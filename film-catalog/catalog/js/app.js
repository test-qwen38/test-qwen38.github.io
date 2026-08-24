(function () {
  const data = window.FILM_DATA;
  const UI = window.UI;

  const grid = document.getElementById('grid');
  const filtersEl = document.getElementById('filters');
  const input = document.getElementById('searchInput');
  const sortSel = document.getElementById('sortSelect');
  const summary = document.getElementById('heroSummary');
  const allTitles = data.movies.map((m) => m.title);

  const params = UI.parseQuery();
  const initialCat = data.categories.some((c) => c.id === params.get('cat')) ? params.get('cat') : '';
  const state = { query: '', category: initialCat, tag: '', sort: 'rating' };

  const SORTS = {
    'rating': (a, b) => b.rating - a.rating,
    'year-desc': (a, b) => b.year - a.year,
    'year-asc': (a, b) => a.year - b.year,
    'title': (a, b) => a.title.localeCompare(b.title, 'ru')
  };

  function allTags() {
    const set = [];
    const seen = Object.create(null);
    data.movies.forEach((m) => {
      m.tags.forEach((t) => {
        const key = t.toLowerCase();
        if (!seen[key]) {
          seen[key] = true;
          set.push(t);
        }
      });
    });
    return set;
  }

  function buildFilters() {
    let html = '<button class="filter is-checked" data-type="all">Все</button>';
    html += data.categories
      .map((c) => '<button class="filter" data-type="cat" data-value="' + c.id + '">' + UI.escapeHtml(c.name) + '</button>')
      .join('');
    html += allTags()
      .map((t) => '<button class="filter filter--tag" data-type="tag" data-value="' + UI.escapeHtml(t) + '"> # ' + UI.escapeHtml(t) + '</button>')
      .join('');
    filtersEl.innerHTML = html;
  }

  function refreshFilterState() {
    filtersEl.querySelectorAll('.filter').forEach((btn) => {
      const type = btn.dataset.type;
      let active = false;
      if (type === 'all') active = !state.category && !state.tag;
      else if (type === 'cat') active = state.category === btn.dataset.value && !state.tag;
      else if (type === 'tag') active = state.tag === btn.dataset.value;
      btn.classList.toggle('is-checked', active);
    });
  }

  function getFiltered() {
    const q = state.query.trim().toLowerCase();
    const tagLower = state.tag.toLowerCase();
    let list = data.movies.filter((m) => {
      if (state.category && !m.categories.includes(state.category)) return false;
      if (state.tag && !m.tags.some((t) => t.toLowerCase() === tagLower)) return false;
      if (!q) return true;
      const inTitle = allTitles.indexOf(m.title) !== -1 && m.title.toLowerCase().includes(q);
      const inActor = m.actors.some((id) => UI.actorName(id).toLowerCase().includes(q));
      const inTag = m.tags.some((t) => t.toLowerCase().includes(q));
      return inTitle || inActor || inTag;
    });
    list = list.slice().sort(SORTS[state.sort] || SORTS.rating);
    return list;
  }

  function render() {
    const list = getFiltered();
    if (!list.length) {
      grid.innerHTML =
        '<div class="empty">' +
        '<p class="empty__title">Ничего не найдено</p>' +
        '<p>Попробуйте изменить запрос или фильтры</p>' +
        '<button id="resetBtn">Сбросить фильтры</button>' +
        '</div>';
      document.getElementById('resetBtn').addEventListener('click', resetAll);
    } else {
      grid.innerHTML = list.map((m) => UI.cardHtml(m, '../movie/index.html')).join('');
    }
    const count = list.length;
    const cat = state.category ? UI.categoryName(state.category) : 'весь каталог';
    const tagPart = state.tag ? ' · тег «' + state.tag + '»' : '';
    summary.textContent = count + UI.plural(count, ['фильм', 'фильма', 'фильмов']) + ' · ' + cat + tagPart;
  }

  function resetAll() {
    state.query = '';
    state.category = '';
    state.tag = '';
    state.sort = 'rating';
    input.value = '';
    sortSel.value = 'rating';
    refreshFilterState();
    render();
  }

  buildFilters();
  refreshFilterState();
  render();

  input.addEventListener('input', () => {
    state.query = input.value;
    render();
  });
  sortSel.addEventListener('change', () => {
    state.sort = sortSel.value;
    render();
  });
  filtersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    const type = btn.dataset.type;
    if (type === 'all') {
      state.category = '';
      state.tag = '';
    } else if (type === 'cat') {
      state.category = btn.dataset.value;
      state.tag = '';
    } else if (type === 'tag') {
      state.tag = btn.dataset.value;
      state.category = '';
    }
    refreshFilterState();
    render();
  });
})();
