// Группы навигации на первом экране: на устройствах без наведения подпункты открываются по тапу
(function () {
  var groups = document.querySelectorAll('.nav-group');
  var headerNav = document.querySelector('.header__nav');
  // Страница может быть без ряда разделов (страница проекта) — тогда блок не нужен
  if (!groups.length || !headerNav) return;

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

// Попапы из макета: обсуждение проекта и подписка на обновления.
(function () {
  var root = document.documentElement;
  var layers = Array.prototype.slice.call(document.querySelectorAll('[data-dialog]'));
  if (!layers.length) return;

  var active = null;
  var returnFocus = null;
  var hideTimer = null;
  var mobile = window.matchMedia('(max-width: 599px)');

  function focusable(layer) {
    return Array.prototype.slice.call(layer.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]'))
      .filter(function (el) { return el.offsetParent !== null; });
  }

  function open(name, trigger) {
    var layer = document.querySelector('[data-dialog="' + name + '"]');
    if (!layer) return;
    clearTimeout(hideTimer);
    if (active && active !== layer) close(false);
    active = layer;
    returnFocus = trigger || document.activeElement;
    layer.hidden = false;
    root.classList.add('dialog-open');
    requestAnimationFrame(function () {
      layer.classList.add('is-open');
      var first = layer.querySelector('input, textarea, [data-dialog-close]');
      if (first) first.focus({ preventScroll: true });
    });
  }

  function close(restore) {
    if (!active) return;
    var layer = active;
    active = null;
    layer.classList.remove('is-open');
    root.classList.remove('dialog-open');
    hideTimer = setTimeout(function () { layer.hidden = true; }, 300);
    if (restore !== false && returnFocus && typeof returnFocus.focus === 'function') {
      returnFocus.focus({ preventScroll: true });
    }
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-dialog-open], [data-dialog-open-mobile]');
    if (trigger) {
      var name = trigger.getAttribute('data-dialog-open');
      if (!name && mobile.matches) name = trigger.getAttribute('data-dialog-open-mobile');
      if (name) {
        e.preventDefault();
        open(name, trigger);
        return;
      }
    }
    if (active && e.target.closest('[data-dialog-close]')) {
      e.preventDefault();
      close(true);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (!active) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
      return;
    }
    if (e.key !== 'Tab') return;
    var items = focusable(active);
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  layers.forEach(function (layer) {
    var fields = Array.prototype.slice.call(layer.querySelectorAll('.field input, .field textarea'));
    fields.forEach(function (control) {
      function sync() {
        control.closest('.field').classList.toggle('has-value', Boolean(control.value.trim()));
        control.closest('.field').classList.remove('is-invalid');
      }
      control.addEventListener('input', sync);
      sync();
    });

    var file = layer.querySelector('.file-field input');
    if (file) {
      file.addEventListener('change', function () {
        var label = file.closest('.file-field');
        var text = label.querySelector('span');
        var selected = file.files && file.files[0];
        label.classList.toggle('has-file', Boolean(selected));
        text.textContent = selected ? selected.name : 'Прикрепите файл';
      });
    }

    var form = layer.querySelector('form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalid = null;
      Array.prototype.slice.call(form.querySelectorAll('[required]')).forEach(function (control) {
        var field = control.closest('.field');
        var bad = !control.checkValidity();
        if (field) field.classList.toggle('is-invalid', bad);
        if (bad && !invalid) invalid = control;
      });
      var status = form.querySelector('.dialog__status');
      if (invalid) {
        status.textContent = 'Проверьте обязательные поля.';
        invalid.focus();
        return;
      }
      status.textContent = 'Форма заполнена. Отправка будет подключена при интеграции с 1С-Битрикс.';
    });
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

// Карта партнёров: живая карта (Leaflet + OpenStreetMap) и список партнёров.
// Данные — выгрузка /include/contacts.php старого сайта (assets/data/partners.json).
// Клик по партнёру раскрывает контакты и показывает его на карте, клик по метке — наоборот.
// На планшете и мобильном карта переезжает внутрь раскрытого партнёра (как в макете).
(function () {
  var list = document.querySelector('.pmap__list');
  var canvas = document.getElementById('partners-map');
  if (!list || !canvas) return;

  var wide = window.matchMedia('(min-width: 1200px)');
  var home = canvas.parentElement;
  var MOSCOW = [55.75, 37.62];
  var map = null, items = [], current = null;

  function esc(v) {
    return String(v).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function row(label, html) {
    return '<div><dt>' + label + '</dt><dd>' + html + '</dd></div>';
  }

  function render(p) {
    var c = '';
    if (p.address) c += row('Адрес:', esc(p.address));
    if (p.work) c += row('Часы работы:', esc(p.work));
    if (p.phone) c += row('Телефон:', '<a href="' + esc(p.phoneHref || 'tel:' + p.phone.replace(/[^\d+]/g, '')) + '">' + esc(p.phone) + '</a>');
    if (p.email) c += row('Почта:', '<a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>');
    if (p.site) {
      var url = /^https?:/.test(p.site) ? p.site : 'https://' + p.site;
      c += row('Сайт:', '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(p.site.replace(/^https?:\/\//, '').replace(/\/$/, '')) + '</a>');
    }
    var li = document.createElement('li');
    li.className = 'partner';
    li.innerHTML =
      '<button class="partner__row" type="button" aria-expanded="false">' +
        '<span class="partner__name">' + esc(p.name) + '</span>' +
        '<span class="partner__desc">' + esc(p.text || p.address) + '</span>' +
      '</button>' +
      '<div class="partner__more"><div class="partner__more-in">' +
        '<dl class="partner__contacts">' + c + '</dl>' +
        '<div class="partner__map"></div>' +
      '</div></div>';
    return li;
  }

  function icon(active) {
    return L.icon({
      iconUrl: 'assets/img/map/partner_icon' + (active ? '-active' : '') + '.svg',
      iconSize: [40, 53],
      iconAnchor: [20, 46],
      className: 'partner-marker'
    });
  }

  // Карта живёт в одном контейнере: на десктопе — слева, на узких экранах — в раскрытом партнёре
  function placeCanvas() {
    var slot = !wide.matches && current ? current.el.querySelector('.partner__map') : home;
    if (canvas.parentElement !== slot) slot.appendChild(canvas);
    if (map) setTimeout(function () { map.invalidateSize(); }, 320);
  }

  function open(item, opts) {
    opts = opts || {};
    var same = current === item;
    items.forEach(function (it) {
      it.el.classList.remove('is-open');
      it.el.querySelector('.partner__row').setAttribute('aria-expanded', 'false');
      if (it.marker) it.marker.setIcon(icon(false)).setZIndexOffset(0);
    });
    if (same && !opts.keep) { current = null; placeCanvas(); return; }
    current = item;
    item.el.classList.add('is-open');
    item.el.querySelector('.partner__row').setAttribute('aria-expanded', 'true');
    placeCanvas();
    if (map && item.marker) {
      item.marker.setIcon(icon(true)).setZIndexOffset(1000);
      var go = function () {
        if (opts.instant) map.setView(item.latlng, 13);
        else map.flyTo(item.latlng, 13, { duration: .8 });
      };
      wide.matches ? go() : setTimeout(go, 330);
    }
    if (opts.scroll && wide.matches) {
      list.scrollTo({ top: item.el.offsetTop - list.offsetTop, behavior: 'smooth' });
    }
  }

  fetch(list.getAttribute('data-src'))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      // Сервис-партнёров на старом сайте по умолчанию не показывали — здесь тоже
      data.filter(function (p) { return !p.service; }).forEach(function (p) {
        var el = render(p);
        list.appendChild(el);
        var item = { el: el, latlng: [p.lat, p.lng] };
        items.push(item);
        el.querySelector('.partner__row').addEventListener('click', function () { open(item); });
      });

      if (window.L) {
        map = L.map(canvas, {
          center: MOSCOW,
          zoom: 9,
          scrollWheelZoom: false,
          zoomControl: false,
          attributionControl: false
        });
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        items.forEach(function (item) {
          item.marker = L.marker(item.latlng, { icon: icon(false), title: item.el.querySelector('.partner__name').textContent })
            .addTo(map)
            .on('click', function () { open(item, { keep: true, scroll: true }); });
        });
      }

      if (!wide.matches && items.length) open(items[0], { instant: true });
    });

  wide.addEventListener('change', placeCanvas);
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

// Плашка cookie: выбор хранится в localStorage, без него плашка показывается на каждой странице
(function () {
  var banner = document.querySelector('[data-cookie]');
  if (!banner) return;
  var KEY = 'shuko-cookie-choice';
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* хранилище недоступно */ }
  if (saved) return;

  banner.hidden = false;
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { banner.classList.add('is-visible'); });
  });

  banner.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cookie-choice]');
    if (!btn) return;
    try { localStorage.setItem(KEY, btn.getAttribute('data-cookie-choice')); } catch (err) { /* без сохранения */ }
    banner.classList.remove('is-visible');
    setTimeout(function () { banner.hidden = true; }, 300);
  });
})();
