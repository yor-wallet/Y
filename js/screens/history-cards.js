'use strict';

/* ============================================================
   HISTORY (12.4.0) — transactions grouped by day, filtered by type or by REAL status.
   The card screens live in js/features/v12.js (the old card screens with a network name were removed: those cards are not issued).
   ============================================================ */
const isCryptoTx = x => !!(x.asset || String(x.type || '').startsWith('CRYPTO'));
/* 12.12.0 : with the crypto section hidden, crypto operations are not listed (home, history). Money transfers only. */
/* 14.0.0: the real crypto withdrawals (flow CRYPTO_WITHDRAWAL, paid by an administrator) are listed; the old simulated crypto operations stay hidden */
function visibleTransactions(txs){ return FEATURES.crypto ? txs : (txs || []).filter(x => !isCryptoTx(x) || x.flow === 'CRYPTO_WITHDRAWAL' || x.confirm === 'ADMIN'); }   /* 14.2: internal crypto sends (confirmed by DYT) */
/* 12.14.0 — search + period + direction, combined with the status chips. Memory only (reset when the app restarts). */
const HIST = { q:'', period:'all', dir:'all', st:'all' };   /* 17.4.0: st = status tab (all · pending · failed) */
function histPeriodStart(p){
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (p === 'today') return d.getTime();
  if (p === '7d') return d.getTime() - 6 * 864e5;
  if (p === '30d') return d.getTime() - 29 * 864e5;
  if (p === 'month'){ d.setDate(1); return d.getTime(); }
  return 0;
}
function historyFilter(txs, f){
  txs = visibleTransactions(txs);
  const from = histPeriodStart(HIST.period);
  if (from) txs = txs.filter(x => (x.createdAt || 0) >= from);
  if (HIST.dir === 'in') txs = txs.filter(x => x.direction === 'IN');
  if (HIST.dir === 'out') txs = txs.filter(x => x.direction !== 'IN');
  if (HIST.q && typeof txMatches === 'function') txs = txs.filter(x => txMatches(x, HIST.q));
  if ((!f || f === 'all') && HIST.st !== 'all') f = HIST.st;   /* 17.4.0: the one tab row sets direction or status; every redraw respects it */
  if (f === 'fiat') return txs.filter(x => !x.asset && !String(x.type || '').startsWith('CRYPTO'));
  if (f === 'crypto') return txs.filter(x => x.asset || String(x.type || '').startsWith('CRYPTO'));
  if (f === 'pending') return txs.filter(x => txState(x.status) === 'pending');
  if (f === 'failed') return txs.filter(x => txState(x.status) === 'failed');
  return txs;
}
function historyListHtml(f){
  const all = visibleTransactions(Runtime.transactions || []);
  if (!all.length && !Runtime.ctx) return skeletonRows(5);                 /* data not loaded yet */
  const txs = historyFilter(all, f || 'all');
  if (!txs.length) return all.length ? emptyState('search', t('ds.nohist_title'), t('ds.nofilter_body')) : emptyState('history', t('ds.nohist_title'), t('ds.nohist_body'));
  return txGroupedHtml(txs, false);
}
Object.assign(TR.en, { 'hist.q':'Name, number, reference or amount', 'hist.period':'Period', 'hist.dir':'Direction', 'hist.p.all':'All dates', 'hist.p.today':'Today', 'hist.p.7d':'7 days', 'hist.p.30d':'30 days', 'hist.p.month':'This month', 'hist.d.all':'In and out', 'hist.d.in':'Received', 'hist.d.out':'Sent' });
Object.assign(TR.fr, { 'hist.q':'Nom, numéro, référence ou montant', 'hist.period':'Période', 'hist.dir':'Sens', 'hist.p.all':'Toutes les dates', 'hist.p.today':'Aujourd’hui', 'hist.p.7d':'7 jours', 'hist.p.30d':'30 jours', 'hist.p.month':'Ce mois-ci', 'hist.d.all':'Entrées et sorties', 'hist.d.in':'Reçues', 'hist.d.out':'Envoyées' });
Object.assign(TR.ar, { 'hist.q':'الاسم أو الرقم أو المرجع أو المبلغ', 'hist.period':'الفترة', 'hist.dir':'الاتجاه', 'hist.p.all':'كل التواريخ', 'hist.p.today':'اليوم', 'hist.p.7d':'7 أيام', 'hist.p.30d':'30 يوماً', 'hist.p.month':'هذا الشهر', 'hist.d.all':'الوارد والصادر', 'hist.d.in':'المستلمة', 'hist.d.out':'المرسلة' });
Object.assign(TR.en, { 'hx.q':'Search', 'hx.all':'All', 'hx.in':'Received', 'hx.out':'Sent' });
Object.assign(TR.fr, { 'hx.q':'Rechercher', 'hx.all':'Tout', 'hx.in':'Reçues', 'hx.out':'Envoyées' });
Object.assign(TR.ar, { 'hx.q':'بحث', 'hx.all':'الكل', 'hx.in':'المستلمة', 'hx.out':'المرسلة' });
/* 17.4.0 (owner, 28/11: « refais l'historique, tout nouveau look, regarde comment font les autres »). What the leading apps do and what is applied:
   one search field with the period inside it (a sheet to choose), ONE row of tabs (All · Received · Sent · In progress · Failed) instead of three rows,
   chronological list grouped by day, received amounts in the green of gains with a « + », sent ones in the page ink with a « − », and a status shown
   only when it needs attention (in progress, failed). Same data, same receipt on tap. */
const HX_TABS = [['all', 'hx.all'], ['in', 'hx.in'], ['out', 'hx.out'], ['pending', 'filter.pending'], ['failed', 'filter.failed']];
function hxTabOn(k){ return k === 'in' || k === 'out' ? HIST.dir === k && HIST.st === 'all' : k === 'all' ? HIST.dir === 'all' && HIST.st === 'all' : HIST.st === k; }
function renderHistory(){
  return refTop(t('nav.history'), false) +
    '<div class="screen-body ds-hist hx" style="padding-top:0">' +
      '<div class="field-box hist-search hx-search"><span class="hist-s-ic" aria-hidden="true">' + icon('search', 18) + '</span>' +
        '<input id="hist-q" type="search" enterkeyhint="search" autocomplete="off" spellcheck="false" placeholder="' + escapeHtml(t('hx.q')) + '" aria-label="' + escapeHtml(t('hist.q')) + '">' +
        '<button type="button" class="hx-period" data-hx-period aria-haspopup="dialog" aria-label="' + escapeHtml(t('hist.period')) + '"><span>' + escapeHtml(t('hist.p.' + HIST.period)) + '</span>' + '<i class="hx-caret" aria-hidden="true"></i></button></div>' +
      '<div class="chips hx-tabs" role="group" aria-label="' + escapeHtml(t('nav.history')) + '">' +
        HX_TABS.map(([k, key]) => '<button class="chip" data-hf="' + k + '" aria-pressed="' + (hxTabOn(k) ? 'true' : 'false') + '">' + escapeHtml(t(key)) + '</button>').join('') + '</div>' +
      '<div id="history-list" aria-live="polite">' + historyListHtml('all') + '</div>' +
    '</div>';
}
function hxRedraw(){ const l = document.getElementById('history-list'); if (l) l.innerHTML = historyListHtml('all'); }
function hxWire(root){
  root.querySelectorAll('[data-hf]').forEach(b => { b.onclick = () => {
    const k = b.getAttribute('data-hf');
    if (k === 'in' || k === 'out'){ HIST.dir = k; HIST.st = 'all'; } else if (k === 'all'){ HIST.dir = 'all'; HIST.st = 'all'; } else { HIST.dir = 'all'; HIST.st = k; }
    root.querySelectorAll('[data-hf]').forEach(c => c.setAttribute('aria-pressed', c === b ? 'true' : 'false'));
    hxRedraw();
  }; });
  const pb = root.querySelector('[data-hx-period]');
  if (pb) pb.onclick = () => {
    const rows = ['all', 'today', '7d', '30d', 'month'].map(p => '<button type="button" class="settings-row hx-prow" data-hx-p="' + p + '" aria-pressed="' + (HIST.period === p) + '"><div class="settings-row-body"><div class="settings-row-title">' + escapeHtml(t('hist.p.' + p)) + '</div></div>' + (HIST.period === p ? '<span class="hx-tick">' + icon('check', 18) + '</span>' : '') + '</button>').join('');
    const close = R.overlay.open('<div class="omx-sheet hx-sheet"><h2>' + escapeHtml(t('hist.period')) + '</h2><div class="settings-group">' + rows + '</div></div>', { kind: 'sheet' });
    document.querySelectorAll('#ov-root [data-hx-p]').forEach(r => { r.onclick = () => {
      HIST.period = r.getAttribute('data-hx-p'); const lb = pb.querySelector('span'); if (lb) lb.textContent = t('hist.p.' + HIST.period);
      pb.classList.toggle('on', HIST.period !== 'all'); try { close(); } catch(e){ /* rien */ } hxRedraw(); }; });
  };
  if (pb) pb.classList.toggle('on', HIST.period !== 'all');
}
if (typeof R !== 'undefined' && R.on) R.on(info => { if (info && info.id === 'history' && info.el) try { hxWire(info.el); } catch(e){ console.error('[history]', e); } });
