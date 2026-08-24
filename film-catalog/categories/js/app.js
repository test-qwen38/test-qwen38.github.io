(function () {
  const data = window.FILM_DATA;
  const UI = window.UI;

  const panels = document.getElementById('panels');
  const summary = document.getElementById('heroSummary');
  const id = UI.parseQuery().get('id');
  const single = id ? data.categories.find((c) => c.id === id) : null;

  function categoryMovies(catId) {
    return data.movies
      .filter((m) => m.categories.includes(catId))
      .sort((a, b) => b.rating - a.rating);
  }

  function rowHtml(m) {
    const barWidth = (m.rating / 10) * 100;
    return (
      '<a class="row" href="../movie/index.html?id=' + m.id + '">' +
      '<span class="row__thumb" style="' + UI.posterStyle(m.id) + '">' + UI.escapeHtml(UI.initials(m.title, 1)) + '</span>' +
      '<span class="row__info">' +
      '<span class="row__title">' + UI.escapeHtml(m.title) + '</span>' +
      '<span class="row__meta">' + m.year + ' · ' + m.duration + ' мин</span>' +
      '</span>' +
      '<span class="row__rating">' +
      '<span class="row__num">' + UI.formatRating(m.rating) + '</span>' +
      '<span class="row__bar"><i style="width:' + barWidth + '%"></i></span>' +
      '</span>' +
      '<span class="row__go" aria-hidden="true">→</span>' +
      '</a>'
    );
  }

  function panelHtml(cat) {
    const movies = categoryMovies(cat.id);
    const rows = movies.length
      ? movies.map(rowHtml).join('')
      : '<div class="panel--empty"><p>Пока нет фильмов этой категории</p></div>';
    return (
      '<article class="panel">' +
      '<header class="panel__head">' +
      '<h2 class="panel__name">' + UI.escapeHtml(cat.name) + '</h2>' +
      '<span class="panel__count"><b>' + movies.length + '</b> ' + UI.plural(movies.length, ['фильм', 'фильма', 'фильмов']) + '</span>' +
      '</header>' +
      '<div class="panel__rows">' + rows + '</div>' +
      '</article>'
    );
  }

  const cats = single ? [single] : data.categories;
  panels.innerHTML = cats.map(panelHtml).join('');
  if (single) panels.classList.add('panels--single');

  const total = data.movies.length;
  const catCount = data.categories.length;
  summary.textContent = (
    catCount + UI.plural(catCount, ['категория', 'категории', 'категорий']) + ' · ' +
    total + UI.plural(total, ['фильм', 'фильма', 'фильмов'])
  );

  document.title = (single ? single.name + ' — ' : '') + 'Категории — КиноКаталог';
})();
