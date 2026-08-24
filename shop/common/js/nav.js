/* Общий рендер навигационной панели: лого + «Категории» / «Мои заказы» + слот #authNav.
   current — ключ активной страницы ("categories" | "orders") либо "" когда активных пунктов нет */

const NAV_ITEMS = [
  { key: "categories", label: "Категории", href: "../categories/index.html" },
  { key: "orders", label: "Мои заказы", href: "../orders/index.html" }
];

function renderSiteNav(current) {
  const nav = document.querySelector("nav.site-nav");
  if (!nav) return;

  const itemsHtml = NAV_ITEMS.map(item => {
    if (item.key === current) {
      return `<li class="current"><span>${item.label}</span></li>`;
    }
    return `<li><a target="_top" href="${item.href}" class="nav-link">${item.label}</a></li>`;
  }).join("");

  nav.innerHTML = `
    <a target="_top" href="../categories/index.html" class="site-logo">Онлайн магазин</a>
    <ul>${itemsHtml}</ul>
    <div class="site-userbox" id="authNav"></div>
  `;

  renderAuthNav();
}
