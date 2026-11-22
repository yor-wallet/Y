'use strict';

/* ============================================================
   OM WALLET 14.2 — ENVOI INTERNE (crypto, entre utilisateurs OM Wallet)
   transfer_crypto (code PIN vérifié par le serveur) ENREGISTRE l'envoi : le montant de l'expéditeur est réservé, le destinataire
   n'est PAS crédité. Seul l'administrateur confirme (Admin Control › Transactions à confirmer) : crédit, heure exacte, un e-mail.
   L'écran ne montre jamais « reçu » ou « crédité » avant que le serveur l'ait fait ; il suit le statut réel (PENDING → CONFIRMED / REJECTED).
   ============================================================ */
Object.assign(TR.en, {
  'si.short':'Send','si.title':'Send to an OM Wallet user','si.lead':'Crypto to another OM Wallet account.',
  'si.to':'Recipient’s Wallet ID','si.toPh':'e.g. FRD-A1B2C3','si.found':'Recipient','si.nf':'No active OM Wallet account has this ID.','si.self':'This is your own Wallet ID.','si.looking':'Searching…',
  'si.asset':'Crypto to send','si.none':'No crypto balance to send','si.noneD':'You need an available crypto balance to send.','si.note':'Note (optional)',
  'si.review':'Check your sending','si.go':'Send','si.rule':'The amount is set aside for this sending while it is in progress.',
  'si.s.SUBMIT':'Recording your sending…','si.s.PENDING':'In progress','si.s.CONFIRMED':'Transfer confirmed','si.s.REJECTED':'Refused — the amount was returned to your balance','si.s.FAILED':'Not sent',
  'si.st.rec':'Submitted','si.st.wait':'In progress','si.st.done':'Confirmed','si.again':'Back to the form','si.done':'Back to Crypto',
  'si.e.recipient_not_found':'No active OM Wallet account has this ID.','si.e.self_transfer':'You cannot send to yourself.','si.e.insufficient_balance':'Insufficient available balance.',
  'si.e.unsupported_asset_network':'This crypto is not available on this network.','si.e.pin_required':'Confirm with your code.','si.e.sender_inactive':'Your account cannot send.',
  'si.e.invalid_amount':'The amount is not valid.','si.e.unknown':'The sending could not be recorded.','si.e.uncertain':'No answer from the server. Check Activity before trying again: the same sending is never counted twice.'
});
Object.assign(TR.fr, {
  'si.short':'Envoyer','si.title':'Envoyer à un utilisateur OM Wallet','si.lead':'Crypto vers un autre compte OM Wallet.',
  'si.to':'Wallet ID du destinataire','si.toPh':'ex. FRD-A1B2C3','si.found':'Destinataire','si.nf':'Aucun compte OM Wallet actif n’a cet identifiant.','si.self':'C’est votre propre Wallet ID.','si.looking':'Recherche…',
  'si.asset':'Crypto à envoyer','si.none':'Aucun solde crypto à envoyer','si.noneD':'Un envoi nécessite un solde crypto disponible.','si.note':'Note (facultatif)',
  'si.review':'Vérifiez votre envoi','si.go':'Envoyer','si.rule':'Le montant est mis de côté pendant le traitement de cet envoi.',
  'si.s.SUBMIT':'Enregistrement de votre envoi…','si.s.PENDING':'En cours','si.s.CONFIRMED':'Transfert confirmé','si.s.REJECTED':'Refusé — le montant est revenu sur votre solde','si.s.FAILED':'Non envoyé',
  'si.st.rec':'Soumis','si.st.wait':'En cours','si.st.done':'Confirmé','si.again':'Retour au formulaire','si.done':'Retour à Crypto',
  'si.e.recipient_not_found':'Aucun compte OM Wallet actif n’a cet identifiant.','si.e.self_transfer':'Vous ne pouvez pas vous envoyer à vous-même.','si.e.insufficient_balance':'Solde disponible insuffisant.',
  'si.e.unsupported_asset_network':'Cette crypto n’est pas disponible sur ce réseau.','si.e.pin_required':'Confirmez avec votre code.','si.e.sender_inactive':'Votre compte ne peut pas envoyer.',
  'si.e.invalid_amount':'Le montant n’est pas valide.','si.e.unknown':'L’envoi n’a pas pu être enregistré.','si.e.uncertain':'Aucune réponse du serveur. Vérifiez l’Activité avant de réessayer : le même envoi n’est jamais compté deux fois.'
});
Object.assign(TR.ar, {
  'si.short':'إرسال','si.title':'إرسال إلى مستخدم OM Wallet','si.lead':'عملات رقمية إلى حساب OM Wallet آخر.',
  'si.to':'معرّف Wallet ID للمستلم','si.toPh':'مثال FRD-A1B2C3','si.found':'المستلم','si.nf':'لا يوجد حساب OM Wallet نشط بهذا المعرّف.','si.self':'هذا معرّفك أنت.','si.looking':'جارٍ البحث…',
  'si.asset':'العملة المراد إرسالها','si.none':'لا يوجد رصيد رقمي للإرسال','si.noneD':'يتطلب الإرسال رصيداً رقمياً متاحاً.','si.note':'ملاحظة (اختياري)',
  'si.review':'راجع عملية الإرسال','si.go':'إرسال','si.rule':'يُحجز المبلغ لهذا الإرسال أثناء المعالجة.',
  'si.s.SUBMIT':'جارٍ تسجيل الإرسال…','si.s.PENDING':'قيد التنفيذ','si.s.CONFIRMED':'تم تأكيد التحويل','si.s.REJECTED':'مرفوض — أُعيد المبلغ إلى رصيدك','si.s.FAILED':'لم يُرسل',
  'si.st.rec':'تم الإرسال','si.st.wait':'قيد التنفيذ','si.st.done':'تم التأكيد','si.again':'العودة إلى النموذج','si.done':'العودة إلى العملات',
  'si.e.recipient_not_found':'لا يوجد حساب OM Wallet نشط بهذا المعرّف.','si.e.self_transfer':'لا يمكنك الإرسال إلى نفسك.','si.e.insufficient_balance':'الرصيد المتاح غير كافٍ.',
  'si.e.unsupported_asset_network':'هذه العملة غير متاحة على هذه الشبكة.','si.e.pin_required':'أكّد برمزك.','si.e.sender_inactive':'لا يمكن لحسابك الإرسال.',
  'si.e.invalid_amount':'المبلغ غير صحيح.','si.e.unknown':'تعذّر تسجيل الإرسال.','si.e.uncertain':'لا يوجد رد من الخادم. تحقق من النشاط قبل إعادة المحاولة: لن يُحتسب الإرسال نفسه مرتين أبداً.'
});

const OMXSend = (() => {
  const S = { f: {}, who: null, look: 0, review: null, done: null, pollT: 0 };
  const top = title => '<div class="topbar omx-top"><button class="topbar-back" data-action="back" aria-label="' + escapeHtml(t('ui.back')) + '"><span class="dir-flip" style="display:inline-flex">' + icon('back', 20) + '</span></button>' +
    '<span class="topbar-title">' + escapeHtml(title) + '</span><span style="width:calc(44px*var(--ui))"></span></div>';
  const errText = e => { const m = String(e && (e.message || e.code) || e || ''); const k = (m.match(/[a-z_]{5,}/g) || []).find(x => TR.en['si.e.' + x]); return t(k ? 'si.e.' + k : 'si.e.unknown'); };
  const isNetErr = e => { const m = String(e && e.message || e || ''); return /Failed to fetch|NetworkError|network|timeout|aborted|Load failed/i.test(m) && !/[a-z]+_[a-z_]+/.test(m); };
  /* the server keeps YOR-XXXXXX; the app shows FRD-XXXXXX; a bare code is accepted too */
  const toServerId = v => { const s = String(v || '').trim().toUpperCase().replace(/\s+/g, ''); if (!s) return ''; const n = normId(s); return /^YOR-/.test(n) ? n : 'YOR-' + n.replace(/^-+/, ''); };
  const myId = () => String((Runtime.ctx && Runtime.ctx.yorId) || (Runtime.profile && (Runtime.profile.yorId || Runtime.profile.yor_id)) || '').toUpperCase();
  const sources = () => (Runtime.wallets || []).filter(w => Number(w.availableBalance) > 0).map(w => ({ key: w.asset + '/' + w.network, asset: String(w.asset).toUpperCase(), network: w.network, avail: Number(w.availableBalance) }));

  function renderForm(){
    const list = sources(), f = S.f;
    if (!list.length) return top(t('si.title')) + '<div class="screen-body omx-page"><section class="omx-card omx-block big">' + icon('crypto', 36) + '<b>' + escapeHtml(t('si.none')) + '</b><p>' + escapeHtml(t('si.noneD')) + '</p></section></div>';
    if (!f.src || !list.some(x => x.key === f.src)) f.src = list[0].key;
    const cur = list.find(x => x.key === f.src), n = OMX_NETWORKS[cur.network] || { name: cur.network, std: '' };
    const who = S.who;
    return top(t('si.title')) + '<div class="screen-body omx-page wd-form"><p class="omx-lead">' + escapeHtml(t('si.lead')) + '</p>' +
      '<section class="omx-card wd-fields"><label for="si-to">' + escapeHtml(t('si.to')) + '</label><input id="si-to" class="input ltr" dir="ltr" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' + escapeHtml(t('si.toPh')) + '" value="' + escapeHtml(f.to || '') + '">' +
        '<div id="si-who" aria-live="polite">' + (who && who.name ? '<div class="si-who">' + icon('user', 18) + '<span>' + escapeHtml(t('si.found')) + '</span><b>' + escapeHtml(who.name) + '</b></div>' : '') + '</div><p class="wd-err" id="si-e-to" role="alert">' + escapeHtml(who && who.err ? who.err : '') + '</p></section>' +
      '<section class="omx-card omx-sec"><div class="omx-sh"><h2>' + escapeHtml(t('si.asset')) + '</h2></div><div class="omx-grid">' +
        list.map(x => '<button type="button" class="omx-pick' + (x.key === f.src ? ' on' : '') + '" data-si-src="' + escapeHtml(x.key) + '" aria-pressed="' + (x.key === f.src) + '">' + omxLogo(x.asset, 34) + '<b>' + escapeHtml(x.asset) + '</b><small class="ltr">' + escapeHtml((OMX_NETWORKS[x.network] || { std: x.network }).std || x.network) + '</small></button>').join('') + '</div></section>' +
      '<section class="omx-card wd-amt"><label for="si-amt">' + escapeHtml(t('wd.amount')) + '</label><div class="wd-amt-in"><input id="si-amt" inputmode="decimal" autocomplete="off" placeholder="0" value="' + escapeHtml(f.amount || '') + '"><span>' + escapeHtml(cur.asset) + '</span><button type="button" class="wd-max" data-si="max">' + escapeHtml(t('wd.max')) + '</button></div>' +
        '<div class="wd-meta"><span>' + escapeHtml(t('wd.avail')) + ' <b class="ltr">' + escapeHtml(omxQty(cur.avail, cur.asset)) + '</b></span><span>' + escapeHtml(n.name) + '</span></div><p class="wd-err" id="si-e-amt" role="alert"></p>' +
        '<label for="si-note">' + escapeHtml(t('si.note')) + '</label><input id="si-note" class="input" maxlength="140" value="' + escapeHtml(f.note || '') + '"></section>' +
      '<p class="omx-info">' + icon('shield', 18) + '<span>' + escapeHtml(t('si.rule')) + '</span></p>' +
      '<button class="btn btn-primary btn-block" id="si-next">' + escapeHtml(t('wd.continue')) + '</button></div>';
  }
  async function lookup(force){
    const id = toServerId(S.f.to), my = myId(), seq = ++S.look, box = document.getElementById('si-who'), err = document.getElementById('si-e-to');
    if (!id || id.length < 8){ S.who = null; if (box) box.innerHTML = ''; if (err) err.textContent = ''; return null; }
    if (!force && S.who && S.who.id === id) return S.who;
    if (my && id === my){ S.who = { id, err: t('si.self') }; if (box) box.innerHTML = ''; if (err) err.textContent = S.who.err; return S.who; }
    if (box) box.innerHTML = '<small class="omx-muted">' + escapeHtml(t('si.looking')) + '</small>';
    let r = null, failed = false;
    try { const { data, error } = await sb.rpc('find_user_by_yor_id', { p_yor_id: id }); if (error) throw error; r = (Array.isArray(data) ? data[0] : data) || null; } catch(e){ failed = true; }
    if (seq !== S.look) return S.who;
    S.who = r ? { id, name: r.display_name || dispId(r.yor_id) } : { id, err: failed ? t('si.e.unknown') : t('si.nf') };
    if (box) box.innerHTML = S.who.name ? '<div class="si-who">' + icon('user', 18) + '<span>' + escapeHtml(t('si.found')) + '</span><b>' + escapeHtml(S.who.name) + '</b></div>' : '';
    if (err) err.textContent = S.who.err || '';
    return S.who;
  }
  async function next(){
    const f = S.f, cur = sources().find(x => x.key === f.src), who = await lookup(false);
    const raw = String(f.amount || '').trim().replace(',', '.'), amt = Number(raw);
    const eAmt = !(amt > 0) || !/^\d+(\.\d{0,8})?$/.test(raw) ? t('wd.err.amount') : !cur || amt > cur.avail + 1e-12 ? t('wd.err.funds') : '';
    const ea = document.getElementById('si-e-amt'); if (ea) ea.textContent = eAmt;
    if (!who || !who.name){ const et = document.getElementById('si-e-to'); if (et && !et.textContent) et.textContent = t('si.nf'); return; }
    if (eAmt) return;
    S.review = { to: who.id, name: who.name, asset: cur.asset, network: cur.network, amount: amt, note: String(f.note || '').trim().slice(0, 140) || null, idem: uuid() };
    R.go('send-internal-review');
  }
  function renderReview(){
    const r = S.review; if (!r){ setTimeout(() => R.go('send-internal', { replace: true }), 0); return ''; }
    const n = OMX_NETWORKS[r.network] || { name: r.network, std: '' }, k = OMXMarket.get(r.asset);
    const line = (a, b, cls) => '<div class="' + (cls || '') + '"><dt>' + escapeHtml(a) + '</dt><dd class="ltr" dir="auto">' + b + '</dd></div>';
    return top(t('si.review')) + '<div class="screen-body omx-page wd-form"><section class="omx-card wd-review"><div class="wd-rv-amt ltr">' + omxLogo(r.asset, 34) + escapeHtml(omxQty(r.amount, r.asset)) + '</div>' +
      (k ? '<p class="wd-rv-usd ltr">≈ ' + escapeHtml(omxUsd(r.amount * k.price)) + '</p>' : '') +
      '<dl class="wd-sum">' + line(t('si.found'), escapeHtml(r.name)) + line('Wallet ID', escapeHtml(dispId(r.to))) + line(t('wd.network'), omxNetLogo(r.network, 20) + ' ' + escapeHtml(n.name + (n.std ? ' (' + n.std + ')' : ''))) +
        line(t('wd.fee'), escapeHtml('0 ' + r.asset)) + (r.note ? line(t('si.note'), escapeHtml(r.note)) : '') + line(t('wd.total'), escapeHtml(omxQty(r.amount, r.asset)), 'tot') + '</dl></section>' +
      '<p class="omx-info">' + icon('shield', 18) + '<span>' + escapeHtml(t('si.rule')) + '</span></p>' +
      '<button class="btn btn-primary btn-block" id="si-go">' + icon('lock', 18) + '<span>' + escapeHtml(t('si.go')) + '</span></button></div>';
  }
  async function submit(btn){
    const r = S.review; if (!r || r.busy) return;
    if (navigator.onLine === false){ toast(t('px.offlineSend'), 'error'); return; }
    r.busy = true; UIKit.loading(btn, true);
    const pin = await PinEngine.authorize();
    if (!pin.ok){ r.busy = false; UIKit.loading(btn, false); if (pin.error) toast(t(pin.error), 'error'); return; }
    S.done = { submitting: true, review: r };
    R.go('send-internal-done', { reset: true });
    let res;
    try { res = await sb.rpc('transfer_crypto', { p_to_yor_id: r.to, p_asset: r.asset, p_network: r.network, p_amount: r.amount, p_note: r.note, p_idempotency_key: r.idem, p_pin_grant: pin.grant }); }
    catch(e){ res = { error: e }; }
    r.busy = false;
    if (res.error || !res.data || res.data.ok === false){
      const e = res.error || (res.data && res.data.error) || 'unknown';
      S.done = { review: r, error: isNetErr(e) ? t('si.e.uncertain') : errText(e), uncertain: isNetErr(e) };
    } else {
      S.done = { review: r, id: res.data.transaction_id, reference: res.data.reference, status: String(res.data.status || 'PENDING').toUpperCase() };
      S.f = {}; S.who = null;
      try { await AuthEngine.hydrateRuntime(); } catch(e){}
    }
    if (R.current() === 'send-internal-done') R.go('send-internal-done', { force: true });
  }
  /* the REAL status, read from the account's transactions (refreshed live when OM Wallet confirms or refuses) */
  function liveStatus(){
    const d = S.done; if (!d || !d.id) return d && d.status;
    const tx = (Runtime.transactions || []).find(x => x.id === d.id);
    if (!tx) return d.status;
    const s = String(tx.status || '').toUpperCase();
    return s === 'SUCCESS' || s === 'CONFIRMED' ? 'CONFIRMED' : s === 'REJECTED' || s === 'REFUNDED' ? 'REJECTED' : 'PENDING';
  }
  function renderDone(){
    const d = S.done; if (!d){ setTimeout(() => R.go('wallet', { replace: true }), 0); return ''; }
    const r = d.review || {}, st = d.submitting ? 'SUBMIT' : d.error ? 'FAILED' : liveStatus();
    const k = { SUBMIT: 'prep', PENDING: 'wait', CONFIRMED: 'done', REJECTED: 'fail', FAILED: 'fail' }[st] || 'wait';
    const g = { prep: '<circle class="a-ring" cx="40" cy="40" r="30"/>', wait: '<circle class="a-face" cx="40" cy="40" r="30"/><path class="a-hand" d="M40 40V22"/><path class="a-hand2" d="M40 40h12"/>',
      done: '<circle class="a-face ok" cx="40" cy="40" r="30"/><path class="a-check" pathLength="1" d="M27 41l9 9 18-20"/>', fail: '<circle class="a-face ko" cx="40" cy="40" r="30"/><path class="a-x" pathLength="1" d="M29 29l22 22M51 29L29 51"/>' }[k];
    const at = { SUBMIT: 0, PENDING: 1, CONFIRMED: 3 }[st], fail = st === 'REJECTED' || st === 'FAILED';
    const steps = ['si.st.rec', 'si.st.wait', 'si.st.done'].map((s, i) => {
      let c = 'todo'; if (fail) c = i === 0 && st === 'REJECTED' ? 'ok' : i === (st === 'REJECTED' ? 1 : 0) ? 'ko' : 'todo'; else if (at != null) c = i < at ? 'ok' : i === at ? 'now' : 'todo';
      return '<li class="wd-step ' + c + '"' + (c === 'now' ? ' aria-current="step"' : '') + '><i aria-hidden="true"></i><span>' + escapeHtml(t(s)) + '</span></li>'; }).join('');
    const amt = r.asset ? omxQty(r.amount, r.asset) : '';
    return top(t('si.title')) + '<div class="screen-body omx-page wd-track"><section class="omx-card wd-hero s-' + (st === 'CONFIRMED' ? 'success' : fail ? 'failed' : 'pending') + '" aria-live="polite">' +
        '<div class="wd-anim k-' + k + '" aria-hidden="true"><svg viewBox="0 0 80 80" width="96" height="96">' + g + '</svg></div><div class="wd-hamt ltr">' + escapeHtml(amt) + '</div><b>' + escapeHtml(t('si.s.' + st)) + '</b>' + (st === 'PENDING' || st === 'SUBMIT' ? '<div class="omx-prog" aria-hidden="true"><i></i><i></i><i></i></div>' : '') +
        (d.error ? '<p class="wd-msg">' + escapeHtml(d.error) + '</p>' : '') + '</section>' +
      (d.uncertain ? '' : '<ol class="wd-steps si-steps">' + steps + '</ol>') +
      '<section class="omx-card"><dl class="wd-sum">' + (r.name ? '<div><dt>' + escapeHtml(t('si.found')) + '</dt><dd dir="auto">' + escapeHtml(r.name) + ' <small class="ltr">' + escapeHtml(dispId(r.to)) + '</small></dd></div>' : '') +
        (d.reference ? '<div><dt>' + escapeHtml(t('wd.ref')) + '</dt><dd class="ltr">' + escapeHtml(d.reference) + '</dd></div>' : '') +
        (r.network ? '<div><dt>' + escapeHtml(t('wd.network')) + '</dt><dd>' + escapeHtml((OMX_NETWORKS[r.network] || { name: r.network }).name) + '</dd></div>' : '') + '</dl></section>' +
      '<div class="omx-btns">' + (d.error && !d.uncertain ? '<button class="btn btn-secondary" data-si="again">' + escapeHtml(t('si.again')) + '</button>' : '') +
        '<button class="btn btn-primary" data-si="home">' + escapeHtml(t('si.done')) + '</button></div></div>';
  }
  function bind(info){
    const id = info.id, el = info.el;
    if (id === 'send-internal'){
      const f = S.f, to = el.querySelector('#si-to'), a = el.querySelector('#si-amt'), nt = el.querySelector('#si-note'), nx = el.querySelector('#si-next');
      let tm = 0;
      if (to){ to.oninput = () => { f.to = to.value; clearTimeout(tm); tm = setTimeout(() => lookup(false), 450); }; to.onblur = () => lookup(false); }
      if (a) a.oninput = () => { f.amount = a.value; };
      if (nt) nt.oninput = () => { f.note = nt.value; };
      if (nx) nx.onclick = () => next();
    }
    if (id === 'send-internal-review'){ const go = el.querySelector('#si-go'); if (go) go.onclick = () => submit(go); }
    if (id === 'send-internal-done'){
      clearInterval(S.pollT);
      if (S.done && S.done.id && liveStatus() === 'PENDING'){
        S.pollT = setInterval(async () => {
          if (document.visibilityState === 'hidden' || R.current() !== 'send-internal-done') return;
          const before = liveStatus(); try { await AuthEngine.hydrateRuntime(); } catch(e){ return; }
          if (liveStatus() !== before && R.current() === 'send-internal-done') R.go('send-internal-done', { force: true });
        }, 5000);
        R.onLeave(() => clearInterval(S.pollT));
      }
    }
    if (['send-internal', 'send-internal-done'].indexOf(id) === -1 || el.__si) return;
    el.__si = true;
    el.addEventListener('click', e => {
      const s = e.target.closest && e.target.closest('[data-si-src]');
      if (s){ S.f.src = s.getAttribute('data-si-src'); S.f.amount = ''; R.go('send-internal', { force: true }); return; }
      const b = e.target.closest && e.target.closest('[data-si]'); if (!b) return;
      const a = b.getAttribute('data-si');
      if (a === 'max'){ const cur = sources().find(x => x.key === S.f.src); if (!cur) return; const dp = (omxAsset(cur.asset) || { dp: 8 }).dp; const v = Math.floor(cur.avail * Math.pow(10, dp)) / Math.pow(10, dp); S.f.amount = v > 0 ? String(v) : ''; const i = el.querySelector('#si-amt'); if (i) i.value = S.f.amount; }
      else if (a === 'again'){ R.go('send-internal', { replace: true }); }
      else if (a === 'home'){ R.go('wallet', { reset: true }); }
    });
  }
  /* live: when OM Wallet confirms or refuses, a notification arrives, the data is reloaded and this screen is redrawn (auth.js onLive) */
  function start(){ S.f = {}; S.who = null; R.go('send-internal'); }
  R.register({ 'send-internal': renderForm, 'send-internal-review': renderReview, 'send-internal-done': renderDone });
  R.on(info => { try { bind(info); } catch(e){ console.error('[send-internal]', e); } });
  return { start, toServerId, state: S };
})();
