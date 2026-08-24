(function () {
  const data = window.FILM_DATA;
  const categoryMap = Object.fromEntries(data.categories.map((c) => [c.id, c.name]));
  const actorMap = Object.fromEntries(data.actors.map((a) => [a.id, a.name]));

  const PALETTES = [
    ['#0f2027', '#2c5364'],
    ['#1a2a6c', '#b21f1f'],
    ['#232526', '#414345'],
    ['#2b5876', '#4e4376'],
    ['#141e30', '#243b55'],
    ['#3a1c71', '#d76d77'],
    ['#00467f', '#a5cc82'],
    ['#42275a', '#734b6d'],
    ['#16222a', '#3a6073'],
    ['#5f2c82', '#49a09d'],
    ['#200122', '#6f0000'],
    ['#093028', '#237a57']
  ];

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function posterStyle(seed) {
    const pair = PALETTES[Math.abs(seed) % PALETTES.length];
    return 'background:linear-gradient(135deg,' + pair[0] + ' 0%,' + pair[1] + ' 100%)';
  }

  function initials(text, maxWords) {
    const words = String(text).split(/\s+/).filter(Boolean).slice(0, maxWords || 2);
    return words.map((w) => (w[0] || '').toUpperCase()).join('') || '•';
  }

  function personInitials(name) {
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function stars(rating) {
    const width = Math.max(0, Math.min(100, (rating / 10) * 100));
    return (
      '<span class="stars" aria-hidden="true">' +
      '<span class="stars__base">★★★★★</span>' +
      '<span class="stars__fill" style="width:' + width + '%">★★★★★</span>' +
      '</span>'
    );
  }

  function formatRating(rating) {
    return Number(rating).toFixed(1);
  }

  function plural(n, forms) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return forms[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
    return forms[2];
  }

  function categoryName(id) {
    return categoryMap[id] || id;
  }

  function actorName(id) {
    return actorMap[id] || id;
  }

  function parseQuery() {
    return new URLSearchParams(window.location.search);
  }

  function cardHtml(movie, movieHref) {
    const cats = movie.categories.map((id) => escapeHtml(categoryName(id))).join(' · ');
    const tags = movie.tags
      .slice(0, 3)
      .map((t) => '<span class="tag">' + escapeHtml(t) + '</span>')
      .join('');
    return (
      '<a class="card" href="' + movieHref + '?id=' + movie.id + '">' +
      '<div class="card__poster" style="' + posterStyle(movie.id) + '">' +
      '<span class="card__poster-name">' + escapeHtml(initials(movie.title)) + '</span>' +
      '<span class="card__badge">' + formatRating(movie.rating) + '</span>' +
      '</div>' +
      '<div class="card__body">' +
      '<h2 class="card__title">' + escapeHtml(movie.title) + '</h2>' +
      '<p class="card__meta">' + movie.year + ' · ' + movie.duration + ' мин</p>' +
      '<p class="card__cats">' + cats + '</p>' +
      '<div class="card__tags">' + tags + '</div>' +
      '</div>' +
      '</a>'
    );
  }

  window.UI = {
    escapeHtml,
    posterStyle,
    initials,
    personInitials,
    stars,
    formatRating,
    plural,
    categoryName,
    actorName,
    parseQuery,
    cardHtml
  };
})();
