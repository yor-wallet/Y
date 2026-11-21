'use strict';

/* ============================================================
   ADMIN · TRANSFER SETTINGS · DY (13.2.0)
   Admin Control → Transfer Settings → DY. Administrators only.
   This screen is a window on the server: admin_dy_overview (state, who, when, history, blocked attempts) and admin_dy_set (the ON/OFF button).
   Both functions check is_admin() themselves and every change is written to the audit log (DY_ON / DY_OFF): hiding the entry from other
   people is a courtesy, the permission is enforced by the database. Nothing is stored or decided in the browser.
   ============================================================ */
const AdminDY = (() => {
  const isAdmin = () => { try { return !!(Runtime && Runtime.ctx && Runtime.ctx.role === 'admin'); } catch(e){ return false; } };
  let st = null, loaded = false, failed = false, busy = false;
  const host = () => document.getElementById('dy-body');
  const loc = () => (LANG === 'ar' ? 'ar-OM-u-nu-latn' : LANG === 'fr' ? 'fr-FR' : 'en-GB');
  function when(iso){
    try { return new Date(iso).toLocaleString(loc(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch(e){ return String(iso || ''); }
  }
  const num = n => { try { return Number(n || 0).toLocaleString('en-US'); } catch(e){ return String(n || 0); } };

  function paint(){
    const h = host(); if (!h) return;
    if (failed){ h.innerHTML = emptyState('warn', t('dy.err'), '', '<button type="button" class="btn btn-secondary" data-dy="reload">' + escapeHtml(t('dy.retry')) + '</button>'); return; }
    if (!loaded){ h.innerHTML = skeletonRows(3); return; }
    const on = !!st.enabled;
    const hist = Array.isArray(st.history) ? st.history : [];
    h.innerHTML =
      '<section class="dy-card' + (on ? ' is-on' : '') + '" aria-labelledby="dy-sw-t">' +
        '<div class="dy-row"><span class="dy-ico">' + icon('shield', 22) + '</span>' +
          '<div class="dy-txt"><b id="dy-sw-t">' + escapeHtml(t('dy.sw')) + '</b><small>' + escapeHtml(t('dy.swSub')) + '</small></div>' +
          '<button type="button" class="switch dy-switch" id="dy-switch" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" aria-labelledby="dy-sw-t" data-dy="toggle"' + (busy ? ' disabled' : '') + '></button></div>' +
        '<div class="dy-state ' + (on ? 'on' : 'off') + '" role="status">' + escapeHtml(t(on ? 'dy.on' : 'dy.off')) + '</div>' +
        '<p class="dy-desc">' + escapeHtml(t('dy.desc')) + '</p>' +
        '<div class="dy-meta"><span>' + escapeHtml(t('dy.last')) + '</span><b>' + (st.updatedAt && (hist.length || st.updatedBy)
            ? escapeHtml(when(st.updatedAt)) + (st.updatedBy ? ' · ' + escapeHtml(t('dy.by')) + ' ' + escapeHtml(st.updatedBy) : '') : escapeHtml(t('dy.never'))) + '</b></div>' +
      '</section>' +
      '<section class="dy-card"><h2 class="dy-h">' + escapeHtml(t('dy.preview')) + '</h2><div class="dy-preview">' + DY.noticeHtml() + '</div></section>' +
      '<section class="dy-card"><h2 class="dy-h">' + escapeHtml(t('dy.blocked')) + '</h2><div class="dy-stats">' +
        '<div><b class="ltr" dir="ltr">' + escapeHtml(num(st.blocked24h)) + '</b><small>' + escapeHtml(t('dy.b24')) + '</small></div>' +
        '<div><b class="ltr" dir="ltr">' + escapeHtml(num(st.blockedTotal)) + '</b><small>' + escapeHtml(t('dy.bAll')) + '</small></div></div></section>' +
      '<section class="dy-card"><h2 class="dy-h">' + escapeHtml(t('dy.history')) + '</h2>' +
        (hist.length ? '<ul class="dy-hist">' + hist.map(x => '<li><span class="dy-dot ' + (x.enabled ? 'on' : 'off') + '"></span><span>' + escapeHtml(t(x.enabled ? 'dy.hOn' : 'dy.hOff')) +
            (x.by ? ' · ' + escapeHtml(x.by) : '') + '</span><small class="ltr" dir="ltr">' + escapeHtml(when(x.at)) + '</small></li>').join('') + '</ul>'
          : '<p class="dy-desc">' + escapeHtml(t('dy.histEmpty')) + '</p>') +
      '</section>';
  }
  async function load(){
    try {
      const { data, error } = await sb.rpc('admin_dy_overview');
      if (error) throw error;
      st = data || {}; loaded = true; failed = false;
    } catch(e){ console.error('[dy]', e); failed = true; }
    paint();
  }
  const errKey = e => /forbidden|unauthenticated/i.test(String(e && e.message || '')) ? 'dy.e.forbidden' : 'dy.e.generic';

  /* the button asks first: it affects every user */
  function ask(next){
    const close = R.overlay.open(
      '<div class="po-sheet"><h2>' + escapeHtml(t(next ? 'dy.askOnT' : 'dy.askOffT')) + '</h2><p class="po-lead">' + escapeHtml(t(next ? 'dy.askOnD' : 'dy.askOffD')) + '</p>' +
      '<div class="field-err" id="dy-err" role="alert"></div>' +
      '<button type="button" class="btn btn-primary" id="dy-go">' + escapeHtml(t(next ? 'dy.askOnYes' : 'dy.askOffYes')) + '</button>' +
      '<button type="button" class="btn btn-ghost" id="dy-no">' + escapeHtml(t('dy.cancel')) + '</button></div>', { kind: 'modal' });
    setTimeout(() => {
      const go = document.getElementById('dy-go'), no = document.getElementById('dy-no'), err = document.getElementById('dy-err'); if (!go) return;
      no.onclick = () => close();
      go.onclick = async () => {
        if (busy) return; busy = true; err.textContent = ''; UIKit.loading(go, true);
        try {
          const { data, error } = await sb.rpc('admin_dy_set', { p_enabled: next });
          if (error) throw error;
          st = data || st; loaded = true; failed = false; try { DY.status(true); } catch(e){ /* rien */ }
          close(); toast(t(next ? 'dy.okOn' : 'dy.okOff'), 'success'); try { UIKit.haptic('success'); } catch(e){ /* rien */ }
        } catch(e){ console.error('[dy] set', e); UIKit.loading(go, false); err.textContent = t(errKey(e)); }
        finally { busy = false; paint(); }
      };
    }, 60);
  }

  function render(){
    if (!isAdmin()){ setTimeout(() => R.go('home', { reset: true }), 0); return ''; }
    return '<div class="topbar"><button class="topbar-back" data-action="back" aria-label="' + escapeHtml(t('ui.back')) + '"><span class="dir-flip" style="display:inline-flex">' + icon('back', 20) + '</span></button>' +
      '<span class="topbar-title">' + escapeHtml(t('dy.title')) + '</span><span style="width:calc(44px*var(--ui))"></span></div>' +
      '<div class="screen-body dy-screen" style="padding-top:0"><p class="dy-kicker">' + escapeHtml(t('dy.sub')) + '</p><div id="dy-body" aria-live="polite"></div></div>';
  }
  function bind(el){
    loaded = false; failed = false; st = null; paint(); load();
    if (el.__dyBound) return;
    el.__dyBound = true;
    el.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-dy]'); if (!b) return;
      const a = b.getAttribute('data-dy');
      if (a === 'reload'){ loaded = false; failed = false; paint(); load(); }
      else if (a === 'toggle' && loaded && !busy) ask(!st.enabled);
    });
  }
  /* entry in the Services list, for administrators only (next to the payouts entry) */
  function addMenu(el){
    if (!isAdmin() || el.querySelector('[data-nav="dy-control"]')) return;
    const btn = '<button class="yb-svc" data-nav="dy-control"><span class="yb-svc-i">' + icon('shield', 22) + '</span><span class="yb-svc-t">' + escapeHtml(t('dy.menu')) + '</span></button>';
    const po = el.querySelector('[data-nav="payouts"]');
    const grid = po && po.parentElement;
    if (grid) grid.insertAdjacentHTML('beforeend', btn);
    else {
      const last = el.querySelector('.yb-sec:last-of-type'); if (!last) return;
      last.insertAdjacentHTML('afterend', '<section class="yb-sec"><div class="yb-h"><h2>' + escapeHtml(t('dy.admin')) + '</h2></div><div class="yb-grid">' + btn + '</div></section>');
    }
    const b = el.querySelector('[data-nav="dy-control"]');
    if (b) b.addEventListener('click', e => { e.preventDefault(); R.go('dy-control'); });
  }
  function init(){
    R.register({ 'dy-control': render });
    R.on(info => {
      try {
        if (info.id === 'dy-control' && info.el.querySelector('#dy-body')) bind(info.el);
        else if (info.id === 'services') addMenu(info.el);
      } catch(e){ console.error('[dy]', e); }
    });
  }
  init();
  return { isAdmin };
})();
