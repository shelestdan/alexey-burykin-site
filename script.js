(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- nav scroll state + progress --------------------------------------
  var nav = document.getElementById('nav');
  var progress = document.querySelector('.nav__progress i');
  var onScroll = function () {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (y > 24) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (y / h) * 100 : 0;
      progress.style.setProperty('--p', p + '%');
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // --- mobile menu -------------------------------------------------------
  var burger = document.querySelector('.nav__burger');
  var mobile = document.getElementById('mobile-menu');
  if (burger && mobile) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      if (open) {
        mobile.classList.remove('is-open');
        mobile.hidden = true;
      } else {
        mobile.hidden = false;
        void mobile.offsetWidth;
        mobile.classList.add('is-open');
      }
    });
    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.setAttribute('aria-expanded', 'false');
        mobile.classList.remove('is-open');
        mobile.hidden = true;
      });
    });
  }

  // --- split hero headline into word spans ------------------------------
  (function splitHeadline() {
    var h = document.querySelector('[data-split]');
    if (!h) return;
    // Walk through child nodes: text nodes get split by words,
    // element children (span.accent, <br/>) are preserved.
    var counter = 0;
    function wrap(text) {
      var parts = text.split(/(\s+)/); // keep spaces
      var frag = document.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p.length) return;
        if (/^\s+$/.test(p)) {
          frag.appendChild(document.createTextNode(p));
          return;
        }
        var outer = document.createElement('span');
        outer.className = 'w';
        var inner = document.createElement('span');
        inner.textContent = p;
        inner.style.setProperty('--i', counter++);
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
      return frag;
    }

    function processNode(node) {
      var kids = Array.prototype.slice.call(node.childNodes);
      kids.forEach(function (kid) {
        if (kid.nodeType === 3) { // text
          var replacement = wrap(kid.nodeValue);
          node.replaceChild(replacement, kid);
        } else if (kid.nodeType === 1) {
          if (kid.tagName === 'BR') return;
          // wrap the whole inline element as one "word" to keep its styling intact
          var outer = document.createElement('span');
          outer.className = 'w';
          var clone = kid.cloneNode(true);
          clone.style.display = 'inline-block';
          clone.style.setProperty('--i', counter++);
          outer.appendChild(clone);
          node.replaceChild(outer, kid);
        }
      });
    }

    processNode(h);
  })();

  // --- reveal on scroll (with stagger) ----------------------------------
  var revealTargets = document.querySelectorAll(
    '.section__head, .diag-card, .fail-card, .work-card, .method-list li, .split__col, .econ-card, .dash__panel, .dash__copy, .case, .fit-col, .format-card, .faq__item, .about-head, .about-copy, .about-media, .about-principle, .pull, .contact-copy, .contact-form, .portrait-badge'
  );
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });

  if ('IntersectionObserver' in window && !reduce) {
    var groups = new WeakMap();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // stagger siblings in same parent grid
        var el = entry.target;
        var parent = el.parentElement;
        var idx = Array.prototype.indexOf.call(parent.children, el);
        el.style.transitionDelay = Math.min(idx, 6) * 70 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }

  // --- count-up for stats -----------------------------------------------
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target) || reduce) { return; }
    var duration = 1400;
    var start = null;
    el.textContent = '0';
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      // ease-out cubic
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toString();
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target.toString();
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  // --- mouse-follow glow on cards ---------------------------------------
  var glowCards = document.querySelectorAll('.work-card');
  if (!reduce) {
    glowCards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', x + '%');
        card.style.setProperty('--my', y + '%');
      });
      card.addEventListener('mouseleave', function () {
        card.style.removeProperty('--mx');
        card.style.removeProperty('--my');
      });
    });
  }

  // --- magnetic primary CTAs --------------------------------------------
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    var magnets = document.querySelectorAll('.btn--primary.btn--lg');
    magnets.forEach(function (m) {
      m.addEventListener('mousemove', function (e) {
        var rect = m.getBoundingClientRect();
        var relX = e.clientX - (rect.left + rect.width / 2);
        var relY = e.clientY - (rect.top + rect.height / 2);
        m.style.setProperty('--mx', (relX * 0.12).toFixed(2) + 'px');
        m.style.setProperty('--my', (relY * 0.12).toFixed(2) + 'px');
      });
      m.addEventListener('mouseleave', function () {
        m.style.setProperty('--mx', '0px');
        m.style.setProperty('--my', '0px');
      });
    });
  }

  // --- smooth anchor with header offset ---------------------------------
  var headerOffset = function () {
    return nav ? nav.getBoundingClientRect().height + 12 : 80;
  };
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  // --- contact form ------------------------------------------------------
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');
  var submitBtn = document.getElementById('submitBtn');

  function fieldEl(name) { return form.querySelector('#' + name); }
  function errEl(name) { return form.querySelector('.field__error[data-for="' + name + '"]'); }

  function setError(name, message) {
    var el = errEl(name);
    if (el) el.textContent = message || '';
    var input = fieldEl(name);
    if (input) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  }
  function clearErrors() {
    form.querySelectorAll('.field__error').forEach(function (el) { el.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
  }
  function setNote(kind, msg) {
    note.className = 'contact-form__note' + (kind ? ' is-' + kind : '');
    note.textContent = msg || '';
  }

  // validators
  var emailRe = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
  // RU phone canonical: "+7 (XXX) XXX-XX-XX" exactly
  var phoneReFormatted = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;

  // format raw digits → "+7 (XXX) XXX-XX-XX"
  function formatRuPhone(raw) {
    // keep digits only
    var d = (raw || '').replace(/\D/g, '');
    // normalize leading 8 or 7 → drop country digit, assume +7
    if (d.length && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
    d = d.slice(0, 10); // max 10 significant digits (area + number)
    var out = '+7';
    if (d.length > 0) out += ' (' + d.slice(0, 3);
    if (d.length >= 3) out += ')';
    if (d.length > 3) out += ' ' + d.slice(3, 6);
    if (d.length > 6) out += '-' + d.slice(6, 8);
    if (d.length > 8) out += '-' + d.slice(8, 10);
    return out;
  }

  function validateField(name) {
    var val = (fieldEl(name) && fieldEl(name).value || '').trim();
    switch (name) {
      case 'name':
        if (val.length < 2) return 'Укажите имя (минимум 2 символа)';
        if (val.length > 80) return 'Слишком длинно — сократите, пожалуйста';
        return '';
      case 'email':
        if (!val) return 'Укажите электронную почту';
        if (!emailRe.test(val)) return 'Проверьте адрес: похоже на опечатку';
        return '';
      case 'phone':
        if (!val) return ''; // optional
        if (!phoneReFormatted.test(val)) return 'Формат: +7 (XXX) XXX-XX-XX';
        return '';
      case 'consent':
        return fieldEl('consent').checked ? '' : 'Нужно согласие на обработку данных';
      default: return '';
    }
  }

  // phone mask — live format as user types
  var phoneEl = document.getElementById('phone');
  if (phoneEl) {
    var maskPhone = function () {
      var before = phoneEl.value;
      var formatted = formatRuPhone(before);
      if (formatted !== before) phoneEl.value = formatted;
    };
    phoneEl.addEventListener('focus', function () {
      if (!phoneEl.value) phoneEl.value = '+7 ';
    });
    phoneEl.addEventListener('input', maskPhone);
    phoneEl.addEventListener('paste', function () {
      setTimeout(maskPhone, 0);
    });
    phoneEl.addEventListener('blur', function () {
      if (phoneEl.value === '+7 ' || phoneEl.value === '+7') phoneEl.value = '';
    });
  }

  if (form) {
    // live-clear errors as user corrects them
    ['name', 'email', 'phone'].forEach(function (n) {
      var el = fieldEl(n);
      if (!el) return;
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid') === 'true') setError(n, '');
      });
      el.addEventListener('blur', function () {
        var msg = validateField(n);
        if (msg || n === 'name' || n === 'email') setError(n, msg);
      });
    });
    var consentEl = fieldEl('consent');
    if (consentEl) {
      consentEl.addEventListener('change', function () {
        if (consentEl.checked) setError('consent', '');
      });
    }

    // textarea char counter
    var note2 = fieldEl('note');
    var counter = document.querySelector('[data-counter-for="note"]');
    if (note2 && counter) {
      var max = parseInt(note2.getAttribute('maxlength'), 10) || 600;
      var upd = function () {
        var n = note2.value.length;
        counter.textContent = n + ' / ' + max;
        counter.style.color = n > max * 0.9 ? 'var(--warn)' : '';
      };
      note2.addEventListener('input', upd);
      upd();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();
      setNote('', '');

      // honeypot: if filled → silently drop (bot)
      var honey = form.querySelector('#website');
      if (honey && honey.value.trim() !== '') {
        setNote('success', 'Спасибо. Ваша заявка принята.');
        form.reset();
        return;
      }

      var fields = ['name', 'email', 'phone', 'consent'];
      var ok = true;
      var firstInvalid = null;
      fields.forEach(function (n) {
        var msg = validateField(n);
        if (msg) {
          setError(n, msg);
          ok = false;
          if (!firstInvalid) firstInvalid = fieldEl(n);
        }
      });

      if (!ok) {
        setNote('error', 'Проверьте отмеченные поля — и отправьте ещё раз.');
        if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
        return;
      }

      // simulate submit — lock UI briefly
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.disabled = true;
      setNote('', 'Отправляю…');

      setTimeout(function () {
        submitBtn.removeAttribute('aria-busy');
        submitBtn.disabled = false;
        setNote('success', 'Спасибо. Заявка принята — свяжусь с вами в течение рабочего дня. Если удобнее в Telegram, напишите: @Mbobr1975');
        form.reset();
        if (counter) counter.textContent = '0 / ' + (note2 ? (note2.getAttribute('maxlength') || 600) : 600);
      }, 700);
    });
  }

  // --- side rail: show after hero, activate current section -------------
  var rail = document.querySelector('.rail');
  var railLinks = document.querySelectorAll('.rail__list a');
  if (rail && railLinks.length) {
    var railTargets = [];
    railLinks.forEach(function (a) {
      var id = a.getAttribute('href');
      var t = id ? document.querySelector(id) : null;
      if (t) railTargets.push({ a: a, t: t });
    });
    var updateRail = function () {
      var y = window.scrollY + window.innerHeight * 0.4;
      var heroH = document.querySelector('.hero');
      if (heroH) {
        var heroBottom = heroH.offsetTop + heroH.offsetHeight - 200;
        if (window.scrollY > heroBottom) rail.classList.add('is-visible');
        else rail.classList.remove('is-visible');
      }
      var active = null;
      railTargets.forEach(function (o) {
        if (o.t.offsetTop <= y) active = o.a;
      });
      railLinks.forEach(function (a) { a.classList.remove('is-active'); });
      if (active) active.classList.add('is-active');
    };
    updateRail();
    window.addEventListener('scroll', updateRail, { passive: true });
    window.addEventListener('resize', updateRail);
  }

  // --- manifest per-line reveal -----------------------------------------
  var manifestTitle = document.querySelector('.manifest__title');
  if (manifestTitle && 'IntersectionObserver' in window) {
    var mio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          mio.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    mio.observe(manifestTitle);
  } else if (manifestTitle) {
    manifestTitle.classList.add('is-in');
  }

  // --- parallax on elements with data-parallax --------------------------
  var parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !reduce && window.matchMedia('(min-width: 768px)').matches) {
    var rafPending = false;
    var applyParallax = function () {
      rafPending = false;
      parallaxEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var vh = window.innerHeight;
        if (rect.bottom < 0 || rect.top > vh) return;
        var mid = rect.top + rect.height / 2;
        var dist = mid - vh / 2;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.04;
        el.style.transform = 'translate3d(0, ' + (-dist * speed).toFixed(1) + 'px, 0)';
      });
    };
    var queueParallax = function () {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(applyParallax);
    };
    applyParallax();
    window.addEventListener('scroll', queueParallax, { passive: true });
    window.addEventListener('resize', queueParallax);
  }

  // --- 3D tilt on [data-tilt] cards -------------------------------------
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    var tiltEls = document.querySelectorAll('[data-tilt]');
    tiltEls.forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var rx = ((e.clientY - cy) / rect.height) * -6;
        var ry = ((e.clientX - cx) / rect.width) * 6;
        el.style.transform = 'perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(0)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
  }

  // --- dashboard bars: animate widths on reveal -------------------------
  var dashPanel = document.querySelector('.dash__panel');
  if (dashPanel && 'IntersectionObserver' in window && !reduce) {
    dashPanel.querySelectorAll('.dash__bar i').forEach(function (bar) {
      var target = bar.style.getPropertyValue('--w') || '50%';
      bar.dataset.target = target;
      bar.style.setProperty('--w', '0%');
    });
    var dashIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.dash__bar i').forEach(function (bar, idx) {
            setTimeout(function () {
              bar.style.setProperty('--w', bar.dataset.target);
            }, idx * 120);
          });
          dashIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    dashIo.observe(dashPanel);
  }

  // --- QUIZ: progress + reveal result when all 3 answered ----------------
  var quiz = document.getElementById('quiz');
  if (quiz) {
    var progressBar = quiz.querySelector('.quiz__progress-bar');
    var progressLabel = quiz.querySelector('.quiz__progress-label b');
    var result = document.getElementById('quizResult');
    var total = 3;
    function updateQuiz() {
      var answered = 0;
      for (var i = 1; i <= total; i++) {
        if (quiz.querySelector('input[name="q' + i + '"]:checked')) answered++;
      }
      if (progressBar) progressBar.style.setProperty('--p', (answered / total * 100) + '%');
      if (progressLabel) progressLabel.textContent = String(answered);
      if (result) {
        if (answered === total) result.hidden = false;
        else result.hidden = true;
      }
    }
    quiz.addEventListener('change', function (e) {
      if (e.target && e.target.type === 'radio') updateQuiz();
    });
    updateQuiz();
  }
})();
