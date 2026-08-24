const form = document.getElementById("loginForm");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const loginError = document.getElementById("loginError");

function showLoginError(message) {
  loginError.textContent = message;
  loginError.classList.remove("hidden");
}

form.addEventListener("submit", e => {
  e.preventDefault();
  loginError.classList.add("hidden");

  const username = normalizeUsername(usernameInput.value);
  if (!username || !passwordInput.value) {
    showLoginError("Введите имя пользователя и пароль");
    return;
  }

  const user = login(username, passwordInput.value);
  if (!user) {
    showLoginError("Неверное имя пользователя или пароль");
    passwordInput.value = "";
    return;
  }
  window.location.replace("../categories/index.html");
});
