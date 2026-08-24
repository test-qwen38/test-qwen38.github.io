renderSiteNav("orders");

if (!requireAuthRedirect("orders/order-detail.html", "?id=" + (new URLSearchParams(window.location.search).get("id") || ""))) {
  window.stop();
}

const STEPS = ORDER_STATUS_FLOW.map(key => ({ key, label: STATUS_LABELS[key] }));

const params = new URLSearchParams(window.location.search);
const orderId = params.get("id") || "";
const sessionUser = currentUser();
const order = findOrder(orderId);

const titleEl = document.getElementById("orderTitle");
const detailContent = document.getElementById("detailContent");
const notFoundEl = document.getElementById("notFound");
const itemDetailsEl = document.getElementById("itemDetails");
const commentBlock = document.getElementById("commentBlock");
const customerDetailsEl = document.getElementById("customerDetails");
const statusBadgeSlot = document.getElementById("statusBadgeSlot");
const timelineEl = document.getElementById("timeline");
const statusButtonsEl = document.getElementById("statusButtons");

const canViewOrder = order && (isAdmin() || (sessionUser && sessionUser.username === order.owner));

if (!canViewOrder) {
  titleEl.textContent = "Заказ не найден";
  detailContent.classList.add("hidden");
  notFoundEl.classList.remove("hidden");
} else {
  render(order);
}

function dlRow(label, value) {
  if (!value || value === null || String(value).trim() === "") return "";
  return `<div class="dl-row"><dt>${label}</dt><dd>${escapeHtml(String(value))}</dd></div>`;
}

function render(data) {
  document.title = `Заказ № ${data.num}`;
  titleEl.textContent = `Заказ № ${data.num}`;

  let rows = "";

  if (Array.isArray(data.lines) && data.lines.length) {
    for (const [i, l] of data.lines.entries()) {
      const parts = [];
      if (data.lines.length > 1) parts.push(dlRow(`Позиция ${i + 1}`, ""));
      rows += `
        <div class="detail-line">
          <p class="order-item-name">${escapeHtml(l.name)}</p>
          ${[
            dlRow(l.type === "Услуга" ? "Тип услуги" : "Тип", l.type || ""),
            dlRow("Категория", l.category),
            dlRow("Количество", `${l.qty} шт.`),
            dlRow("Цена за единицу", formatPrice(l.price)),
            `<div class="dl-row line-total-detail"><dt>Сумма позиции</dt><dd>${formatPrice(l.price * l.qty)}</dd></div>`
          ].join("")}
        </div>`;
    }
  } else {
    rows = [
      dlRow("Товар / услуга", data.itemName),
      dlRow("Тип", data.itemType === "Услуга" ? "Услуга" : "Товар"),
      dlRow("Категория", data.category),
      dlRow("Количество", `${data.qty} шт.`),
      dlRow("Цена за единицу", formatPrice(data.unitPrice))
    ].join("");
  }

  itemDetailsEl.innerHTML = [
    rows,
    `<div class="dl-row total-row-detail"><dt>Итого по заказу</dt><dd><strong>${formatPrice(data.total)}</strong></dd></div>`,
    dlRow("Дата оформления", formatDate(data.createdAt))
  ].join("");

  if (data.updatedAt && data.updatedAt !== data.createdAt) {
    itemDetailsEl.innerHTML += `<p class="updated-note">Статус обновлён: ${formatDate(data.updatedAt)}</p>`;
  }

  if (data.comment) {
    commentBlock.textContent = `Комментарий: «${escapeHtml(data.comment)}»`;
    commentBlock.classList.remove("hidden");
  } else {
    commentBlock.classList.add("hidden");
  }

  const c = data.customer || {};
  customerDetailsEl.innerHTML = [
    dlRow("Имя", c.name),
    dlRow("Акаунт", data.owner ? "#" + data.owner : null),
    dlRow("Телефон", c.phone ? "+" + String(c.phone).replace(/^\+/, "") : ""),
    dlRow("Email", c.email)
  ].join("");

  const currentStepIndex = STEPS.findIndex(s => s.key === data.status);
  timelineEl.innerHTML = STEPS.map((step, i) => {
    const active = i <= currentStepIndex;
    return `<li class="${active ? "active" : ""}"><span class="timeline-dot">${active ? "✓" : i + 1}</span>${step.label}</li>`;
  }).join("");

  statusBadgeSlot.innerHTML = `<span class="status-badge status-${data.status}">${STATUS_LABELS[data.status] || data.status}</span>`;

  let buttonsHtml = "";
  if (isAdmin()) {
    if (data.status === "new") {
      buttonsHtml += `<button type="button" class="btn-submit" data-status="processing">Перевести в обработку</button>`;
    } else if (data.status === "processing") {
      buttonsHtml += `<button type="button" class="btn-submit" data-status="done">Отметить выполненным</button>`;
    } else {
      buttonsHtml = `<p class="status-done-note">Заказ завершён — спасибо за покупку!</p>`;
    }
  } else if (data.status === "done") {
    buttonsHtml = `<p class="status-done-note">Заказ завершён — спасибо за покупку!</p>`;
  } else {
    buttonsHtml = `<p class="status-waiting-note">Статус заказа управляется администратором.</p>`;
  }
  statusButtonsEl.innerHTML = buttonsHtml;

  statusButtonsEl.onclick = (e) => {
    const btn = e.target.closest("button[data-status]");
    if (!btn || !isAdmin()) return;
    setOrderStatus(orderId, btn.dataset.status);
    render(findOrder(orderId));
  };
}
