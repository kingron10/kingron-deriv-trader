const APP_ID = "33WKSW7cKl67wCLdJFnSk";
const REDIRECT_URI = "https://kingron10.github.io/kingron-deriv-trader/";

const connectBtn = document.getElementById("connect");
const status = document.getElementById("status");
const balance = document.getElementById("balance");

connectBtn.addEventListener("click", () => {
    status.textContent = "Redirecting to Deriv...";

    const oauthUrl =
        `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    window.location.href = oauthUrl;
});

// Check if Deriv redirected back with a token
const hash = window.location.hash;

if (hash.includes("access_token=")) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get("access_token");

    status.textContent = "Connected to Deriv";

    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);

    ws.onopen = () => {
        ws.send(JSON.stringify({
            authorize: token
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.msg_type === "authorize") {
    const account = data.authorize;

    status.innerHTML = `
        ✅ Connected<br>
        Account ID: ${account.loginid}<br>
        Account Type: ${account.is_virtual ? "Demo" : "Real"}<br>
        Currency: ${account.currency}
    `;

    balance.textContent = account.balance + " " + account.currency;
        }

        if (data.error) {
            status.textContent = data.error.message;
        }
    };

    ws.onerror = () => {
        status.textContent = "Connection failed";
    };
}
