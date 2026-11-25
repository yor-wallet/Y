'use strict';

/* ============================================================
   OM WALLET 15.0 — TRANSFERT DE CRÉDIT (Omantel · Ooredoo · Vodafone)
   - la personne choisit l'opérateur, saisit un numéro omanais et un montant en rials, confirme avec son code ;
   - la fonction serveur credit-topup met le montant de côté, demande le transfert au fournisseur et NE CONFIRME que sur sa réponse
     « réussi » avec son vrai TID : confirmation immédiate, SANS administrateur, et SMS à l'expéditeur (envoyé par le serveur) ;
   - réponse « refusé » : le montant est rendu ; réponse inconnue : l'opération reste « En cours » (montant mis de côté), jamais
     « confirmée » ni « refusée » à l'aveugle. L'écran suit le statut réel lu sur le compte.
   ============================================================ */
Object.assign(TR.en, {
  'tp.short':'Credit','tp.title':'Credit transfer','tp.lead':'Send mobile credit to an Omani number. Paid from your OMR balance.',
  'tp.op':'Operator','tp.phone':'Phone number','tp.phonePh':'e.g. 9288 8435','tp.amount':'Amount (OMR)','tp.avail':'Available','tp.review':'Check the transfer','tp.go':'Send credit',
  'tp.rule':'The amount is set aside while the operator processes the transfer. It is returned to you if the transfer fails.',
  'tp.to':'To','tp.opL':'Operator','tp.total':'Total',
  'tp.s.SUBMIT':'Sending the transfer…','tp.s.PENDING':'In progress','tp.s.CONFIRMED':'Transfer confirmed','tp.s.REJECTED':'Failed — the amount was returned to your balance','tp.s.FAILED':'Not sent',
  'tp.st.rec':'Submitted','tp.st.wait':'In progress','tp.st.done':'Confirmed','tp.again':'Back to the form','tp.done':'Back to Home',
  'tp.msg':'Transfer of {a} OMR to {p} completed. (TID: {tid}).','tp.smsNote':'A confirmation SMS is sent to your phone number.',
  'tp.e.invalid_phone':'Enter a valid Omani mobile number (8 digits starting with 7 or 9).','tp.e.invalid_amount':'The amount is not valid.','tp.e.invalid_operator':'Choose an operator.',
  'tp.e.below_minimum':'The amount is below the minimum for a credit transfer.','tp.e.limit_per_transaction':'The amount is above the limit for one transfer.','tp.e.limit_daily':'Your daily limit for credit transfers is reached.',
  'tp.e.too_many_open':'Too many credit transfers are still in progress.','tp.e.insufficient_balance':'Insufficient available balance.','tp.e.pin_required':'Confirm with your code.',
  'tp.e.sender_inactive':'Your account cannot send.','tp.e.service_unavailable':'This service is not available yet.','tp.e.provider_refused':'The operator did not accept the transfer. Nothing was taken from your balance.',
  'tp.e.unknown':'The transfer could not be recorded.','tp.e.uncertain':'No answer from the server. Check Activity before trying again: the same transfer is never counted twice.'
});
Object.assign(TR.fr, {
  'tp.short':'Crédit','tp.title':'Transfert de crédit','tp.lead':'Envoyez du crédit mobile à un numéro omanais. Payé depuis votre solde en OMR.',
  'tp.op':'Opérateur','tp.phone':'Numéro de téléphone','tp.phonePh':'ex. 9288 8435','tp.amount':'Montant (OMR)','tp.avail':'Disponible','tp.review':'Vérifiez le transfert','tp.go':'Envoyer le crédit',
  'tp.rule':'Le montant est mis de côté pendant que l’opérateur traite le transfert. Il vous est rendu si le transfert échoue.',
  'tp.to':'Vers','tp.opL':'Opérateur','tp.total':'Total',
  'tp.s.SUBMIT':'Envoi du transfert…','tp.s.PENDING':'En cours','tp.s.CONFIRMED':'Transfert confirmé','tp.s.REJECTED':'Échec — le montant est revenu sur votre solde','tp.s.FAILED':'Non envoyé',
  'tp.st.rec':'Soumis','tp.st.wait':'En cours','tp.st.done':'Confirmé','tp.again':'Retour au formulaire','tp.done':'Retour à l’accueil',
  'tp.msg':'Transfert de {a} OMR vers le {p} effectué. (TID : {tid}).','tp.smsNote':'Un SMS de confirmation est envoyé à votre numéro de téléphone.',
  'tp.e.invalid_phone':'Saisissez un numéro mobile omanais valide (8 chiffres commençant par 7 ou 9).','tp.e.invalid_amount':'Le montant n’est pas valide.','tp.e.invalid_operator':'Choisissez un opérateur.',
  'tp.e.below_minimum':'Le montant est inférieur au minimum d’un transfert de crédit.','tp.e.limit_per_transaction':'Le montant dépasse la limite d’un transfert.','tp.e.limit_daily':'Votre limite quotidienne de transferts de crédit est atteinte.',
  'tp.e.too_many_open':'Trop de transferts de crédit sont encore en cours.','tp.e.insufficient_balance':'Solde disponible insuffisant.','tp.e.pin_required':'Confirmez avec votre code.',
  'tp.e.sender_inactive':'Votre compte ne peut pas envoyer.','tp.e.service_unavailable':'Ce service n’est pas encore disponible.','tp.e.provider_refused':'L’opérateur n’a pas accepté le transfert. Rien n’a été prélevé sur votre solde.',
  'tp.e.unknown':'Le transfert n’a pas pu être enregistré.','tp.e.uncertain':'Aucune réponse du serveur. Vérifiez l’Activité avant de réessayer : le même transfert n’est jamais compté deux fois.'
});
Object.assign(TR.ar, {
  'tp.short':'رصيد','tp.title':'تحويل رصيد','tp.lead':'أرسل رصيداً لهاتف عُماني. يُدفع من رصيدك بالريال العُماني.',
  'tp.op':'المشغّل','tp.phone':'رقم الهاتف','tp.phonePh':'مثال 9288 8435','tp.amount':'المبلغ (ريال عُماني)','tp.avail':'المتاح','tp.review':'راجع التحويل','tp.go':'إرسال الرصيد',
  'tp.rule':'يُحجز المبلغ أثناء معالجة المشغّل للتحويل، ويُعاد إليك إذا فشل التحويل.',
  'tp.to':'إلى','tp.opL':'المشغّل','tp.total':'الإجمالي',
  'tp.s.SUBMIT':'جارٍ إرسال التحويل…','tp.s.PENDING':'قيد التنفيذ','tp.s.CONFIRMED':'تم تأكيد التحويل','tp.s.REJECTED':'فشل — أُعيد المبلغ إلى رصيدك','tp.s.FAILED':'لم يُرسل',
  'tp.st.rec':'تم الإرسال','tp.st.wait':'قيد التنفيذ','tp.st.done':'تم التأكيد','tp.again':'العودة إلى النموذج','tp.done':'العودة إلى الرئيسية',
  'tp.msg':'تمت عملية تحويل مبلغ {a} ريال بنجاح إلى الرقم {p}. (TID: {tid}).','tp.smsNote':'تُرسل رسالة SMS للتأكيد إلى رقم هاتفك.',
  'tp.e.invalid_phone':'أدخل رقم هاتف عُماني صحيحاً (8 أرقام تبدأ بـ 7 أو 9).','tp.e.invalid_amount':'المبلغ غير صحيح.','tp.e.invalid_operator':'اختر مشغّلاً.',
  'tp.e.below_minimum':'المبلغ أقل من الحد الأدنى لتحويل الرصيد.','tp.e.limit_per_transaction':'المبلغ أعلى من حد التحويل الواحد.','tp.e.limit_daily':'بلغت حدك اليومي لتحويل الرصيد.',
  'tp.e.too_many_open':'هناك عدد كبير من تحويلات الرصيد قيد التنفيذ.','tp.e.insufficient_balance':'الرصيد المتاح غير كافٍ.','tp.e.pin_required':'أكّد برمزك.',
  'tp.e.sender_inactive':'لا يمكن لحسابك الإرسال.','tp.e.service_unavailable':'هذه الخدمة غير متاحة بعد.','tp.e.provider_refused':'لم يقبل المشغّل التحويل. لم يُخصم شيء من رصيدك.',
  'tp.e.unknown':'تعذّر تسجيل التحويل.','tp.e.uncertain':'لا يوجد رد من الخادم. تحقق من النشاط قبل إعادة المحاولة: لن يُحتسب التحويل نفسه مرتين أبداً.'
});
Object.assign(TR.en, { 'op.CREDIT_TOPUP':'Credit transfer' });
Object.assign(TR.fr, { 'op.CREDIT_TOPUP':'Transfert de crédit' });
Object.assign(TR.ar, { 'op.CREDIT_TOPUP':'تحويل رصيد' });

const OMXTopup = (() => {
  const OPS = [['OOREDOO', 'Ooredoo'], ['OMANTEL', 'Omantel'], ['VODAFONE', 'Vodafone']];     /* names only: no operator logo is copied */
  const AMOUNTS = [1, 2, 5, 10];
  const S = { f: { op: 'OOREDOO' }, review: null, done: null, pollT: 0 };
  const top = title => refTop(title);
  const isNetErr = e => { const m = String(e && e.message || e || ''); return /Failed to fetch|NetworkError|network|timeout|aborted|Load failed/i.test(m) && !/[a-z]+_[a-z_]+/.test(m); };
  const errText = c => { const k = String(c || ''); return t(TR.en['tp.e.' + k] ? 'tp.e.' + k : 'tp.e.unknown'); };
  const avail = () => { const a = (typeof mainAccount === 'function' ? mainAccount() : null) || {}; return Number(a.availableBalance != null ? a.availableBalance : a.balance) || 0; };
  const omr = v => CurrencyEngine.format(Number(v), 'OMR');
  /* same normalisation as the server (public._credit_topup_request_impl): 8 digits starting with 7 or 9, typed with or without 968 / +968 / 00968 */
  function phoneOf(raw){
    let d = String(raw || '').replace(/[^0-9]/g, '');
    if (/^00968[79][0-9]{7}$/.test(d)) d = d.slice(2);
    if (/^[79][0-9]{7}$/.test(d)) d = '968' + d;
    return /^968[79][0-9]{7}$/.test(d) ? d : '';
  }
  const phoneShow = p => '+' + p.slice(0, 3) + ' ' + p.slice(3, 7) + ' ' + p.slice(7);

  function renderForm(){
    const f = S.f, av = avail();
    return top(t('tp.title')) + '<div class="screen-body omx-page wd-form"><p class="omx-lead">' + escapeHtml(t('tp.lead')) + '</p>' +
      '<section class="omx-card omx-sec"><div class="omx-sh"><h2>' + escapeHtml(t('tp.op')) + '</h2></div><div class="omx-grid" role="group" aria-label="' + escapeHtml(t('tp.op')) + '">' +
        OPS.map(o => '<button type="button" class="omx-pick' + (o[0] === f.op ? ' on' : '') + '" data-tp-op="' + o[0] + '" aria-pressed="' + (o[0] === f.op) + '"><b>' + o[1] + '</b></button>').join('') + '</div></section>' +
      '<section class="omx-card wd-fields"><label for="tp-phone">' + escapeHtml(t('tp.phone')) + '</label><div class="tp-ph ltr" dir="ltr"><span aria-hidden="true">+968</span><input id="tp-phone" class="input ltr" dir="ltr" type="tel" inputmode="tel" autocomplete="off" placeholder="' + escapeHtml(t('tp.phonePh')) + '" value="' + escapeHtml(f.phone || '') + '"></div>' +
        '<p class="wd-err" id="tp-e-phone" role="alert"></p></section>' +
      '<section class="omx-card wd-amt"><label for="tp-amt">' + escapeHtml(t('tp.amount')) + '</label><div class="wd-amt-in"><input id="tp-amt" inputmode="decimal" autocomplete="off" placeholder="0" value="' + escapeHtml(f.amount || '') + '"><span>OMR</span></div>' +
        '<div class="tp-chips" role="group">' + AMOUNTS.map(a => '<button type="button" class="chip" data-tp-amt="' + a + '">' + a + '</button>').join('') + '</div>' +
        '<div class="wd-meta"><span>' + escapeHtml(t('tp.avail')) + ' <b class="ltr">' + escapeHtml(omr(av)) + '</b></span></div><p class="wd-err" id="tp-e-amt" role="alert"></p></section>' +
      '<p class="omx-info">' + icon('shield', 18) + '<span>' + escapeHtml(t('tp.rule')) + '</span></p>' +
      '<button class="btn btn-primary btn-block" id="tp-next">' + escapeHtml(t('wd.continue')) + '</button></div>';
  }
  function next(){
    const f = S.f, p = phoneOf(f.phone), raw = String(f.amount || '').trim().replace(',', '.'), amt = Number(raw);
    const eP = p ? '' : t('tp.e.invalid_phone');
    const eA = !(amt > 0) || !/^\d+(\.\d{0,3})?$/.test(raw) ? t('tp.e.invalid_amount') : amt > avail() + 1e-9 ? t('tp.e.insufficient_balance') : '';
    const a = document.getElementById('tp-e-amt'), b = document.getElementById('tp-e-phone');
    if (a) a.textContent = eA; if (b) b.textContent = eP;
    if (eP || eA) return;
    S.review = { op: f.op, opName: (OPS.find(o => o[0] === f.op) || [])[1] || f.op, phone: p, amount: Math.round(amt * 1000) / 1000, idem: uuid() };
    R.go('topup-review');
  }
  function renderReview(){
    const r = S.review; if (!r){ setTimeout(() => R.go('topup', { replace: true }), 0); return ''; }
    const line = (a, b, cls) => '<div class="' + (cls || '') + '"><dt>' + escapeHtml(a) + '</dt><dd class="ltr" dir="auto">' + b + '</dd></div>';
    return top(t('tp.review')) + '<div class="screen-body omx-page wd-form"><section class="omx-card wd-review"><div class="wd-rv-amt ltr">' + escapeHtml(omr(r.amount)) + '</div>' +
      '<dl class="wd-sum">' + line(t('tp.opL'), escapeHtml(r.opName)) + line(t('tp.to'), escapeHtml(phoneShow(r.phone))) + line(t('wd.fee'), escapeHtml(omr(0))) + line(t('tp.total'), escapeHtml(omr(r.amount)), 'tot') + '</dl></section>' +
      '<p class="omx-info">' + icon('shield', 18) + '<span>' + escapeHtml(t('tp.rule')) + '</span></p>' +
      '<button class="btn btn-primary btn-block" id="tp-go">' + icon('lock', 18) + '<span>' + escapeHtml(t('tp.go')) + '</span></button></div>';
  }
  /* answer of the Edge function -> { status, ... } or { error } (a network failure is never read as a result) */
  async function call(r, grant){
    let res;
    try { res = await sb.functions.invoke('credit-topup', { body: { operator: r.op, phone: r.phone, amount: r.amount, idempotency_key: r.idem, pin_grant: grant } }); }
    catch(e){ return { error: isNetErr(e) ? 'uncertain' : 'unknown' }; }
    const { data, error } = res || {};
    if (error){
      let j = null, st = 0;
      try { const c = error.context; if (c){ st = c.status; if (typeof c.json === 'function') j = await c.json(); } } catch(x){}
      if (j && j.status === 'REJECTED') return { status: 'REJECTED', id: j.transaction_id, reference: j.reference, note: errText('provider_refused') };
      if (st === 404) return { error: 'service_unavailable' };
      if (!j && isNetErr(error)) return { error: 'uncertain' };
      return { error: (j && j.error) || 'unknown' };
    }
    if (!data || data.ok === false) return { error: (data && data.error) || 'unknown' };
    return { status: String(data.status || 'PENDING').toUpperCase(), id: data.transaction_id, reference: data.reference, tid: data.tid, phone: data.phone, amount: data.amount };
  }
  async function submit(btn){
    const r = S.review; if (!r || r.busy) return;
    if (navigator.onLine === false){ toast(t('px.offlineSend'), 'error'); return; }
    r.busy = true; UIKit.loading(btn, true);
    const pin = await PinEngine.authorize();
    if (!pin.ok){ r.busy = false; UIKit.loading(btn, false); if (pin.error) toast(t(pin.error), 'error'); return; }
    S.done = { submitting: true, review: r };
    R.go('topup-done', { reset: true });
    const out = await call(r, pin.grant);
    r.busy = false;
    if (out.error) S.done = { review: r, error: errText(out.error), uncertain: out.error === 'uncertain' };
    else {
      S.done = { review: r, id: out.id, reference: out.reference, status: out.status, tid: out.tid, phone: out.phone, amount: out.amount, note: out.note };
      if (out.status !== 'REJECTED') S.f = { op: r.op };
      try { await AuthEngine.hydrateRuntime(); } catch(e){}
    }
    if (R.current() === 'topup-done') R.go('topup-done', { force: true });
  }
  /* the REAL status: the server's answer first, then the account's transactions (refreshed live) */
  function liveStatus(){
    const d = S.done; if (!d) return '';
    if (d.status === 'CONFIRMED' || d.status === 'REJECTED') return d.status;
    const tx = d.id ? (Runtime.transactions || []).find(x => x.id === d.id) : null;
    if (!tx) return d.status || 'PENDING';
    const s = String(tx.status || '').toUpperCase();
    return s === 'SUCCESS' || s === 'CONFIRMED' ? 'CONFIRMED' : s === 'REJECTED' || s === 'REFUNDED' ? 'REJECTED' : 'PENDING';
  }
  function renderDone(){
    const d = S.done; if (!d){ setTimeout(() => R.go('home', { replace: true }), 0); return ''; }
    const r = d.review || {}, st = d.submitting ? 'SUBMIT' : d.error ? 'FAILED' : liveStatus();
    const k = { SUBMIT: 'prep', PENDING: 'wait', CONFIRMED: 'done', REJECTED: 'fail', FAILED: 'fail' }[st] || 'wait';
    const g = { prep: '<circle class="a-ring" cx="40" cy="40" r="30"/>', wait: '<circle class="a-face" cx="40" cy="40" r="30"/><path class="a-hand" d="M40 40V22"/><path class="a-hand2" d="M40 40h12"/>',
      done: '<circle class="a-face ok" cx="40" cy="40" r="30"/><path class="a-check" pathLength="1" d="M27 41l9 9 18-20"/>', fail: '<circle class="a-face ko" cx="40" cy="40" r="30"/><path class="a-x" pathLength="1" d="M29 29l22 22M51 29L29 51"/>' }[k];
    const at = { SUBMIT: 0, PENDING: 1, CONFIRMED: 3 }[st], fail = st === 'REJECTED' || st === 'FAILED';
    const steps = ['tp.st.rec', 'tp.st.wait', 'tp.st.done'].map((s, i) => {
      let c = 'todo'; if (fail) c = i === 0 && st === 'REJECTED' ? 'ok' : i === (st === 'REJECTED' ? 1 : 0) ? 'ko' : 'todo'; else if (at != null) c = i < at ? 'ok' : i === at ? 'now' : 'todo';
      return '<li class="wd-step ' + c + '"' + (c === 'now' ? ' aria-current="step"' : '') + '><i aria-hidden="true"></i><span>' + escapeHtml(s === 'tp.st.rec' ? t(s) : t(s)) + '</span></li>'; }).join('');
    const tid = d.tid, msg = st === 'CONFIRMED' && tid ? t('tp.msg').replace('{a}', Number(r.amount).toFixed(3)).replace('{p}', d.phone || r.phone).replace('{tid}', tid) : '';
    return top(t('tp.title')) + '<div class="screen-body omx-page wd-track"><section class="omx-card wd-hero s-' + (st === 'CONFIRMED' ? 'success' : fail ? 'failed' : 'pending') + '" aria-live="polite">' +
        '<div class="wd-anim k-' + k + '" aria-hidden="true"><svg viewBox="0 0 80 80" width="96" height="96">' + g + '</svg></div><div class="wd-hamt ltr">' + escapeHtml(r.amount != null ? omr(r.amount) : '') + '</div><b>' + escapeHtml(t('tp.s.' + st)) + '</b>' +
        (st === 'PENDING' || st === 'SUBMIT' ? '<div class="omx-prog" aria-hidden="true"><i></i><i></i><i></i></div>' : '') +
        (msg ? '<p class="wd-msg" dir="auto" id="tp-msg">' + escapeHtml(msg) + '</p><small class="omx-muted">' + escapeHtml(t('tp.smsNote')) + '</small>' : '') +
        (d.error || d.note ? '<p class="wd-msg">' + escapeHtml(d.error || d.note) + '</p>' : '') + '</section>' +
      (d.uncertain ? '' : '<ol class="wd-steps si-steps">' + steps + '</ol>') +
      '<section class="omx-card"><dl class="wd-sum">' + (r.opName ? '<div><dt>' + escapeHtml(t('tp.opL')) + '</dt><dd>' + escapeHtml(r.opName) + '</dd></div>' : '') +
        (r.phone ? '<div><dt>' + escapeHtml(t('tp.to')) + '</dt><dd class="ltr">' + escapeHtml(phoneShow(r.phone)) + '</dd></div>' : '') +
        (tid ? '<div><dt>TID</dt><dd class="ltr">' + escapeHtml(tid) + '</dd></div>' : '') +
        (d.reference ? '<div><dt>' + escapeHtml(t('wd.ref')) + '</dt><dd class="ltr">' + escapeHtml(d.reference) + '</dd></div>' : '') + '</dl></section>' +
      '<div class="omx-btns">' + (d.error && !d.uncertain ? '<button class="btn btn-secondary" data-tp="again">' + escapeHtml(t('tp.again')) + '</button>' : '') +
        '<button class="btn btn-primary" data-tp="home">' + escapeHtml(t('tp.done')) + '</button></div></div>';
  }
  function bind(info){
    const id = info.id, el = info.el;
    if (id === 'topup'){
      const f = S.f, ph = el.querySelector('#tp-phone'), a = el.querySelector('#tp-amt'), nx = el.querySelector('#tp-next');
      if (ph) ph.oninput = () => { f.phone = ph.value; };
      if (a) a.oninput = () => { f.amount = a.value; };
      if (nx) nx.onclick = () => next();
    }
    if (id === 'topup-review'){ const go = el.querySelector('#tp-go'); if (go) go.onclick = () => submit(go); }
    if (id === 'topup-done'){
      clearInterval(S.pollT);
      if (S.done && !S.done.submitting && !S.done.error && liveStatus() === 'PENDING'){
        S.pollT = setInterval(async () => {
          if (document.visibilityState === 'hidden' || R.current() !== 'topup-done') return;
          const before = liveStatus(); try { await AuthEngine.hydrateRuntime(); } catch(e){ return; }
          if (liveStatus() !== before && R.current() === 'topup-done') R.go('topup-done', { force: true });
        }, 5000);
        R.onLeave(() => clearInterval(S.pollT));
      }
    }
    if (['topup', 'topup-done'].indexOf(id) === -1 || el.__tp) return;
    el.__tp = true;
    el.addEventListener('click', e => {
      const q = sel => e.target.closest && e.target.closest(sel);
      const op = q('[data-tp-op]'); if (op){ S.f.op = op.getAttribute('data-tp-op'); el.querySelectorAll('[data-tp-op]').forEach(b => { const on = b === op; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); return; }
      const am = q('[data-tp-amt]'); if (am){ S.f.amount = am.getAttribute('data-tp-amt'); const i = el.querySelector('#tp-amt'); if (i) i.value = S.f.amount; return; }
      const b = q('[data-tp]'); if (!b) return;
      const a = b.getAttribute('data-tp');
      if (a === 'again') R.go('topup', { replace: true });
      else if (a === 'home') R.go('home', { reset: true });
    });
  }
  R.register({ topup: renderForm, 'topup-review': renderReview, 'topup-done': renderDone });
  R.on(info => { try { bind(info); } catch(e){ console.error('[topup]', e); } });
  return { phoneOf, state: S };
})();
