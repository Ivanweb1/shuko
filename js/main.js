// Группы навигации на первом экране: на устройствах без наведения подпункты открываются по тапу
(function () {
  var groups = document.querySelectorAll('.nav-group');

  groups.forEach(function (group) {
    var title = group.querySelector('.nav-group__title');
    title.addEventListener('click', function () {
      var open = !group.classList.contains('is-open');
      groups.forEach(function (g) { g.classList.remove('is-open'); });
      group.classList.toggle('is-open', open);
      title.setAttribute('aria-expanded', String(open));
    });
  });

  // Сворачивание ряда навигации при скролле вниз.
  // Раскрываем только по явному жесту вверх у самого верха страницы: если страница
  // после схлопывания станет короче экрана, браузер сам сбросит скролл в 0,
  // и раскрытие по позиции скролла зациклило бы анимацию.
  var hero = document.querySelector('.hero');
  var lastY = window.scrollY;

  function setCollapsed(on) {
    if (hero.classList.contains('is-collapsed') === on) return;
    hero.classList.toggle('is-collapsed', on);
    if (on) groups.forEach(function (g) { g.classList.remove('is-open'); });
  }

  if (window.scrollY > 0) setCollapsed(true);

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (y > lastY && y > 0) setCollapsed(true);
    lastY = y;
  }, { passive: true });

  window.addEventListener('wheel', function (e) {
    if (e.deltaY > 0) setCollapsed(true);
    else if (e.deltaY < 0 && window.scrollY <= 0) setCollapsed(false);
  }, { passive: true });

  var touchY = null;
  window.addEventListener('touchstart', function (e) { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (touchY === null) return;
    var dy = e.touches[0].clientY - touchY;
    if (dy < -10) setCollapsed(true);
    else if (dy > 10 && window.scrollY <= 0) setCollapsed(false);
  }, { passive: true });

  window.addEventListener('keydown', function (e) {
    if (['ArrowDown', 'PageDown', ' ', 'End'].indexOf(e.key) !== -1) setCollapsed(true);
    if (['ArrowUp', 'PageUp', 'Home'].indexOf(e.key) !== -1 && window.scrollY <= 0) setCollapsed(false);
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-group')) {
      groups.forEach(function (g) { g.classList.remove('is-open'); });
    }
  });
})();
