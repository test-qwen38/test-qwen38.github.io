const ORDERS_CARRY_PREFIX = "orders::";
const ORDERS_MIRROR_KEY = "catalog_orders";

(function initCatalogOrders() {
  let carried = null;

  try {
    const rawName = window.name || "";
    if (rawName.indexOf(ORDERS_CARRY_PREFIX) === 0) {
      const parsed = JSON.parse(rawName.slice(ORDERS_CARRY_PREFIX.length));
      if (Array.isArray(parsed)) carried = parsed;
    }
  } catch (e) {}

  if (!carried) {
    try {
      const rawMirror = localStorage.getItem(ORDERS_MIRROR_KEY);
      if (rawMirror) {
        const mirrored = JSON.parse(rawMirror);
        if (Array.isArray(mirrored)) carried = mirrored;
      }
    } catch (e) {}
  }

  window.catalogOrders = Array.isArray(window.catalogOrders) ? window.catalogOrders : (carried || []);
})();

function syncCarried() {
  try {
    const json = JSON.stringify(window.catalogOrders);
    window.name = ORDERS_CARRY_PREFIX + json;
    localStorage.setItem(ORDERS_MIRROR_KEY, json);
  } catch (e) {}
}

function loadOrders() {
  return [...window.catalogOrders];
}

function saveOrder(order) {
  order.num = window.catalogOrders.length + 1;
  order.status = "new";
  window.catalogOrders.push(order);
  syncCarried();
  return order;
}

function setOrderStatus(id, status) {
  const order = window.catalogOrders.find(o => o.id === id);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  syncCarried();
  return order;
}

function findOrder(id) {
  return window.catalogOrders.find(o => o.id === id) || null;
}
