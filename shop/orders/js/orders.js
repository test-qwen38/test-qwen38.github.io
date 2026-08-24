renderSiteNav("orders");

if (!requireAuthRedirect("orders/index.html")) {
  window.stop();
}

const ordersList = document.getElementById("ordersList");
const noOrdersEl = document.getElementById("noOrders");
const goCatalogEl = document.getElementById("goCatalog");
const summaryEl = document.getElementById("ordersSummary");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric"
  }) + ", " + new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function render() {
  let orders = [...loadOrders()].reverse();
  const sessionUser = currentUser();
  if (sessionUser && !isAdmin()) {
    orders = orders.filter(o => o.owner === sessionUser.username);
  }

  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  const filtered = orders.filter(o => {
    const matchesStatus = status === "all" || o.status === status;
    const linesText = (o.lines || []).map(l => l.name).join(" ");
    const haystack = `${o.itemName} ${linesText} ${(o.customer && o.customer.name) || ""} ${o.category}`.toLowerCase();
    return matchesStatus && haystack.includes(query);
  });

  const totalSum = filtered.reduce((sum, o) => sum + o.total, 0);
  summaryEl.textContent = orders.length === 0 ? "" : `Показано ${pluralizedOrders(filtered.length)} · на сумму ${formatPrice(totalSum)}`;

  if (orders.length === 0) {
    noOrdersEl.textContent = "Заказов пока нет — самое время что-нибудь выбрать в каталоге.";
    noOrdersEl.classList.remove("hidden");
    goCatalogEl.classList.remove("hidden");
  } else {
    noOrdersEl.textContent = "Ничего не найдено";
    noOrdersEl.classList.toggle("hidden", filtered.length > 0);
    goCatalogEl.classList.add("hidden");
  }

  ordersList.innerHTML = filtered.map(o => `
    <li class="order-card">
      <a href="order-detail.html?id=${o.id}" target="_top">
        <div class="order-topline">
          <span>
            <span class="order-number">Заказ №&thinsp;${o.num}</span>
            &nbsp;&middot;&nbsp;<span class="order-date">${formatDate(o.createdAt)}</span>
          </span>
          <span class="status-badge status-${o.status}">${STATUS_LABELS[o.status] || o.status}</span>
        </div>
        ${renderOrderLines(o)}
        <div class="order-bottomline">
          <span class="order-total">${formatPrice(o.total)}</span>
          <span class="order-view-link">Подробнее &rarr;</span>
        </div>
      </a>
    </li>
    `).join("");
}

function renderOrderLines(o) {
  const lines = o.lines && Array.isArray(o.lines) && o.lines.length ? o.lines : null;

  if (lines) {
    return lines.map(l => `
      <p class="order-item-name">${escapeHtml(l.name)}</p>
      <p class="order-meta">${escapeHtml(l.category)} · ${l.qty} шт. × ${formatPrice(l.price)} = ${formatPrice(l.price * l.qty)}</p>
    `).join("") + (o.customer ? `<p class="order-meta buyer-note">Покупатель: ${escapeHtml(o.customer.name)}</p>` : "");
  }

  return `
    <p class="order-item-name">${escapeHtml(o.itemName)}</p>
    <p class="order-meta">${escapeHtml(o.category)} · ${o.qty} шт. × ${formatPrice(o.unitPrice)}${o.customer ? ` · покупатель: ${escapeHtml(o.customer.name)}` : ""}</p>
  `;
}

function pluralizedOrders(n) {
  const mod10 = n % 10, mod100 = n % 100;
  let word = "заказов";
  if (mod10 === 1 && mod100 !== 11) word = "заказ";
  else if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) word = "заказа";
  return `${n} ${word}`;
}

searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);
render();
