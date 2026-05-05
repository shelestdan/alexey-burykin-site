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
    '.section__head, .diag-card, .fail-card, .bflow, .benefits__aside, .method-list li, .fit-col, .format-card, .faq__item, .about-head, .about-copy, .about-media, .about-principle, .qual-card, .quiz__step, .quiz__result-card, .contact-copy, .contact-panel, .portrait-badge'
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

})();
