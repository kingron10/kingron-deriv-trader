// Configured with your App ID (Kingron)
const APP_ID = '33XVY2GPVVkcJtekabSF5'; 
const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

// Initialize WebSocket connection
const ws = new WebSocket(WS_URL);

// DOM Elements (Matches index.html element IDs)
const loginBtn = document.getElementById('loginBtn');
const userInfoCard = document.getElementById('userInfo');
const accountIdEl = document.getElementById('accountId');
const balanceEl = document.getElementById('balance');
const tickPriceEl = document.getElementById('tickPrice');

// 1. Redirect user to Deriv OAuth login page
function login() {
    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=EN`;
    window.location.href = oauthUrl;
}

// 2. Extract authorization token from URL params after login redirect
function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token1'); // First token returned in OAuth response
}

// 3. WebSocket Open Listener
ws.onopen = () => {
    console.log('Connected to Deriv WebSocket server');

    // Keep connection alive with periodic pings every 30 seconds
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ ping: 1 }));
        }
    }, 30000);

    // Check for token in URL parameters
    const token = getTokenFromURL();
    if (token) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfoCard) userInfoCard.style.display = 'block';

        // Authorize session with token
        ws.send(JSON.stringify({ authorize: token }));
    }

    // Subscribe to Volatility 100 Index tick stream
    ws.send(JSON.stringify({ ticks: 'R_100', subscribe: 1 }));
};

// 4. Handle incoming WebSocket responses
ws.onmessage = (event) => {
    const response = JSON.parse(event.data);

    // Authorization success response
    if (response.msg_type === 'authorize' && response.authorize) {
        const { loginid, balance, currency } = response.authorize;
        if (accountIdEl) accountIdEl.innerText = loginid;
        if (balanceEl) balanceEl.innerText = `${balance} ${currency}`;
    }

    // Live tick price stream updates
    if (response.msg_type === 'tick' && response.tick) {
        if (tickPriceEl) tickPriceEl.innerText = response.tick.quote;
    }

    // Handle API errors gracefully
    if (response.error) {
        console.error('Deriv API Error:', response.error.message);
    }
};

// 5. Connection Error / Close Handlers
ws.onerror = (error) => {
    console.error('WebSocket Error:', error);
};

ws.onclose = () => {
    console.log('WebSocket connection closed');
};
