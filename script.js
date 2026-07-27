const APP_ID = "33WKSW7cKl67wCLdJFnSk";
const REDIRECT_URI = "https://kingron10.github.io/kingron10/";

const connectBtn = document.getElementById("connect");
const status = document.getElementById("status");

connectBtn.addEventListener("click", () => {
    status.textContent = "Redirecting to Deriv...";
    window.location.href =
        `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
});
