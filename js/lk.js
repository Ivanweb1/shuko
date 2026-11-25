(function () {
  'use strict';

  /* ---------- Shared: Mobile nav & Notifications drawer ---------- */
  var burger = document.querySelector('[data-lk-burger]');
  var sidebar = document.querySelector('[data-lk-sidebar]');
  if (burger && sidebar) {
    burger.addEventListener('click', function () {
      var open = sidebar.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var notifOverlay = document.querySelector('[data-notif-drawer]');
  document.querySelectorAll('[data-open-notif]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (!notifOverlay) return;
      e.preventDefault();
      notifOverlay.hidden = false;
    });
  });
  if (notifOverlay) {
    notifOverlay.addEventListener('click', function (e) {
      if (e.target === notifOverlay || e.target.closest('[data-close-modal]')) {
        notifOverlay.hidden = true;
      }
    });
  }

  // Notifications filter & delete with Undo toast (works both in drawer and on lk-notifications.html)
  document.querySelectorAll('[data-notif-scope]').forEach(function (scope) {
    var tabs = scope.querySelectorAll('[data-notif-tab]');
    var items = function () { return scope.querySelectorAll('[data-notif-item]'); };
    var lastRemoved = null;
    var toastTimer = null;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var filter = tab.getAttribute('data-notif-tab');
        tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
        items().forEach(function (item) {
          if (filter === 'all') item.hidden = false;
          else if (filter === 'unread') item.hidden = !item.hasAttribute('data-unread');
          else item.hidden = item.getAttribute('data-cat') !== filter;
        });
      });
    });

    scope.addEventListener('click', function (e) {
      var undoBtn = e.target.closest('[data-notif-undo]');
      if (undoBtn && lastRemoved) {
        lastRemoved.parent.insertBefore(lastRemoved.node, lastRemoved.next);
        lastRemoved = null;
        var t = scope.querySelector('.lk-notif-toast');
        if (t) t.remove();
        clearTimeout(toastTimer);
        return;
      }
      var del = e.target.closest('[data-notif-del]');
      if (!del) return;
      var card = del.closest('[data-notif-item]');
      if (!card) return;
      lastRemoved = { node: card, parent: card.parentNode, next: card.nextSibling };
      card.remove();
      var old = scope.querySelector('.lk-notif-toast');
      if (old) old.remove();
      var toast = document.createElement('div');
      toast.className = 'lk-notif-toast';
      toast.innerHTML = '<span>Уведомление удалено</span><button type="button" data-notif-undo>Отменить</button>';
      scope.insertBefore(toast, scope.firstChild);
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { if (toast.parentNode) toast.remove(); }, 5000);
    });
  });

  // Generic modal close
  document.querySelectorAll('[data-modal]').forEach(function (ov) {
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-close-modal]')) {
        ov.hidden = true;
      }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('[data-modal], [data-notif-drawer]').forEach(function (el) {
        el.hidden = true;
      });
    }
  });

  /* ---------- Interactive Chips, Radio Cards & File Inputs ---------- */
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-chip-toggle]');
    if (chip) chip.classList.toggle('is-active');

    var rcard = e.target.closest('.lk-radio-card');
    if (rcard) {
      var group = rcard.closest('.lk-radio-grid');
      if (group) {
        group.querySelectorAll('.lk-radio-card').forEach(function (c) {
          c.classList.remove('is-checked');
          var inp = c.querySelector('input');
          if (inp) inp.checked = false;
        });
        rcard.classList.add('is-checked');
        var inp = rcard.querySelector('input');
        if (inp) inp.checked = true;
      }
    }
  });

  document.addEventListener('change', function (e) {
    var input = e.target.closest('.lk-upload input[type="file"]');
    if (!input) return;
    var box = input.closest('.lk-upload');
    var label = box.querySelector('.lk-upload__file');
    if (label && input.files && input.files.length) {
      label.textContent = input.files.length === 1
        ? 'Выбран файл: ' + input.files[0].name
        : 'Выбрано файлов: ' + input.files.length;
      label.hidden = false;
    }
  });

  /* ---------- REGISTRATION PAGE ---------- */
  var regRoot = document.querySelector('[data-reg-app]');
  if (regRoot) {
    var landing = regRoot.querySelector('[data-reg-landing]');
    var flows = regRoot.querySelectorAll('[data-reg-flow]');
    var activeFlow = null;
    var activeStep = 1;

    function showLanding() {
      if (landing) landing.hidden = false;
      flows.forEach(function (f) { f.hidden = true; });
      activeFlow = null;
    }

    function showFlow(name, step) {
      if (landing) landing.hidden = true;
      flows.forEach(function (f) {
        var match = f.getAttribute('data-reg-flow') === name;
        f.hidden = !match;
        if (match) activeFlow = f;
      });
      if (activeFlow) goStep(step || 1);
    }

    function goStep(n) {
      activeStep = n;
      var steps = activeFlow.querySelectorAll('[data-step]');
      steps.forEach(function (s) {
        s.hidden = Number(s.getAttribute('data-step')) !== n;
      });
      var stepper = activeFlow.querySelector('[data-stepper]');
      if (stepper) {
        var isDone = n > stepper.querySelectorAll('.reg-step').length;
        stepper.hidden = isDone;
        stepper.querySelectorAll('.reg-step').forEach(function (st, idx) {
          var num = idx + 1;
          st.classList.toggle('is-active', num === n);
          st.classList.toggle('is-done', num < n);
          var badge = st.querySelector('.reg-step__num');
          if (badge) badge.textContent = num < n ? '✓' : String(num);
        });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    regRoot.addEventListener('click', function (e) {
      var pick = e.target.closest('[data-pick-flow]');
      if (pick) {
        showFlow(pick.getAttribute('data-pick-flow'), 1);
        return;
      }
      var next = e.target.closest('[data-step-next]');
      if (next && activeFlow) {
        goStep(activeStep + 1);
        return;
      }
      var prev = e.target.closest('[data-step-prev]');
      if (prev && activeFlow) {
        if (activeStep <= 1) showLanding();
        else goStep(activeStep - 1);
        return;
      }
      var backLanding = e.target.closest('[data-reg-reset]');
      if (backLanding) {
        showLanding();
        return;
      }
      var wrong = e.target.closest('[data-wrong-data]');
      if (wrong) {
        var msg = activeFlow.querySelector('[data-wrong-msg]');
        if (msg) msg.hidden = false;
      }
    });

    // Support URL hash ?flow=invite|architect|builder
    var params = new URLSearchParams(window.location.search);
    var initFlow = params.get('flow');
    if (initFlow) showFlow(initFlow, 1);
  }

  /* ---------- LK PROFILE: 6 ROLES + EDIT MODAL ---------- */
  var lkApp = document.querySelector('[data-lk-profile]');
  if (lkApp) {
    var ROLES = {
      manufacturer: {
        name: 'АлюмПроГрупп',
        role: 'Производитель',
        ava: 'assets/img/lk/ee1a910a001b.png',
        desc: 'Производство и монтаж алюминиевых светопрозрачных конструкций для ИЖС. Работаем с системами Schüco с 2015 года.',
        showChatBtn: true,
        showProjectsWidget: true,
        showPortfolio: true,
        showSystems: true,
        legal: [
          ['Юр. лицо', 'ООО «АлюмПро Групп»'],
          ['ИНН', '7714800000'],
          ['Торговая марка', 'AlumPro'],
          ['Клиентский номер Schuco', 'SCH-RU-2024-00147']
        ],
        contacts: [
          ['Руководитель', 'Алексей Петров'],
          ['Телефон', '+ 7 (495) 000-00-00'],
          ['E-mail', 'petrov@alumpro.ru'],
          ['Сайт', 'alumpro.ru'],
          ['Ответственный ИЖС', 'Сергей Иванов']
        ]
      },
      service: {
        name: 'МастерСервис',
        role: 'Сервис-партнёр',
        ava: 'assets/img/lk/7be40a13bf55.png',
        desc: 'Сервисное обслуживание и монтаж конструкций Schüco. Работаем в Московской области с 2018 года.',
        showChatBtn: false,
        showProjectsWidget: false,
        showPortfolio: false,
        showSystems: true,
        legal: [
          ['Юридическое лицо', 'ООО «МастерСервис»'],
          ['ИНН', '5024189320'],
          ['Регион работы', 'Московская область']
        ],
        contacts: [
          ['Руководитель', 'Козлов Андрей Сергеевич'],
          ['Телефон', '+7 (495) 741-22-18'],
          ['E-mail', 'service@master-schuco.ru']
        ]
      },
      contractor: {
        name: 'СтройКонтракт',
        role: 'Контрактор',
        ava: 'assets/img/lk/8a188e18489d.png',
        desc: 'Продажа и монтаж алюминиевых конструкций Schüco. Закупаем у переработчика АлюмПроГрупп.',
        showChatBtn: false,
        showProjectsWidget: false,
        showPortfolio: false,
        showSystems: true,
        legal: [
          ['Юридическое лицо', 'ООО «СтройКонтракт»'],
          ['ИНН', '7728451092'],
          ['Переработчик', 'АлюмПроГрупп'],
          ['Регион', 'Москва и ЦФО']
        ],
        contacts: [
          ['Руководитель', 'Волков Сергей Николаевич'],
          ['Телефон', '+7 (495) 612-88-40'],
          ['E-mail', 'sales@stroykontrakt.ru']
        ]
      },
      bureau: {
        name: 'Бюро «Форма»',
        role: 'Архитектурное бюро',
        ava: 'assets/img/lk/0c245e921889.png',
        desc: 'Проектирование жилых домов и коттеджей. Специализируемся на современной архитектуре и BIM-проектировании.',
        showChatBtn: false,
        showProjectsWidget: true,
        showPortfolio: true,
        showSystems: false,
        legal: [
          ['Юридическое лицо', 'ООО «Архитектурное бюро Форма»'],
          ['ИНН', '7704921840'],
          ['BIM-библиотека', 'Доступ активен (Revit, ArchiCAD, IFC)']
        ],
        contacts: [
          ['Руководитель', 'Соколова Елена Викторовна'],
          ['Телефон', '+7 (495) 510-33-90'],
          ['E-mail', 'hello@forma-bureau.ru'],
          ['Сайт', 'forma-bureau.ru']
        ]
      },
      architect: {
        name: 'Анна Морозова',
        role: 'Архитектор',
        ava: 'assets/img/lk/67da9fddd372.jpg',
        desc: 'Частная архитектурная практика: загородные резиденции и виллы с панорамным остеклением Schüco.',
        showChatBtn: false,
        showProjectsWidget: true,
        showPortfolio: true,
        showSystems: false,
        legal: [
          ['Статус', 'Индивидуальный предприниматель'],
          ['Город', 'Санкт-Петербург'],
          ['BIM-библиотека', 'Доступ активен']
        ],
        contacts: [
          ['ФИО', 'Морозова Анна Игоревна'],
          ['Телефон', '+7 (921) 450-19-82'],
          ['E-mail', 'anna@morozova-arch.ru']
        ]
      },
      builder: {
        name: 'НордХаус Строй',
        role: 'Строитель',
        ava: 'assets/img/lk/b27a3bde110d.png',
        desc: 'Строительство премиальных загородных домов ИЖС под ключ в Москве и Санкт-Петербурге.',
        showChatBtn: false,
        showProjectsWidget: true,
        showPortfolio: false,
        showSystems: false,
        legal: [
          ['Юридическое лицо', 'ООО «НордХаус Строй»'],
          ['ИНН', '7813294810'],
          ['Тип объектов', 'ИЖС, загородные резиденции']
        ],
        contacts: [
          ['Руководитель', 'Петров Максим Олегович'],
          ['Телефон', '+7 (812) 309-44-11'],
          ['E-mail', 'info@nordhaus-stroy.ru']
        ]
      }
    };

    var editIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"/></svg>';
    var lockIcon = '<svg class="lk-kv__lock" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm3.1-9H8.9V6a3.1 3.1 0 0 1 6.2 0v2Z"/></svg>';

    function renderRole(key) {
      var r = ROLES[key] || ROLES.manufacturer;
      var set = function (sel, val) {
        document.querySelectorAll(sel).forEach(function (el) { el.textContent = val; });
      };
      set('[data-role-name]', r.name);
      set('[data-role-badge]', r.role);
      set('[data-role-desc]', r.desc);
      document.querySelectorAll('[data-role-ava]').forEach(function (img) { img.src = r.ava; });

      var chatBtn = lkApp.querySelector('[data-role-chat]');
      if (chatBtn) chatBtn.hidden = !r.showChatBtn;
      var pw = lkApp.querySelector('[data-role-projects]');
      if (pw) pw.hidden = !r.showProjectsWidget;
      var pf = lkApp.querySelector('[data-role-portfolio]');
      if (pf) pf.hidden = !r.showPortfolio;
      var sys = lkApp.querySelector('[data-role-systems]');
      if (sys) sys.hidden = !r.showSystems;

      var legalEl = lkApp.querySelector('[data-legal-rows]');
      if (legalEl) {
        legalEl.innerHTML = r.legal.map(function (pair) {
          return '<div class="lk-kv__row"><span class="lk-kv__key">' + lockIcon + '<span>' + pair[0] + '</span></span><span class="lk-kv__val">' + pair[1] + '</span></div>';
        }).join('');
      }
      var contEl = lkApp.querySelector('[data-contact-rows]');
      if (contEl) {
        contEl.innerHTML = r.contacts.map(function (pair, i) {
          return '<div class="lk-kv__row"><span class="lk-kv__key">' + pair[0] + '</span><span class="lk-kv__val"><span data-contact-val="' + i + '">' + pair[1] + '</span><button class="lk-kv__edit" type="button" data-edit-field="' + pair[0] + '" data-edit-idx="' + i + '" aria-label="Редактировать ' + pair[0] + '">' + editIcon + '</button></span></div>';
        }).join('');
      }
    }

    var roleSelect = document.querySelector('[data-role-select]');
    var initRole = new URLSearchParams(window.location.search).get('role') || 'manufacturer';
    if (roleSelect) {
      roleSelect.value = ROLES[initRole] ? initRole : 'manufacturer';
      roleSelect.addEventListener('change', function () { renderRole(roleSelect.value); });
      renderRole(roleSelect.value);
    } else {
      renderRole(initRole);
    }

    // Expand / collapse «Управление профилем»
    var detailsToggle = lkApp.querySelector('[data-toggle-details]');
    var detailsLabel = detailsToggle && detailsToggle.querySelector('[data-toggle-label]');
    var detailsBody = lkApp.querySelector('[data-profile-details]');
    if (detailsToggle && detailsBody) {
      var detailsHead = detailsToggle.closest('.lk-sec-head');
      function setDetailsOpen(open) {
        detailsBody.hidden = !open;
        if (detailsHead) detailsHead.classList.toggle('is-expanded', open);
        detailsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (detailsLabel) detailsLabel.textContent = open ? 'Скрыть' : 'Подробнее';
        else detailsToggle.textContent = open ? 'Скрыть' : 'Подробнее';
      }
      detailsToggle.addEventListener('click', function () {
        setDetailsOpen(detailsBody.hidden);
      });
      var moreBtn = lkApp.querySelector('[data-open-details]');
      if (moreBtn) {
        moreBtn.addEventListener('click', function () {
          setDetailsOpen(true);
          detailsBody.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    }

    // Edit field modal («Редактировать»)
    var editModal = document.querySelector('[data-edit-modal]');
    var editLabel = editModal && editModal.querySelector('[data-edit-title]');
    var editInput = editModal && editModal.querySelector('[data-edit-input]');
    var editForm = editModal && editModal.querySelector('[data-edit-form]');
    var editTargetEl = null;

    lkApp.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-edit-field]');
      if (!btn || !editModal) return;
      var idx = btn.getAttribute('data-edit-idx');
      editTargetEl = lkApp.querySelector('[data-contact-val="' + idx + '"]');
      editLabel.textContent = btn.getAttribute('data-edit-field');
      editInput.value = editTargetEl ? editTargetEl.textContent : '';
      editModal.hidden = false;
      editInput.focus();
    });

    if (editForm) {
      editForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (editTargetEl && editInput.value.trim()) {
          editTargetEl.textContent = editInput.value.trim();
        }
        editModal.hidden = true;
      });
    }
  }

  /* ---------- PORTFOLIO: TABS, PUBLISH TOGGLE & DRAG-DROP PHOTOS ---------- */
  var portApp = document.querySelector('[data-portfolio-app]');
  if (portApp) {
    // Tabs
    var pTabs = portApp.querySelectorAll('[data-port-tab]');
    var pCards = portApp.querySelectorAll('[data-port-card]');
    pTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var f = tab.getAttribute('data-port-tab');
        pTabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
        pCards.forEach(function (c) {
          c.hidden = f !== 'all' && c.getAttribute('data-status') !== f;
        });
      });
    });

    // Publish / Unpublish toggle
    portApp.addEventListener('click', function (e) {
      var pubBtn = e.target.closest('[data-toggle-pub]');
      if (pubBtn) {
        var card = pubBtn.closest('[data-port-card]');
        var isPub = card.getAttribute('data-status') === 'published';
        card.setAttribute('data-status', isPub ? 'draft' : 'published');
        pubBtn.textContent = isPub ? 'Опубликовать' : 'Снять с публикации';
        var badge = card.querySelector('.lk-badge');
        if (badge) {
          badge.className = 'lk-badge ' + (isPub ? 'lk-badge--draft' : 'lk-badge--done');
          badge.textContent = isPub ? 'Черновик' : 'Завершён';
        }
      }
    });

    // Open Add / Edit modal
    var projModal = document.querySelector('[data-project-modal]');
    var projTitle = projModal && projModal.querySelector('[data-proj-modal-title]');
    var projStatusSel = projModal && projModal.querySelector('[data-proj-status]');
    var projDoneFields = projModal && projModal.querySelector('[data-proj-done-fields]');

    document.querySelectorAll('[data-open-project-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!projModal) return;
        var mode = btn.getAttribute('data-open-project-modal');
        if (projTitle) projTitle.textContent = mode === 'edit' ? 'Редактировать проект' : 'Добавить новый проект';
        projModal.hidden = false;
      });
    });

    if (projStatusSel && projDoneFields) {
      projStatusSel.addEventListener('change', function () {
        projDoneFields.hidden = projStatusSel.value !== 'done';
      });
    }

    // Drag-and-drop photo reorder inside project modal
    var photoRow = projModal && projModal.querySelector('[data-photo-sortable]');
    if (photoRow) {
      var dragItem = null;
      photoRow.addEventListener('dragstart', function (e) {
        var it = e.target.closest('.lk-photo-item');
        if (!it) return;
        dragItem = it;
        it.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      photoRow.addEventListener('dragend', function () {
        if (dragItem) dragItem.classList.remove('is-dragging');
        photoRow.querySelectorAll('.is-over').forEach(function (el) { el.classList.remove('is-over'); });
        dragItem = null;
      });
      photoRow.addEventListener('dragover', function (e) {
        e.preventDefault();
        var target = e.target.closest('.lk-photo-item');
        if (!target || target === dragItem) return;
        photoRow.querySelectorAll('.is-over').forEach(function (el) { el.classList.remove('is-over'); });
        target.classList.add('is-over');
      });
      photoRow.addEventListener('drop', function (e) {
        e.preventDefault();
        var target = e.target.closest('.lk-photo-item');
        if (!target || !dragItem || target === dragItem) return;
        var items = Array.from(photoRow.querySelectorAll('.lk-photo-item'));
        if (items.indexOf(dragItem) < items.indexOf(target)) {
          target.after(dragItem);
        } else {
          target.before(dragItem);
        }
      });
      photoRow.addEventListener('click', function (e) {
        var del = e.target.closest('.lk-photo-item__del');
        if (del) del.closest('.lk-photo-item').remove();
      });
    }

    var projForm = projModal && projModal.querySelector('[data-project-form]');
    if (projForm) {
      projForm.addEventListener('submit', function (e) {
        e.preventDefault();
        projModal.hidden = true;
      });
    }
  }

  /* ---------- ADD PROJECT PAGE (lk-add-project.html) ---------- */
  var addProjApp = document.querySelector('[data-add-project-app]');
  if (addProjApp) {
    var statusSel = addProjApp.querySelector('[data-proj-status]');
    var doneRow = addProjApp.querySelector('[data-proj-done-fields]');
    var sysSel = addProjApp.querySelector('[data-sys-select]');
    var sysChips = addProjApp.querySelector('[data-sys-chips]');
    var addForm = addProjApp.querySelector('[data-add-project-form]');

    if (statusSel && doneRow) {
      statusSel.addEventListener('change', function () {
        statusSel.classList.toggle('has-value', Boolean(statusSel.value));
        doneRow.hidden = statusSel.value !== 'done';
      });
    }
    if (sysSel && sysChips) {
      sysSel.addEventListener('change', function () {
        var val = sysSel.value;
        if (!val) return;
        var exists = Array.from(sysChips.querySelectorAll('[data-sys-chip]')).some(function (b) { return b.textContent === val; });
        if (!exists) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = sysSel.classList.contains('lk-select-pills__sel') ? 'lk-chip lk-chip--gray' : 'lk-chip lk-chip--static';
        chip.setAttribute('data-sys-chip', '');
        chip.title = 'Нажмите, чтобы убрать';
        chip.textContent = val;
        sysChips.appendChild(chip);
        }
        sysSel.selectedIndex = 0;
      });
      sysChips.addEventListener('click', function (e) {
        var c = e.target.closest('[data-sys-chip]');
        if (c) c.remove();
      });
    }
    if (addForm) {
      addForm.addEventListener('submit', function (e) {
        e.preventDefault();
        window.location.href = addProjApp.getAttribute('data-redirect') || 'lk-projects.html';
      });
    }

    var addPhotoRow = addProjApp.querySelector('[data-photo-sortable]');
    if (addPhotoRow) {
      var dragEl = null;
      addPhotoRow.addEventListener('dragstart', function (e) {
        var it = e.target.closest('.lk-photo-item');
        if (!it) return;
        dragEl = it;
        it.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      addPhotoRow.addEventListener('dragend', function () {
        if (dragEl) dragEl.classList.remove('is-dragging');
        addPhotoRow.querySelectorAll('.is-over').forEach(function (el) { el.classList.remove('is-over'); });
        dragEl = null;
      });
      addPhotoRow.addEventListener('dragover', function (e) {
        e.preventDefault();
        var target = e.target.closest('.lk-photo-item');
        if (!target || target === dragEl) return;
        addPhotoRow.querySelectorAll('.is-over').forEach(function (el) { el.classList.remove('is-over'); });
        target.classList.add('is-over');
      });
      addPhotoRow.addEventListener('drop', function (e) {
        e.preventDefault();
        var target = e.target.closest('.lk-photo-item');
        if (!target || !dragEl || target === dragEl) return;
        var items = Array.from(addPhotoRow.querySelectorAll('.lk-photo-item'));
        if (items.indexOf(dragEl) < items.indexOf(target)) target.after(dragEl);
        else target.before(dragEl);
      });
      addPhotoRow.addEventListener('click', function (e) {
        var del = e.target.closest('.lk-photo-item__del');
        if (del) del.closest('.lk-photo-item').remove();
      });
    }
  }

  /* ---------- PORTFOLIO CARD CONTEXT MENU (⋮ -> Редактировать / Предпросмотр / Удалить) ---------- */
  document.addEventListener('click', function (e) {
    var delAction = e.target.closest('[data-card-delete]');
    if (delAction) {
      var card = delAction.closest('.lk-pcard, tr');
      if (card) card.remove();
      return;
    }
    var menuBtn = e.target.closest('.lk-pcard .lk-pcard__menu-btn');
    var existing = document.querySelector('.lk-card-menu');
    if (!menuBtn) {
      if (existing && !e.target.closest('.lk-card-menu')) existing.remove();
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    var host = menuBtn.parentElement;
    var already = host.querySelector('.lk-card-menu');
    if (existing) existing.remove();
    if (already) return;
    var menu = document.createElement('div');
    menu.className = 'lk-card-menu';
    menu.innerHTML =
      '<a class="lk-card-menu__item" href="lk-edit-project.html"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"/></svg><span>Редактировать</span></a>' +
      '<a class="lk-card-menu__item" href="project.html" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="3"/></svg><span>Предпросмотр</span></a>' +
      '<button class="lk-card-menu__item" type="button" data-card-delete><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg><span>Удалить</span></button>';
    host.appendChild(menu);
  }, true);

  /* ---------- PROJECTS TABLE: SEARCH & STATUS TABS ---------- */
  document.querySelectorAll('[data-projects-table]').forEach(function (wrap) {
    var search = wrap.querySelector('[data-table-search]');
    var tabs = wrap.querySelectorAll('[data-table-tab]');
    var rows = wrap.querySelectorAll('tbody tr');
    var curStatus = 'all';

    function filter() {
      var q = (search ? search.value : '').trim().toLowerCase();
      rows.forEach(function (tr) {
        var stOk = curStatus === 'all' || tr.getAttribute('data-status') === curStatus;
        var qOk = !q || tr.textContent.toLowerCase().indexOf(q) !== -1;
        tr.hidden = !(stOk && qOk);
      });
    }

    if (search) search.addEventListener('input', filter);
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        curStatus = tab.getAttribute('data-table-tab');
        tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
        filter();
      });
    });
  });

  /* ---------- CHAT (КОНСУЛЬТАЦИИ) ---------- */
  var chatApp = document.querySelector('[data-chat-app]');
  if (chatApp) {
    var threads = chatApp.querySelectorAll('[data-thread]');
    var headName = chatApp.querySelector('[data-chat-name]');
    var headSub = chatApp.querySelector('[data-chat-sub]');
    var msgBox = chatApp.querySelector('[data-chat-messages]');
    var form = chatApp.querySelector('[data-chat-form]');
    var input = chatApp.querySelector('[data-chat-input]');

    var DATA = {
      support: {
        name: 'Поддержка Schüco',
        sub: 'Отвечает в течение часа',
        msgs: [
          { me: false, author: 'Ассистент поддержки', text: 'Добрый день! Чем могу помочь?', time: '11:02' },
          { me: true, text: 'Здравствуйте! Есть вопрос по монтажу AWS 75 BS.SI — правильно ли делать примыкание к деревянной стене без доп. уплотнения?', time: '11:02' },
          { me: false, author: 'Ассистент поддержки', text: 'Нет, для деревянных стен рекомендуем использовать паропроницаемую мембрану + бутиловую ленту по периметру. Прикладываю документацию по узлу примыкания.', time: '11:04' }
        ]
      },
      manager: {
        name: 'Менеджер Schüco',
        sub: 'Персональный менеджер',
        msgs: [
          { me: false, author: 'Менеджер Schüco', text: 'Добрый день! Карточка вашей компании и документы получены, всё проверили.', time: '10:45' },
          { me: false, author: 'Менеджер Schüco', text: 'Проект «Клубный дом, Рублёвка» одобрен и опубликован на вашей публичной странице.', time: '10:52' }
        ]
      }
    };
    var currentKey = 'support';

    var verifiedSvg = '<span class="lk-verified" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M3 8.5 6.5 12 13 4.5"/></svg></span>';
    var checksSvg = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M1.5 8.5 4.5 11.5 10.5 4.5M5.5 11.5 11.5 4.5"/></svg>';
    var backBtn = chatApp.querySelector('[data-chat-back]');

    function renderChat(key) {
      currentKey = key;
      var d = DATA[key];
      if (!d) return;
      headName.innerHTML = d.name + ' ' + verifiedSvg;
      headSub.textContent = d.sub;
      msgBox.innerHTML = '<div class="lk-chat__date">20 января</div>' + d.msgs.map(function (m) {
        var timeHtml = '<span class="lk-msg__time">' + m.time + (m.me ? checksSvg : '') + '</span>';
        return '<div class="lk-msg-row' + (m.me ? ' lk-msg-row--me' : '') + '">' +
          '<div class="lk-msg' + (m.me ? ' lk-msg--me' : '') + '">' +
          (m.author ? '<span class="lk-msg__author">' + m.author + '</span>' : '') +
          '<span class="lk-msg__text">' + m.text + '</span></div>' +
          timeHtml + '</div>';
      }).join('');
      msgBox.scrollTop = msgBox.scrollHeight;
    }

    threads.forEach(function (btn) {
      btn.addEventListener('click', function () {
        threads.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var badge = btn.querySelector('.lk-thread__unread');
        if (badge) badge.remove();
        renderChat(btn.getAttribute('data-thread'));
        chatApp.classList.add('is-chat-open');
      });
    });

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        chatApp.classList.remove('is-chat-open');
      });
    }

    if (form && input) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var txt = input.value.trim();
        if (!txt) return;
        var now = new Date();
        var hh = String(now.getHours()).padStart(2, '0');
        var mm = String(now.getMinutes()).padStart(2, '0');
        DATA[currentKey].msgs.push({ me: true, text: txt, time: hh + ':' + mm });
        input.value = '';
        renderChat(currentKey);
      });
    }

    renderChat('support');
  }
})();
