'use strict';

/* ============================================================
   iOS MOTION (12.16.0) — the way an iPhone moves.
   Presentation only: nothing here changes what a screen does or what the server is asked.
   - springs: real damped-spring physics sampled into CSS linear() easings (--ios-spring…), with a cubic-bezier fallback
   - push / pop between screens (parallax 30 %, dimming, leading-edge shadow), sheet "present / dismiss", dissolve for tab switches
   - interactive edge swipe back (the finger drives both screens; release springs to the end or back)
   - large titles that collapse into a translucent bar, back button labelled with the previous screen
   - sheets: drag to dismiss, the app scales back behind them
   - pull to refresh (the iOS activity spinner), haptics (Taptic Engine through the iOS 17.4+ switch trick, vibration elsewhere)
   Every motion is skipped under prefers-reduced-motion (screens then simply dissolve in 120 ms).
   ============================================================ */
const IOS = (() => {
  const D = document, ROOT = D.documentElement;
  const fail = e => { try { console.error('[ios]', e); } catch(_){ /* rien */ } };
  const reduced = () => { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch(e){ return false; } };
  const rtl = () => ROOT.getAttribute('dir') === 'rtl';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const $ = id => D.getElementById(id);

  /* ---------- springs: damped harmonic oscillator -> CSS linear() ---------- */
  const LINEAR_OK = (() => { try { return !!(window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)')); } catch(e){ return false; } })();
  const EASE_FALLBACK = 'cubic-bezier(.32,.72,0,1)';
  function spring(response, damping){
    const w = 2 * Math.PI / response, z = damping;
    const f = z >= 1
      ? t => 1 - Math.exp(-w * t) * (1 + w * t)
      : (() => { const wd = w * Math.sqrt(1 - z * z); return t => 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)); })();
    const settle = Math.min(1.6, 5 / (Math.min(z, 1) * w));
    const n = 44, pts = [];
    for (let i = 0; i <= n; i++) pts.push(+f(settle * i / n).toFixed(4));
    pts[n] = 1;
    return { css: LINEAR_OK ? 'linear(' + pts.join(', ') + ')' : EASE_FALLBACK, ms: Math.round(settle * 1000) };
  }
  /* 16.0.0 — one motion system (docs/mouvement/AUDIT.md): every animation of the app takes one of these springs.
     No strong bounce anywhere: the most playful spring overshoots by less than 2 %. */
  const SPR = {
    smooth: spring(.5, 1),          /* sheets, present / dismiss, scale-back: critically damped */
    push: spring(.52, 1),           /* push / pop between screens: the UIKit navigation spring */
    snappy: spring(.34, .9),        /* controls, spring-back after a touch: 0.15 % overshoot */
    bouncy: spring(.42, .8),        /* « gentle »: switches, confirmations, badges — 1.5 % overshoot (was 8 % before 16.0.0) */
    press: spring(.16, 1)           /* the touch going down: immediate, no overshoot */
  };
  SPR.gentle = SPR.bouncy;
  function setVars(){
    const st = ROOT.style;
    Object.keys(SPR).forEach(k => {
      st.setProperty('--ios-' + k, SPR[k].css); st.setProperty('--ios-' + k + '-d', SPR[k].ms + 'ms');
      st.setProperty('--m-' + k, SPR[k].css); st.setProperty('--m-' + k + '-d', SPR[k].ms + 'ms');      /* the unified tokens (css/motion-system.css) */
    });
    st.setProperty('--ios-ease', EASE_FALLBACK);
  }
  /* analytic damped spring, for the end of a gesture: x0 = distance to the target, v0 = the finger's velocity (units / s).
     The motion that follows the finger keeps its speed — no jump in velocity at release (what a fixed curve cannot do). */
  function springAt(x0, v0, response, damping, t){
    const w = 2 * Math.PI / response, z = Math.min(damping, 1);
    if (z >= 1) return (x0 + (v0 + w * x0) * t) * Math.exp(-w * t);
    const wd = w * Math.sqrt(1 - z * z);
    return Math.exp(-z * w * t) * (x0 * Math.cos(wd * t) + ((v0 + z * w * x0) / wd) * Math.sin(wd * t));
  }
  function animateSpring(o){
    const x0 = o.from - o.to, v0 = o.velocity || 0, rs = o.response || .45, dp = o.damping == null ? 1 : o.damping;
    let t0 = null, id = 0, done = false;
    const step = now => {
      if (done) return;
      if (t0 == null) t0 = now;
      const t = (now - t0) / 1000, x = springAt(x0, v0, rs, dp, t), x2 = springAt(x0, v0, rs, dp, t + .004);
      const settled = t > .04 && Math.abs(x) < 5e-4 && Math.abs((x2 - x) / .004) < .02;
      if (settled || t > 2){ done = true; o.onUpdate(o.to); if (o.onDone) o.onDone(); return; }
      o.onUpdate(o.to + x); id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => { done = true; cancelAnimationFrame(id); };
  }
  /* finger velocity from the last 90 ms of samples ([time ms, position px]) -> px / ms */
  function velocity(samples){
    if (!samples || samples.length < 2) return 0;
    const last = samples[samples.length - 1]; let first = samples[0];
    for (let i = samples.length - 1; i >= 0; i--){ if (last[0] - samples[i][0] > 90) break; first = samples[i]; }
    const dt = last[0] - first[0]; return dt > 0 ? (last[1] - first[1]) / dt : 0;
  }

  /* ---------- haptics ---------- */
  const Haptics = (() => {
    let lab = null, last = 0;
    const canVibrate = () => { try { return typeof navigator.vibrate === 'function'; } catch(e){ return false; } };
    const enabled = () => { try { return !(typeof Runtime !== 'undefined' && Runtime.settings && Runtime.settings.vibration === false); } catch(e){ return true; } };
    function ensure(){
      if (lab || !D.body) return;
      lab = D.createElement('label');
      lab.setAttribute('aria-hidden', 'true');
      lab.style.cssText = 'position:fixed;left:-100px;top:-100px;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden';
      const i = D.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1;
      lab.appendChild(i); D.body.appendChild(lab);
    }
    /* iOS 17.4+ Safari / home-screen apps: toggling a "switch" checkbox inside a user gesture produces a Taptic tick */
    function tick(){ try { ensure(); if (lab) lab.click(); } catch(e){ /* rien */ } }
    function play(pattern){
      if (!enabled()) return;
      if (canVibrate()){ try { navigator.vibrate(pattern); } catch(e){ /* rien */ } return; }
      const now = Date.now(); if (now - last < 35) return; last = now;
      const seq = Array.isArray(pattern) ? pattern.filter((_, i) => i % 2 === 0).length : 1;
      tick(); for (let i = 1; i < seq; i++) setTimeout(tick, 70 * i);
    }
    return {
      select: () => play(6), light: () => play(8), medium: () => play(14),
      success: () => play([12, 40, 12]), warning: () => play([20, 40, 20]), error: () => play([40, 30, 40, 30, 40])
    };
  })();

  /* ---------- screen transitions ---------- */
  const PRESENT = { processing:1, receipt:1, 'tx-result':1, 'cards-add':1, 'contact-add':1, 'banks-add':1, 'profile-edit':1 };
  const TABS = { home:1, wallet:1, markets:1, history:1, account:1, services:1, exchange:1, spot:1 };   /* 16.0.0: Swap and Spot are tabs of the bar (14.7.0) */
  let running = [], skipNext = false, dimEl = null;
  function dim(){
    if (dimEl && dimEl.isConnected) return dimEl;
    const host = $('screens'); if (!host) return null;
    dimEl = D.createElement('div'); dimEl.id = 'ios-dim'; dimEl.setAttribute('aria-hidden', 'true');
    host.appendChild(dimEl); return dimEl;
  }
  function settleAll(){
    running.forEach(a => { try { a.finish(); } catch(e){ /* rien */ } });
    running = [];
    D.querySelectorAll('.ios-leaving,.ios-entering').forEach(e => { e.classList.remove('ios-leaving', 'ios-entering'); e.style.zIndex = ''; });
  }
  function anim(el, frames, opts){
    if (!el || !el.animate) return Promise.resolve();
    const a = el.animate(frames, Object.assign({ fill: 'none' }, opts));
    running.push(a);
    return a.finished.catch(() => {});
  }
  function run(kind, el, prevEl){
    const d = rtl() ? -1 : 1, dm = dim();
    const T = (x, y, s) => 'translate3d(' + x + ',' + y + ',0)' + (s != null ? ' scale(' + s + ')' : '');
    const jobs = [];
    el.classList.add('ios-entering'); prevEl.classList.add('ios-leaving');
    /* 16.0.0 — one gesture, one motion: pushing and going back are the same horizontal slide as the edge swipe (UIKit: the new screen
       covers from the trailing edge, the old one drifts 30 % under a dimming veil). Compositor only (transform / opacity): the « glass
       depth » zoom with 8 px blur of 14.4.0 re-blurred two full screens every frame and did not match the gesture. */
    if (kind === 'push' || kind === 'pop'){
      const o = { duration: SPR.push.ms, easing: SPR.push.css };
      const top = kind === 'push' ? el : prevEl, under = kind === 'push' ? prevEl : el;
      top.style.zIndex = 3; under.style.zIndex = 1; if (dm) dm.style.zIndex = 2; top.dataset.iosMode = 'push';
      const off = T((d * 100) + '%', 0), rest = T(0, 0), drift = T((-d * 30) + '%', 0);
      if (kind === 'push'){
        jobs.push(anim(el, [{ transform: off }, { transform: rest }], o));
        jobs.push(anim(prevEl, [{ transform: rest }, { transform: drift }], o));
        if (dm) jobs.push(anim(dm, [{ opacity: 0 }, { opacity: 1 }], o));
      } else {
        jobs.push(anim(prevEl, [{ transform: rest }, { transform: off }], o));
        jobs.push(anim(el, [{ transform: drift }, { transform: rest }], o));
        if (dm) jobs.push(anim(dm, [{ opacity: 1 }, { opacity: 0 }], o));
      }
    } else if (kind === 'present' || kind === 'dismiss'){
      /* a full-screen sheet (receipt, result): rises from the bottom while the screen under it steps back (scale .94, no blur) */
      const o = { duration: SPR.smooth.ms + 60, easing: SPR.smooth.css };
      const top = kind === 'present' ? el : prevEl, under = kind === 'present' ? prevEl : el;
      top.style.zIndex = 3; under.style.zIndex = 1; if (dm) dm.style.zIndex = 2; top.dataset.iosMode = 'sheet';
      const low = T(0, '100%'), up = T(0, 0), back = T(0, '10px', .94), front = T(0, 0, 1);
      jobs.push(anim(top, kind === 'present' ? [{ transform: low }, { transform: up }] : [{ transform: up }, { transform: low }], o));
      jobs.push(anim(under, kind === 'present' ? [{ transform: front }, { transform: back }] : [{ transform: back }, { transform: front }], o));
      if (dm) jobs.push(anim(dm, kind === 'present' ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }], o));
    } else {
      /* tab switches, sign-in: a fade-through, in place. The old screen leaves first (100 ms, accelerating), the new one arrives just
         after it (from 90 ms, decelerating), so the two never show through each other. Opacity only: the blocks of a screen seen for
         the first time rise on their own (js/ui/omw.js), the screen itself does not move. */
      el.style.zIndex = 3; prevEl.style.zIndex = 2;
      if (reduced()){
        jobs.push(anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 120 }));
        jobs.push(anim(prevEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 }));
      } else {
        const total = 300, out = 100, lag = 90;               /* the old screen stays hidden until the end (no fill: the element is reused later) */
        jobs.push(anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: total - lag, delay: lag, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
        jobs.push(anim(prevEl, [{ opacity: 1, easing: 'cubic-bezier(.4,0,1,1)' }, { opacity: 0, offset: out / total }, { opacity: 0 }], { duration: total }));
      }
    }
    Promise.all(jobs).then(() => {
      el.classList.remove('ios-entering'); prevEl.classList.remove('ios-leaving');
      el.style.zIndex = ''; prevEl.style.zIndex = ''; delete el.dataset.iosMode; delete prevEl.dataset.iosMode;
      running = [];
    });
  }
  /* 16.0.0 — the one place that names how a screen arrives: 'push' / 'pop' (horizontal), 'present' / 'dismiss' (from the bottom),
     'fade' (tabs, sign-in, start), or null when the same screen is only redrawn with fresh data (nothing moves). The entrance of the
     blocks (omw.js) and the tab-bar pill (motion.js) read it so that one navigation gives one coherent motion. */
  function kindOf(info){
    const { id, from, el, prevEl } = info || {};
    if (!el || !from || from === id || !prevEl || prevEl === el) return null;
    if (reduced()) return 'fade';
    if (info.back) return PRESENT[from] ? 'dismiss' : 'pop';
    if (PRESENT[id] && !info.reset) return 'present';
    if (info.reset || (TABS[id] && TABS[from])) return 'fade';
    return 'push';
  }
  function transition(info){
    if (!info.el) return;
    if (skipNext){ skipNext = false; return; }
    const kind = kindOf(info); if (!kind) return;
    settleAll();
    run(kind, info.el, info.prevEl);
  }

  /* ---------- large titles, collapsing bar, back label ---------- */
  /* 15.3.0: the screens of the Settings family get the iOS large title too (settings and the account hub have their own header + compact bar, js/ui/ios.js) */
  const LARGE = { profile:1, cards:1, services:1, notifications:1, devices:1, sessions:1, help:1, privacy:1, about:1 };
  const screenTitle = el => {
    if (!el) return '';
    const n = el.querySelector('.ios-lt, .topbar-title, h1');
    return n ? (n.textContent || '').trim() : '';
  };
  function bindScroll(el){
    if (el.__iosScroll) return; el.__iosScroll = true;
    let busy = false;
    el.addEventListener('scroll', () => {
      if (busy) return; busy = true;
      requestAnimationFrame(() => { busy = false; const y = el.scrollTop; el.classList.toggle('ios-scrolled', y > 3); el.classList.toggle('ios-collapsed', y > 38); });
    }, { passive: true });
  }
  function decorate(info){
    const { id, el } = info;
    if (!el) return;
    bindScroll(el);
    el.classList.remove('ios-scrolled', 'ios-collapsed');
    const large = !!LARGE[id];
    el.classList.toggle('ios-large', large);
    const tb = el.querySelector(':scope > .topbar');
    /* a heading of its own (cards, services) -> a synthetic inline bar so the title can collapse into it */
    if (large && !tb){
      const own = el.querySelector('.rv-title h1, .yb-title, h1');
      if (own && !el.querySelector(':scope > .ios-synth')){
        const bar = D.createElement('div'); bar.className = 'topbar ios-synth'; bar.setAttribute('aria-hidden', 'true');
        bar.innerHTML = '<span class="topbar-title"></span>'; bar.firstChild.textContent = (own.textContent || '').trim();
        el.insertBefore(bar, el.firstChild);
      }
    }
    if (large && tb && !el.querySelector(':scope > .ios-lt')){
      const tt = tb.querySelector('.topbar-title');
      if (tt){ const h = D.createElement('h1'); h.className = 'ios-lt'; h.textContent = (tt.textContent || '').trim(); tb.insertAdjacentElement('afterend', h); }
    }
    /* back button: the previous screen's name, like UIKit ("‹ Settings") */
    const bk = el.querySelector(':scope > .topbar .topbar-back');
    if (bk && !bk.querySelector('.ios-back-t')){
      let to = null; try { to = R.peekBack(); } catch(e){ /* rien */ }
      const label = to === 'home' ? (typeof t === 'function' ? t('nav.home') : 'Home') : screenTitle(to ? $(to) : null);
      if (label && label.length <= 10){ const s = D.createElement('span'); s.className = 'ios-back-t'; s.textContent = label; bk.appendChild(s); }
    }
    try {
      const ttl = screenTitle(el);
      D.title = ttl && id !== 'home' ? ttl + ' · ' + ((typeof CONFIG !== 'undefined' && CONFIG.APP && CONFIG.APP.name) || 'DYT') : ((typeof CONFIG !== 'undefined' && CONFIG.APP && CONFIG.APP.name) || 'DYT');
    } catch(e){ /* rien */ }
  }

  /* ---------- interactive edge swipe back ---------- */
  function edgeSwipe(){
    const host = $('screens'); if (!host) return;
    const EDGE = 26;
    let g = null;
    const widthOf = () => host.offsetWidth || window.innerWidth;
    host.addEventListener('touchstart', e => {
      if (e.touches.length !== 1 || g) return;
      const x = e.touches[0].clientX, w = window.innerWidth, d = rtl() ? -1 : 1;
      const atEdge = d === 1 ? x <= EDGE : x >= w - EDGE;
      if (!atEdge) return;
      let to = null; try { to = R.peekBack(); } catch(err){ /* rien */ }
      const cur = host.querySelector('.screen.active'), prev = to ? $(to) : null;
      if (!to || !cur || !prev || prev === cur || !prev.firstElementChild) return;
      g = { x0: x, y0: e.touches[0].clientY, dx: 0, cur, prev, d, on: false, t0: Date.now() };
    }, { passive: true });
    host.addEventListener('touchmove', e => {
      if (!g) return;
      const t0 = e.touches[0], dx = (t0.clientX - g.x0) * g.d, dy = t0.clientY - g.y0;
      if (!g.on){
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8){ g = null; return; }
        if (dx < 6) return;
        g.on = true; settleAll();
        g.prev.classList.add('ios-leaving'); g.cur.classList.add('ios-entering'); g.cur.dataset.iosMode = 'push';
        g.prev.style.zIndex = 2; g.cur.style.zIndex = 3; g.cur.style.transition = 'none'; g.prev.style.transition = 'none';
        Haptics.select();
      }
      if (e.cancelable) e.preventDefault();
      g.dx = clamp(dx, 0, widthOf());
      (g.samples = g.samples || []).push([performance.now(), g.dx]); if (g.samples.length > 8) g.samples.shift();
      paint(g, g.dx / widthOf());
    }, { passive: false });
    const end = () => {
      if (!g) return;
      const s = g; g = null;
      if (!s.on) return;
      const w = widthOf(), vpx = velocity(s.samples);                 /* px / ms, the finger's speed at release */
      const commit = (s.dx > w * .34 && vpx > -.2) || vpx > .55;      /* a flick back cancels even past one third */
      const from = s.dx / w, to = commit ? 1 : 0;
      const dm = dim();
      const finish = () => {
        [s.cur, s.prev].forEach(x => { x.style.transform = ''; x.style.transition = ''; x.style.zIndex = ''; x.classList.remove('ios-leaving', 'ios-entering'); delete x.dataset.iosMode; });
        if (dm) dm.style.opacity = '';
        if (commit){ skipNext = true; try { R.back(); } catch(err){ fail(err); } setTimeout(() => { skipNext = false; }, 60); }
      };
      /* 16.0.0 — the screen leaves (or comes back) on a spring that starts at the finger's speed: no jump in velocity at release */
      if (reduced()) { paint(s, to); finish(); }
      else animateSpring({ from, to, velocity: vpx * 1000 / w, response: .42, damping: 1, onUpdate: p => paint(s, clamp(p, 0, 1)), onDone: finish });
      if (commit) Haptics.light();
    };
    host.addEventListener('touchend', end, { passive: true });
    host.addEventListener('touchcancel', end, { passive: true });
    function paint(s, p){
      const W = widthOf(), dm = dim();
      s.cur.style.transform = 'translate3d(' + (s.d * p * W) + 'px,0,0)';
      s.prev.style.transform = 'translate3d(' + (-s.d * (1 - p) * W * .3) + 'px,0,0)';
      if (dm) dm.style.opacity = String(1 - p);
    }
  }

  /* ---------- sheets: drag down to dismiss, app scales back ---------- */
  function sheets(){
    const body = D.body;
    const sync = () => {
      const open = !!D.querySelector('#ov-root .ov.is-open:not(.is-modal)');
      body.classList.toggle('ios-sheet-open', open);
    };
    const wrap = ov => {
      if (ov.__iosDrag || ov.classList.contains('is-modal')) return; ov.__iosDrag = true;
      const panel = ov.querySelector('.ov-panel'), back = ov.querySelector('.ov-backdrop'); if (!panel) return;
      let s = null;
      panel.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return;
        const tg = e.target;
        if (tg.closest && tg.closest('input,textarea,select,[contenteditable],[data-no-drag]')) return;
        if (panel.scrollTop > 0) return;
        s = { y0: e.touches[0].clientY, x0: e.touches[0].clientX, dy: 0, on: false, t0: Date.now() };
      }, { passive: true });
      panel.addEventListener('touchmove', e => {
        if (!s) return;
        const dy = e.touches[0].clientY - s.y0, dx = e.touches[0].clientX - s.x0;
        if (!s.on){
          if (Math.abs(dx) > Math.abs(dy) || dy < -4){ s = null; return; }
          if (dy < 8 || panel.scrollTop > 0) return;
          s.on = true; panel.style.transition = 'none';
        }
        if (e.cancelable) e.preventDefault();
        s.dy = dy;
        /* follows the finger 1:1 downwards; upwards it resists (rubber band), like a UIKit sheet at its top detent */
        const rub = dy >= 0 ? dy : -Math.min(28, Math.pow(-dy, .72));
        (s.samples = s.samples || []).push([performance.now(), dy]); if (s.samples.length > 8) s.samples.shift();
        panel.style.transform = 'translate3d(0,' + rub + 'px,0)';
        if (back) back.style.opacity = String(clamp(1 - Math.max(0, rub) / Math.max(1, panel.offsetHeight), 0, 1));
      }, { passive: false });
      const end = () => {
        if (!s) return; const k = s; s = null;
        if (!k.on) return;
        const v = velocity(k.samples), h = panel.offsetHeight, dy = Math.max(0, k.dy);
        const dismiss = (dy > Math.min(150, h * .32) && v > -.25) || v > .6;
        if (dismiss){
          /* 16.0.0 — the sheet keeps going from where the finger left it, at the finger's speed (it used to jump back to the top and then
             vanish in one frame). The inline transform wins over the closed state, so closing the overlay does not interrupt it. */
          const dist = h + 24 - dy, sp = Math.max(v, 1.1), dur = Math.round(clamp(dist / sp, 140, 300));
          panel.style.transition = 'transform ' + dur + 'ms cubic-bezier(.3,.75,.4,1)';
          panel.style.transform = 'translate3d(0,' + (h + 24) + 'px,0)';
          if (back){ back.style.transition = 'opacity ' + dur + 'ms linear'; back.style.opacity = '0'; }
          try { R.overlay.close(); } catch(err){ fail(err); }
          if (ov.classList.contains('is-open')){            /* not dismissible: it stays, spring back */
            panel.style.transition = 'transform ' + SPR.snappy.ms + 'ms ' + SPR.snappy.css; panel.style.transform = '';
            if (back){ back.style.transition = ''; back.style.opacity = ''; }
          }
          Haptics.light();
        } else {
          panel.style.transition = 'transform ' + SPR.snappy.ms + 'ms ' + SPR.snappy.css;
          panel.style.transform = '';
          if (back){ back.style.transition = 'opacity ' + SPR.snappy.ms + 'ms ease'; back.style.opacity = ''; }
          setTimeout(() => { panel.style.transition = ''; if (back) back.style.transition = ''; }, SPR.snappy.ms + 30);
        }
      };
      panel.addEventListener('touchend', end, { passive: true });
      panel.addEventListener('touchcancel', end, { passive: true });
    };
    const scan = () => { D.querySelectorAll('#ov-root .ov').forEach(wrap); sync(); };
    new MutationObserver(scan).observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    scan();
  }

  /* ---------- pull to refresh: the DYT arch fills as you pull, the coin flips while it loads (14.10.0; markets and wallet added) ---------- */
  function pullToRefresh(){
    const OK = { home:1, history:1, notifications:1, wallet:1, markets:1, asset:1 };
    const LIVE = { wallet:1, markets:1, asset:1, home:1 };          /* these also reload the live prices */
    const ind = D.createElement('div'); ind.id = 'ios-ptr'; ind.setAttribute('aria-hidden', 'true');
    ind.innerHTML = '<svg viewBox="0 0 40 40" width="36" height="36"><path class="pt-track" d="M9 37V19a11 11 0 0 1 22 0V37"/><path class="pt-arch" pathLength="1" d="M9 37V19a11 11 0 0 1 22 0V37"/><circle class="pt-coin" cx="20" cy="28" r="5.4"/></svg>';
    D.body.appendChild(ind);
    const arch = ind.querySelector('.pt-arch'), coin = ind.querySelector('.pt-coin');
    let g = null, busy = false;
    const paint = (dy, spin) => {
      const p = clamp(dy / 74, 0, 1);
      ind.style.opacity = String(spin ? 1 : clamp(p * 1.4, 0, 1));
      ind.style.transform = 'translate3d(-50%,' + (spin ? 62 : dy * .85) + 'px,0)';
      ind.classList.toggle('spin', !!spin);
      arch.style.strokeDashoffset = String(spin ? 0 : 1 - p); coin.style.opacity = String(spin ? 1 : clamp((p - .3) / .7, 0, 1)); if (!spin) coin.style.transform = 'scale(' + (.55 + .45 * p).toFixed(3) + ')';
    };
    D.addEventListener('touchstart', e => {
      if (busy || e.touches.length !== 1) return;
      if (R.overlay.isOpen()) return;
      const scr = D.querySelector('.screen.active');
      if (!scr || !OK[scr.id] || scr.scrollTop > 0) return;
      if (e.target.closest && e.target.closest('[data-promo-track],input,textarea,.ov,.yl,.ps,.fid')) return;
      g = { y0: e.touches[0].clientY, x0: e.touches[0].clientX, on: false, dy: 0, scr };
    }, { passive: true });
    D.addEventListener('touchmove', e => {
      if (!g) return;
      const dy = e.touches[0].clientY - g.y0, dx = Math.abs(e.touches[0].clientX - g.x0);
      if (!g.on){
        if (dy < -4 || dx > 12 + dy * .6){ g = null; return; }
        if (dy < 10 || g.scr.scrollTop > 0) return;
        g.on = true; ind.style.transition = 'none';
      }
      g.dy = Math.pow(Math.max(0, dy), .86);          /* rubber band */
      paint(g.dy, false);
      if (!g.armed && g.dy >= 74){ g.armed = true; Haptics.medium(); }
      if (g.armed && g.dy < 74) g.armed = false;
    }, { passive: true });
    const end = async () => {
      if (!g) return; const s = g; g = null;
      if (!s.on) return;
      ind.style.transition = '';
      if (s.dy < 74){ paint(0, false); ind.style.opacity = '0'; return; }
      busy = true; paint(74, true); Haptics.light();
      const t0 = Date.now(); let ok = true;
      try { const jobs = [AuthEngine.hydrateRuntime()]; if (LIVE[s.scr.id] && typeof OMXMarket !== 'undefined') jobs.push(OMXMarket.refresh()); await Promise.all(jobs); } catch(e){ ok = false; }
      const rest = 650 - (Date.now() - t0); if (rest > 0) await new Promise(r => setTimeout(r, rest));
      try { const cur = R.current(); if (ok && OK[cur] && cur !== 'markets' && cur !== 'asset') R.go(cur, { force: true });       /* markets / asset are patched in place by the live feed */ else if (!ok && typeof toast === 'function') toast(t('res.toast'), 'error'); } catch(e){ fail(e); }
      if (ok) Haptics.success();
      paint(0, false); ind.style.opacity = '0'; ind.classList.remove('spin'); busy = false;
    };
    D.addEventListener('touchend', end, { passive: true });
    D.addEventListener('touchcancel', end, { passive: true });
  }

  /* ---------- small things ---------- */
  function misc(){
    /* iOS-style selection feedback on the controls that have no button press of their own */
    D.addEventListener('pointerdown', e => {
      const el = e.target && e.target.closest ? e.target.closest('.chip,[role="switch"],.nav-item,.side-item,.dst-opt,.settings-row,.item,.yb-svc,.rv-act') : null;
      if (el && !el.disabled) Haptics.select();
    }, { passive: true, capture: true });
    /* tapping the bar scrolls to the top (UIKit status-bar tap) */
    D.addEventListener('click', e => {
      const bar = e.target && e.target.closest ? e.target.closest('.screen.active > .topbar') : null;
      if (!bar || e.target.closest('button,a,input,[data-action],[data-nav],[data-px]')) return;
      const scr = bar.parentElement; if (scr && scr.scrollTo) scr.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    });
    /* iOS dark / light cross-dissolve when the theme changes */
    let first = true;
    new MutationObserver(() => {
      if (first){ first = false; return; }
      if (reduced()) return;
      ROOT.classList.add('ios-theming'); clearTimeout(misc._t); misc._t = setTimeout(() => ROOT.classList.remove('ios-theming'), 480);
    }).observe(ROOT, { attributes: true, attributeFilter: ['data-theme'] });
  }

  function init(){
    if (init._done) return; init._done = true;
    try { setVars(); } catch(e){ fail(e); }
    try { R.on(info => { try { transition(info); } catch(e){ fail(e); } try { decorate(info); } catch(e){ fail(e); } }); } catch(e){ fail(e); }
    [edgeSwipe, sheets, pullToRefresh, misc].forEach(fn => { try { fn(); } catch(e){ fail(e); } });
    /* UIKit.haptic is the app's single haptic entry point: it only knew navigator.vibrate (absent on iPhone) */
    try {
      if (typeof UIKit !== 'undefined' && UIKit.haptic && !UIKit.haptic.__ios){
        const orig = UIKit.haptic;
        UIKit.haptic = function(kind){ try { orig(kind); } catch(e){ /* rien */ } if (typeof navigator.vibrate === 'function') return; try { (Haptics[kind === 'tap' || !kind ? 'light' : kind] || Haptics.light)(); } catch(e){ /* rien */ } };
        UIKit.haptic.__ios = true;
      }
    } catch(e){ fail(e); }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
  return { init, spring, SPR, Haptics, reduced, springAt, animateSpring, velocity, kindOf };
})();
