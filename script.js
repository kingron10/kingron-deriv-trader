const APP_ID = "33XacCf580jM6g1WBhdIV";
const REDIRECT_URI = "https://kingron10.github.io/kingron-deriv-trader/";

const connectBtn = document.getElementById("connect");
const logoutBtn = document.getElementById("logout");
const status = document.getElementById("status");
const balance = document.getElementById("balance");
const accountId = document.getElementById("accountId");

// Connect to Deriv
connectBtn.onclick = () => {
    const url =
        `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    window.location.href = url;
};

// Logout
logoutBtn.onclick = () => {
    localStorage.removeItem("deriv_token");
    window.location.href = REDIRECT_URI;
};

// Read OAuth token
const hash = new URLSearchParams(window.location.hash.substring(1));
const token = hash.get("access_token");

if (token) {
    localStorage.setItem("deriv_token", token);
}

const savedToken = localStorage.getItem("deriv_token");

if (savedToken) {
    status.textContent = "Connecting...";

    const ws = new WebSocket(
        `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`
    );

    ws.onopen = () => {
        ws.send(JSON.stringify({
            authorize: savedToken
        }));
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        if (data.error) {
            status.textContent = data.error.message;
            return;
        }

        if (data.msg_type === "authorize") {
            status.textContent = "✅ Connected";
            accountId.textContent = data.authorize.loginid;

            // Request account balance
            ws.send(JSON.stringify({
                balance: 1
            }));

            // Subscribe to live ticks
            ws.send(JSON.stringify({
                ticks: "R_100"
            }));
        }

        if (data.msg_type === "balance") {
            balance.textContent =
                data.balance.balance + " " + data.balance.currency;
        }

        if (data.msg_type === "tick") {
            document.getElementById("tick").textContent = data.tick.quote;
        }
    };

    ws.onclose = () => {
        status.textContent = "Disconnected";
    };
}
