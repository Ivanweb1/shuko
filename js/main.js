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
    if (document.documentElement.classList.contains('menu-open')) return;
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

// Меню под бургером
(function () {
  var root = document.documentElement;
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  var overlay = document.querySelector('.menu-overlay');
  var hideTimer = null;

  function open() {
    clearTimeout(hideTimer);
    menu.hidden = false;
    overlay.hidden = false;
    menu.scrollTop = 0;
    // даём браузеру отрисовать скрытое состояние, чтобы сработала анимация
    void menu.offsetHeight;
    root.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
  }

  function close() {
    if (!root.classList.contains('menu-open')) return;
    root.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    hideTimer = setTimeout(function () {
      menu.hidden = true;
      overlay.hidden = true;
    }, 300);
  }

  burger.addEventListener('click', function () {
    root.classList.contains('menu-open') ? close() : open();
  });
  overlay.addEventListener('click', close);
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) {
      close();
      burger.focus();
    }
  });
})();
