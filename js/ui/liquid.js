'use strict';

/* ============================================================
   OM WALLET — VERRE LIQUIDE (14.6.0). Presentation only, with css/liquid.css.
   - bottom menu: the glass capsule gets slimmer while a page scrolls down (labels fade, icons stay) and is full again
     as soon as the page scrolls up, comes back near the top, or another page opens
   - the glass lens under the active tab stretches while it travels to the newly chosen tab
   Nothing here changes what a tab or a button does (the tabs keep their data-nav and the router's handler).
   Everything is skipped under « reduce motion ».
   ============================================================ */
const LiquidGlass = (() => {
  const D = document;
  const reduced = () => { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch(e){ return false; } };
  const fail = e => { try { console.error('[liquid]', e); } catch(_){ /* rien */ } };
  const nav = () => D.getElementById('bottom-nav');

  /* ---------- slimmer capsule while scrolling down ---------- */
  const lastY = new WeakMap();
  let frame = 0, pending = null;
  function setMin(on){
    const n = nav(); if (!n) return;
    if (n.classList.contains('lg-min') !== on) n.classList.toggle('lg-min', on);
  }
  function onScroll(e){
    const el = e.target;
    if (!el || el.nodeType !== 1 || !el.classList.contains('screen')) return;      /* only a page's own scroll, never a sheet or a carousel */
    pending = el;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const s = pending; pending = null; if (!s) return;
      const y = s.scrollTop, prev = lastY.has(s) ? lastY.get(s) : y;
      lastY.set(s, y);
      if (reduced() || y < 40) { setMin(false); return; }
      if (y - prev > 6) setMin(true);
      else if (prev - y > 6) setMin(false);
    });
  }

  /* ---------- the lens stretches while it moves to another tab ---------- */
  function lens(){
    const n = nav(); if (!n) return;
    const ind = n.querySelector('.nav-ind'); if (!ind || ind.__lg) return;   /* the menu is rebuilt when the language changes: watch the new lens */
    ind.__lg = true;
    let lastX = null;
    const read = () => { const m = /translateX\((-?[\d.]+)px\)/.exec(ind.style.transform || ''); return m ? parseFloat(m[1]) : null; };
    lastX = read();
    if (!window.MutationObserver) return;
    new MutationObserver(() => {
      const x = read(); if (x == null) return;
      if (lastX != null && Math.abs(x - lastX) > 2 && ind.classList.contains('ready') && !reduced()){
        ind.classList.remove('lg-stretch'); void ind.offsetWidth; ind.classList.add('lg-stretch');
      }
      lastX = x;
    }).observe(ind, { attributes: true, attributeFilter: ['style'] });
    ind.addEventListener('animationend', () => ind.classList.remove('lg-stretch'));
  }

  function init(){
    if (init._done) return; init._done = true;
    try { D.addEventListener('scroll', onScroll, { capture: true, passive: true }); } catch(e){ fail(e); }
    try { R.on(() => { try { setMin(false); requestAnimationFrame(lens); } catch(e){ fail(e); } }); } catch(e){ fail(e); }
    try { requestAnimationFrame(lens); } catch(e){ fail(e); }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
  return { init, setMin };
})();
