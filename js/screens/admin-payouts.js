'use strict';

/* ============================================================
   ADMIN · PAYOUTS & SMS (13.1.0) — the administrator's button.
   Orange Money Mali transfers wait as "in progress" until an administrator has paid the recipient. This screen (administrators only) lists them and gives
   the administrator the button that finishes the job:
     - "Mark as paid & send SMS"  -> admin_payout_confirm(tx, Orange Money reference): the transfer becomes COMPLETED, the sender is notified and the database
        calls the payout-notice function, which sends the SMS to the recipient. The SMS leaves ONLY when the administrator clicks (never from the app).
     - "Send SMS again"           -> admin_payout_resend_notice(tx): a new SMS for a transfer already paid (e.g. the first one failed).
   Everything is decided by the server (is_admin() inside each function): this screen is a window on admin_payout_list and two buttons. Nothing else is
   written from here, nothing is computed here, and a non-administrator never sees the entry (and the server refuses the calls anyway).
   ============================================================ */
Object.assign(TR.en, {
  'po.title':'Payouts & SMS','po.menu':'Payouts & SMS','po.admin':'Administrator','po.f.open':'To pay','po.f.done':'Paid','po.f.all':'All',
  'po.empty':'No payout here.','po.emptyD':'Orange Money Mali transfers appear here as soon as they are recorded.','po.load':'Loading…','po.err':'The list could not be loaded. Pull to refresh or try again.','po.retry':'Try again',
  'po.st.open':'To pay','po.st.done':'Paid','po.st.refunded':'Refunded','po.st.other':'Other',
  'po.from':'From','po.to':'To','po.paidRef':'Orange Money ref.','po.rate':'Rate',
  'po.sms.none':'SMS: will be sent when you mark it as paid','po.sms.notSent':'SMS: not sent','po.sms.sending':'SMS: sending…','po.sms.sent':'SMS: sent','po.sms.failed':'SMS: failed',
  'po.pay':'Mark as paid & send SMS','po.resend':'Send SMS again',
  'po.payT':'Mark as paid','po.payD':'Confirm only after you have sent the money to this Orange Money number. When you confirm, the transfer becomes “Paid”, the sender is notified and an SMS is sent to the recipient.',
  'po.ref':'Orange Money reference','po.refH':'4 to 60 characters, as shown by Orange Money. It is printed in the SMS.','po.refErr':'Enter the Orange Money reference (4 to 60 characters).','po.refInternal':'This looks like an internal transfer reference, not an Orange Money one. Copy the reference shown by Orange Money.',
  'po.confirm':'Confirm and send SMS','po.cancel':'Cancel','po.paying':'Confirming…',
  'po.resendT':'Send the SMS again?','po.resendD':'The recipient will receive another SMS for this payout.','po.resendYes':'Send again',
  'po.ok.pay':'Marked as paid. The SMS is being sent.','po.ok.resend':'SMS requested.','po.e.state':'This payout was already handled. The list has been refreshed.','po.e.forbidden':'Your account is not allowed to do this.','po.e.ref':'The reference is required (4 to 60 characters).','po.e.generic':'It did not work. Nothing was changed; try again.'
});
Object.assign(TR.fr, {
  'po.title':'Versements et SMS','po.menu':'Versements et SMS','po.admin':'Administrateur','po.f.open':'À verser','po.f.done':'Versés','po.f.all':'Tous',
  'po.empty':'Aucun versement ici.','po.emptyD':'Les transferts Orange Money Mali apparaissent ici dès qu’ils sont enregistrés.','po.load':'Chargement…','po.err':'La liste n’a pas pu être chargée. Réessayez.','po.retry':'Réessayer',
  'po.st.open':'À verser','po.st.done':'Versé','po.st.refunded':'Remboursé','po.st.other':'Autre',
  'po.from':'De','po.to':'À','po.paidRef':'Réf. Orange Money','po.rate':'Taux',
  'po.sms.none':'SMS : partira quand vous marquerez le versement','po.sms.notSent':'SMS : non envoyé','po.sms.sending':'SMS : envoi en cours…','po.sms.sent':'SMS : envoyé','po.sms.failed':'SMS : échec',
  'po.pay':'Marquer comme versé et envoyer le SMS','po.resend':'Renvoyer le SMS',
  'po.payT':'Marquer comme versé','po.payD':'Ne confirmez qu’après avoir envoyé l’argent à ce numéro Orange Money. À la confirmation, le transfert passe à « Versé », l’expéditeur est prévenu et un SMS part vers le destinataire.',
  'po.ref':'Référence Orange Money','po.refH':'De 4 à 60 caractères, telle qu’affichée par Orange Money. Elle figure dans le SMS.','po.refErr':'Saisissez la référence Orange Money (4 à 60 caractères).','po.refInternal':'Cela ressemble à une référence interne de transfert, pas à une référence Orange Money. Copiez la référence affichée par Orange Money.',
  'po.confirm':'Confirmer et envoyer le SMS','po.cancel':'Annuler','po.paying':'Confirmation…',
  'po.resendT':'Renvoyer le SMS ?','po.resendD':'Le destinataire recevra un nouveau SMS pour ce versement.','po.resendYes':'Renvoyer',
  'po.ok.pay':'Versement marqué. Le SMS part.','po.ok.resend':'SMS demandé.','po.e.state':'Ce versement a déjà été traité. La liste est actualisée.','po.e.forbidden':'Votre compte n’est pas autorisé à faire cela.','po.e.ref':'La référence est obligatoire (4 à 60 caractères).','po.e.generic':'Cela n’a pas fonctionné. Rien n’a été modifié ; réessayez.'
});
Object.assign(TR.ar, {
  'po.title':'الدفعات والرسائل','po.menu':'الدفعات والرسائل','po.admin':'المسؤول','po.f.open':'بانتظار الدفع','po.f.done':'مدفوعة','po.f.all':'الكل',
  'po.empty':'لا توجد دفعات هنا.','po.emptyD':'تظهر هنا تحويلات Orange Money مالي بمجرد تسجيلها.','po.load':'جارٍ التحميل…','po.err':'تعذّر تحميل القائمة. حاول مرة أخرى.','po.retry':'إعادة المحاولة',
  'po.st.open':'بانتظار الدفع','po.st.done':'مدفوعة','po.st.refunded':'مستردة','po.st.other':'أخرى',
  'po.from':'من','po.to':'إلى','po.paidRef':'مرجع Orange Money','po.rate':'السعر',
  'po.sms.none':'الرسالة: ستُرسل عند تأكيد الدفع','po.sms.notSent':'الرسالة: لم تُرسل','po.sms.sending':'الرسالة: جارٍ الإرسال…','po.sms.sent':'الرسالة: أُرسلت','po.sms.failed':'الرسالة: فشلت',
  'po.pay':'تأكيد الدفع وإرسال الرسالة','po.resend':'إعادة إرسال الرسالة',
  'po.payT':'تأكيد الدفع','po.payD':'أكّد فقط بعد أن ترسل المبلغ إلى رقم Orange Money هذا. عند التأكيد تصبح الحالة «مدفوعة» ويُشعَر المرسل وتُرسل رسالة SMS إلى المستلم.',
  'po.ref':'مرجع Orange Money','po.refH':'من 4 إلى 60 حرفاً كما يظهر في Orange Money. يظهر في الرسالة.','po.refErr':'أدخل مرجع Orange Money (من 4 إلى 60 حرفاً).','po.refInternal':'يبدو هذا مرجع تحويل داخلي وليس مرجع Orange Money. انسخ المرجع الذي يظهر في Orange Money.',
  'po.confirm':'تأكيد وإرسال الرسالة','po.cancel':'إلغاء','po.paying':'جارٍ التأكيد…',
  'po.resendT':'إعادة إرسال الرسالة؟','po.resendD':'سيستلم المستلم رسالة أخرى لهذه الدفعة.','po.resendYes':'إعادة الإرسال',
  'po.ok.pay':'تم تأكيد الدفع. الرسالة قيد الإرسال.','po.ok.resend':'تم طلب الرسالة.','po.e.state':'تمت معالجة هذه الدفعة مسبقاً. تم تحديث القائمة.','po.e.forbidden':'حسابك غير مخوَّل بهذا الإجراء.','po.e.ref':'المرجع مطلوب (من 4 إلى 60 حرفاً).','po.e.generic':'لم تنجح العملية. لم يتغير شيء؛ حاول مرة أخرى.'
});

const AdminPayouts = (() => {
  const isAdmin = () => { try { return !!(Runtime && Runtime.ctx && Runtime.ctx.role === 'admin'); } catch(e){ return false; } };
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const OPEN = ['PENDING', 'PROCESSING'];
  let rows = [], filter = 'open', loaded = false, failed = false, busy = false, pollT = 0, pollN = 0;
  const host = () => document.getElementById('po-list');

  function stateOf(r){ return OPEN.indexOf(r.status) !== -1 ? 'open' : r.status === 'COMPLETED' ? 'done' : r.status === 'REFUNDED' ? 'refunded' : 'other'; }
  function visible(){ return rows.filter(r => filter === 'all' || stateOf(r) === filter); }
  function smsLine(r){
    const s = String(r.notice_status || '').toUpperCase(), st = stateOf(r);
    if (st === 'open') return { cls: 'none', txt: t('po.sms.none') };
    if (s === 'SENT') return { cls: 'ok', txt: t('po.sms.sent') };
    if (s === 'QUEUED' || s === 'SENDING') return { cls: 'wait', txt: t('po.sms.sending') };
    if (s === 'FAILED') return { cls: 'bad', txt: t('po.sms.failed') + (r.notice_error ? ' — ' + String(r.notice_error).slice(0, 120) : '') };
    return { cls: 'bad', txt: t('po.sms.notSent') };
  }
  const money = (a, c) => { try { return CurrencyEngine.format(a, c); } catch(e){ return String(a) + ' ' + c; } };
  function cardHtml(r){
    const st = stateOf(r), sms = smsLine(r);
    const dest = r.dest_amount != null ? money(r.dest_amount, r.dest_currency || 'XOF') : '';
    const who = (name, phone) => escapeHtml(name || '') + (name && phone ? ' · ' : '') + (phone ? '<span class="nw">' + escapeHtml(formatPhoneIntl(phone)) + '</span>' : '');
    return '<article class="po-card" data-tx="' + escapeHtml(r.id) + '" data-state="' + st + '">' +
      '<div class="po-top"><b class="ltr" dir="ltr">' + escapeHtml(dispId(String(r.reference || ''))) + '</b><span class="po-st po-' + st + '">' + escapeHtml(t('po.st.' + st)) + '</span></div>' +
      '<div class="po-amt ltr" dir="ltr">' + moneyHtml(money(r.amount, 'OMR')) + (dest ? ' <span>→ ' + escapeHtml(dest) + '</span>' : '') + '</div>' +
      '<div class="po-line"><small>' + escapeHtml(t('po.to')) + '</small><span class="ltr" dir="ltr">' + who(r.beneficiary_name, r.beneficiary_phone) + '</span></div>' +
      '<div class="po-line"><small>' + escapeHtml(t('po.from')) + '</small><span class="ltr" dir="ltr">' + who(r.full_name, r.phone) + '</span></div>' +
      (r.paid_ref ? '<div class="po-line"><small>' + escapeHtml(t('po.paidRef')) + '</small><span class="ltr" dir="ltr">' + escapeHtml(r.paid_ref) + '</span></div>' : '') +
      '<div class="po-sms po-sms-' + sms.cls + '" role="status">' + escapeHtml(sms.txt) + '</div>' +
      (st === 'open' ? '<button type="button" class="btn btn-primary po-act" data-po="pay" data-tx="' + escapeHtml(r.id) + '">' + icon('send', 18) + '<span>' + escapeHtml(t('po.pay')) + '</span></button>'
        : st === 'done' ? '<button type="button" class="btn btn-secondary po-act" data-po="resend" data-tx="' + escapeHtml(r.id) + '">' + icon('mail', 18) + '<span>' + escapeHtml(t('po.resend')) + '</span></button>' : '') +
    '</article>';
  }
  function paint(){
    const h = host(); if (!h) return;
    if (failed){ h.innerHTML = emptyState('warn', t('po.err'), '', '<button type="button" class="btn btn-secondary" data-po="reload">' + escapeHtml(t('po.retry')) + '</button>'); return; }
    if (!loaded){ h.innerHTML = skeletonRows(4); return; }
    const v = visible();
    h.innerHTML = v.length ? v.map(cardHtml).join('') : emptyState('banknote', t('po.empty'), t('po.emptyD'));
    document.querySelectorAll('#payouts [data-pf]').forEach(c => c.setAttribute('aria-pressed', c.getAttribute('data-pf') === filter ? 'true' : 'false'));
  }
  async function load(){
    try {
      const { data, error } = await sb.rpc('admin_payout_list', { p_status: null, p_limit: 200 });
      if (error) throw error;
      rows = Array.isArray(data) ? data : []; loaded = true; failed = false;
    } catch(e){ console.error('[payouts]', e); failed = true; }
    paint(); schedulePoll();
  }
  /* the SMS is sent by the server a moment after the click: keep reading the state while it is "sending" */
  function schedulePoll(){
    clearTimeout(pollT);
    if (!document.getElementById('payouts')) return;
    if (!rows.some(r => ['QUEUED', 'SENDING'].indexOf(String(r.notice_status || '').toUpperCase()) !== -1) || pollN >= 8) return;
    pollN++; pollT = setTimeout(load, 3000);
  }
  function errKey(error){
    const m = String(error && error.message || '').toLowerCase();
    if (m.includes('invalid_state') || m.includes('not_manual_payout') || m.includes('not_found')) return 'po.e.state';
    if (m.includes('forbidden') || m.includes('unauthenticated')) return 'po.e.forbidden';
    if (m.includes('payout_reference_required')) return 'po.e.ref';
    return 'po.e.generic';
  }
  const byId = id => rows.find(r => r.id === id);

  function openPay(r){
    const close = R.overlay.open(
      '<div class="po-sheet"><h2>' + escapeHtml(t('po.payT')) + '</h2>' +
      '<p class="po-lead">' + escapeHtml(t('po.payD')) + '</p>' +
      '<div class="po-box"><b class="ltr" dir="ltr">' + escapeHtml(money(r.dest_amount != null ? r.dest_amount : r.amount, r.dest_amount != null ? (r.dest_currency || 'XOF') : 'OMR')) + '</b>' +
      '<span class="ltr" dir="ltr">' + escapeHtml([r.beneficiary_name, r.beneficiary_phone ? formatPhoneIntl(r.beneficiary_phone) : ''].filter(Boolean).join(' · ')) + '</span></div>' +
      '<div class="field"><label class="field-label" for="po-ref">' + escapeHtml(t('po.ref')) + '</label><div class="field-box"><input id="po-ref" type="text" maxlength="60" autocomplete="off" autocapitalize="characters" spellcheck="false" dir="ltr" lang="en"></div>' +
      '<div class="sp-hint">' + escapeHtml(t('po.refH')) + '</div><div class="field-err" id="po-err" role="alert"></div></div>' +
      '<button type="button" class="btn btn-primary" id="po-go">' + escapeHtml(t('po.confirm')) + '</button>' +
      '<button type="button" class="btn btn-ghost" id="po-no">' + escapeHtml(t('po.cancel')) + '</button></div>');
    setTimeout(() => {
      const inp = document.getElementById('po-ref'), go = document.getElementById('po-go'), no = document.getElementById('po-no'), err = document.getElementById('po-err');
      if (!inp || !go) return;
      no.onclick = () => close();
      const submit = async () => {
        const ref = inp.value.trim();
        if (ref.length < 4 || ref.length > 60){ err.textContent = t('po.refErr'); inp.focus(); return; }
        /* a reference of OUR OWN transfers (OMT…, BMCT…, OMW…, FRD-/YOR-…) is never an Orange Money reference: typed by mistake it would be printed in the recipient's SMS */
        if (/^(OMT\d|BMCT\d|OMW\d|FRD-|YOR-)/i.test(ref)){ err.textContent = t('po.refInternal'); inp.focus(); return; }
        if (busy) return; busy = true; err.textContent = ''; UIKit.loading(go, true);
        try {
          const { error } = await sb.rpc('admin_payout_confirm', { p_tx: r.id, p_paid_ref: ref });
          if (error) throw error;
          close(); toast(t('po.ok.pay'), 'success'); try { UIKit.haptic('success'); } catch(e){ /* rien */ }
          pollN = 0; await load();
        } catch(e){
          console.error('[payouts] confirm', e); UIKit.loading(go, false);
          const k = errKey(e); err.textContent = t(k); if (k === 'po.e.state'){ close(); pollN = 0; load(); }
        } finally { busy = false; }
      };
      go.onclick = submit; inp.onkeydown = e => { if (e.key === 'Enter'){ e.preventDefault(); submit(); } };
      try { inp.focus({ preventScroll: true }); } catch(e){ /* rien */ }
    }, 60);
  }
  function openResend(r){
    const close = R.overlay.open(
      '<div class="po-sheet"><h2>' + escapeHtml(t('po.resendT')) + '</h2><p class="po-lead">' + escapeHtml(t('po.resendD')) + '</p>' +
      '<div class="po-box"><span class="ltr" dir="ltr">' + escapeHtml([r.beneficiary_name, r.beneficiary_phone ? formatPhoneIntl(r.beneficiary_phone) : ''].filter(Boolean).join(' · ')) + '</span></div>' +
      '<div class="field-err" id="po-err" role="alert"></div>' +
      '<button type="button" class="btn btn-primary" id="po-go">' + escapeHtml(t('po.resendYes')) + '</button><button type="button" class="btn btn-ghost" id="po-no">' + escapeHtml(t('po.cancel')) + '</button></div>', { kind: 'modal' });
    setTimeout(() => {
      const go = document.getElementById('po-go'), no = document.getElementById('po-no'), err = document.getElementById('po-err'); if (!go) return;
      no.onclick = () => close();
      go.onclick = async () => {
        if (busy) return; busy = true; UIKit.loading(go, true);
        try {
          const { error } = await sb.rpc('admin_payout_resend_notice', { p_tx: r.id });
          if (error) throw error;
          close(); toast(t('po.ok.resend'), 'success'); pollN = 0; await load();
        } catch(e){ console.error('[payouts] resend', e); UIKit.loading(go, false); err.textContent = t(errKey(e)); }
        finally { busy = false; }
      };
    }, 60);
  }

  function render(){
    if (!isAdmin()){ setTimeout(() => R.go('home', { reset: true }), 0); return ''; }
    return refTop(t('po.title')) +
      '<div class="screen-body" style="padding-top:0"><div class="chips" role="group" aria-label="' + escapeHtml(t('po.title')) + '">' +
        ['open', 'done', 'all'].map(f => '<button type="button" class="chip" data-pf="' + f + '" aria-pressed="' + (f === filter ? 'true' : 'false') + '">' + escapeHtml(t('po.f.' + f)) + '</button>').join('') +
      '</div><div id="po-list" aria-live="polite"></div></div>';
  }
  function bind(el){
    loaded = false; failed = false; pollN = 0; rows = []; paint(); load();
    if (el.__poBound) return;                          /* the screen element is reused: one listener only */
    el.__poBound = true;
    el.addEventListener('click', e => {
      const f = e.target.closest && e.target.closest('[data-pf]');
      if (f){ filter = f.getAttribute('data-pf'); paint(); return; }
      const b = e.target.closest && e.target.closest('[data-po]'); if (!b) return;
      const a = b.getAttribute('data-po');
      if (a === 'reload'){ loaded = false; failed = false; paint(); load(); return; }
      const r = byId(b.getAttribute('data-tx')); if (!r || !UUID.test(String(r.id))) return;
      if (a === 'pay' && stateOf(r) === 'open') openPay(r);
      else if (a === 'resend' && stateOf(r) === 'done') openResend(r);
    });
  }
  /* entry in the Services list, for administrators only */
  function addMenu(el){
    if (!isAdmin() || el.querySelector('[data-nav="payouts"]')) return;
    const last = el.querySelector('.yb-sec:last-of-type'); if (!last) return;
    last.insertAdjacentHTML('afterend', '<section class="yb-sec"><div class="yb-h"><h2>' + escapeHtml(t('po.admin')) + '</h2></div><div class="yb-grid"><button class="yb-svc" data-nav="payouts"><span class="yb-svc-i">' + icon('banknote', 22) + '</span><span class="yb-svc-t">' + escapeHtml(t('po.menu')) + '</span></button></div></section>');
    const b = el.querySelector('[data-nav="payouts"]');          /* added after the screen's own wiring ran: it needs its own handler */
    if (b) b.addEventListener('click', e => { e.preventDefault(); R.go('payouts'); });
  }
  function init(){
    R.register({ payouts: render });
    R.on(info => {
      try {
        if (info.id === 'payouts' && info.el.querySelector('#po-list')) bind(info.el);
        else if (info.id === 'services') addMenu(info.el);
      } catch(e){ console.error('[payouts]', e); }
    });
  }
  init();
  return { isAdmin };
})();
