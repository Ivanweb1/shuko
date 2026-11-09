// Страница проекта: ряд разделов появляется в шапке после прокрутки первого экрана,
// галерея листается стрелками, форма отправляется демонстрационно.
(function () {
  var root = document.documentElement;
  var header = document.querySelector('.header');
  var hero = document.querySelector('.project-hero');
  if (!header || !hero || !document.querySelector('.header__nav')) return;

  function update() {
    var limit = hero.getBoundingClientRect().bottom - header.offsetHeight;
    root.classList.toggle('is-docked', limit <= 0);
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
})();

(function () {
  var track = document.querySelector('[data-gallery-track]');
  if (!track) return;

  var prev = document.querySelector('[data-gallery="prev"]');
  var next = document.querySelector('[data-gallery="next"]');
  var counter = document.querySelector('[data-gallery="count"]');

  // Сколько фото помещается в кадр: шаг = ширина фото + зазор между ними
  function pageSize() {
    var items = track.children;
    if (!items.length) return { per: 1, step: track.clientWidth };
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    var step = items[0].getBoundingClientRect().width + gap;
    return { per: Math.max(1, Math.round(track.clientWidth / step)), step: step };
  }

  function pageCount() {
    return Math.max(1, Math.ceil(track.children.length / pageSize().per));
  }

  function pageCurrent() {
    var size = pageSize();
    return Math.min(pageCount(), Math.round(track.scrollLeft / (size.step * size.per)) + 1);
  }

  function render() {
    if (counter) counter.textContent = pageCurrent() + '/' + pageCount();
    var atStart = track.scrollLeft <= 1;
    var atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
    if (prev) prev.disabled = atStart;
    if (next) next.disabled = atEnd;
  }

  function go(direction) {
    var size = pageSize();
    var max = track.scrollWidth - track.clientWidth;
    var left = Math.max(0, Math.min(max, track.scrollLeft + direction * size.step * size.per));
    track.scrollTo({ left: left, behavior: 'smooth' });
  }

  if (prev) prev.addEventListener('click', function () { go(-1); });
  if (next) next.addEventListener('click', function () { go(1); });
  track.addEventListener('scroll', render, { passive: true });
  window.addEventListener('resize', render);
  render();
})();

(function () {
  var form = document.querySelector('.pform__card');
  if (!form) return;

  var status = form.querySelector('.pform__status');
  var file = form.querySelector('.pfile input');
  var fileLabel = form.querySelector('.pfile span');

  if (file && fileLabel) {
    file.addEventListener('change', function () {
      fileLabel.textContent = file.files && file.files[0] ? file.files[0].name : 'Прикрепите файл';
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var valid = true;
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (control) {
      var empty = !control.value.trim();
      control.classList.toggle('is-invalid', empty);
      if (empty) valid = false;
    });
    if (status) {
      status.textContent = valid
        ? 'Заявка отправлена. Мы свяжемся с вами в течение часа.'
        : 'Заполните имя и телефон.';
    }
  });
})();
