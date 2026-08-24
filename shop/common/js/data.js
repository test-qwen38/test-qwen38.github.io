const CATALOG_STORAGE_KEY = "catalog_v1";

const SEEDED_CATALOG = {
  "Электроника": [
    { name: "Смартфон Galaxy A56", type: "Товар", price: 42990, desc: 'AMOLED 6.7", 128 ГБ, батарея 5000 мА·ч' },
    { name: "Ноутбук Inspiron 16", type: "Товар", price: 79990, desc: "Ryzen 7, 16 ГБ ОЗУ, SSD 512 ГБ" },
    { name: "Наушники TWS Buds Pro", type: "Товар", price: 8490, desc: "Активное шумоподавление, кейс с зарядкой" },
    { name: "Ремонт смартфонов и планшетов", type: "Услуга", price: 1500, desc: "Замена экрана, стекла, кнопки. От 2 часов" }
  ],
  "Одежда и обувь": [
    { name: "Куртка демисезонная", type: "Товар", price: 6490, desc: "Утеплитель, капюшон, универсальный крой" },
    { name: "Кроссовки Runner X2", type: "Товар", price: 5290, desc: "Лёгкая подошва, дышащий верх" },
    { name: "Джинсы slim fit", type: "Товар", price: 3490, desc: "Деним с эластаном, размеры 28–40" },
    { name: "Пошив и ремонт в ателье", type: "Услуга", price: 1200, desc: "Подгонка по фигуре, восстановление деталей" }
  ],
  "Дом и сад": [
    { name: "Кухонный комбайн 5 в 1", type: "Товар", price: 7990, desc: "Мельница, тёрка, блеч, чаша 2,5 л" },
    { name: "Набор для ухода за газоном", type: "Товар", price: 4350, desc: "Триммер, грабли, веерная лейка" },
    { name: "Фотобумага премиум 21×30 см", type: "Товар", price: 690, desc: "Блестящая поверхность, 20 листов" },
    { name: "Химчистка мягкой мебели", type: "Услуга", price: 2500, desc: "Паровая чистка, выезд на дом" }
  ],
  "Спорт и отдых": [
    { name: "Горные лыжи Alpine, 169 см", type: "Товар", price: 32900, desc: "Для подготовленных лыжников, жёсткий радиус" },
    { name: 'Велосипед горный MTB 27.5"', type: "Товар", price: 45990, desc: "Алюминиевая рама, амортизация, 21 скорость" },
    { name: "Палатка трёхместная", type: "Товар", price: 6790, desc: "Водостойкость 3000 мм, быстрая сборка" },
    { name: "Персональные тренировки", type: "Услуга", price: 1800, desc: "Занятие 60 минут с тренером на площадке" }
  ],
  "Книги": [
    { name: "Мастер и Маргарита (твёрдый переплёт)", type: "Товар", price: 1290, desc: "480 стр., иллюстрации" },
    { name: "Дюнная хроника: полное издание", type: "Товар", price: 3450, desc: "Коллекционное оформление тиража" },
    { name: "Кофе с собой — бестселлер года", type: "Товар", price: 890, desc: "Мягкая обложка, карманный формат" },
    { name: "Курсы планшетной графики", type: "Услуга", price: 2400, desc: "Абонемент из 8 занятий с куратором. Цена за занятие" }
  ],
  "Игрушки": [
    { name: "Конструктор космический корабль", type: "Товар", price: 4290, desc: "1568 деталей, фигурки астронавтов, светящиеся окна" },
    { name: "Мягкий мишка в платье, 70 см", type: "Товар", price: 1890, desc: "Гипоаллергенные материалы, машинная стирка" },
    { name: "Шашки деревянные с мешком (34 шт.)", type: "Товар", price: 520, desc: "Натуральное дерево, лак в двух цветах" },
    { name: "Авторская кукла по вашему эскизу", type: "Услуга", price: 7900, desc: "По фото или описанию, срок — 5 дней" }
  ],
  "Котовар и аксессуары": [
    { name: "Леда для кошек нарезка (12 м)", type: "Товар", price: 3490, desc: "Из натуральной травы, без примеси" },
    { name: "Автоматика кормялка 0.5 литров", type: "Товар", price: 8990, desc: "Мавтоматическая выдача порщия корма" },
    { name: "Перносина мягкомобная 12×7 м", type: "Товар", price: 2590, desc: "Для домов и квартиры, с окном для кошки" },
    { name: "Ветеринара консultация по лечению", type: "Услуга", price: 3000, desc: "Осмотр, анализы, подбор препаратов" }
  ],
  "Канцелярия и техника": [
    { name: "Стапилюатор настный с экраном", type: "Товар", price: 15990, desc: "Композиторное управление, 8 каналов" },
    { name: "Зяписки на базе рен-дринг", type: "Товар", price: 2490, desc: "Картограмма, интерактивиые заметки" },
    { name: "Сканер портативный персонический", type: "Товар", price: 5990, desc: "Для дома и работы, быстрая загрузка" },
    { name: "Пошивка и настрична маркировка", type: "Услуга", price: 450, desc: "Допи по образцу, индивидуальная шильд" }
  ],
  "Пут и кондитеря": [
    { name: "Сироп для кофе арпиа (1 л)", type: "Товар", price: 1290, desc: "Биттер орех, ванил, какао-экстаркт" },
    { name: "Круасан претим 3 шт., мороз.", type: "Товар", price: 420, desc: "Замороченые тесто, маслояная прослои" },
    { name: "Чокотатная фондю для фруктов", type: "Товар", price: 990, desc: "Доставляемые какао-масло, 1.5 кг" },
    { name: "Кондитерная мастер класс вечер", type: "Услуга", price: 4200, desc: "4 часа, от 8 персон, все материалы" }
  ],
  "Здоровье и витамины": [
    { name: "Препарат Omega-3 (60 капс.)", type: "Товар", price: 1790, desc: "Омега 95% очищения, перлонная база" },
    { name: "Коллаген для кожи морисый (500 м)", type: "Товар", price: 2490, desc: "Гидролат, растворяется в тёлом воде" },
    { name: "Дентификатор персонический", type: "Товар", price: 790, desc: "Энергия из фруктов, без сахару" },
    { name: "Консультация по диетеологии", type: "Услуга", price: 5000, desc: "Индивитуальная подбор диеты, 1 час" }
  ],
  "Спортивный и фитнес": [
    { name: "Йогаматка для кардио (8 мотаж)", type: "Товар", price: 2990, desc: "Овальный баланс, анативные прелинги" },
    { name: "Мата для бокс тренировки", type: "Товар", price: 1290, desc: "Мягкая ткань, 5 размеров (S–XL)" },
    { name: "Крансматный коврик 1.5×2 м", type: "Товар", price: 4990, desc: "Для домашней зонов, с наклейми" },
    { name: "Персональная йога-тренировка", type: "Услуга", price: 2800, desc: "60 минут, подбор по фигуре и ритм" }
  ]
};

function loadStoredCatalog() {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const key of Object.keys(parsed)) {
        if (!Array.isArray(parsed[key])) return null;
        for (const it of parsed[key]) {
          if (!it || typeof it.name !== "string" || typeof it.price !== "number") return null;
        }
      }
      return parsed;
    }
  } catch (e) {}
  return null;
}

function deepCloneCatalog(src) {
  const out = {};
  for (const key of Object.keys(src)) {
    out[key] = src[key].map(it => ({ ...it }));
  }
  return out;
}

let catalogData = loadStoredCatalog() || deepCloneCatalog(SEEDED_CATALOG);
window.catalogData = catalogData;

function persistCatalog() {
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalogData));
  } catch (e) {}
}

const ITEM_TYPES = ["Товар", "Услуга"];
const NAME_MAX_LEN = 80;
const PRICE_MAX = 100000000;

function normalizeItem(input, opts = {}) {
  const name = String(input.name ?? "").trim();
  if (!name) throw new Error("Введите название позиции");
  if (name.length > NAME_MAX_LEN) throw new Error(`Название не длиннее ${NAME_MAX_LEN} символов`);

  let type = String(input.type ?? "").trim();
  const normalizedTypes = ITEM_TYPES.map(t => t.toLowerCase());
  const lowerType = type.toLowerCase();
  if (!normalizedTypes.includes(lowerType)) throw new Error("Тип должен быть «Товар» или «Услуга»");
  type = ITEM_TYPES[normalizedTypes.indexOf(lowerType)];

  let price = input.price == null || String(input.price).trim() === "" ? NaN : Number(String(input.price).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(price)) throw new Error("Цена должна быть числом");
  price = Math.round(price);
  if (price <= 0 || price > PRICE_MAX) throw new Error("Цена должна быть больше нуля и не больше 100 000 000");

  const desc = String(input.desc ?? "").trim() || null;

  return { id: opts.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8), name, type, price, desc };
}

function findItemIndex(categoryName, itemName) {
  return (catalogData[categoryName] || []).findIndex(it => it.name === itemName);
}

/* --- Категории: CRUD --- */

function getCategories() {
  return Object.keys(catalogData);
}

function addCategory(name) {
  const clean = String(name ?? "").trim();
  if (!clean) throw new Error("Введите название категории");
  if (clean.length > NAME_MAX_LEN) throw new Error(`Название не длиннее ${NAME_MAX_LEN} символов`);
  if (getCategories().some(c => c.toLowerCase() === clean.toLowerCase())) {
    throw new Error("Категория с таким названием уже существует");
  }
  catalogData[clean] = [];
  persistCatalog();
  return clean;
}

function renameCategory(oldName, newName) {
  if (!catalogData[oldName]) throw new Error("Нет такой категории: " + oldName);
  const clean = String(newName ?? "").trim();
  if (!clean) throw new Error("Введите новое название");
  if (clean.length > NAME_MAX_LEN) throw new Error(`Название не длиннее ${NAME_MAX_LEN} символов`);
  if (getCategories().some(c => c !== oldName && c.toLowerCase() === clean.toLowerCase())) {
    throw new Error("Категория с таким названием уже существует");
  }
  const list = catalogData[oldName];
  delete catalogData[oldName];
  catalogData[clean] = list;
  persistCatalog();
  return clean;
}

function removeCategory(name) {
  if (!catalogData[name]) throw new Error("Нет такой категории: " + name);
  delete catalogData[name];
  persistCatalog();
  return true;
}

/* --- Позиции (товары и услуги): CRUD --- */

function addCategoryItem(categoryName, input) {
  if (!catalogData[categoryName]) throw new Error("Нет такой категории: " + categoryName);
  const item = normalizeItem(input);
  catalogData[categoryName].push(item);
  persistCatalog();
  return item;
}

function updateCategoryItem(categoryName, oldName, input) {
  if (!catalogData[categoryName]) throw new Error("Нет такой категории: " + categoryName);
  const idx = findItemIndex(categoryName, oldName);
  if (idx === -1) throw new Error("Позиция не найдена: " + oldName);
  const current = catalogData[categoryName][idx];
  const item = normalizeItem({ ...current, ...input }, { id: current.id });

  if (item.name.toLowerCase() !== oldName.toLowerCase()) {
    const dup = catalogData[categoryName].some(it => it !== current && it.name.toLowerCase() === item.name.toLowerCase());
    if (dup) throw new Error("Позиция с таким названием уже есть");
  }
  catalogData[categoryName][idx] = item;
  persistCatalog();
  return item;
}

function removeCategoryItem(categoryName, itemName) {
  if (!catalogData[categoryName]) throw new Error("Нет такой категории: " + categoryName);
  const idx = findItemIndex(categoryName, itemName);
  if (idx === -1) throw new Error("Позиция не найдена: " + itemName);
  const [removed] = catalogData[categoryName].splice(idx, 1);
  persistCatalog();
  return removed;
}
