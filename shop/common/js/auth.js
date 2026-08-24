/* Авторизация (демо, клиентская): пользователи user и admin, одна сессия на вкладку */
const AUTH_STORAGE_KEY = "auth_session_v1";
const AUTH_PASSWORD = "Wwwqqq111";

const USERS = {
  user: { username: "user", role: "user" },
  admin: { username: "admin", role: "admin" }
};

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidCredentials(username, password) {
  const name = normalizeUsername(username);
  return Boolean(USERS[name]) && String(password || "") === AUTH_PASSWORD;
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && USERS[parsed.username]) return { username: parsed.username, role: parsed.role || "user" };
    }
  } catch (e) {}
  return null;
}

function currentUser() {
  return loadSession();
}

function isAdmin() {
  const u = currentUser();
  return Boolean(u) && u.role === "admin";
}

function login(username, password) {
  if (!isValidCredentials(username, password)) return null;
  const user = USERS[normalizeUsername(username)];
  try { sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user)); } catch (e) {}
  return user;
}

function logout() {
  try { sessionStorage.removeItem(AUTH_STORAGE_KEY); } catch (e) {}
  return null;
}

/* next — путь страницы относительно корня сайта, например "checkout/index.html" */
function guestLoginUrl(next) {
  return "../login/index.html" + (next ? "?next=" + encodeURIComponent(next) : "");
}

/* nextPath относительно корневого каталога сайта: {path:"orders/index.html", query:"?id=..."} */
function requireAuthRedirect(nextPath, queryString) {
  if (currentUser()) return true;
  let next = "";
  try {
    const u = new URL(window.location.href);
    u.pathname = "../" + nextPath;
    u.search = queryString || "";
    next = encodeURI(u.pathname + u.search).replace(/%2F/g, "/");
  } catch (e) {}
  window.location.replace(guestLoginUrl(next));
  window.stop();
  return false;
}

/* Слот #authNav в шапке: гость → «Войти», пользователь → имя/роль + выход */
function renderAuthNav() {
  const slot = document.getElementById("authNav");
  if (!slot) return;

  const user = currentUser();
  if (!user) {
    slot.innerHTML = '<a href="../login/index.html" class="btn-ghost btn-sm nav-login">Войти</a>';
    return;
  }

  slot.innerHTML = `
    <span class="user-chip">${escapeHtml(user.username)}<span class="role-badge ${user.role}">${user.role === "admin" ? "админ" : "клиент"}</span></span>
    <button type="button" class="btn-ghost btn-sm auth-logout">Выйти</button>
  `;

  slot.querySelector(".auth-logout").addEventListener("click", () => {
    logout();
    window.location.replace("../categories/index.html");
  });
}
