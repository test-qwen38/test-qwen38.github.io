(function () {
  const data = window.FILM_DATA;
  const UI = window.UI;

  const id = parseInt(UI.parseQuery().get('id'), 10);
  const movie = data.movies.find((m) => m.id === id);
  const content = document.getElementById('content');
  const crumbs = document.getElementById('crumbs');
  document.body.classList.add('page-movie');

  if (!movie) {
    content.innerHTML =
      '<div class="notfound">' +
      '<h1>Фильм не найден</h1>' +
      '<p>Возможно, он был удалён из каталога.</p>' +
      '<a href="../catalog/index.html">Вернуться в каталог</a>' +
      '</div>';
    return;
  }

  document.title = movie.title + ' — КиноКаталог';
  const mainCat = data.categories.find((c) => c.id === movie.categories[0]);

  crumbs.innerHTML =
    '<a href="../index.html">Главная</a><span class="crumbs__sep">/</span>' +
    '<a href="../catalog/index.html">Каталог</a><span class="crumbs__sep">/</span>' +
    (mainCat ? '<a href="../catalog/index.html?cat=' + mainCat.id + '">' + UI.escapeHtml(mainCat.name) + '</a><span class="crumbs__sep">/</span>' : '') +
    '<span class="crumbs__current">' + UI.escapeHtml(movie.title) + '</span>';

  const catLinks = movie.categories
    .map((cId) => {
      const c = data.categories.find((x) => x.id === cId);
      return c ? '<a class="cat-link" href="../catalog/index.html?cat=' + c.id + '">' + UI.escapeHtml(c.name) + '</a>' : '';
    })
    .join('');

  const tags = movie.tags
    .map((t) => '<span class="tag"># ' + UI.escapeHtml(t) + '</span>')
    .join('');

  const actorLinks = movie.actors
    .map((aId) => {
      const a = data.actors.find((x) => x.id === aId);
      if (!a) return '';
      return (
        '<a class="actor" href="../actors/index.html?id=' + a.id + '">' +
        '<span class="actor__avatar">' + UI.escapeHtml(UI.personInitials(a.name)) + '</span>' +
        '<span class="actor__name">' + UI.escapeHtml(a.name) + '</span>' +
        '</a>'
      );
    })
    .join('');

  // --- related movies: share an actor or category, highest rating first ---
  const related = data.movies
    .filter((m) => {
      if (m.id === movie.id) return false;
      const sharedActor = m.actors.some((a) => movie.actors.includes(a));
      const sharedCat = m.categories.some((c) => movie.categories.includes(c));
      return sharedActor || sharedCat;
    })
    .map((m) => {
      const sharedCats = m.categories.filter((c) => movie.categories.includes(c));
      let score = m.rating;
      score += sharedCats.length * 0.5;
      score += m.actors.filter((a) => movie.actors.includes(a)).length * 0.25;
      return { m, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const sharedLabel =
    related.length > 1
      ? related.length + UI.plural(related.length, ['похожий фильм', 'похожих фильма', 'похожих фильмов'])
      : related.length === 1
        ? '1 похожий фильм'
        : '';

  const relatedHtml = related.length
    ? '<section class="related">' +
      '<h2>Похожие фильмы</h2>' +
      '<p class="related__sub">' + sharedLabel + ' по совпадающим актерам и категориям</p>' +
      '<div class="grid">' +
      related.map((r) => UI.cardHtml(r.m, 'index.html')).join('') +
      '</div>' +
      '</section>'
    : '';

  content.innerHTML =
    '<div class="detail">' +
    '<div class="poster" style="' + UI.posterStyle(movie.id) + '">' +
    '<span class="poster__name">' + UI.escapeHtml(UI.initials(movie.title)) + '</span>' +
    '</div>' +
    '<div class="info">' +
    '<h1>' + UI.escapeHtml(movie.title) + '</h1>' +
    '<div class="info__meta">' +
    '<span class="meta-item">' + movie.year + '</span>' +
    '<span class="meta-item">' + movie.duration + ' мин</span>' +
    '<span class="meta-item">' + movie.actors.length + UI.plural(movie.actors.length, ['актёр', 'актёра', 'актёров']) + '</span>' +
    '</div>' +
    '<div class="rating-block">' +
    '<span class="rating-block__num">' + UI.formatRating(movie.rating) + '</span>' +
    UI.stars(movie.rating) +
    '<span class="rating-block__label">из 10</span>' +
    '</div>' +
    '<div class="cats">' + catLinks + '</div>' +
    '<div class="tags">' + tags + '</div>' +
    '<div class="desc"><h2>Описание</h2><p>' + UI.escapeHtml(movie.description) + '</p></div>' +
    '<div class="actors-block"><h2>В ролях</h2><div class="actors">' + actorLinks + '</div></div>' +
    '</div>' +
    '</div>' +
    relatedHtml;
})();
