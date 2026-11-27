'use strict';

/* ============================================================
   OM WALLET — INTERACTIONS (14.4.0)
   Presentation only. Nothing here decides what an action does: buttons keep their ids / data-* and their existing handlers.
   - touch: a soft light blooms from the finger and the control springs (scale .96 → 1)
   - screens: cards rise in a cascade when a screen opens; list rows appear as they scroll into view
   - messages: success / error / info drop from the top as a glass capsule with a drawn icon and a time bar; swipe up to dismiss
   - input: the field that gets an error shakes once; the field icon lights up on focus (CSS)
   - home banners: a real carousel (each banner opens a real screen), auto-advances only while visible
   - settings: category rows scroll to their section and flash it
   - low-power phones: live blur and ambient loops are switched off (html.w-lite)
   Everything is skipped under « reduce motion ».
   ============================================================ */
const OMW = (() => {
  const D = document, ROOT = D.documentElement;
  const reduced = () => { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch(e){ return false; } };
  const fail = e => { try { console.error('[omw]', e); } catch(_){ /* rien */ } };

  /* ---------- device capability ---------- */
  function capability(){
    try {
      const cores = navigator.hardwareConcurrency || 8, mem = navigator.deviceMemory || 8;
      if (cores <= 4 || mem <= 2) ROOT.classList.add('w-lite');
    } catch(e){ /* rien */ }
  }

  /* ---------- touch: light + spring ---------- */
  const PRESS = '.fk-key,.btn,.omx-act,.hub-row,.omx-row,.omx-pick,.chip,.nav-item,.hub-circ,.topbar-back,.w-sq,.w-pill,.w-row,.w-promo-card,.ds-eye,.hub-out,.w-out,.yd-nav button,.settings-row,.omx-net.pick,.wp-skip,.lt-key,.lt-mv,.omx-star,.yb-svc,.px-chip,.wd-max,.wd-paste,.nav-cta,.tr-flip,.tr-pairbtn,.item.tx-row,.lt-act';
  /* 16.0.0 — the light blooms only on surfaces (buttons, cards, tiles); list rows get the iOS highlight instead (css/motion-system.css) */
  const LIGHT = '.btn,.omx-act:not(.lt-acts > .omx-act),.lt-act,.w-promo-card,.lt-mv,.yb-svc,.w-pill,.omx-pick,.px-chip,.tr-pairbtn';   /* home quick actions: their circle sinks instead */
  function press(){
    D.addEventListener('pointerdown', e => {
      const el = e.target.closest && e.target.closest(PRESS); if (!el || el.disabled) return;
      el.classList.add('w-press', 'm-down');                 /* m-down = really held now (some templates carry w-press as a static marker) */
      if (reduced() || !el.matches(LIGHT)) return;
      const r = el.getBoundingClientRect(), dot = D.createElement('span');
      dot.className = 'w-light'; dot.style.left = (e.clientX - r.left) + 'px'; dot.style.top = (e.clientY - r.top) + 'px';
      /* 16.0.0 — the element gets its own position / overflow back once the light is gone (before, overflow:hidden stayed for good and
         clipped shadows, badges and focus rings after the first touch) */
      if (el.__wl == null){ el.__wl = 0; el.__wlPos = getComputedStyle(el).position === 'static' ? el.style.position : null; el.__wlOv = el.style.overflow; }
      el.__wl++;
      if (el.__wlPos !== null) el.style.position = 'relative';
      el.style.overflow = 'hidden';
      el.appendChild(dot);
      setTimeout(() => {
        dot.remove();
        if (--el.__wl <= 0){ el.style.overflow = el.__wlOv || ''; if (el.__wlPos !== null) el.style.position = el.__wlPos || ''; el.__wl = null; }
      }, 650);
    }, { passive: true });
    const up = () => D.querySelectorAll('.w-press,.m-down').forEach(x => x.classList.remove('w-press', 'm-down'));
    ['pointerup', 'pointercancel', 'pointerleave', 'blur'].forEach(t => window.addEventListener(t, up, { passive: true }));
  }

  /* ---------- screens: cascade + scroll reveal ---------- */
  let io = null;
  /* 16.0.0 — one entrance per screen, on the compositor: at most 8 visible blocks rise 10 px and fade in, 28 ms apart, on the soft spring.
     Before: up to 14 blocks, each class removed and re-added with a forced layout in between (14 synchronous reflows in the first frame
     of the transition), 620 ms each, plus static .w-rise in the templates — about 840 ms before a screen was still. */
  const ENTER = { duration: 440, delay: 24, step: 28, max: 8 };
  /* When the blocks rise (16.0.0): the first screen after start-up or sign-in, and a tab opened for the first time in this session.
     Never when the same screen is redrawn with fresh data (a confirmed deposit used to make the whole home screen rise again), never inside
     a screen that already slides in or rises as a whole (push / present), never when going back: one navigation, one motion. */
  const seen = new Set();
  function wantsEntrance(info){
    const first = !seen.has(info.id); seen.add(info.id);
    if (!info.from) return true;
    if (info.from === info.id) return false;
    const kind = (typeof IOS !== 'undefined' && IOS.kindOf) ? IOS.kindOf(info) : 'fade';
    return kind === 'fade' && (info.reset || first);
  }
  function cascade(el){
    if (!el || reduced() || !el.animate) return;
    const host = el.querySelector('.w-home, .w-assets, .w-set, .hub, .screen-body') || el;
    const vh = window.innerHeight || 800, curve = (typeof IOS !== 'undefined' && IOS.SPR) ? IOS.SPR.smooth.css : 'cubic-bezier(.2,.8,.2,1)';
    let n = 0;
    for (const k of host.children){                                  /* reads only, no style writes between them: one layout at most */
      if (n >= ENTER.max) break;
      const b = k.getBoundingClientRect();
      if (!b.height || !b.width) continue;
      if (b.top > vh) break;
      k.animate([{ opacity: 0, transform: 'translate3d(0,10px,0)' }, { opacity: 1, transform: 'none' }],
        { duration: ENTER.duration, delay: ENTER.delay + n * ENTER.step, easing: curve, fill: 'backwards' });
      n++;
    }
    if (!io && 'IntersectionObserver' in window) io = new IntersectionObserver(es => {
      let i = 0;
      es.forEach(x => {
        if (!x.isIntersecting) return;
        const r = x.target, d = Math.min(i++, 5) * 26;
        r.style.transitionDelay = d + 'ms'; r.classList.add('w-in'); io.unobserve(r);
        /* 16.0.0 — once in place the row becomes a plain row again: before, the delay stayed on it and its press highlight lagged */
        setTimeout(() => { r.classList.remove('w-reveal', 'w-in'); r.style.transitionDelay = ''; }, d + 1000);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    if (!io) return;
    const late = [...el.querySelectorAll('.omx-row, .w-arow, .hub-row, .w-row, .settings-row, .rv-list > *')]
      .filter(r => r.getBoundingClientRect().top > vh * 0.92);         /* all reads first, then the writes: one style pass, not one per row */
    late.forEach(r => { r.classList.add('w-reveal'); io.observe(r); });
  }

  /* ---------- messages ---------- */
  const TI = {
    success: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    error: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M12 11v6M12 7.5h.01"/></svg>'
  };
  function newToast(msg, type){
    const c = D.getElementById('toasts'); if (!c) return;
    const kind = type === 'error' ? 'error' : (type === 'success' || type === 'ok') ? 'success' : 'info';
    const el = D.createElement('div');
    el.className = 'toast w-toast ' + kind; el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    el.innerHTML = '<span class="w-ti" aria-hidden="true">' + TI[kind] + '</span><span class="w-tt"></span><i class="w-tb" aria-hidden="true"></i>';
    el.querySelector('.w-tt').textContent = msg;
    c.appendChild(el);
    try { if (typeof UIKit !== 'undefined' && UIKit.haptic) UIKit.haptic(kind === 'error' ? 'warning' : kind === 'success' ? 'success' : 'tap'); } catch(e){ /* rien */ }
    let gone = false;
    const leave = () => { if (gone) return; gone = true; el.classList.add('leaving'); setTimeout(() => el.remove(), 360); };
    let y0 = null;
    el.addEventListener('pointerdown', e => { y0 = e.clientY; });
    el.addEventListener('pointermove', e => { if (y0 != null && y0 - e.clientY > 18) leave(); });
    el.addEventListener('click', leave);
    setTimeout(leave, 2900);
  }

  /* ---------- input feedback: shake the field that receives an error ---------- */
  function errors(){
    const mo = new MutationObserver(list => list.forEach(m => {
      const t = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      const err = t && t.closest && t.closest('.field-err'); if (!err || !err.textContent.trim() || reduced()) return;
      const box = err.previousElementSibling && err.previousElementSibling.querySelector ? (err.previousElementSibling.querySelector('.field-box') || err.previousElementSibling) : null;
      const target = box || err;
      target.classList.remove('w-shake'); void target.offsetWidth; target.classList.add('w-shake');
    }));
    mo.observe(D.body, { childList: true, characterData: true, subtree: true });
  }

  /* ---------- home banners: real carousel ---------- */
  let carTimer = null;
  function carousel(el){
    clearInterval(carTimer); carTimer = null;
    const car = el && el.querySelector('[data-w-carousel]'); if (!car) return;
    const track = car.querySelector('.w-promo-track'), cards = [...car.querySelectorAll('.w-promo-card')], dots = [...(car.nextElementSibling ? car.nextElementSibling.querySelectorAll('i') : [])];
    let k = 0, x0 = null;
    const rtl = () => ROOT.getAttribute('dir') === 'rtl';
    const show = n => { k = (n + cards.length) % cards.length; track.style.transform = 'translateX(' + ((rtl() ? 1 : -1) * k * 100) + '%)'; dots.forEach((d, j) => d.classList.toggle('on', j === k)); cards.forEach((c, j) => c.tabIndex = j === k ? 0 : -1); };
    car.addEventListener('pointerdown', e => { x0 = e.clientX; }, { passive: true });
    car.addEventListener('pointerup', e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40){ show(k + ((dx < 0) !== rtl() ? 1 : -1)); } }, { passive: true });
    car.addEventListener('click', e => { if (car.__moved){ e.preventDefault(); e.stopPropagation(); } }, true);
    if (reduced()) return;
    carTimer = setInterval(() => { if (!car.isConnected){ clearInterval(carTimer); carTimer = null; return; } if (D.hidden) return; show(k + 1); }, 5200);
  }

  /* ---------- settings: scroll to a section ---------- */
  function anchors(){
    D.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-w-scroll]'); if (!b) return;
      const a = D.getElementById(b.getAttribute('data-w-scroll')); if (!a) return;
      e.preventDefault();
      a.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      const g = a.nextElementSibling && a.nextElementSibling.nextElementSibling;
      if (g && !reduced()){ g.classList.remove('w-flash'); void g.offsetWidth; g.classList.add('w-flash'); }
    });
  }

  function init(){
    if (init._done) return; init._done = true;
    try { capability(); } catch(e){ fail(e); }
    try { press(); } catch(e){ fail(e); }
    try { errors(); } catch(e){ fail(e); }
    try { anchors(); } catch(e){ fail(e); }
    try { if (typeof toast === 'function') toast = newToast; } catch(e){ fail(e); }        /* every existing toast(msg, type) call now uses the new capsule */
    try {
      R.on(info => {
        try {
          if (io) io.disconnect();                     /* every navigation redraws its screen: rows still waiting belong to a replaced page */
          if (wantsEntrance(info)) cascade(info.el);
          carousel(info.el);
        } catch(e){ fail(e); }
      });
    } catch(e){ fail(e); }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
  return { init, toast: newToast, reduced };
})();
