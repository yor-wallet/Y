'use strict';

/* ============================================================
   OM WALLET — MOTION (14.10.0): feedback you can feel, in real time.
   Presentation only: nothing here changes what an action does; ids, data-* and handlers are untouched.
   - segmented controls: a yellow pill glides to the chosen option (also when the screen re-renders)
   - live numbers: prices, percentages and the balance flash green / red when they move; the balance and the main price roll to the new value
   - live lists: market rows are patched in place when a tick arrives (no flicker, the sparklines are not redrawn)
   - live status: the « live » dot keeps pulsing across updates instead of restarting
   - alerts: the bell rings and its badge pops when a notification arrives; copy buttons confirm with a pop
   - pull to refresh (touch): the arch fills as you pull, the coin spins while the prices reload
   Under « reduce motion » everything is reduced to a short colour change; heavy effects are off on low-power phones (html.w-lite).
   ============================================================ */
const MOTION = (() => {
  const D = document, ROOT = D.documentElement;
  const reduced = () => { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch(e){ return false; } };
  const fail = e => { try { console.error('[motion]', e); } catch(_){ /* rien */ } };
  const raf = f => requestAnimationFrame(f);
  const haptic = k => { try { if (typeof UIKit !== 'undefined' && UIKit.haptic) UIKit.haptic(k); } catch(e){ /* rien */ } };

  /* ---------------------------------------------------------- 1. segmented controls ---------------------------------------------------------- */
  const lastPill = new Map();
  function pillKey(g){
    const scr = g.closest('.screen'), all = scr ? [...scr.querySelectorAll('.chips')] : [g];
    return (scr ? scr.id : '') + ':' + all.indexOf(g) + ':' + g.querySelectorAll(':scope > .chip').length;
  }
  function place(g){
    const on = g.querySelectorAll(':scope > .chip[aria-pressed="true"]');
    if (on.length !== 1 || !g.offsetWidth){ g.removeAttribute('data-pill'); return; }
    let p = g.querySelector(':scope > .chip-pill');
    if (!p){ p = D.createElement('i'); p.className = 'chip-pill'; p.setAttribute('aria-hidden', 'true'); g.insertBefore(p, g.firstChild); }
    const chip = on[0], k = pillKey(g), l = chip.offsetLeft, w = chip.offsetWidth, prev = lastPill.get(k);
    if (!p.__ready){
      p.__ready = true;
      p.style.transition = 'none';
      if (prev && !reduced()){ p.style.width = prev.w + 'px'; p.style.transform = 'translateX(' + prev.l + 'px)'; void p.offsetWidth; }   /* the screen was re-rendered: start where the pill was */
      else { p.style.width = w + 'px'; p.style.transform = 'translateX(' + l + 'px)'; }
      void p.offsetWidth;
      p.style.transition = '';
    }
    g.setAttribute('data-pill', '1');
    p.style.width = w + 'px'; p.style.transform = 'translateX(' + l + 'px)';
    if (prev && (prev.l !== l || prev.w !== w) && p.__ready && !reduced()) haptic('tap');
    lastPill.set(k, { l, w });
  }
  function placeAll(root){ (root || D).querySelectorAll('.chips').forEach(g => { try { place(g); } catch(e){ fail(e); } }); }

  /* ---------------------------------------------------------- 2. live numbers ---------------------------------------------------------- */
  const LIVE_SEL = '[data-omx-v],[data-omx-p],[data-omx-total],.omx-ap';
  const prev = new Map(), busy = new Set(), quiet = {}, masked = new Set();
  let lastScreen = '';
  const num = s => { const m = String(s).replace(/[  \s,]/g, '').match(/[-+−]?\d+(?:\.\d+)?/); return m ? parseFloat(m[0].replace('−', '-')) : NaN; };
  function keyOf(el){
    const scr = el.closest('.screen'), id = scr ? scr.id : '';
    if (el.hasAttribute('data-omx-total')) return id + ':total';
    const v = el.getAttribute('data-omx-v'); if (v) return id + ':v:' + v + ':' + (el.getAttribute('data-omx-q') || '') + (el.classList.contains('omx-ap') ? ':ap' : '');
    const p = el.getAttribute('data-omx-p'); if (p) return id + ':p:' + p;
    return id + ':' + el.className;
  }
  function flash(el, dir){
    el.classList.remove('lv-up', 'lv-dn'); void el.offsetWidth;
    el.classList.add(dir > 0 ? 'lv-up' : 'lv-dn');
    clearTimeout(el.__lvT); el.__lvT = setTimeout(() => el.classList.remove('lv-up', 'lv-dn'), 1000);
  }
  /* the figure rolls to its new value: « $2,850.83 » (decimals in a lighter span) or any text with one number in it.
     A newer value arriving mid-roll starts from what is on screen (no jump back), and only one roll runs per element (token). */
  function roll(el, from, to){
    if (reduced() || !isFinite(from) || !isFinite(to) || Math.abs(to - from) < 1e-9) return;       /* text only: cheap, so also on low-power phones */
    const dec = el.querySelector(':scope > .lt-dec'), first = el.firstChild, structured = !!(dec && first && first.nodeType === 3);
    const finalText = el.textContent, finalInt = structured ? first.textContent : null, finalDec = structured ? dec.textContent : null;
    const nm = /[-+\u2212]?\d[\d,]*(?:\.\d+)?/.exec(structured ? finalInt + finalDec : finalText);
    if (!nm) return;
    const decimals = (nm[0].split('.')[1] || '').length;
    const fmt = v => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const t0 = performance.now(), dur = 600, ease = x => 1 - (1 + 7 * x) * Math.exp(-7 * x), token = el.__rt = (el.__rt || 0) + 1;   /* 16.0.0: critically damped, the physics of every other motion */
    busy.add(el); el.__w = null;                                          /* a stale marker from an aborted roll must not abort this one */
    const write = v => {
      el.__cur = v;
      if (structured){ const s = fmt(Math.abs(v)).split('.'); first.textContent = finalInt.replace(/[-+\u2212]?\d[\d,]*/, (v < 0 ? '-' : '') + s[0]); dec.textContent = s[1] ? '.' + s[1] : ''; el.__w = el.textContent; }
      else { el.textContent = finalText.replace(nm[0], fmt(v)); el.__w = el.textContent; }
    };
    const step = now => {
      if (el.__rt !== token || !el.isConnected){ if (el.__rt === token) busy.delete(el); return; }
      if (el.__w != null && el.textContent !== el.__w){ busy.delete(el); raf(() => check(el)); return; }       /* the app wrote a newer value meanwhile: let it win */
      const k = Math.max(0, Math.min(1, (now - t0) / dur));
      if (k < 1){ write(from + (to - from) * ease(k)); raf(step); return; }
      if (structured){ first.textContent = finalInt; dec.textContent = finalDec; } else el.textContent = finalText;
      el.__w = null; el.__cur = null; busy.delete(el);
    };
    raf(step);
  }
  /* 16.0.0 \u2014 the balance changes digit by digit, like Revolut or Stocks: each digit that changed slides out and its new value slides in
     (up when the balance grows, down when it falls), from the right, 22 ms apart, on the snappy spring. The text the app wrote stays in
     the element (screen readers read it, layout does not move); a light overlay draws the motion above it and is removed at the end. */
  function stopOdo(el){
    const s = el.__odo; if (!s) return;
    el.__odo = null; clearTimeout(s.t); s.anims.forEach(a => { try { a.cancel(); } catch(e){ /* rien */ } });
    if (s.ov.isConnected) s.ov.remove();
    el.classList.remove('m-odo-on'); el.style.removeProperty('--m-odo-c');
  }
  function odometer(el, fromStr, toStr, dir){
    if (reduced() || !el.animate || !toStr || fromStr === toStr) return false;
    stopOdo(el);
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || /text/.test(cs.backgroundClip || cs.webkitBackgroundClip || '')) return false;
    const dec = el.querySelector(':scope > .lt-dec'), decLen = dec ? dec.textContent.length : 0;
    const n = toStr.length, m = fromStr ? fromStr.length : 0, cells = [];
    const esc = c => c === '<' ? '&lt;' : c === '&' ? '&amp;' : c === '>' ? '&gt;' : c;
    let html = '';
    for (let i = 0; i < n; i++){
      const ch = toStr[i], j = m - (n - i), old = fromStr && j >= 0 ? fromStr[j] : null;
      const moves = /\d/.test(ch) && (fromStr == null || old !== ch);
      const cell = moves ? '<span class="m-od" data-i="' + i + '"><span class="m-od-n">' + ch + '</span>' + (old && /\d/.test(old) ? '<span class="m-od-o">' + old + '</span>' : '') + '</span>' : esc(ch);
      if (moves) cells.push(i);
      html += i >= n - decLen ? '<span class="lt-dec">' + cell + '</span>' : cell;
    }
    if (!cells.length) return false;
    const ov = D.createElement('span'); ov.className = 'm-odo'; ov.setAttribute('aria-hidden', 'true'); ov.innerHTML = html;
    el.style.setProperty('--m-odo-c', cs.color);
    el.classList.add('m-odo-on'); el.appendChild(ov);
    const S = (typeof IOS !== 'undefined' && IOS.SPR) ? IOS.SPR.snappy : { css: 'cubic-bezier(.2,.8,.2,1)', ms: 360 };
    const up = dir >= 0 ? 1 : -1, anims = [];
    const order = cells.slice().reverse();                 /* from the right: cents first, like a counter */
    ov.querySelectorAll('.m-od').forEach(c => {
      const k = order.indexOf(+c.getAttribute('data-i')), delay = Math.max(0, k) * 22, nw = c.firstChild, od = c.querySelector('.m-od-o');
      anims.push(nw.animate([{ transform: 'translate3d(0,' + (up * 62) + '%,0)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: S.ms, delay, easing: S.css, fill: 'backwards' }));
      if (od) anims.push(od.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate3d(0,' + (-up * 62) + '%,0)', opacity: 0 }], { duration: Math.round(S.ms * .8), delay, easing: S.css, fill: 'forwards' }));
    });
    const total = S.ms + (cells.length - 1) * 22 + 40;
    el.__odo = { ov, anims, t: setTimeout(() => { if (el.__odo && el.__odo.ov === ov) stopOdo(el); }, total) };
    return true;
  }
  function check(el){
    if (!el.isConnected) return;
    if (el.hasAttribute('data-omx-mask') || /\u2022/.test(el.textContent)){ if (el.hasAttribute('data-omx-total')){ masked.add(keyOf(el)); stopOdo(el); } return; }
    if (el.hasAttribute('data-omx-total')){                  /* the balance: digit by digit (the overlay is ours: never read it as a value) */
      const txt = [...el.childNodes].filter(x => !(x.classList && x.classList.contains('m-odo'))).map(x => x.textContent).join('');
      const v = num(txt); if (!isFinite(v)) return;
      const k = keyOf(el), old = prev.get(k), was = el.__txt; prev.set(k, v);
      if (masked.has(k)){ masked.delete(k); el.__txt = txt; odometer(el, null, txt, 1); return; }       /* the eye: the digits rise into view */
      if (old == null || old === v || was === txt){ el.__txt = txt; return; }
      el.__txt = txt;
      const scr = el.closest('.screen'); if (scr && quiet[scr.id] && Date.now() < quiet[scr.id]) return;
      flash(el, v > old ? 1 : -1);
      if (!odometer(el, was || null, txt, v - old)) roll(el, old, v);
      return;
    }
    let shown = null;
    if (busy.has(el)){ if (el.textContent === el.__w) return; shown = el.__cur; el.__rt = (el.__rt || 0) + 1; el.__w = null; busy.delete(el); }       /* newer value mid-roll: chain from what is shown */
    const v = num(el.textContent); if (!isFinite(v)) return;
    const k = keyOf(el), old = prev.get(k); prev.set(k, v);
    if (masked.has(k)){ masked.delete(k); if (!reduced() && el.hasAttribute('data-omx-total')) roll(el, v * 0.9, v); return; }       /* the eye: the balance counts up into view */
    if (old == null || old === v) return;
    const scr = el.closest('.screen'); if (scr && quiet[scr.id] && Date.now() < quiet[scr.id]) return;       /* just arrived on this screen: show the values, do not flash them all */
    flash(el, v > old ? 1 : -1);
    if (el.hasAttribute('data-omx-total') || el.classList.contains('omx-ap')) roll(el, shown != null ? shown : old, v);
  }

  /* ---------------------------------------------------------- 3. live lists and status, patched in place ---------------------------------------------------------- */
  /* html = the freshly rendered rows. Same assets in the same order -> only the numbers change (flash, no flicker, sparklines kept). Otherwise -> replaced. */
  function patchList(host, html){
    const tpl = D.createElement('template'); tpl.innerHTML = html;
    const nu = [...tpl.content.querySelectorAll('[data-omx-asset]')], old = [...host.querySelectorAll('[data-omx-asset]')];
    const same = nu.length > 0 && nu.length === old.length && !tpl.content.querySelector('.omx-empty') && !host.querySelector('.omx-empty') &&
      nu.every((n, i) => n.getAttribute('data-omx-asset') === old[i].getAttribute('data-omx-asset'));
    if (!same){ host.innerHTML = html; return false; }
    nu.forEach((n, i) => {
      const o = old[i];
      for (const sel of ['[data-omx-v]', '[data-omx-p]']){
        const a = n.querySelector(sel), b = o.querySelector(sel);
        if (a && b){ if (b.textContent !== a.textContent) b.textContent = a.textContent; if (b.className.replace(/\blv-(up|dn)\b/g, '').trim() !== a.className.trim()) b.className = a.className + (b.classList.contains('lv-up') ? ' lv-up' : b.classList.contains('lv-dn') ? ' lv-dn' : ''); }
      }
      const p = n.querySelector('[data-omx-p]'), sp = o.querySelector('svg.omx-spark');
      if (p && sp){ const up = p.classList.contains('up'); sp.classList.toggle('up', up); sp.classList.toggle('down', !up && p.classList.contains('down')); }
    });
    return true;
  }
  function patchStatus(el, html){
    const tpl = D.createElement('template'); tpl.innerHTML = html;
    const nu = tpl.content.firstElementChild; if (!nu || nu.tagName !== el.tagName) return false;
    if (!!nu.querySelector('.omx-retry') !== !!el.querySelector('.omx-retry')) return false;
    if (el.className !== nu.className) el.className = nu.className;
    const a = nu.querySelector('span'), b = el.querySelector('span'); if (a && b && a.textContent !== b.textContent) b.textContent = a.textContent;
    const s1 = nu.querySelector('small'), s2 = el.querySelector('small');
    if (s1 && s2){ if (s1.textContent !== s2.textContent) s2.textContent = s1.textContent; } else if (!!s1 !== !!s2) return false;
    return true;
  }

  /* ---------------------------------------------------------- 4. alerts: bell + badge, copy ---------------------------------------------------------- */
  let badgeN = null;
  function badgeCheck(){
    const b = D.querySelector('.lt-badge'), n = b ? parseInt(b.textContent, 10) || 0 : 0;
    if (badgeN != null && n > badgeN){
      if (b && !reduced()){ b.classList.remove('lv-pop'); void b.offsetWidth; b.classList.add('lv-pop'); }
      const bell = D.querySelector('[data-action="notifications"]');
      if (bell && !reduced()){ bell.classList.remove('lv-ring'); void bell.offsetWidth; bell.classList.add('lv-ring'); setTimeout(() => bell.classList.remove('lv-ring'), 1000); }
      haptic('success');
    }
    badgeN = n;
  }
  function keypadFx(){
    D.addEventListener('click', e => {
      const key = e.target.closest && e.target.closest('[data-tr="key"]'); if (!key || reduced()) return;
      const amt = key.closest('.screen') && key.closest('.screen').querySelector('.tr-amt, .lt-amt, input[inputmode="none"], [data-amt]'); if (!amt) return;
      amt.classList.remove('lv-type'); void amt.offsetWidth; amt.classList.add('lv-type'); clearTimeout(amt.__ty); amt.__ty = setTimeout(() => amt.classList.remove('lv-type'), 260);
    }, true);
  }
  function copyFx(){
    D.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-copy],[data-omx="dep-copy"],[data-action="copy"],.px-chip.id,[data-ch-act="copy"],[data-nwc-act="copy"]'); if (!b) return;
      b.classList.remove('lv-copied'); void b.offsetWidth; b.classList.add('lv-copied'); clearTimeout(b.__cp); b.__cp = setTimeout(() => b.classList.remove('lv-copied'), 1000);
    }, true);
  }

  /* ---------------------------------------------------------- 4b. navigation, depth (16.0.0) ---------------------------------------------------------- */
  /* the tab bar: the pill under the current tab moves like a drop of liquid — its leading edge goes first, the trailing edge follows,
     it stretches across the gap and settles on the new tab (compositor only: translate + scaleX from the left edge). v12.js still owns
     the pill's final place (it measures it); this only draws the travel between the two places. */
  let navCause = null;                   /* how the last navigation arrived (IOS.kindOf), set by the route hook below, read once by the pill */
  function navLiquid(){
    const nav = D.getElementById('bottom-nav'); if (!nav || nav.__liquid) return;
    nav.__liquid = true;
    let last = null;
    const measure = () => {
      const dock = nav.querySelector('.nav-dock'), a = nav.querySelector('.nav-item[aria-current="page"]:not(.nav-cta)');
      if (!dock || !a || nav.hidden || !dock.offsetWidth) return null;
      const d = dock.getBoundingClientRect(), r = a.getBoundingClientRect();
      return { x: r.left - d.left, w: r.width };
    };
    const move = () => {
      const ind = nav.querySelector('.nav-ind'), to = measure();
      if (!ind || !to){ last = null; return; }
      const from = last; last = to;
      const cause = navCause && performance.now() - navCause.t < 600 ? navCause.kind : null; navCause = null;
      if (!from || reduced() || !ind.animate || Math.abs(to.x - from.x) < 1) return;
      /* the page is already sliding (push / pop / sheet): a second sideways motion would compete with it — the pill just appears in place */
      if (cause && cause !== 'fade'){ ind.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' }); return; }
      const dx = to.x - from.x, w = to.w, lead = dx * .78, lag = dx * .16;
      const L = dx > 0 ? from.x + lag : from.x + lead, Rr = dx > 0 ? from.x + w + lead : from.x + w + lag;
      const S = (typeof IOS !== 'undefined' && IOS.SPR) ? IOS.SPR.smooth : { css: 'cubic-bezier(.2,.8,.2,1)', ms: 420 };
      ind.animate([
        { transform: 'translateX(' + from.x + 'px) scaleX(1)', opacity: 1 },
        { transform: 'translateX(' + L.toFixed(1) + 'px) scaleX(' + ((Rr - L) / w).toFixed(3) + ')', opacity: 1, offset: .4 },
        { transform: 'translateX(' + to.x + 'px) scaleX(1)', opacity: 1 }
      ], { duration: Math.max(380, S.ms), easing: S.css });
    };
    new MutationObserver(() => raf(move)).observe(nav, { attributes: true, subtree: true, attributeFilter: ['aria-current', 'hidden'] });
    window.addEventListener('resize', () => { last = null; raf(move); }, { passive: true });
    raf(move);
  }
  /* home: the balance block drifts slower than the page and steps back a little as you scroll (depth), compositor only */
  function heroDepth(scr){
    if (!scr || scr.__depth || reduced()) return; scr.__depth = true;
    let busy = false, lastY = -1, lastHero = null;
    scr.addEventListener('scroll', () => {
      if (busy) return; busy = true;
      raf(() => {
        busy = false;
        const y = Math.min(scr.scrollTop, 420), hero = scr.querySelector('.lt-hero'); if (!hero) return;
        if (y === lastY && hero === lastHero) return;            /* a redrawn home screen has a new hero: paint it even at the same scroll */
        lastY = y; lastHero = hero;
        const k = Math.min(1, y / 260);
        hero.style.transform = y > 0 ? 'translate3d(0,' + (y * .3).toFixed(1) + 'px,0) scale(' + (1 - k * .045).toFixed(4) + ')' : '';
        hero.style.opacity = y > 0 ? (1 - k * .6).toFixed(3) : '';
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------- 5. observer ---------------------------------------------------------- */
  function observe(){
    const mo = new MutationObserver(list => {
      const els = new Set(), groups = new Set(); let badge = false;
      for (const m of list){
        let n = m.target; if (n && n.nodeType === 3) n = n.parentElement; if (!n || !n.closest) continue;
        if (m.type === 'attributes'){ const g = n.closest('.chips'); if (g) groups.add(g); continue; }
        if (n.classList && n.classList.contains('chip-pill')) continue;
        const live = n.closest(LIVE_SEL); if (live) els.add(live);
        const g = n.closest('.chips'); if (g) groups.add(g);
        if (n.closest('.lt-badge') || n.querySelector && n.querySelector('.lt-badge')) badge = true;
        m.addedNodes && m.addedNodes.forEach(a => {
          if (a.nodeType !== 1 || (a.classList && a.classList.contains('chip-pill'))) return;
          if (a.matches(LIVE_SEL)) els.add(a); a.querySelectorAll(LIVE_SEL).forEach(x => els.add(x));
          if (a.matches('.chips')) groups.add(a); a.querySelectorAll('.chips').forEach(x => groups.add(x));
          if (a.matches('.lt-badge') || a.querySelector('.lt-badge')) badge = true;
        });
      }
      if (els.size || groups.size || badge) raf(() => { els.forEach(el => { try { check(el); } catch(e){ fail(e); } }); groups.forEach(g => { try { place(g); } catch(e){ fail(e); } }); if (badge) try { badgeCheck(); } catch(e){ fail(e); } });
    });
    mo.observe(D.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-pressed'] });
    window.addEventListener('resize', () => raf(() => placeAll()), { passive: true });
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(() => placeAll()).catch(() => {});
  }

  function init(){
    if (init._done) return; init._done = true;
    try { observe(); } catch(e){ fail(e); }
    try { copyFx(); } catch(e){ fail(e); }
    try { keypadFx(); } catch(e){ fail(e); }
    try { navLiquid(); } catch(e){ fail(e); }
    try {
      R.on(info => {
        try {
          /* only a real change of screen names the cause: a screen that redraws itself right after arriving (the asset screen does, 9 ms
             later) must not erase the « push » of the navigation that brought it */
          const kind = (typeof IOS !== 'undefined' && IOS.kindOf) ? IOS.kindOf(info) : null;
          if (kind) navCause = { kind, t: performance.now() };
          if (info.id === 'home') heroDepth(info.el);
          if (!D.getElementById('bottom-nav') || !D.getElementById('bottom-nav').__liquid) navLiquid();
          if (info.id !== lastScreen){ quiet[info.id] = Date.now() + 900; lastScreen = info.id; }     /* a screen change is not a price move */
          raf(() => { placeAll(info.el); badgeCheck(); });
          setTimeout(() => placeAll(info.el), 380);
        } catch(e){ fail(e); }
      });
    } catch(e){ fail(e); }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
  return { init, patchList, patchStatus, placeAll, reduced, odometer, peek: () => ({ prev: [...prev], busy: busy.size }) };       /* peek: for the tests */
})();
