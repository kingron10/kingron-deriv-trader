// App ID for Kingron
const APP_ID = '33XVY2GPVVkcJtekabSF5'; 
const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

const ws = new WebSocket(WS_URL);

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const userInfoCard = document.getElementById('userInfo');
const accountIdEl = document.getElementById('accountId');
const balanceEl = document.getElementById('balance');
const tickPriceEl = document.getElementById('tickPrice');

// 1. OAuth Login Redirect
function login() {
    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=EN`;
    window.location.href = oauthUrl;
}

// 2. Parse OAuth Token from URL
function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token1');
}

// 3. WebSocket Setup
ws.onopen = () => {
    console.log('Connected to Deriv WebSocket');

    // Keep connection alive
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ ping: 1 }));
        }
    }, 30000);

    // Check for authorization token after OAuth redirect
    const token = getTokenFromURL();
    if (token) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfoCard) userInfoCard.style.display = 'block';
        
        ws.send(JSON.stringify({ authorize: token }));
    }

    // Subscribe to Volatility 100 Index ticks
    ws.send(JSON.stringify({ ticks: 'R_100', subscribe: 1 }));
};

ws.onmessage = (event) => {
    const response = JSON.parse(event.data);

    // Account authorization response
    if (response.msg_type === 'authorize' && response.authorize) {
        if (accountIdEl) accountIdEl.innerText = response.authorize.loginid;
        if (balanceEl) balanceEl.innerText = `${response.authorize.balance} ${response.authorize.currency}`;
    }

    // Real-time tick stream response
    if (response.msg_type === 'tick' && response.tick) {
        if (tickPriceEl) tickPriceEl.innerText = response.tick.quote;
    }

    if (response.error) {
        console.error('Deriv API Error:', response.error.message);
    }
};

ws.onerror = (err) => console.error('WebSocket Error:', err);
ws.onclose = () => console.log('WebSocket connection closed');
