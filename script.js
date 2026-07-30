// Using App ID 1089 (Deriv's default public app ID for testing)
const APP_ID = '1089'; 
const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

let ws;

function connectWebSocket() {
    ws = new WebSocket(WS_URL);

    const loginBtn = document.getElementById('loginBtn');
    const userInfoCard = document.getElementById('userInfo');
    const accountIdEl = document.getElementById('accountId');
    const balanceEl = document.getElementById('balance');
    const tickPriceEl = document.getElementById('tickPrice');

    ws.onopen = () => {
        console.log('✅ WebSocket Connected!');

        // Send Ping every 30s
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ ping: 1 }));
            }
        }, 30000);

        // Check for token in URL after OAuth login
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token1');

        if (token) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userInfoCard) userInfoCard.style.display = 'block';
            ws.send(JSON.stringify({ authorize: token }));
        }

        // Request real-time prices for Volatility 100 Index
        console.log('Requesting R_100 ticks...');
        ws.send(JSON.stringify({ ticks: 'R_100', subscribe: 1 }));
    };

    ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        console.log('📩 Received:', response);

        // Handle Live Tick Updates
        if (response.msg_type === 'tick' && response.tick) {
            if (tickPriceEl) {
                tickPriceEl.innerText = response.tick.quote;
            }
        }

        // Handle Account Authorization
        if (response.msg_type === 'authorize' && response.authorize) {
            if (accountIdEl) accountIdEl.innerText = response.authorize.loginid;
            if (balanceEl) balanceEl.innerText = `${response.authorize.balance} ${response.authorize.currency}`;
        }

        if (response.error) {
            console.error('❌ Deriv Error:', response.error.message);
            if (tickPriceEl) tickPriceEl.innerText = 'Error loading price';
        }
    };

    ws.onerror = (err) => {
        console.error('❌ WebSocket Error:', err);
        if (tickPriceEl) tickPriceEl.innerText = 'Connection Error';
    };

    ws.onclose = () => {
        console.log('⚠️ WebSocket Closed. Reconnecting in 3s...');
        setTimeout(connectWebSocket, 3000);
    };
}

// Start connection
connectWebSocket();

// OAuth Login Trigger
function login() {
    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=EN`;
    window.location.href = oauthUrl;
}
