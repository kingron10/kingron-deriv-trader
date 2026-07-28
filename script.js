const APP_ID = "33XacCf580jM6g1WBhdIV";

const connectBtn = document.getElementById("connect");
const logoutBtn = document.getElementById("logout");
const status = document.getElementById("status");
const balance = document.getElementById("balance");
const accountId = document.getElementById("accountId");
const tick = document.getElementById("tick");
const debug = document.getElementById("debug");

function log(message) {
    debug.textContent += message + "\n";
}

let ws = null;

connectBtn.onclick = () => {
    const token = prompt("Enter your Deriv Personal Access Token:");

    if (!token) return;

    status.textContent = "Connecting...";

    ws = new WebSocket(
        `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`
    );

    ws.onopen = () => {
        log("WebSocket opened");

        ws.send(JSON.stringify({
            authorize: token
        }));
    };

    ws.onmessage = (event) => {
        log(event.data);

        const data = JSON.parse(event.data);

        if (data.error) {
            log(JSON.stringify(data.error));
            status.textContent = "❌ " + data.error.message;
            return;
        }

        if (data.msg_type === "authorize") {
            status.textContent = "✅ Connected";
            accountId.textContent = data.authorize.loginid;

            ws.send(JSON.stringify({
                balance: 1
            }));

            ws.send(JSON.stringify({
                ticks: "R_100",
                subscribe: 1
            }));
        }

        if (data.msg_type === "balance") {
            balance.textContent =
                data.balance.balance + " " + data.balance.currency;
        }

        if (data.msg_type === "tick") {
            tick.textContent = data.tick.quote;
        }
    };

    ws.onerror = (error) => {
        log("WebSocket error");
        status.textContent = "❌ Connection Error";
    };

    ws.onclose = (event) => {
        log("Closed: Code=" + event.code + ", Reason=" + event.reason);
        status.textContent =
            "Disconnected (Code: " + event.code + ", Reason: " + event.reason + ")";
    };
};

logoutBtn.onclick = () => {
    if (ws) {
        ws.close();
    }

    status.textContent = "Ready to connect to Deriv API";
    balance.textContent = "--";
    accountId.textContent = "--";
    tick.textContent = "Waiting...";
    debug.textContent = "";
};
