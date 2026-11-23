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
  const SPR = {
    smooth: spring(.5, 1),          /* UIKit push / sheet: critically damped, no overshoot */
    snappy: spring(.38, .86),       /* small controls: a hint of overshoot */
    bouncy: spring(.5, .62)         /* playful: switches, badges, success */
  };
  function setVars(){
    const st = ROOT.style;
    Object.keys(SPR).forEach(k => { st.setProperty('--ios-' + k, SPR[k].css); st.setProperty('--ios-' + k + '-d', SPR[k].ms + 'ms'); });
    st.setProperty('--ios-ease', EASE_FALLBACK);
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
  const TABS = { home:1, wallet:1, markets:1, history:1, account:1, services:1 };
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
    const SM = SPR.smooth, dur = kind === 'present' || kind === 'dismiss' ? Math.max(SM.ms, 480) : Math.max(SM.ms, 420);
    const ez = SM.css;
    const T = (x, y, s) => 'translate3d(' + x + ',' + y + ',0)' + (s ? ' scale(' + s + ')' : '');
    const o = { duration: dur, easing: ez };
    const jobs = [];
    el.classList.add('ios-entering'); prevEl.classList.add('ios-leaving');
    /* 14.4.0 — « glass depth »: screens no longer slide sideways. The new screen comes forward out of the glass (from slightly behind,
       a little low, softly blurred), the old one recedes into it. Blur only on capable phones (html.w-lite turns it off). */
    const lite = ROOT.classList.contains('w-lite'), B = v => lite ? 'none' : 'blur(' + v + 'px)';
    const S = (y, s) => 'translate3d(0,' + y + ',0) scale(' + s + ')';
    if (kind === 'push'){
      el.style.zIndex = 3; prevEl.style.zIndex = 2; el.dataset.iosMode = 'push';
      jobs.push(anim(el, [{ transform: S('26px', .92), opacity: 0, filter: B(8) }, { transform: S(0, 1), opacity: 1, filter: B(0) }], o));
      jobs.push(anim(prevEl, [{ transform: S(0, 1), opacity: 1, filter: B(0) }, { transform: S('-10px', 1.04), opacity: 0, filter: B(6) }], o));
      if (dm) jobs.push(anim(dm, [{ opacity: 0 }, { opacity: .6 }], o));
    } else if (kind === 'pop'){
      el.style.zIndex = 2; prevEl.style.zIndex = 3; prevEl.dataset.iosMode = 'push';
      jobs.push(anim(prevEl, [{ transform: S(0, 1), opacity: 1, filter: B(0) }, { transform: S('26px', .9), opacity: 0, filter: B(8) }], o));
      jobs.push(anim(el, [{ transform: S('-10px', 1.04), opacity: 0, filter: B(6) }, { transform: S(0, 1), opacity: 1, filter: B(0) }], o));
      if (dm) jobs.push(anim(dm, [{ opacity: .6 }, { opacity: 0 }], o));
    } else if (kind === 'present'){
      el.style.zIndex = 3; prevEl.style.zIndex = 2; el.dataset.iosMode = 'sheet';
      jobs.push(anim(el, [{ transform: T(0, '100%', .96) }, { transform: T(0, 0, 1) }], o));
      jobs.push(anim(prevEl, [{ transform: T(0, 0, 1), filter: B(0) }, { transform: T(0, 0, .92), filter: B(4) }], o));
      if (dm) jobs.push(anim(dm, [{ opacity: 0 }, { opacity: 1 }], o));
    } else if (kind === 'dismiss'){
      el.style.zIndex = 2; prevEl.style.zIndex = 3; prevEl.dataset.iosMode = 'sheet';
      jobs.push(anim(prevEl, [{ transform: T(0, 0, 1) }, { transform: T(0, '100%', .96) }], o));
      jobs.push(anim(el, [{ transform: T(0, 0, .92), filter: B(4) }, { transform: T(0, 0, 1), filter: B(0) }], o));
      if (dm) jobs.push(anim(dm, [{ opacity: 1 }, { opacity: 0 }], o));
    } else {                                    /* tab switches, sign-in: the new screen rises a little while the old one fades */
      el.style.zIndex = 3; prevEl.style.zIndex = 2;
      const od = { duration: reduced() ? 120 : 360, easing: 'cubic-bezier(.22,1,.36,1)' };
      jobs.push(anim(el, reduced() ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: S('14px', .985) }, { opacity: 1, transform: S(0, 1) }], od));
      jobs.push(anim(prevEl, [{ opacity: 1 }, { opacity: 0 }], { duration: reduced() ? 120 : 220, easing: 'ease-out' }));
    }
    Promise.all(jobs).then(() => {
      el.classList.remove('ios-entering'); prevEl.classList.remove('ios-leaving');
      el.style.zIndex = ''; prevEl.style.zIndex = ''; delete el.dataset.iosMode; delete prevEl.dataset.iosMode;
      running = [];
    });
  }
  function transition(info){
    const { id, from, el, prevEl } = info;
    if (!el) return;
    if (skipNext){ skipNext = false; return; }
    if (!from || from === id || !prevEl || prevEl === el) return;
    settleAll();
    let kind;
    if (reduced()) kind = 'fade';
    else if (info.back) kind = PRESENT[from] ? 'dismiss' : 'pop';
    else if (PRESENT[id] && !info.reset) kind = 'present';
    else if (info.reset || (TABS[id] && TABS[from])) kind = 'fade';
    else kind = 'push';
    run(kind, el, prevEl);
  }

  /* ---------- large titles, collapsing bar, back label ---------- */
  const LARGE = { profile:1, cards:1, services:1 };   /* settings has its own large header (14.4.0) */
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
      D.title = ttl && id !== 'home' ? ttl + ' · ' + ((typeof CONFIG !== 'undefined' && CONFIG.APP && CONFIG.APP.name) || 'OM Wallet') : ((typeof CONFIG !== 'undefined' && CONFIG.APP && CONFIG.APP.name) || 'OM Wallet');
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
      paint(g, g.dx / widthOf());
    }, { passive: false });
    const end = () => {
      if (!g) return;
      const s = g; g = null;
      if (!s.on) return;
      const w = widthOf(), v = s.dx / Math.max(1, Date.now() - s.t0);
      const commit = s.dx > w * .34 || v > .55;
      const from = s.dx / w, to = commit ? 1 : 0, SM = SPR.smooth;
      const dm = dim();
      const finish = () => {
        [s.cur, s.prev].forEach(x => { x.style.transform = ''; x.style.transition = ''; x.style.zIndex = ''; x.classList.remove('ios-leaving', 'ios-entering'); delete x.dataset.iosMode; });
        if (dm) dm.style.opacity = '';
        if (commit){ skipNext = true; try { R.back(); } catch(err){ fail(err); } setTimeout(() => { skipNext = false; }, 60); }
      };
      const dur = Math.max(260, Math.round(SM.ms * (commit ? 1 - from : from) * 1.1));
      const t0 = performance.now();
      const step = now => {
        const k = clamp((now - t0) / dur, 0, 1), e2 = 1 - Math.pow(1 - k, 3);
        paint(s, from + (to - from) * e2);
        if (k < 1) requestAnimationFrame(step); else finish();
      };
      if (reduced()) { paint(s, to); finish(); } else requestAnimationFrame(step);
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
        s.dy = Math.max(0, dy);
        const rub = s.dy;                         /* follows the finger 1:1 */
        panel.style.transform = 'translate3d(0,' + rub + 'px,0)';
        if (back) back.style.opacity = String(clamp(1 - rub / Math.max(1, panel.offsetHeight), 0, 1));
      }, { passive: false });
      const end = () => {
        if (!s) return; const k = s; s = null;
        if (!k.on) return;
        const v = k.dy / Math.max(1, Date.now() - k.t0);
        const dismiss = k.dy > Math.min(150, panel.offsetHeight * .32) || v > .6;
        panel.style.transition = ''; if (back) back.style.opacity = '';
        if (dismiss){
          panel.style.transform = '';
          try { R.overlay.close(); } catch(err){ fail(err); }
          if (ov.classList.contains('is-open')){ /* not dismissible: it stays, spring back */ }
          Haptics.light();
        } else {
          panel.style.transition = 'transform ' + SPR.snappy.ms + 'ms ' + SPR.snappy.css;
          panel.style.transform = '';
          setTimeout(() => { panel.style.transition = ''; }, SPR.snappy.ms + 30);
        }
      };
      panel.addEventListener('touchend', end, { passive: true });
      panel.addEventListener('touchcancel', end, { passive: true });
    };
    const scan = () => { D.querySelectorAll('#ov-root .ov').forEach(wrap); sync(); };
    new MutationObserver(scan).observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    scan();
  }

  /* ---------- pull to refresh (iOS activity indicator) ---------- */
  function pullToRefresh(){
    const OK = { home:1, history:1, notifications:1 };
    const TICKS = 12, R0 = 7, R1 = 12;
    const ind = D.createElement('div'); ind.id = 'ios-ptr'; ind.setAttribute('aria-hidden', 'true');
    let ticks = ''; for (let i = 0; i < TICKS; i++){ const a = i * 360 / TICKS; ticks += '<line x1="20" y1="' + (20 - R1) + '" x2="20" y2="' + (20 - R0) + '" transform="rotate(' + a + ' 20 20)"/>'; }
    ind.innerHTML = '<svg viewBox="0 0 40 40" width="28" height="28">' + ticks + '</svg>';
    D.body.appendChild(ind);
    const lines = ind.querySelectorAll('line');
    let g = null, busy = false;
    const paint = (dy, spin) => {
      const p = clamp(dy / 74, 0, 1);
      ind.style.opacity = String(spin ? 1 : clamp(p * 1.4, 0, 1));
      ind.style.transform = 'translate3d(-50%,' + (spin ? 62 : dy * .85) + 'px,0)';
      ind.classList.toggle('spin', !!spin);
      if (!spin) lines.forEach((l, i) => { l.style.opacity = String(i / TICKS < p ? 1 : .22); });
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
      try { await AuthEngine.hydrateRuntime(); } catch(e){ ok = false; }
      const rest = 650 - (Date.now() - t0); if (rest > 0) await new Promise(r => setTimeout(r, rest));
      try { const cur = R.current(); if (ok && OK[cur]) R.go(cur, { force: true }); else if (!ok && typeof toast === 'function') toast(t('res.toast'), 'error'); } catch(e){ fail(e); }
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
  return { init, spring, SPR, Haptics, reduced };
})();
