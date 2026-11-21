'use strict';

/* ============================================================
   ADMIN · TRANSFER SETTINGS · DY (13.2.0)
   Admin Control → Transfer Settings → DY. Administrators only.
   This screen is a window on the server: admin_dy_overview (state, who, when, history, blocked attempts) and admin_dy_set (the ON/OFF button).
   Both functions check is_admin() themselves and every change is written to the audit log (DY_ON / DY_OFF): hiding the entry from other
   people is a courtesy, the permission is enforced by the database. Nothing is stored or decided in the browser.
   ============================================================ */
Object.assign(TR.en, { 'adm.dash':'Dashboard','adm.transfers':'Transfers','adm.settings':'System Settings','adm.logs':'Activity Logs','adm.exit':'Back to app','adm.status':'System Status','adm.online':'Online','adm.offline':'Not reachable',
  'adm.users':'Users','adm.tt':'Total Transfers','adm.today':'Today’s Transactions','adm.bal':'Total Balance','adm.role':'Administrator','adm.notice':'Notice shown to senders (when DY is ON)','adm.note':'Note',
  'adm.n1':'When DY is OFF, transfers work normally with all the usual checks.','adm.n2':'You can turn DY on or off at any time.' });
Object.assign(TR.fr, { 'adm.dash':'Tableau de bord','adm.transfers':'Transferts','adm.settings':'Paramètres du système','adm.logs':'Journal d’activité','adm.exit':'Retour à l’application','adm.status':'État du système','adm.online':'En ligne','adm.offline':'Injoignable',
  'adm.users':'Utilisateurs','adm.tt':'Total des transferts','adm.today':'Opérations du jour','adm.bal':'Solde total','adm.role':'Administrateur','adm.notice':'Avis montré aux expéditeurs (quand DY est actif)','adm.note':'Remarque',
  'adm.n1':'Quand DY est désactivé, les transferts fonctionnent normalement avec toutes les vérifications habituelles.','adm.n2':'Vous pouvez activer ou désactiver DY à tout moment.' });
Object.assign(TR.ar, { 'adm.dash':'الرئيسية','adm.transfers':'التحويلات','adm.settings':'إعدادات النظام','adm.logs':'سجل النشاط','adm.exit':'العودة إلى التطبيق','adm.status':'حالة النظام','adm.online':'يعمل الآن','adm.offline':'غير متاح',
  'adm.users':'المستخدمون','adm.tt':'إجمالي التحويلات','adm.today':'عمليات اليوم','adm.bal':'الرصيد الكلي','adm.role':'المدير','adm.notice':'الإشعار الذي يراه المرسل (عند تفعيل DY)','adm.note':'ملاحظة',
  'adm.n1':'عند إيقاف DY، تعمل التحويلات بشكل طبيعي مع جميع عمليات التحقق المعتادة.','adm.n2':'يمكنك تفعيل أو إيقاف DY في أي وقت.' });
/* Admin Control is bilingual like the reference: Arabic first, English under it, whatever the language of the app */
const bi = k => '<b>' + escapeHtml(TR.ar[k] || k) + '</b><small>' + escapeHtml(TR.en[k] || k) + '</small>';

const AdminDY = (() => {
  const isAdmin = () => { try { return !!(Runtime && Runtime.ctx && Runtime.ctx.role === 'admin'); } catch(e){ return false; } };
  let st = null, loaded = false, failed = false, busy = false, stats = null;
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
      '<section class="dy-card"><h2 class="dy-h">' + escapeHtml(TR.ar['adm.notice']) + ' <small>' + escapeHtml(TR.en['adm.notice']) + '</small></h2><div class="dy-preview">' + DY.noticeHtml() + '</div></section>' +
      '<section class="dy-card"><h2 class="dy-h">' + escapeHtml(t('dy.blocked')) + '</h2><div class="dy-stats">' +
        '<div><b class="ltr" dir="ltr">' + escapeHtml(num(st.blocked24h)) + '</b><small>' + escapeHtml(t('dy.b24')) + '</small></div>' +
        '<div><b class="ltr" dir="ltr">' + escapeHtml(num(st.blockedTotal)) + '</b><small>' + escapeHtml(t('dy.bAll')) + '</small></div></div></section>' +
      '<section class="dy-card"><h2 class="dy-h">' + escapeHtml(t('dy.history')) + '</h2>' +
        (hist.length ? '<ul class="dy-hist">' + hist.map(x => '<li><span class="dy-dot ' + (x.enabled ? 'on' : 'off') + '"></span><span>' + escapeHtml(t(x.enabled ? 'dy.hOn' : 'dy.hOff')) +
            (x.by ? ' · ' + escapeHtml(x.by) : '') + '</span><small class="ltr" dir="ltr">' + escapeHtml(when(x.at)) + '</small></li>').join('') + '</ul>'
          : '<p class="dy-desc">' + escapeHtml(t('dy.histEmpty')) + '</p>') +
      '</section>';
  }
  function paintSide(){
    const h = document.getElementById('adm-right'); if (!h) return;
    const bal = stats ? moneyHtml(CurrencyEngine.format(Number(stats.balance_omr || 0), 'OMR')) : '—';
    const card = (ic, k, v) => '<div class="adm-stat"><span class="adm-si">' + icon(ic, 22) + '</span><span class="adm-sl">' + bi(k) + '</span><span class="adm-sv ltr" dir="ltr">' + v + '</span></div>';
    h.innerHTML =
      '<section class="adm-card adm-brand">' + omLogoHtml(120) + '<div class="adm-bt">Admin Control</div></section>' +
      '<section class="adm-card adm-status ' + (failed ? 'bad' : 'ok') + '"><span class="adm-chk">' + icon(failed ? 'close' : 'check', 28) + '</span><div class="adm-sl">' + bi('adm.status') + '</div>' +
        '<div class="adm-pill" role="status">' + escapeHtml(TR.ar[failed ? 'adm.offline' : 'adm.online']) + '<small>' + escapeHtml(TR.en[failed ? 'adm.offline' : 'adm.online']) + '</small></div></section>' +
      card('history', 'adm.tt', stats ? escapeHtml(num(stats.transfers_total)) : '—') + card('user', 'adm.users', stats ? escapeHtml(num(stats.users)) : '—') +
      card('clock', 'adm.today', stats ? escapeHtml(num(stats.transactions_today)) : '—') + card('wallet', 'adm.bal', bal);
  }
  async function loadStats(){
    try { const { data, error } = await sb.rpc('admin_console_stats'); if (error) throw error; stats = data || null; } catch(e){ console.error('[dy] stats', e); stats = null; }
    paintSide();
  }
  async function load(){
    try {
      const { data, error } = await sb.rpc('admin_dy_overview');
      if (error) throw error;
      st = data || {}; loaded = true; failed = false;
    } catch(e){ console.error('[dy]', e); failed = true; }
    paint(); paintSide(); loadStats();
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
    const p = Runtime.profile || {}, who = [p.firstName, p.lastName].filter(Boolean).join(' ') || t('adm.role');
    const nav = (ic, k, attrs, on) => '<button type="button" class="adm-nav' + (on ? ' on' : '') + '" ' + attrs + '><span class="adm-ni">' + icon(ic, 22) + '</span><span class="adm-nl">' + bi(k) + '</span></button>';
    return '<div class="adm"><header class="adm-top"><button class="hub-circ" data-action="back" aria-label="' + escapeHtml(t('ui.back')) + '">' + icon('back', 22) + '</button>' +
        '<div class="adm-ttl"><h1>' + escapeHtml(TR.ar['dy.sub']) + '</h1><small>' + escapeHtml(TR.en['dy.sub']) + '</small></div>' +
        '<div class="adm-me"><span class="px-ava" aria-hidden="true">' + escapeHtml(pxInitials(p)) + '</span><span class="adm-mt"><b>' + escapeHtml(who) + '</b><small>' + escapeHtml(TR.en['adm.role']) + '</small></span></div></header>' +
      '<aside class="adm-side">' + omLogoHtml(110) +
        nav('home', 'adm.dash', 'data-adm="stats"') + nav('history', 'adm.transfers', 'data-nav="payouts"') + nav('settings', 'adm.settings', 'data-adm="top"', true) + nav('doc', 'adm.logs', 'data-adm="logs"') + nav('logout', 'adm.exit', 'data-nav="home"') + '</aside>' +
      '<main class="adm-main"><section class="adm-card adm-head"><span class="dy-ico">' + icon('settings', 22) + '</span><div class="adm-ht">' + bi('dy.title') + '</div></section>' +
        '<div id="dy-body" aria-live="polite"></div></main>' +
      '<aside class="adm-right" id="adm-right"></aside>' +
      '<section class="adm-card adm-notes"><span class="dy-ico">' + icon('info', 22) + '</span><div><b>' + escapeHtml(TR.ar['adm.note']) + ':</b><ul><li>' + escapeHtml(TR.ar['adm.n1']) + '</li><li>' + escapeHtml(TR.ar['adm.n2']) + '</li></ul></div>' +
        '<div class="adm-en"><b>' + escapeHtml(TR.en['adm.note']) + ':</b><ul><li>' + escapeHtml(TR.en['adm.n1']) + '</li><li>' + escapeHtml(TR.en['adm.n2']) + '</li></ul></div></section></div>';
  }
  function bind(el){
    loaded = false; failed = false; st = null; paint(); load();
    if (el.__dyBound) return;
    el.__dyBound = true;
    el.addEventListener('click', e => {
      const nv = e.target.closest && e.target.closest('[data-adm]');
      if (nv){ const k = nv.getAttribute('data-adm'); const to = k === 'logs' ? el.querySelector('.dy-hist') : k === 'stats' ? document.getElementById('adm-right') : el.querySelector('.adm'); if (to && to.scrollIntoView) to.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
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
