'use strict';

/* ============================================================
   OM WALLET 15.0 — TRANSFERT DE CRÉDIT (Omantel · Ooredoo · Vodafone) — RÉSERVÉ À L'ADMINISTRATEUR
   Circuit voulu par le propriétaire : l'administrateur choisit le service « Crédit », saisit l'opérateur, le numéro et le montant, et appuie
   sur Envoyer : l'opération est CONFIRMÉE tout de suite (admin_topup_send), et le SMS part aussitôt (fonction credit-topup) avec le message :
   « تمت عملية تحويل مبلغ 1.000 ريال بنجاح إلى الرقم 96892888435. (TID: ...) ». Rien d'autre n'est obligatoire (ni code, ni deuxième validation).
   Le TID est celui de l'opérateur si l'administrateur le saisit ; sinon l'opération reçoit son propre numéro OM Wallet.
   ============================================================ */
Object.assign(TR.en, {
  'tp.short':'Credit','tp.title':'Credit transfer','tp.lead':'Send mobile credit to an Omani number (Omantel, Ooredoo, Vodafone).',
  'tp.op':'Operator','tp.phone':'Phone number','tp.phonePh':'e.g. 9288 8435','tp.amount':'Amount (OMR)','tp.tid':'Operator TID (optional)','tp.tidHint':'Leave empty: the operation gets its own OM Wallet number.',
  'tp.go':'Send','tp.rule':'Confirmed right away. A confirmation SMS is sent to your phone number.',
  'tp.to':'To','tp.opL':'Operator',
  'tp.s.CONFIRMED':'Transfer confirmed','tp.s.FAILED':'Not sent','tp.again':'New transfer','tp.done':'Back to Home',
  'tp.msg':'Transfer of {a} OMR to {p} completed. (TID: {tid}).','tp.smsNote':'A confirmation SMS is sent to your phone number.',
  'tp.e.invalid_phone':'Enter a valid Omani mobile number (8 digits starting with 7 or 9).','tp.e.invalid_amount':'The amount is not valid.','tp.e.invalid_operator':'Choose an operator.',
  'tp.e.limit_per_transaction':'The amount is above the limit for one transfer.','tp.e.invalid_tid':'The TID is not valid (4 to 32 letters, digits, . _ -).','tp.e.tid_in_use':'This TID is already used by another transfer.',
  'tp.e.forbidden':'This service is reserved for the administrator.','tp.e.unauthenticated':'Sign in again.',
  'tp.e.unknown':'The transfer could not be recorded.','tp.e.uncertain':'No answer from the server. Check Activity before trying again: the same transfer is never counted twice.'
});
Object.assign(TR.fr, {
  'tp.short':'Crédit','tp.title':'Transfert de crédit','tp.lead':'Envoyez du crédit mobile à un numéro omanais (Omantel, Ooredoo, Vodafone).',
  'tp.op':'Opérateur','tp.phone':'Numéro de téléphone','tp.phonePh':'ex. 9288 8435','tp.amount':'Montant (OMR)','tp.tid':'TID de l’opérateur (facultatif)','tp.tidHint':'Laissé vide : l’opération reçoit son propre numéro OM Wallet.',
  'tp.go':'Envoyer','tp.rule':'Confirmé tout de suite. Un SMS de confirmation est envoyé à votre numéro de téléphone.',
  'tp.to':'Vers','tp.opL':'Opérateur',
  'tp.s.CONFIRMED':'Transfert confirmé','tp.s.FAILED':'Non envoyé','tp.again':'Nouveau transfert','tp.done':'Retour à l’accueil',
  'tp.msg':'Transfert de {a} OMR vers le {p} effectué. (TID : {tid}).','tp.smsNote':'Un SMS de confirmation est envoyé à votre numéro de téléphone.',
  'tp.e.invalid_phone':'Saisissez un numéro mobile omanais valide (8 chiffres commençant par 7 ou 9).','tp.e.invalid_amount':'Le montant n’est pas valide.','tp.e.invalid_operator':'Choisissez un opérateur.',
  'tp.e.limit_per_transaction':'Le montant dépasse la limite d’un transfert.','tp.e.invalid_tid':'Le TID n’est pas valide (4 à 32 lettres, chiffres, . _ -).','tp.e.tid_in_use':'Ce TID est déjà utilisé par un autre transfert.',
  'tp.e.forbidden':'Ce service est réservé à l’administrateur.','tp.e.unauthenticated':'Reconnectez-vous.',
  'tp.e.unknown':'Le transfert n’a pas pu être enregistré.','tp.e.uncertain':'Aucune réponse du serveur. Vérifiez l’Activité avant de réessayer : le même transfert n’est jamais compté deux fois.'
});
Object.assign(TR.ar, {
  'tp.short':'رصيد','tp.title':'تحويل رصيد','tp.lead':'أرسل رصيداً لهاتف عُماني (عُمانتل، أوريدو، فودافون).',
  'tp.op':'المشغّل','tp.phone':'رقم الهاتف','tp.phonePh':'مثال 9288 8435','tp.amount':'المبلغ (ريال عُماني)','tp.tid':'TID المشغّل (اختياري)','tp.tidHint':'إن تُرك فارغاً: تحصل العملية على رقمها الخاص من OM Wallet.',
  'tp.go':'إرسال','tp.rule':'يتم التأكيد فوراً. تُرسل رسالة SMS للتأكيد إلى رقم هاتفك.',
  'tp.to':'إلى','tp.opL':'المشغّل',
  'tp.s.CONFIRMED':'تم تأكيد التحويل','tp.s.FAILED':'لم يُرسل','tp.again':'تحويل جديد','tp.done':'العودة إلى الرئيسية',
  'tp.msg':'تمت عملية تحويل مبلغ {a} ريال بنجاح إلى الرقم {p}. (TID: {tid}).','tp.smsNote':'تُرسل رسالة SMS للتأكيد إلى رقم هاتفك.',
  'tp.e.invalid_phone':'أدخل رقم هاتف عُماني صحيحاً (8 أرقام تبدأ بـ 7 أو 9).','tp.e.invalid_amount':'المبلغ غير صحيح.','tp.e.invalid_operator':'اختر مشغّلاً.',
  'tp.e.limit_per_transaction':'المبلغ أعلى من حد التحويل الواحد.','tp.e.invalid_tid':'الـ TID غير صحيح (من 4 إلى 32 حرفاً أو رقماً أو . _ -).','tp.e.tid_in_use':'هذا الـ TID مستخدم في تحويل آخر.',
  'tp.e.forbidden':'هذه الخدمة مخصصة للمسؤول.','tp.e.unauthenticated':'سجّل الدخول من جديد.',
  'tp.e.unknown':'تعذّر تسجيل التحويل.','tp.e.uncertain':'لا يوجد رد من الخادم. تحقق من النشاط قبل إعادة المحاولة: لن يُحتسب التحويل نفسه مرتين أبداً.'
});
Object.assign(TR.en, { 'op.CREDIT_TOPUP':'Credit transfer' });
Object.assign(TR.fr, { 'op.CREDIT_TOPUP':'Transfert de crédit' });
Object.assign(TR.ar, { 'op.CREDIT_TOPUP':'تحويل رصيد' });

const OMXTopup = (() => {
  const OPS = [['OOREDOO', 'Ooredoo'], ['OMANTEL', 'Omantel'], ['VODAFONE', 'Vodafone']];     /* names only: no operator logo is copied */
  const AMOUNTS = [1, 2, 5, 10];
  const S = { f: { op: 'OOREDOO' }, done: null, busy: false, idem: '' };
  const top = title => refTop(title);
  const isAdmin = () => { try { return !!(Runtime && Runtime.ctx && Runtime.ctx.role === 'admin'); } catch(e){ return false; } };
  const isNetErr = e => { const m = String(e && e.message || e || ''); return /Failed to fetch|NetworkError|network|timeout|aborted|Load failed/i.test(m) && !/[a-z]+_[a-z_]+/.test(m); };
  const errText = c => { const k = String(c || ''); return t(TR.en['tp.e.' + k] ? 'tp.e.' + k : 'tp.e.unknown'); };
  const omr = v => CurrencyEngine.format(Number(v), 'OMR');
  /* same normalisation as the server: 8 digits starting with 7 or 9, typed with or without 968 / +968 / 00968 */
  function phoneOf(raw){
    let d = String(raw || '').replace(/[^0-9]/g, '');
    if (/^00968[79][0-9]{7}$/.test(d)) d = d.slice(2);
    if (/^[79][0-9]{7}$/.test(d)) d = '968' + d;
    return /^968[79][0-9]{7}$/.test(d) ? d : '';
  }
  const phoneShow = p => p ? '+' + p.slice(0, 3) + ' ' + p.slice(3, 7) + ' ' + p.slice(7) : '';

  function renderForm(){
    if (!isAdmin()){ setTimeout(() => R.go('home', { replace: true }), 0); return ''; }
    const f = S.f;
    return top(t('tp.title')) + '<div class="screen-body omx-page wd-form"><p class="omx-lead">' + escapeHtml(t('tp.lead')) + '</p>' +
      '<section class="omx-card omx-sec"><div class="omx-sh"><h2>' + escapeHtml(t('tp.op')) + '</h2></div><div class="omx-grid" role="group" aria-label="' + escapeHtml(t('tp.op')) + '">' +
        OPS.map(o => '<button type="button" class="omx-pick' + (o[0] === f.op ? ' on' : '') + '" data-tp-op="' + o[0] + '" aria-pressed="' + (o[0] === f.op) + '"><b>' + o[1] + '</b></button>').join('') + '</div></section>' +
      '<section class="omx-card wd-fields"><label for="tp-phone">' + escapeHtml(t('tp.phone')) + '</label><div class="tp-ph ltr" dir="ltr"><span aria-hidden="true">+968</span><input id="tp-phone" class="input ltr" dir="ltr" type="tel" inputmode="tel" autocomplete="off" placeholder="' + escapeHtml(t('tp.phonePh')) + '" value="' + escapeHtml(f.phone || '') + '"></div>' +
        '<p class="wd-err" id="tp-e-phone" role="alert"></p></section>' +
      '<section class="omx-card wd-amt"><label for="tp-amt">' + escapeHtml(t('tp.amount')) + '</label><div class="wd-amt-in"><input id="tp-amt" inputmode="decimal" autocomplete="off" placeholder="0" value="' + escapeHtml(f.amount || '') + '"><span>OMR</span></div>' +
        '<div class="tp-chips" role="group">' + AMOUNTS.map(a => '<button type="button" class="chip" data-tp-amt="' + a + '">' + a + '</button>').join('') + '</div><p class="wd-err" id="tp-e-amt" role="alert"></p>' +
        '<label for="tp-tid">' + escapeHtml(t('tp.tid')) + '</label><input id="tp-tid" class="input ltr" dir="ltr" maxlength="32" autocomplete="off" spellcheck="false" value="' + escapeHtml(f.tid || '') + '"><small class="omx-muted">' + escapeHtml(t('tp.tidHint')) + '</small><p class="wd-err" id="tp-e-tid" role="alert"></p></section>' +
      '<p class="omx-info">' + icon('shield', 18) + '<span>' + escapeHtml(t('tp.rule')) + '</span></p>' +
      '<button class="btn btn-primary btn-block" id="tp-go">' + icon('send', 18) + '<span>' + escapeHtml(t('tp.go')) + '</span></button></div>';
  }
  async function send(btn){
    if (S.busy) return;
    const f = S.f, p = phoneOf(f.phone), raw = String(f.amount || '').trim().replace(',', '.'), amt = Number(raw), tid = String(f.tid || '').trim();
    const eP = p ? '' : t('tp.e.invalid_phone'), eA = !(amt > 0) || !/^\d+(\.\d{0,3})?$/.test(raw) ? t('tp.e.invalid_amount') : '', eT = tid && !/^[0-9A-Za-z._-]{4,32}$/.test(tid) ? t('tp.e.invalid_tid') : '';
    [['tp-e-phone', eP], ['tp-e-amt', eA], ['tp-e-tid', eT]].forEach(([id, m]) => { const el = document.getElementById(id); if (el) el.textContent = m; });
    if (eP || eA || eT) return;
    if (navigator.onLine === false){ toast(t('px.offlineSend'), 'error'); return; }
    if (!S.idem) S.idem = uuid();                       /* the same sending is never counted twice, even if the answer is lost and the button pressed again */
    S.busy = true; UIKit.loading(btn, true);
    const review = { op: f.op, opName: (OPS.find(o => o[0] === f.op) || [])[1] || f.op, phone: p, amount: Math.round(amt * 1000) / 1000 };
    let res;
    try { res = await sb.rpc('admin_topup_send', { p_operator: f.op, p_phone: p, p_amount: review.amount, p_tid: tid || null, p_idempotency_key: S.idem }); }
    catch(e){ res = { error: e }; }
    S.busy = false; UIKit.loading(btn, false);
    if (res.error || !res.data || res.data.ok === false){
      const e = res.error;
      if (e && isNetErr(e)){ toast(t('tp.e.uncertain'), 'error'); return; }          /* answer lost: the same key is kept, a second press cannot send twice */
      const m = String((e && (e.message || e.code)) || (res.data && res.data.error) || ''), k = (m.match(/[a-z]+(?:_[a-z]+)+/) || [])[0];
      S.idem = '';
      S.done = { review, error: errText(k) };
    } else {
      const d = res.data; S.idem = '';
      S.done = { review, id: d.transaction_id, reference: d.reference, tid: d.tid };
      S.f = { op: f.op };
      try { await AuthEngine.hydrateRuntime(); } catch(e){}
    }
    R.go('topup-done', { reset: true });
  }
  function renderDone(){
    const d = S.done; if (!d){ setTimeout(() => R.go('home', { replace: true }), 0); return ''; }
    const r = d.review || {}, ok = !d.error;
    const g = ok ? '<circle class="a-face ok" cx="40" cy="40" r="30"/><path class="a-check" pathLength="1" d="M27 41l9 9 18-20"/>' : '<circle class="a-face ko" cx="40" cy="40" r="30"/><path class="a-x" pathLength="1" d="M29 29l22 22M51 29L29 51"/>';
    const msg = ok ? t('tp.msg').replace('{a}', Number(r.amount).toFixed(3)).replace('{p}', r.phone).replace('{tid}', d.tid) : '';
    return top(t('tp.title')) + '<div class="screen-body omx-page wd-track"><section class="omx-card wd-hero s-' + (ok ? 'success' : 'failed') + '" aria-live="polite">' +
        '<div class="wd-anim k-' + (ok ? 'done' : 'fail') + '" aria-hidden="true"><svg viewBox="0 0 80 80" width="96" height="96">' + g + '</svg></div><div class="wd-hamt ltr">' + escapeHtml(omr(r.amount)) + '</div><b>' + escapeHtml(t(ok ? 'tp.s.CONFIRMED' : 'tp.s.FAILED')) + '</b>' +
        (ok ? '<p class="wd-msg" dir="auto" id="tp-msg">' + escapeHtml(msg) + '</p><small class="omx-muted">' + escapeHtml(t('tp.smsNote')) + '</small>' : '<p class="wd-msg">' + escapeHtml(d.error) + '</p>') + '</section>' +
      '<section class="omx-card"><dl class="wd-sum"><div><dt>' + escapeHtml(t('tp.opL')) + '</dt><dd>' + escapeHtml(r.opName || '') + '</dd></div><div><dt>' + escapeHtml(t('tp.to')) + '</dt><dd class="ltr">' + escapeHtml(phoneShow(r.phone)) + '</dd></div>' +
        (d.tid ? '<div><dt>TID</dt><dd class="ltr">' + escapeHtml(d.tid) + '</dd></div>' : '') + (d.reference ? '<div><dt>' + escapeHtml(t('wd.ref')) + '</dt><dd class="ltr">' + escapeHtml(d.reference) + '</dd></div>' : '') + '</dl></section>' +
      '<div class="omx-btns"><button class="btn btn-secondary" data-tp="again">' + escapeHtml(t('tp.again')) + '</button><button class="btn btn-primary" data-tp="home">' + escapeHtml(t('tp.done')) + '</button></div></div>';
  }
  function bind(info){
    const id = info.id, el = info.el;
    if (['topup', 'topup-done'].indexOf(id) === -1) return;
    if (id === 'topup'){
      const f = S.f, ph = el.querySelector('#tp-phone'), a = el.querySelector('#tp-amt'), ti = el.querySelector('#tp-tid'), go = el.querySelector('#tp-go');
      if (ph) ph.oninput = () => { f.phone = ph.value; };
      if (a) a.oninput = () => { f.amount = a.value; };
      if (ti) ti.oninput = () => { f.tid = ti.value; };
      if (go) go.onclick = () => send(go);
    }
    if (el.__tp) return;
    el.__tp = true;
    el.addEventListener('click', e => {
      const q = sel => e.target.closest && e.target.closest(sel);
      const op = q('[data-tp-op]'); if (op){ S.f.op = op.getAttribute('data-tp-op'); el.querySelectorAll('[data-tp-op]').forEach(b => { const on = b === op; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); return; }
      const am = q('[data-tp-amt]'); if (am){ S.f.amount = am.getAttribute('data-tp-amt'); const i = el.querySelector('#tp-amt'); if (i) i.value = S.f.amount; return; }
      const b = q('[data-tp]'); if (!b) return;
      if (b.getAttribute('data-tp') === 'again') R.go('topup', { replace: true });
      else if (b.getAttribute('data-tp') === 'home') R.go('home', { reset: true });
    });
  }
  R.register({ topup: renderForm, 'topup-done': renderDone });
  R.on(info => { try { bind(info); } catch(e){ console.error('[topup]', e); } });
  return { phoneOf, state: S };
})();
