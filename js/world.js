// Мир Schüco: ряд разделов в шапке после первого экрана, разделы «О компании» / «Подход»,
// события истории и кнопка «Смотреть все» на узких экранах.
(function () {
  var root = document.documentElement;
  var header = document.querySelector('.header');
  var hero = document.querySelector('.world-hero');
  if (!header || !hero || !document.querySelector('.header__nav')) return;

  function update() {
    root.classList.toggle('is-docked', hero.getBoundingClientRect().bottom - header.offsetHeight <= 0);
  }
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
})();

(function () {
  document.querySelectorAll('.wacc__toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.wacc__item');
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
})();

(function () {
  var section = document.querySelector('.whist');
  if (!section) return;
  var all = section.querySelector('.whist__all');
  if (all) {
    all.addEventListener('click', function () { section.classList.add('is-all'); });
  }
})();
