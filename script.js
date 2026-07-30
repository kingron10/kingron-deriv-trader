const APP_ID = '1089'; // Using public test ID to ensure access
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

        // Ping every 30s to keep connection alive
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ ping: 1 }));
            }
        }, 30000);

        // Check for token from OAuth redirect
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token1');

        if (token) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userInfoCard) userInfoCard.style.display = 'block';
            ws.send(JSON.stringify({ authorize: token }));
        }

        // Subscribe to Volatility 100 Index (1s tick speed)
        console.log('Subscribing to price stream...');
        ws.send(JSON.stringify({ ticks: '1HZ100V', subscribe: 1 }));
    };

    ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        console.log('📩 Message from Deriv:', response);

        // Live Tick Update Received
        if (response.msg_type === 'tick' && response.tick) {
            if (tickPriceEl) {
                tickPriceEl.style.color = '#4caf50'; // Green text for live ticks
                tickPriceEl.innerText = response.tick.quote;
            }
        }

        // Account Authorization Received
        if (response.msg_type === 'authorize' && response.authorize) {
            if (accountIdEl) accountIdEl.innerText = response.authorize.loginid;
            if (balanceEl) balanceEl.innerText = `${response.authorize.balance} ${response.authorize.currency}`;
        }

        // Handle API Errors gracefully
        if (response.error) {
            console.error('❌ Deriv API Error:', response.error.message);
            
            // If symbol failed, fallback to Forex EUR/USD test
            if (response.msg_type === 'tick') {
                console.log('Trying fallback symbol frxEURUSD...');
                ws.send(JSON.stringify({ ticks: 'frxEURUSD', subscribe: 1 }));
            } else {
                if (tickPriceEl) {
                    tickPriceEl.style.color = '#f44336';
                    tickPriceEl.innerText = response.error.message;
                }
            }
        }
    };

    ws.onerror = (err) => {
        console.error('❌ WebSocket Error:', err);
        if (tickPriceEl) {
            tickPriceEl.style.color = '#f44336';
            tickPriceEl.innerText = 'Connection Error';
        }
    };

    ws.onclose = () => {
        console.log('⚠️ Connection closed. Reconnecting in 3s...');
        setTimeout(connectWebSocket, 3000);
    };
}

// Start WebSocket connection
connectWebSocket();

// Trigger OAuth Login
function login() {
    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=EN`;
    window.location.href = oauthUrl;
}
