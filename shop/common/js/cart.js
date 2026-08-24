const CART_STORAGE_KEY = "cart_v1";

let cart = loadCart();

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(e => e && typeof e.category === "string" && typeof e.name === "string");
      }
    }
  } catch (e) {}
  return [];
}

function persistCart() {
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch (e) {}
}

function findCartLine(category, name) {
  return cart.find(e => e.category === category && e.name === name);
}

function getCartLines() {
  const valid = [];
  let changed = false;

  for (const entry of cart) {
    const item = (catalogData[entry.category] || []).find(i => i.name === entry.name);
    if (!item) {
      changed = true;
      continue;
    }
    entry.type = item.type;
    entry.price = item.price;
    valid.push(entry);
  }

  if (changed) persistCart();
  return valid;
}

function addToCart(category, item) {
  const line = findCartLine(category, item.name);
  if (line) {
    line.qty = Math.min(99, line.qty + 1);
  } else {
    cart.push({ category: category, name: item.name, type: item.type || "Товар", price: item.price, qty: 1 });
  }
  persistCart();
}

function setCartItemQty(category, name, qty) {
  const line = findCartLine(category, name);
  if (!line) return null;
  line.qty = Math.min(99, Math.max(1, Math.round(qty) || 1));
  persistCart();
  return line;
}

function removeCartItem(category, name) {
  const idx = cart.findIndex(e => e.category === category && e.name === name);
  if (idx !== -1) {
    cart.splice(idx, 1);
    persistCart();
  }
}

function clearCart() {
  cart = [];
  persistCart();
}
