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

  // Закреплённая шапка: когда ряд разделов доезжает до шапки, пункты
  // перелетают в её центр, при скролле обратно — возвращаются на место.
  var root = document.documentElement;
  var header = document.querySelector('.header');
  var headerNav = document.querySelector('.header__nav');
  var titles = Array.prototype.slice.call(document.querySelectorAll('.nav-group__title'));
  var items = Array.prototype.slice.call(headerNav.querySelectorAll('a'));
  var DUR = 500;
  var EASE = 'cubic-bezier(.22, .61, .36, 1)';
  var docked = false;
  var token = 0;

  // Положение самого текста (у правой группы кнопка шире текста)
  function textRect(el) {
    var r = document.createRange();
    r.selectNodeContents(el);
    return r.getBoundingClientRect();
  }

  function shouldDock() {
    if (getComputedStyle(headerNav).display === 'none') return false;
    return textRect(titles[0]).top < header.getBoundingClientRect().bottom;
  }

  function fly(back) {
    var tok = ++token;
    var wasDocked = root.classList.contains('is-docked');

    items.forEach(function (a, i) {
      var cur = wasDocked ? getComputedStyle(a).transform : null;
      a.style.transition = 'none';
      a.style.transform = '';
      var base = a.getBoundingClientRect();
      var t = textRect(titles[i]);
      var atTitle = 'translate(' + (t.left - base.left) + 'px, ' + (t.top - base.top) + 'px)';
      a.style.transform = cur === null ? atTitle : (cur === 'none' ? '' : cur);
      a._end = back ? atTitle : '';
    });

    root.classList.add('is-docked');
    groups.forEach(function (g) { g.classList.remove('is-open'); });
    void header.offsetWidth;

    items.forEach(function (a) {
      a.style.transition = 'transform ' + DUR + 'ms ' + EASE;
      a.style.transform = a._end;
    });

    setTimeout(function () {
      if (tok !== token || !back) return;
      root.classList.remove('is-docked');
      items.forEach(function (a) {
        a.style.transition = 'none';
        a.style.transform = '';
      });
    }, DUR);
  }

  function update() {
    var want = shouldDock();
    if (want === docked) return;
    docked = want;
    fly(!want);
  }

  if (shouldDock()) {
    docked = true;
    root.classList.add('is-docked');
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (!root.classList.contains('menu-open')) update();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-group')) {
      groups.forEach(function (g) { g.classList.remove('is-open'); });
    }
  });
})();

// Реализованные проекты: на десктопе наведение на строку меняет фото слева,
// на планшете и мобильном первый тап раскрывает фото под строкой, второй ведёт по ссылке
(function () {
  var list = document.querySelector('.projects__list');
  if (!list) return;
  var items = Array.prototype.slice.call(list.querySelectorAll('.project'));
  var slides = Array.prototype.slice.call(document.querySelectorAll('.projects__slide'));
  var wide = window.matchMedia('(min-width: 1200px)');

  function activate(item) {
    items.forEach(function (it) { it.classList.toggle('is-active', it === item); });
    var img = item.getAttribute('data-img');
    slides.forEach(function (s) { s.classList.toggle('is-active', s.getAttribute('data-img') === img); });
  }

  items.forEach(function (item) {
    var row = item.querySelector('.project__row');
    row.addEventListener('mouseenter', function () { if (wide.matches) activate(item); });
    row.addEventListener('focus', function () { activate(item); });
    row.addEventListener('click', function (e) {
      if (!wide.matches && !item.classList.contains('is-active')) {
        e.preventDefault();
        activate(item);
      }
    });
  });
})();

// Наши люди: переключение вкладок и перетаскивание ленты мышью
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.people__tab'));
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    });
  });

  var track = document.querySelector('.people__track');
  if (!track) return;
  var startX = 0, startScroll = 0, down = false, moved = false;

  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
  });
  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) {
      moved = true;
      track.classList.add('is-dragging');
    }
    if (moved) track.scrollLeft = startScroll - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!down) return;
    down = false;
    // снимаем флаг после click, чтобы перетаскивание не открыло карточку
    setTimeout(function () { track.classList.remove('is-dragging'); }, 0);
  });
  track.addEventListener('dragstart', function (e) { e.preventDefault(); });
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
