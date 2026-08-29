/**
 * AZURE HAVEN RETREAT — interaction layer
 * Vanilla JS only. No dependencies.
 *
 * Modules:
 *  - revealOnScroll   IntersectionObserver-driven fade/rise for [data-reveal]
 *  - headerState      toggles compact header once hero is scrolled past
 *  - magneticButtons  cursor-follow micro-interaction for .magnetic elements
 *  - horizonPulse     brightens the signature horizon line near section mid-points
 *  - scrollProgress   fills the top hairline bar as the guest reads down the page
 *  - parallax         drifts [data-parallax] layers against scroll, via --parallax-y
 *  - countUp          animates [data-count-to] numerals once they enter view
 */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* ------------------------------------------------------------------ *
   * revealOnScroll
   * Trigger: element enters viewport (20% from bottom)
   * Delay:   staggered via CSS transition-delay per nth-child where set
   * Duration: 900ms (see --dur via CSS custom transition on [data-reveal])
   * Easing:  var(--ease-soft) — cubic-bezier(0.16, 1, 0.3, 1), a gentle
   *          decelerate that reads as "settling" rather than "arriving"
   * GPU:     animates opacity + transform only, both compositor-friendly
   * Purpose: each screen should feel like it resolves into focus as the
   *          guest "arrives" at it, echoing the brief's cinematic pacing
   * ------------------------------------------------------------------ */
  function revealOnScroll() {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -10% 0px' }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------ *
   * headerState
   * Trigger: scrollY crosses the hero's height
   * Duration/Easing: handled in CSS (.site-header transition)
   * GPU: toggles a class; background/backdrop-filter transition in CSS
   * Purpose: header starts transparent over the cinematic hero, then
   *          becomes a legible, grounded bar once content needs contrast
   * ------------------------------------------------------------------ */
  function headerState() {
    const header = document.querySelector('.site-header');
    const hero = document.querySelector('.hero');
    if (!header || !hero) return;

    let ticking = false;

    const update = () => {
      const threshold = 24;
      header.classList.toggle('is-scrolled', window.scrollY > threshold);
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  /* ------------------------------------------------------------------ *
   * magneticButtons
   * Trigger: pointermove within a padded bounding box around .magnetic
   * Delay:   0 — tracks cursor directly for responsiveness
   * Duration: 200ms return-to-rest on pointerleave
   * Easing:  var(--ease-soft)
   * GPU:     transform: translate3d only
   * Purpose: reinforces the "premium app" feel called for in the brief —
   *          buttons feel weighted and alive rather than static hitboxes
   * ------------------------------------------------------------------ */
  function magneticButtons() {
    if (prefersReducedMotion) return;
    const buttons = document.querySelectorAll('.magnetic');
    if (!buttons.length) return;

    const strength = 0.35;
    const radius = 60; // px of "pull" beyond the button's own box

    buttons.forEach((btn) => {
      let frame = null;

      const onMove = (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        const maxDist = Math.max(rect.width, rect.height) / 2 + radius;

        if (dist > maxDist) return;

        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          btn.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
        });
      };

      const onLeave = () => {
        if (frame) cancelAnimationFrame(frame);
        btn.style.transition = `transform 200ms var(--ease-soft, ease-out)`;
        btn.style.transform = 'translate3d(0, 0, 0)';
        setTimeout(() => {
          btn.style.transition = '';
        }, 220);
      };

      btn.addEventListener('pointermove', onMove);
      btn.addEventListener('pointerleave', onLeave);
    });
  }

  /* ------------------------------------------------------------------ *
   * horizonPulse
   * Trigger: continuous, driven by scroll position vs. document height
   * Duration: n/a (directly bound to scroll, not time-based)
   * Easing:  linear mapping, smoothed by rAF throttling
   * GPU:     opacity only
   * Purpose: the signature horizon-line brightens as the guest moves
   *          deeper into the page — a quiet reward for continued scroll,
   *          echoing the brief's "cinematic journey" structure
   * ------------------------------------------------------------------ */
  function horizonPulse() {
    const line = document.querySelector('.horizon-line');
    if (!line || prefersReducedMotion) return;

    let ticking = false;

    const update = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? window.scrollY / docHeight : 0;
      const opacity = 0.35 + Math.sin(progress * Math.PI) * 0.45;
      line.style.opacity = opacity.toFixed(2);
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  /* ------------------------------------------------------------------ *
   * scrollProgress
   * Trigger: continuous, driven by scroll position vs. document height
   * Duration/Easing: 120ms linear (see .scroll-progress-fill transition)
   * GPU:     transform: scaleX only
   * Purpose: a quiet, honest read on how far into the page the guest has
   *          travelled — same hairline-and-gold grammar as the preloader
   *          bar and the horizon-line, just relocated to the top edge
   * ------------------------------------------------------------------ */
  function scrollProgress() {
    const fill = document.getElementById('scroll-progress-fill');
    if (!fill) return;

    let ticking = false;

    const update = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0;
      fill.style.transform = `scaleX(${progress})`;
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', update, { passive: true });

    update();
  }

  /* ------------------------------------------------------------------ *
   * parallax
   * Trigger: continuous, driven by each [data-parallax] element's own
   *          position relative to the viewport centre (not raw scrollY,
   *          so it behaves the same whether the element is near the top
   *          or far down a long page)
   * Duration: n/a — directly bound to scroll, rAF-throttled like the
   *           other continuous-scroll modules on this page
   * Easing:  linear mapping; the drift itself is subtle enough (see the
   *          small data-parallax-speed values in HTML) that it reads as
   *          weight/depth rather than a distinct "effect"
   * GPU:     writes only the --parallax-y custom property; the actual
   *          transform (composed with any hover/keyframe transform that
   *          already owns the same element) lives in CSS, so this module
   *          never fights .philosophy-media:hover img, ambient-breathe,
   *          or the gallery's hover lift for the transform property
   * Safety:  the element-to-viewport-centre distance is clamped to
   *          [-1, 1] BEFORE it's scaled by speed. Without the clamp, an
   *          element far from the current scroll position (e.g. right
   *          after page load, before the guest has scrolled at all)
   *          produces an unbounded offset — and since every parallax
   *          target sits inside an overflow:hidden frame with only an
   *          8% drift margin (see .parallax-inner / .g-cell img in CSS),
   *          an unclamped value would push the image past its frame and
   *          expose a blank edge. Clamping guarantees max drift is always
   *          speed * vh * MAX_SHIFT_RATIO, comfortably inside that margin
   *          for every speed value used in the HTML (all ≤ 0.35).
   * Purpose: the resort's large photographic moments — hero, philosophy,
   *          gastronomy, wellness, booking, gallery — gain a slight sense
   *          of depth as the guest scrolls past them, rather than sitting
   *          as flat, static planes
   * ------------------------------------------------------------------ */
  function parallax() {
    if (prefersReducedMotion) return;
    const layers = Array.from(document.querySelectorAll('[data-parallax]'));
    if (!layers.length) return;

    // Skip the whole module on narrow viewports — CSS already zeroes
    // --parallax-y under 640px, and touch-scroll perf matters more there
    // than a decorative drift most guests won't linger to notice.
    if (window.matchMedia('(max-width: 640px)').matches) return;

    const MAX_SHIFT_RATIO = 0.22; // fraction of viewport height, before speed scaling

    const items = layers.map((el) => ({
      el,
      speed: parseFloat(el.dataset.parallaxSpeed) || 0.15,
    }));

    let ticking = false;
    const viewportH = () => window.innerHeight;

    const update = () => {
      const vh = viewportH();
      items.forEach(({ el, speed }) => {
        const rect = el.getBoundingClientRect();
        // Distance of the element's own centre from the viewport's centre,
        // normalised so "just entering the bottom edge" and "just leaving
        // the top edge" land near -1 / 1 — then hard-clamped, since an
        // element far outside the viewport would otherwise produce an
        // offset with no upper bound (see Safety note above).
        const elCentre = rect.top + rect.height / 2;
        const viewCentre = vh / 2;
        const rawOffset = (elCentre - viewCentre) / vh;
        const offset = Math.max(-1, Math.min(1, rawOffset));
        const y = offset * speed * vh * MAX_SHIFT_RATIO;
        el.style.setProperty('--parallax-y', `${y.toFixed(1)}px`);
      });
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', update, { passive: true });

    update();
  }

  /* ------------------------------------------------------------------ *
   * countUp
   * Trigger: element enters viewport (IntersectionObserver, same 20%
   *          threshold as revealOnScroll, so numerals resolve alongside
   *          their [data-reveal] parent rather than lagging behind it)
   * Duration: 1600ms per numeral
   * Easing:  ease-out cubic — fast climb, gentle settle on the final
   *          value, echoing --ease-soft without needing the CSS var
   *          (this runs as a JS-driven rAF loop, not a CSS transition)
   * GPU:     text content only; no transform/opacity involved
   * Purpose: turns the resort's key figures (hectares, residence types,
   *          the 24/7 concierge line) into a small moment of arrival
   *          rather than static labels the eye skips past
   * ------------------------------------------------------------------ */
  function countUp() {
    const targets = document.querySelectorAll('[data-count-to]');
    if (!targets.length) return;

    const animateOne = (el) => {
      const end = parseFloat(el.dataset.countTo);
      const suffix = el.dataset.suffix || '';
      if (!Number.isFinite(end)) return;

      if (prefersReducedMotion) {
        el.textContent = `${end}${suffix}`;
        return;
      }

      const duration = 1600;
      const start = performance.now();

      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = Math.round(end * eased);
        el.textContent = `${value}${suffix}`;
        if (t < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) {
      targets.forEach(animateOne);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateOne(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------ *
   * contactForm
   * Lightweight non-blocking submit handler — no backend wired here,
   * so we intercept, acknowledge, and reset rather than 404.
   * ------------------------------------------------------------------ */
  function contactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const button = form.querySelector('button[type="submit"] span');
      if (!button) return;
      const original = button.textContent;
      button.textContent = 'Запрос отправлен';
      form.reset();
      setTimeout(() => {
        button.textContent = original;
      }, 2600);
    });
  }

  /* ------------------------------------------------------------------ *
   * navToggle
   * Trigger: click on the mobile burger button
   * Purpose: opens/closes the slide-in mobile navigation panel; closes
   *          automatically when a nav link is chosen or Escape is hit
   * ------------------------------------------------------------------ */
  function navToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.primary-nav');
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      toggle.classList.toggle('is-open', open);
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      document.body.style.overflow = open ? 'hidden' : '';
    };

    toggle.addEventListener('click', () => {
      setOpen(!nav.classList.contains('is-open'));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ------------------------------------------------------------------ *
   * waitForImages
   * Trigger: called once at preloader start.
   * Purpose: window's 'load' event does NOT reliably wait for images
   *          marked loading="lazy" if they sit outside the initial
   *          viewport — the browser can defer fetching them entirely
   *          until the guest scrolls near them. Since several villa and
   *          gallery images use loading="lazy", we explicitly resolve a
   *          promise per <img> (via .complete or its load/error events)
   *          and only consider the page "loaded" once every single one
   *          has settled — success or failure, we don't want to hang on
   *          a broken image forever.
   * Returns: a Promise that resolves once all <img> elements have
   *          finished loading (or errored).
   * ------------------------------------------------------------------ */
  function waitForImages() {
    const images = Array.from(document.querySelectorAll('img'));
    if (!images.length) return Promise.resolve();

    const promises = images.map((img) => {
      // loading="lazy" images the browser hasn't scrolled near yet report
      // .complete === true with naturalWidth === 0 — i.e. "nothing to load"
      // rather than "already loaded". Force them to load eagerly now so
      // the preloader can actually wait on them instead of being fooled.
      if (img.loading === 'lazy') img.loading = 'eager';

      const isActuallyLoaded = img.complete && img.naturalWidth > 0;
      if (isActuallyLoaded) return Promise.resolve();

      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    });

    return Promise.all(promises);
  }

  /* ------------------------------------------------------------------ *
   * preloader
   * Trigger: window 'load' (all images/fonts settled).
   * Sequence (strictly ordered, not parallel):
   *   1. progress bar climbs from 0 → 100, pausing near ~90% until the
   *      real 'load' event fires (so it never lies about being done)
   *   2. bar visibly completes at 100% and holds for a beat
   *   3. only THEN does the preloader lift/fade, revealing the site
   * Purpose: the number and the bar are the one honest signal the guest
   *          watches — the reveal is a consequence of completion, not a
   *          timer running alongside it.
   * ------------------------------------------------------------------ */
  function preloader() {
    const el = document.getElementById('preloader');
    const fill = document.getElementById('preloader-bar-fill');
    const percentEl = document.getElementById('preloader-percent');
    if (!el) return;

    if (prefersReducedMotion) {
      waitForImages().then(() => {
        document.body.classList.remove('is-loading');
        el.classList.add('is-hidden');
        setTimeout(() => el.remove(), 350);
      });
      return;
    }

    const MIN_DURATION = 2600; // ms — the choreography always gets this long to play out, cache or not
    const start = performance.now();

    let progress = 0;
    let pageLoaded = false;
    let rafId = null;

    // pageLoaded only flips true once BOTH the native 'load' event has
    // fired AND every <img> on the page (lazy or not) has resolved —
    // whichever settles last is what the bar actually waits on.
    Promise.all([
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener('load', resolve, { once: true })),
      waitForImages(),
    ]).then(() => {
      pageLoaded = true;
    });

    const setProgress = (value) => {
      progress = Math.min(100, Math.max(progress, value));
      if (fill) fill.style.transform = `scaleX(${progress / 100})`;
      if (percentEl) percentEl.textContent = Math.round(progress);
    };

    const finish = () => {
      el.classList.add('is-complete');
      // hold at a completed 100% for a beat so the eye registers "done"
      // BEFORE anything starts revealing the site underneath
      setTimeout(() => {
        document.body.classList.remove('is-loading');
        el.classList.add('is-hidden');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
        setTimeout(() => el.remove(), 1300); // fallback if transitionend never fires
      }, 380);
    };

    // Time-based progress mapped against MIN_DURATION, so the bar's pace
    // is stable regardless of frame rate or how fast the page actually
    // loads. It can only reach 100 once BOTH the real page is loaded AND
    // the minimum choreography time has elapsed — whichever is slower.
    const tick = (now) => {
      const elapsed = now - start;
      const timeRatio = Math.min(1, elapsed / MIN_DURATION);

      // Eased time-based target: fast start, gentle settle near the end —
      // caps at 96% until the page has actually finished loading.
      const eased = 1 - Math.pow(1 - timeRatio, 3);
      const cap = pageLoaded ? 100 : 96;
      const target = Math.min(cap, eased * 100);

      if (target > progress) setProgress(target);

      const minTimeElapsed = elapsed >= MIN_DURATION;

      if (progress >= 100 || (pageLoaded && minTimeElapsed && progress >= 99.5)) {
        setProgress(100);
        finish();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    // Safety net: never trap the guest behind the preloader, even if an
    // image or the load event never resolves for some reason.
    setTimeout(() => {
      pageLoaded = true;
    }, 8000);

    rafId = requestAnimationFrame(tick);
  }

  function init() {
    revealOnScroll();
    headerState();
    magneticButtons();
    horizonPulse();
    scrollProgress();
    parallax();
    countUp();
    contactForm();
    navToggle();
    preloader();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
