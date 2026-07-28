const APP_ID = "33WKSW7cKl67wCLdJFnSk";

const connectBtn = document.getElementById("connect");
const status = document.getElementById("status");
const balance = document.getElementById("balance");
const accountId = document.getElementById("accountId");

let ws;

connectBtn.onclick = () => {
    status.textContent = "Connecting...";

    ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);

    ws.onopen = () => {
        const token = prompt("Enter your Deriv API Token:");
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
            status.textContent = "✅ Connected";
            accountId.textContent = data.authorize.loginid;

            ws.send(JSON.stringify({
                balance: 1
            }));
        }

        if (data.msg_type === "balance") {
            balance.textContent =
                data.balance.balance + " " + data.balance.currency;
        }
    };

    ws.onerror = () => {
        status.textContent = "Connection Error";
    };

    ws.onclose = () => {
        status.textContent = "Disconnected";
    };
};
