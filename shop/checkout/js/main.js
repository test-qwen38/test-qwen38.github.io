const backLink = document.getElementById("backLink");
const formSection = document.getElementById("checkoutForm");
const errorState = document.getElementById("errorState");
const successState = document.getElementById("successState");
const cartLinesEl = document.getElementById("cartLines");
const totalPriceEl = document.getElementById("totalPrice");
const form = document.getElementById("orderForm");
const formError = document.getElementById("formError");

renderSiteNav("");

const checkoutUser = requireAuthRedirect("checkout/index.html") ? currentUser() : null;
if (checkoutUser) {
  document.getElementById("orderForm").name.value = checkoutUser.username;
}

[form.name, form.phone].forEach(input => {
  input.addEventListener("input", () => input.closest(".field").classList.remove("invalid"));
});

function renderCart() {
  const lines = getCartLines();
  const isEmpty = lines.length === 0;

  errorState.classList.toggle("hidden", !isEmpty);
  formSection.classList.toggle("hidden", isEmpty);

  if (isEmpty) {
    backLink.href = "../categories/index.html";
    totalPriceEl.textContent = formatPrice(0);
    return;
  }

  const linesHtml = lines.map(l => `
    <li class="cart-line" data-category="${escapeAttr(l.category)}" data-name="${escapeAttr(l.name)}">
      <div class="cart-line-head">
        <span class="item-name">${escapeHtml(l.name)}</span>
        <button type="button" class="icon-btn icon-del cart-remove" aria-label="Убрать из корзины">&times;</button>
      </div>
      <p class="item-type">${escapeHtml(l.category)} &middot; ${formatPrice(l.price)} за ед.</p>
      <div class="cart-line-foot">
        <div class="stepper">
          <button type="button" class="qty-minus" aria-label="Уменьшить">&minus;</button>
          <input type="text" value="${l.qty}" readonly>
          <button type="button" class="qty-plus" aria-label="Увеличить">+</button>
        </div>
        <span class="line-total">${formatPrice(l.price * l.qty)}</span>
      </div>
    </li>
  `).join("");

  cartLinesEl.innerHTML = linesHtml;
  totalPriceEl.textContent = formatPrice(lines.reduce((s, l) => s + l.price * l.qty, 0));
}

cartLinesEl.addEventListener("click", e => {
  const line = e.target.closest(".cart-line");
  if (!line) return;

  const cat = line.dataset.category;
  const name = line.dataset.name;
  const current = Number(line.querySelector(".stepper input").value);

  if (e.target.classList.contains("qty-plus")) {
    setCartItemQty(cat, name, current + 1);
    renderCart();
  } else if (e.target.classList.contains("qty-minus")) {
    setCartItemQty(cat, name, current - 1);
    renderCart();
  } else if (e.target.classList.contains("cart-remove")) {
    removeCartItem(cat, name);
    renderCart();
  }
});

form.addEventListener("submit", e => {
  e.preventDefault();
  formError.classList.add("hidden");

  if (!requireAuthRedirect("checkout/index.html")) return;

  const sessionUser = currentUser();
  form.name.value = sessionUser ? sessionUser.username : "";

  const lines = getCartLines();
  if (!lines.length) {
    showFormError("Корзина пуста — добавьте товары в каталоге");
    return;
  }

  const nameField = form.name.closest(".field");
  const phoneField = form.phone.closest(".field");
  let firstInvalid = null;

  if (new FormData(form).get("name").trim().length < 2) {
    nameField.classList.add("invalid");
    firstInvalid = firstInvalid || form.name;
  } else {
    nameField.classList.remove("invalid");
  }

  const phoneValue = new FormData(form).get("phone").replace(/[\s()-]/g, "");
  if (!/^\+?\d{10,15}$/.test(phoneValue)) {
    phoneField.classList.add("invalid");
    firstInvalid = firstInvalid || form.phone;
  } else {
    phoneField.classList.remove("invalid");
  }

  const agree = document.getElementById("agreeCheckbox");
  if (!agree.checked) {
    agree.focus();
    showFormError("Нужно согласиться на обработку персональных данных");
    return;
  }

  if (firstInvalid) {
    firstInvalid.focus();
    showFormError("Проверьте выделенные поля");
    return;
  }

  const data = new FormData(form);
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);

  let itemName;
  if (lines.length === 1) {
    itemName = lines[0].name;
  } else {
    itemName = pluralize(itemCount, ["товар", "товара", "товаров"]);
  }

  const order = {
    id: Date.now().toString(36).toUpperCase(),
    owner: sessionUser.username,
    createdAt: new Date().toISOString(),
    category: [...new Set(lines.map(l => l.category))].join(" · "),
    itemName,
    lines: lines.map(l => ({
      name: l.name,
      type: l.type || "Товар",
      category: l.category,
      price: l.price,
      qty: l.qty
    })),
    total: total,
    comment: data.get("comment").trim() || null,
    customer: {
      name: data.get("name").trim(),
      phone: phoneValue,
      email: data.get("email").trim() || null
    }
  };

  const saved = saveOrder(order);
  clearCart();
  backLink.href = "../categories/index.html";

  successState.innerHTML = `
    <div class="success-icon">&#10003;</div>
    <h2>Заказ оформлен!</h2>
    <p id="successText">Спасибо, ${escapeHtml(order.customer.name)}! Заказ №&thinsp;${saved.num} ${lines.length === 1 ? `на «${escapeHtml(lines[0].name)}» (${lines[0].qty} шт.)` : `на ${pluralize(itemCount, ["товар", "товара", "товаров"])}`} принят. Мы свяжемся с вами по номеру ${escapeHtml(order.customer.phone)} в ближайшее время.</p>
    <div class="success-actions">
      <a target="_top" href="../orders/index.html" class="btn-submit btn-primary">Мои заказы</a>
      <a target="_top" href="${backLink.href}" class="btn-ghost">Продолжить покупки</a>
    </div>
  `;
  formSection.classList.add("hidden");
  successState.classList.remove("hidden");
});

function showFormError(message) {
  formError.textContent = message;
  formError.classList.remove("hidden");
}

renderCart();
