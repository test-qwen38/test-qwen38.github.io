const list = document.getElementById("categoryList");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const addFormSection = document.querySelector(".form-inline-category");
const addForm = document.getElementById("addCategoryForm");
const newNameInput = document.getElementById("newNameInput");
const formError = document.getElementById("categoryFormError");
let editingName = null;

renderSiteNav("categories");

function refreshUiForRole() {
  if (editingName) return;
  const admin = isAdmin();
  if (!admin && addFormSection) addFormSection.classList.add("hidden");
}

if (!requireAuthRedirect("categories/index.html")) {
  window.stop();
} else {
  refreshUiForRole();
}

function getCategoriesWithCount() {
  return Object.keys(catalogData).map(name => ({ name, count: catalogData[name].length }));
}

function render(filter = "") {
  const query = (filter || "").trim().toLowerCase();
  const all = getCategoriesWithCount();
  const items = all.filter(c => c.name.toLowerCase().includes(query));

  list.innerHTML = items.map(c => {
    const isRenaming = editingName === c.name;
    return `
    <li class="category-item ${isRenaming ? "renaming" : ""}">
      ${isRenaming ? `
        <form class="inline-rename-form" data-category="${escapeAttr(c.name)}">
          <input type="text" name="name" value="${escapeHtml(c.name)}" autocomplete="off">
          <button type="submit" class="btn-submit btn-sm">Сохранить</button>
          <button type="button" class="btn-ghost btn-sm cancel-rename">Отмена</button>
        </form>
      ` : `
        <a href="../catalog/index.html?category=${encodeURIComponent(c.name)}" target="_top">
          <span class="category-name">${escapeHtml(c.name)}</span>
          <span class="category-count">${pluralize(c.count, ["товар", "товара", "товаров"])}</span>
        </a>
        ${isAdmin() ? `
        <div class="item-actions">
          <button type="button" class="icon-btn icon-edit btn-rename" data-name="${escapeAttr(c.name)}" title="Переименовать">✎</button>
          <button type="button" class="icon-btn icon-del btn-danger" data-name="${escapeAttr(c.name)}" title="Удалить">×</button>
        </div>
      ` : ""}
      `}
    </li>
  `}).join("");

  emptyState.style.display = items.length ? "none" : "block";
}

addForm.addEventListener("submit", e => {
  e.preventDefault();
  if (!isAdmin()) return;
  const name = newNameInput.value.trim();
  newNameInput.value = "";
  formError.classList.add("hidden");
  try {
    if (editingName) {
      renameCategory(editingName, name);
      editingName = null;
    } else {
      addCategory(name);
    }
    render(searchInput.value);
  } catch (err) {
    formError.textContent = err.message;
    formError.classList.remove("hidden");
    render(searchInput.value);
  }
});

list.addEventListener("click", e => {
  const btn = e.target.closest(".icon-btn, .btn-submit, .cancel-rename");
  if (!btn) return;
  if (!isAdmin()) return;
  e.preventDefault();

  const categoryItem = btn.closest(".category-item");
  if (!categoryItem) {
    console.error('No category item found for btn', e.target);
    return;
  }

  let name;

  if (btn.classList.contains("cancel-rename")) {
    editingName = null;
    render(searchInput.value);
    return;
  }

  if (btn.classList.contains("icon-edit")) {
    const form = categoryItem.querySelector("form");

    if (!form) {
      const anchor = categoryItem.querySelector("a");
      if (!anchor) return;
      name = decodeURIComponent(anchor.href.split("category=").pop());
    } else {
      name = form.dataset.category;
    }

    editingName = name;
    render(searchInput.value);
    return;
  } else if (btn.classList.contains("icon-del")) {
    if (!btn.classList.contains("confirm")) {
      btn.textContent = "✓";
      btn.title = "Подтвердить удаление?";
      btn.classList.add("confirm");

      clearTimeout(window.__categoryDeleteTimer);
      window.__categoryDeleteTimer = setTimeout(() => {
        render(searchInput.value);
      }, 2500);
      return;
    }

    name = btn.dataset.name || "";
    if (!name) return;

    clearTimeout(window.__categoryDeleteTimer);
    removeCategory(name);
    render(searchInput.value);
    return;
  } else if (btn.classList.contains("btn-submit")) {
    const form = btn.closest("form");
    if (!form) return;
    const newName = form.querySelector('input[name="name"]').value.trim();
    const oldName = form.dataset.category;

    if (newName === oldName) {
      editingName = null;
      render(searchInput.value);
      return;
    }

    try {
      renameCategory(oldName, newName);
      editingName = null;
      render(searchInput.value);
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.remove("hidden");
    }
    return;
  }
});

list.addEventListener("submit", e => {
  e.preventDefault();
  if (!isAdmin()) return;
  const form = e.target;
  const newName = form.querySelector('input[name="name"]').value.trim();
  const oldName = form?.dataset.category;

  if (!oldName) {
    console.error('No old category name found', form);
    return;
  }

  try {
    renameCategory(oldName, newName);
    editingName = null;
    render(searchInput.value);
  } catch (err) {
    console.error('Rename error', err);
    formError.textContent = err.message;
    formError.classList.remove("hidden");
  }
});

searchInput.addEventListener("input", e => {
  render(e.target.value);
});

render();
