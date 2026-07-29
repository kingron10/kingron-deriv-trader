/**
 * Kingron Deriv Trader Engine
 * App ID: 33XacCf580jM6glWBhdIV
 */

// --- CONFIGURATION ---
const CONFIG = {
    APP_ID: '33XacCf580jM6glWBhdIV',
    SYMBOL: 'R_100', // Volatility 100 Index
    WS_URL: 'wss://ws.derivws.com/websockets/v3'
};

// --- GLOBAL STATE ---
let ws = null;
let reconnectTimer = null;
const state = {
    token: localStorage.getItem('deriv_token') || null,
    account: localStorage.getItem('deriv_account') || null,
    isAuthorized: false,
    balance: null,
    currency: null
};

// --- DOM ELEMENTS ---
const elements = {
    status: document.getElementById('status'),
    accountId: document.getElementById('account-id'),
    balance: document.getElementById('balance'),
    symbolPrice: document.getElementById('symbol-price'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    logs: document.getElementById('logs')
};

// --- UTILITY LOGGING ---
function log(message) {
    console.log(`[Kingron Trader] ${message}`);
    if (elements.logs) {
        elements.logs.innerHTML += `> ${message}<br>`;
        elements.logs.scrollTop = elements.logs.scrollHeight;
    }
}

// --- 1. OAUTH & TOKEN MANAGEMENT ---

/**
 * Redirects the user to the official Deriv OAuth portal with your App ID
 */
function loginWithDeriv() {
    const authUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${CONFIG.APP_ID}`;
    window.location.href = authUrl;
}

/**
 * Clears saved tokens and refreshes the application session
 */
function logout() {
    localStorage.removeItem('deriv_token');
    localStorage.removeItem('deriv_account');
    log('Logged out successfully.');
    window.location.reload();
}

/**
 * Checks for OAuth parameters sent back by Deriv in the URL query string
 */
function checkOAuthRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token1');
    const account = urlParams.get('acct1');

    if (token && account) {
        localStorage.setItem('deriv_token', token);
        localStorage.setItem('deriv_account', account);
        
        state.token = token;
        state.account = account;

        // Clean up URL parameters without triggering a page reload
        window.history.replaceState({}, document.title, window.location.pathname);
        log(`Token saved successfully for account: ${account}`);
    }
}

// --- 2. WEBSOCKET ENGINE ---

/**
 * Initializes the WebSocket connection to Deriv's API
 */
function initWebSocket() {
    const wsUrl = `${CONFIG.WS_URL}?app_id=${CONFIG.APP_ID}`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        log('WebSocket connected.');
        updateStatusUI('Connected', 'green');

        // Step 2a: Subscribe to live price tick stream (Public data request)
        subscribeToTicks(CONFIG.SYMBOL);

        // Step 2b: Authorize session if a saved token exists
        if (state.token) {
            authorizeUser(state.token);
        }
    };

    ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        handleApiResponse(response);
    };

    ws.onerror = (error) => {
        log(`WebSocket error encountered.`);
    };

    ws.onclose = () => {
        log('WebSocket connection closed. Reconnecting in 3s...');
        updateStatusUI('Disconnected', 'red');
        state.isAuthorized = false;

        // Automatically attempt reconnect after 3 seconds
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(initWebSocket, 3000);
    };
}

/**
 * Sends authorization payload over the WebSocket
 */
function authorizeUser(token) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    log('Authenticating token with Deriv API...');
    ws.send(JSON.stringify({ authorize: token }));
}

/**
 * Subscribes to live price ticks for a given market symbol
 */
function subscribeToTicks(symbol) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
        ticks: symbol,
        subscribe: 1
    }));
}

// --- 3. RESPONSE HANDLER ---

/**
 * Routes incoming API messages to their respective UI update functions
 */
function handleApiResponse(data) {
    // Catch API errors from Deriv engine
    if (data.error) {
        log(`API Error [${data.msg_type}]: ${data.error.message}`);
        return;
    }

    switch (data.msg_type) {
        case 'authorize':
            handleAuthResponse(data.authorize);
            break;
            
        case 'tick':
            handleTickResponse(data.tick);
            break;
            
        case 'buy':
            handleBuyResponse(data.buy);
            break;
            
        default:
            break;
    }
}

function handleAuthResponse(authData) {
    state.isAuthorized = true;
    state.balance = authData.balance;
    state.currency = authData.currency;

    log(`Authenticated as ${authData.loginid}`);
    
    // Update User Info UI Elements
    if (elements.accountId) elements.accountId.innerText = authData.loginid;
    if (elements.balance) elements.balance.innerText = `${authData.balance} ${authData.currency}`;
    
    // Toggle Login/Logout buttons
    if (elements.loginBtn) elements.loginBtn.style.display = 'none';
    if (elements.logoutBtn) elements.logoutBtn.style.display = 'inline-block';
}

function handleTickResponse(tickData) {
    if (elements.symbolPrice) {
        elements.symbolPrice.innerText = tickData.quote;
    }
}

function handleBuyResponse(buyData) {
    log(`Order Executed! Contract ID: ${buyData.contract_id} | Purchase Price: $${buyData.buy_price}`);
}

// --- 4. TRADING OPERATIONS ---

/**
 * Sends a buy order request to the Deriv API
 * @param {string} contractType - 'CALL' (Rise) or 'PUT' (Fall)
 * @param {number} amount - Amount/Stake for the order
 */
function buyContract(contractType, amount = 10) {
    if (!state.isAuthorized) {
        alert('Please connect your Deriv account first!');
        return;
    }

    log(`Sending buy request for ${contractType}...`);

    const orderPayload = {
        buy: 1,
        price: amount,
        parameters: {
            amount: amount,
            basis: 'stake',
            contract_type: contractType,
            currency: state.currency || 'USD',
            duration: 5,
            duration_unit: 't', // 5 Ticks Duration
            symbol: CONFIG.SYMBOL
        }
    };

    ws.send(JSON.stringify(orderPayload));
}

// --- 5. UI HELPERS ---

function updateStatusUI(text, color) {
    if (elements.status) {
        elements.status.innerText = text;
        elements.status.style.color = color;
    }
}

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    // 1. Check if user is returning from the Deriv login redirect
    checkOAuthRedirect();

    // 2. Open WebSocket connection
    initWebSocket();
});
