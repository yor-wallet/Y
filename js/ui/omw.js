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
  const PRESS = '.btn,.omx-act,.hub-row,.omx-row,.omx-pick,.chip,.nav-item,.hub-circ,.topbar-back,.w-sq,.w-pill,.w-row,.w-promo-card,.ds-eye,.hub-out,.w-out,.yd-nav button,.settings-row,.omx-net.pick,.wp-skip,.lt-key,.lt-mv,.omx-star,.yb-svc,.px-chip,.wd-max,.wd-paste,.nav-cta';
  function press(){
    D.addEventListener('pointerdown', e => {
      const el = e.target.closest && e.target.closest(PRESS); if (!el || el.disabled) return;
      el.classList.add('w-press');
      if (reduced()) return;
      const r = el.getBoundingClientRect(), dot = D.createElement('span');
      dot.className = 'w-light'; dot.style.left = (e.clientX - r.left) + 'px'; dot.style.top = (e.clientY - r.top) + 'px';
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.style.overflow = el.style.overflow || 'hidden';
      el.appendChild(dot); setTimeout(() => dot.remove(), 650);
    }, { passive: true });
    const up = () => D.querySelectorAll('.w-press').forEach(x => x.classList.remove('w-press'));
    ['pointerup', 'pointercancel', 'pointerleave', 'blur'].forEach(t => window.addEventListener(t, up, { passive: true }));
  }

  /* ---------- screens: cascade + scroll reveal ---------- */
  let io = null;
  function cascade(el){
    if (!el || reduced()) return;
    const host = el.querySelector('.w-home, .w-assets, .w-set, .hub, .screen-body') || el;
    const kids = [...host.children].filter(k => k.offsetParent !== null).slice(0, 14);
    kids.forEach((k, n) => { k.classList.remove('w-rise'); void k.offsetWidth; k.style.setProperty('--w-i', n); k.classList.add('w-rise'); });
    if (!io && 'IntersectionObserver' in window) io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting){ x.target.classList.add('w-in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -6% 0px' });
    if (!io) return;
    const vh = window.innerHeight || 800;
    el.querySelectorAll('.omx-row, .w-arow, .hub-row, .w-row, .settings-row, .rv-list > *').forEach(r => {
      if (r.getBoundingClientRect().top > vh * 0.92){ r.classList.add('w-reveal'); io.observe(r); }
    });
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
    try { R.on(info => { try { cascade(info.el); carousel(info.el); } catch(e){ fail(e); } }); } catch(e){ fail(e); }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
  return { init, toast: newToast, reduced };
})();
