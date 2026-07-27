const connectBtn = document.getElementById("connect");
const status = document.getElementById("status");
const balance = document.getElementById("balance");

connectBtn.addEventListener("click", () => {
    status.textContent = "Connecting...";
    balance.textContent = "--";

    // We'll connect to the Deriv API in the next step.
    setTimeout(() => {
        status.textContent = "Ready to connect to Deriv API";
    }, 1000);
});
