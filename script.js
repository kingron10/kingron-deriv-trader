const APP_ID = "33XacCf580jM6g1WBhdIV";
const REDIRECT_URI = "https://kingron10.github.io/kingron-deriv-trader/";

const connectBtn = document.getElementById("connect");
const logoutBtn = document.getElementById("logout");
const status = document.getElementById("status");
const balance = document.getElementById("balance");
const accountId = document.getElementById("accountId");

// Connect button
connectBtn.addEventListener("click", () => {
    status.textContent = "Redirecting to Deriv...";

    const oauthUrl =
        `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    window.location.href = oauthUrl;
});

// Logout button
logoutBtn.addEventListener("click", () => {
    window.location.hash = "";
    status.textContent = "Logged out";
    balance.textContent = "--";
    accountId.textContent = "--";
});

// Check if Deriv redirected back with an access token
const hash = window.location.hash;

if (hash.includes("access_token=")) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get("access_token");

    status.textContent = "Connecting...";

    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);

    ws.onopen = () => {
        ws.send(JSON.stringify({
            authorize: token
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.error) {
            status.textContent = "❌ " + data.error.message;
            return;
        }

        if (data.msg_type === "authorize") {
            const account = data.authorize;

            accountId.textContent = account.loginid;

            status.innerHTML = `
                ✅ Connected<br>
                Account Type: ${account.is_virtual ? "Demo" : "Real"}<br>
                Currency: ${account.currency}
            `;

            // Request live balance
            ws.send(JSON.stringify({
                balance: 1,
                subscribe: 1
            }));
        }

        if (data.msg_type === "balance") {
            balance.textContent =
                `${data.balance.balance} ${data.balance.currency}`;
        }
    };

    ws.onerror = () => {
        status.textContent = "❌ Connection failed";
    };

    ws.onclose = () => {
        console.log("WebSocket closed");
    };
}
