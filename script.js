const APP_ID = "33WKSW7cKl67wCLdJFnSk";
const REDIRECT_URI = "https://kingron10.github.io/kingron10/";

document.getElementById("connect").addEventListener("click", () => {
    window.location.href = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
});
