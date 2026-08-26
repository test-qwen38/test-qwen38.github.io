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

/* next — путь страницы, относительный к login-каталогу, например "../checkout/index.html" */
function guestLoginUrl(next) {
  return "../login/index.html" + (next ? "?next=" + encodeURIComponent(next) : "");
}

/* nextPath относительно корня сайта ("checkout/index.html"); queryString — уже закодирована
   вызывающим (например "?category=" + encodeURIComponent(name)). next формируется строкой
   ("../" + путь) — без нормализации URL и повторного кодирования, чтобы не сдвигать "%xx".
   Сброс текущего скрипта — через throw, НЕ window.stop(): replace() откладывает навигацию,
   а window.stop() её отменяет; throw прерывает текущий handler ровно по месту вызова. */
function requireAuthRedirect(nextPath, queryString) {
  if (currentUser()) return true;
  const next = "../" + nextPath + (queryString || "");
  window.location.replace(guestLoginUrl(next));
  throw new Error("auth_redirect");
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
