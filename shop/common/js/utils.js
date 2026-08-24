/* Общие утилиты: экранирование строк, форматирование цен/дат, плюрализация */

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

function escapeAttr(str) {
  return String(str ?? "").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function formatPrice(price) {
  return price.toLocaleString("ru-RU") + " ₽";
}

function formatDate(iso) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) +
    ", " +
    dtoLocaleTimeStr(d)
  );
}

function dtoLocaleTimeStr(d) {
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

/* Русская плюрализация: pluralize(5, ["товар","товара","товаров"]) */
function pluralize(n, forms, withWord = true) {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  let idx = 2;
  if (mod10 === 1 && mod100 !== 11) idx = 0;
  else if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) idx = 1;
  const word = forms[idx];
  return withWord ? `${n} ${word}` : word;
}
