const params = new URLSearchParams(window.location.search);
const categoryName = params.get("category") || "";
const titleEl = document.getElementById("categoryTitle");
const countEl = document.getElementById("itemsCount");
const grid = document.getElementById("productGrid");
const filterInput = document.getElementById("filterInput");
const emptyState = document.getElementById("emptyState");
const chips = Array.from(document.querySelectorAll(".chip"));
const itemForm = document.getElementById("itemForm");
const itemFormError = document.getElementById("itemFormError");
const itemNameEl = document.getElementById("itemName");
const itemTypeEl = document.getElementById("itemType");
const itemPriceEl = document.getElementById("itemPrice");
const itemDescEl = document.getElementById("itemDesc");
const cancelFormBtn = document.querySelector(".cancel-form");
const itemFormSection = document.querySelector(".item-form-wrap");

let currentType = "all";
let currentEditItemName = null;
let isAddingNewItem = false;

renderSiteNav("");

function render() {
  const freshItems = catalogData[categoryName] || [];
  const items = freshItems;

  document.title = items.length ? `${categoryName} — Каталог` : "Каталог";
  titleEl.textContent = categoryName || "Каталог";

  const admin = isAdmin();
  const addItemBtnEl = document.querySelector(".btn-add-item");
  if (addItemBtnEl) addItemBtnEl.classList.toggle("hidden", !admin);
  if (!admin && itemFormSection) {
    currentEditItemName = null;
    isAddingNewItem = false;
  }

  renderFormState();

  const query = filterInput.value.trim().toLowerCase();
  const filtered = items.filter(it =>
    it.name.toLowerCase().includes(query) &&
    (currentType === "all" || it.type === currentType)
  );

  grid.innerHTML = filtered.map((it, i) => `
    <li class="product-card">
      <div class="product-header">
        <span class="product-badge ${it.type === "Товар" ? "badge-goods" : "badge-service"}">${escapeHtml(it.type)}</span>
        ${isAdmin() ? `
        <div class="item-actions">
          <button type="button" class="icon-btn icon-edit" data-name="${escapeAttr(it.name)}" title="Изменить">✎</button>
          <button type="button" class="icon-btn icon-del" data-name="${escapeAttr(it.name)}" title="Удалить">×</button>
        </div>
      ` : ""}
      </div>
      <p class="product-name"><a href="#item-${i}" onclick="return false">${escapeHtml(it.name)}</a></p>
      <p class="product-desc">${it.desc ? escapeHtml(it.desc) : "-"}</p>
      <div class="product-footer">
        <span class="product-price">${formatPrice(it.price)}</span>
        <button class="btn-buy" data-name="${encodeURIComponent(it.name)}">Заказать</button>
      </div>
    </li>
  `).join("");

  emptyState.style.display = filtered.length ? "none" : "block";
  countEl.textContent = formatCount(filtered.length);
}

function renderFormState() {
  if (!itemFormSection) return;

  if (currentEditItemName) {
    const freshItems = catalogData[categoryName] || [];
    const existing = freshItems.find(i => i.name === currentEditItemName);
    if (existing) {
      itemNameEl.value = existing.name;
      itemTypeEl.value = existing.type;
      itemPriceEl.value = existing.price;
      itemDescEl.value = existing.desc || "";
      itemFormSection.classList.remove("hidden");
      return;
    }
  }

  if (isAddingNewItem) {
    itemForm.reset();
    itemFormSection.classList.remove("hidden");
    return;
  }

  itemForm.reset();
  itemFormSection.classList.add("hidden");
}

function renderItemForm(allItems) {
  if (!itemFormSection) return;

  if (currentEditItemName) {
    const existing = allItems.find(i => i.name === currentEditItemName);
    if (existing) {
      itemNameEl.value = existing.name;
      itemTypeEl.value = existing.type;
      itemPriceEl.value = existing.price;
      itemDescEl.value = existing.desc || "";
      itemFormSection.classList.remove("hidden");
      return;
    }
  }

  itemForm.reset();
  itemFormSection.classList.add("hidden");
}

function formatCount(n) {
  if (n === 0) return "В этой категории пока пусто";
  return `Показано ${pluralize(n, ["товар", "товара", "товаров"])}`;
}

itemForm.addEventListener("submit", e => {
  e.preventDefault();

  const name = itemNameEl.value.trim();
  const type = itemTypeEl.value;
  const price = parseFloat(itemPriceEl.value);
  const desc = itemDescEl.value.trim();

  itemNameEl.value = "";
  itemDescEl.value = "";
  itemFormError.classList.add("hidden");

  try {
    if (currentEditItemName) {
      updateCategoryItem(categoryName, currentEditItemName, { name, type, price, desc });
    } else {
      addCategoryItem(categoryName, { name, type, price, desc });
    }
    currentEditItemName = null;
    isAddingNewItem = false;
    render();
  } catch (err) {
    itemFormError.textContent = err.message;
    itemFormError.classList.remove("hidden");
    render();
  }
});

const addItemBtn = document.querySelector(".btn-add-item");

addItemBtn.addEventListener("click", () => {
  isAddingNewItem = true;
  render();
});

cancelFormBtn.addEventListener("click", () => {
  currentEditItemName = null;
  isAddingNewItem = false;
  render();
});

grid.addEventListener("click", e => {
  const editBtn = e.target.closest(".icon-edit");
  const delBtn = e.target.closest(".icon-del");
  const buyBtn = e.target.closest(".btn-buy");

  if (editBtn) {
    e.preventDefault();
    currentEditItemName = editBtn.dataset.name;
    render();
  } else if (delBtn) {
    e.preventDefault();
    const itemName = delBtn.dataset.name;
    const card = delBtn.closest(".product-card");
    let confirmBtn = card.querySelector(".icon-del.confirm");

    if (!delBtn.classList.contains("confirm")) {
      const confirmEl = delBtn.cloneNode(true);
      confirmEl.textContent = "Confirm?";
      confirmEl.classList.add("confirm");
      delBtn.replaceWith(confirmEl);
    } else {
      removeCategoryItem(categoryName, itemName);
      render();
    }
  } else if (buyBtn) {
    e.preventDefault();
    const itemName = decodeURIComponent(buyBtn.dataset.name);
    const item = (catalogData[categoryName] || []).find(i => i.name === itemName);
    if (!item) return;
    addToCart(categoryName, item);
    buyBtn.textContent = "✓ Добавлено";
    buyBtn.disabled = true;
    setTimeout(() => { window.location.href = "../checkout/index.html"; }, 350);
  }
});

filterInput.addEventListener("input", render);

chips.forEach(chip => {
  chip.addEventListener("click", () => {
    chips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentType = chip.dataset.type;
    render();
  });
});

render();
