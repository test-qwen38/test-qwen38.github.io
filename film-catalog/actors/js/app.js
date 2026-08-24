(function () {
  const data = window.FILM_DATA;
  const UI = window.UI;

  const pages = document.getElementById('pageTitle');
  const content = document.getElementById('content');
  const summary = document.getElementById('heroSummary');
  const crumbText = document.querySelector('.crumbs__current');
  const actorId = UI.parseQuery().get('id');
  const actor = actorId ? data.actors.find((a) => a.id === actorId) : null;

  function actorMovies(actorId) {
    return data.movies
      .filter((m) => m.actors.includes(actorId))
      .sort((a, b) => b.rating - a.rating);
  }

  // ---------- grid of all actors ----------
  function renderGrid() {
    const cards = data.actors
      .map((a) => {
        const movies = actorMovies(a.id);
        const avg = movies.length
          ? movies.reduce((s, m) => s + m.rating, 0) / movies.length
          : 0;
        return (
          '<a class="actor-card" href="index.html?id=' + a.id + '">' +
          '<span class="actor-card__avatar">' + UI.escapeHtml(UI.personInitials(a.name)) + '</span>' +
          '<span class="actor-card__name">' + UI.escapeHtml(a.name) + '</span>' +
          '<span class="actor-card__meta"><b>' + movies.length + '</b> ' + UI.plural(movies.length, ['фильм', 'фильма', 'фильмов']) +
            (movies.length ? ' · ' + UI.formatRating(avg) + ' ★' : '') +
          '</span>' +
          '</a>'
        );
      })
      .join('');
    content.innerHTML = '<div class="actors-grid">' + cards + '</div>';
    summary.textContent =
      data.actors.length + UI.plural(data.actors.length, ['актёр', 'актёра', 'актёров']) + ' · ' +
      data.movies.length + UI.plural(data.movies.length, ['фильм', 'фильма', 'фильмов']);
    document.title = 'Актеры — КиноКаталог';
  }

  // ---------- actor detail ----------
  function renderActorPage(actor) {
    const movies = actorMovies(actor.id);
    const avg = movies.length
      ? movies.reduce((s, m) => s + m.rating, 0) / movies.length
      : 0;
    const span = movies.length
      ? movies.reduce((s, m) => s + m.year, 0) / movies.length
      : 0;

    pages.textContent = actor.name;
    document.title = actor.name + ' — КиноКаталог';
    crumbText.textContent = actor.name;

    const rows = movies.length
      ? '<div class="movies-list">' +
        movies.map((m) => {
          const barWidth = (m.rating / 10) * 100;
          const cats = m.categories.map((c) => UI.categoryName(c)).join(' · ');
          return (
            '<a class="movie-row" href="../movie/index.html?id=' + m.id + '">' +
            '<span class="movie-row__thumb" style="' + UI.posterStyle(m.id) + '">' + UI.escapeHtml(UI.initials(m.title, 1)) + '</span>' +
            '<span class="movie-row__info">' +
            '<span class="movie-row__title">' + UI.escapeHtml(m.title) + '</span>' +
            '<span class="movie-row__meta">' + m.year + ' · ' + m.duration + ' мин</span>' +
            '</span>' +
            '<span class="movie-row__side">' +
            '<span class="movie-row__cats">' + UI.escapeHtml(cats) + '</span>' +
            '<span class="movie-row__rating">' +
            '<span class="movie-row__num">' + UI.formatRating(m.rating) + '</span>' +
            '<span class="movie-row__bar"><i style="width:' + barWidth + '%"></i></span>' +
            '</span>' +
            '<span class="movie-row__go" aria-hidden="true">→</span>' +
            '</span>' +
            '</a>'
          );
        })
        .join('') +
        '</div>'
      : '<p class="empty-note">Фильмы этого актера пока не добавлены в каталог.</p>';

    content.innerHTML =
      '<div class="actor-head">' +
      '<span class="actor-head__avatar">' + UI.escapeHtml(UI.personInitials(actor.name)) + '</span>' +
      '<div class="actor-head__info">' +
      '<h2>' + UI.escapeHtml(actor.name) + '</h2>' +
      '<div class="actor-head__stats">' +
      '<span class="stat"><span class="stat__num">' + movies.length + '</span><span class="stat__label">' + UI.plural(movies.length, ['фильм', 'фильма', 'фильмов']) + '</span></span>' +
      (movies.length
        ? '<span class="stat"><span class="stat__num">' + UI.formatRating(avg) + '</span><span class="stat__label">средний рейтинг</span></span>' +
        '<span class="stat"><span class="stat__num">' + Math.round(span) + '</span><span class="stat__label">средний год</span></span>'
        : '') +
      '</div>' +
      '</div>' +
      '</div>' +
      '<h3 class="section-title">Фильмы</h3>' +
      rows;

    summary.textContent = movies.length
      ? movies.length + UI.plural(movies.length, ['фильм', 'фильма', 'фильмов']) + ' в каталоге'
      : 'нет фильмов в каталоге';
  }

  if (actor) renderActorPage(actor);
  else renderGrid();
})();
