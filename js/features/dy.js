'use strict';

/* ============================================================
   DY — « transferts suspendus » (13.2.0)
   Un interrupteur d'administrateur. Il est DÉCIDÉ PAR LE SERVEUR : la table dy_settings, les fonctions dy_status / admin_dy_set / admin_dy_overview
   et la garde placée dans fiat_send_external, intl_send, transfer_fiat et bank_send (supabase/migrations/20261121_dy_transfer_switch.sql).
   Ce fichier n'est qu'une fenêtre sur cet état :
     DY actif   -> la personne saisit le numéro ; le serveur cherche le nom (beneficiary_lookup, annuaire autorisé) et on l'affiche s'il est connu ;
                   puis une fenêtre bilingue dit que le service de transfert est indisponible. Aucun montant n'est débité, aucun reçu n'est créé,
                   le code PIN n'est pas consommé. Même si cette fenêtre était contournée, le serveur refuserait la demande.
     DY coupé   -> la procédure normale, avec toutes les vérifications habituelles.
   Aucun nom n'est inventé : sans correspondance de l'annuaire, aucun nom n'est affiché.
   La fenêtre « Erreur système » (showSystemError) n'est utilisée que pour une VRAIE erreur technique du serveur, jamais pour DY.
   ============================================================ */
Object.assign(TR.en, {
  'errors.TRANSFER_UNAVAILABLE':'The money transfer service is currently unavailable. Please try again later.',
  'dy.nameFound':'Beneficiary found',
  'dy.menu':'Transfer settings (DY)','dy.admin':'Administrator','dy.title':'Transfer Settings','dy.sub':'Admin Control',
  'dy.sw':'DY','dy.swSub':'Suspend the money transfer service',
  'dy.desc':'When DY is ON, no transfer can be made. The server refuses every transfer request: nothing is debited, no transfer receipt is created and the sender sees the notice below. When DY is OFF, transfers work normally with all the usual checks.',
  'dy.on':'DY is ON — transfers are suspended','dy.off':'DY is OFF — transfers are available',
  'dy.last':'Last change','dy.by':'by','dy.never':'No change recorded yet',
  'dy.preview':'What the sender sees','dy.blocked':'Blocked attempts','dy.b24':'Last 24 hours','dy.bAll':'Total',
  'dy.history':'History of changes','dy.histEmpty':'No change yet.','dy.hOn':'DY turned ON','dy.hOff':'DY turned OFF',
  'dy.load':'Loading…','dy.err':'The DY status could not be loaded. Try again.','dy.retry':'Try again',
  'dy.askOnT':'Suspend all transfers?','dy.askOnD':'As soon as you confirm, nobody can send money: every transfer request is refused by the server and the notice is shown. This is recorded in the activity log.','dy.askOnYes':'Turn DY ON',
  'dy.askOffT':'Re-enable transfers?','dy.askOffD':'Transfers work again with all the usual checks. This is recorded in the activity log.','dy.askOffYes':'Turn DY OFF',
  'dy.cancel':'Cancel','dy.okOn':'DY is ON. Transfers are suspended.','dy.okOff':'DY is OFF. Transfers are available.',
  'dy.e.forbidden':'Your account is not allowed to do this.','dy.e.generic':'It did not work. Nothing was changed; try again.'
});
Object.assign(TR.fr, {
  'errors.TRANSFER_UNAVAILABLE':'Le service de transfert d’argent est actuellement indisponible. Veuillez réessayer plus tard.',
  'dy.nameFound':'Bénéficiaire identifié',
  'dy.menu':'Réglages des transferts (DY)','dy.admin':'Administrateur','dy.title':'Réglages des transferts','dy.sub':'Contrôle administrateur',
  'dy.sw':'DY','dy.swSub':'Suspendre le service de transfert d’argent',
  'dy.desc':'Quand DY est activé, aucun transfert n’est possible. Le serveur refuse toute demande de transfert : rien n’est débité, aucun reçu de transfert n’est créé et l’expéditeur voit l’avis ci-dessous. Quand DY est désactivé, les transferts fonctionnent normalement avec toutes les vérifications habituelles.',
  'dy.on':'DY est activé — les transferts sont suspendus','dy.off':'DY est désactivé — les transferts sont disponibles',
  'dy.last':'Dernier changement','dy.by':'par','dy.never':'Aucun changement enregistré',
  'dy.preview':'Ce que voit l’expéditeur','dy.blocked':'Tentatives bloquées','dy.b24':'24 dernières heures','dy.bAll':'Total',
  'dy.history':'Historique des changements','dy.histEmpty':'Aucun changement pour l’instant.','dy.hOn':'DY activé','dy.hOff':'DY désactivé',
  'dy.load':'Chargement…','dy.err':'L’état de DY n’a pas pu être chargé. Réessayez.','dy.retry':'Réessayer',
  'dy.askOnT':'Suspendre tous les transferts ?','dy.askOnD':'Dès la confirmation, personne ne peut envoyer d’argent : le serveur refuse chaque demande et l’avis s’affiche. Le changement est inscrit au journal d’activité.','dy.askOnYes':'Activer DY',
  'dy.askOffT':'Rétablir les transferts ?','dy.askOffD':'Les transferts refonctionnent avec toutes les vérifications habituelles. Le changement est inscrit au journal d’activité.','dy.askOffYes':'Désactiver DY',
  'dy.cancel':'Annuler','dy.okOn':'DY activé. Les transferts sont suspendus.','dy.okOff':'DY désactivé. Les transferts sont disponibles.',
  'dy.e.forbidden':'Votre compte n’est pas autorisé à faire cela.','dy.e.generic':'Cela n’a pas fonctionné. Rien n’a été modifié ; réessayez.'
});
Object.assign(TR.ar, {
  'errors.TRANSFER_UNAVAILABLE':'خدمة تحويل الأموال غير متاحة حاليًا. يرجى المحاولة مرة أخرى لاحقًا.',
  'dy.nameFound':'تم التعرف على المستفيد',
  'dy.menu':'إعدادات التحويل (DY)','dy.admin':'المسؤول','dy.title':'إعدادات التحويل','dy.sub':'لوحة تحكم المسؤول',
  'dy.sw':'DY','dy.swSub':'إيقاف خدمة تحويل الأموال',
  'dy.desc':'عند تفعيل DY لا يمكن إجراء أي تحويل. يرفض الخادم كل طلب تحويل: لا يُخصم أي مبلغ ولا يُنشأ أي إيصال تحويل، ويرى المرسل الإشعار أدناه. وعند إيقاف DY تعمل التحويلات بشكل طبيعي مع جميع عمليات التحقق المعتادة.',
  'dy.on':'DY مفعّل — التحويلات متوقفة','dy.off':'DY متوقف — التحويلات متاحة',
  'dy.last':'آخر تغيير','dy.by':'بواسطة','dy.never':'لم يُسجَّل أي تغيير بعد',
  'dy.preview':'ما يراه المرسل','dy.blocked':'المحاولات المحظورة','dy.b24':'آخر 24 ساعة','dy.bAll':'الإجمالي',
  'dy.history':'سجل التغييرات','dy.histEmpty':'لا توجد تغييرات بعد.','dy.hOn':'تم تفعيل DY','dy.hOff':'تم إيقاف DY',
  'dy.load':'جارٍ التحميل…','dy.err':'تعذّر تحميل حالة DY. حاول مرة أخرى.','dy.retry':'إعادة المحاولة',
  'dy.askOnT':'إيقاف جميع التحويلات؟','dy.askOnD':'بمجرد التأكيد لن يتمكن أحد من إرسال الأموال: يرفض الخادم كل طلب ويظهر الإشعار. يُسجَّل هذا التغيير في سجل النشاط.','dy.askOnYes':'تفعيل DY',
  'dy.askOffT':'إعادة تفعيل التحويلات؟','dy.askOffD':'تعمل التحويلات من جديد مع جميع عمليات التحقق المعتادة. يُسجَّل هذا التغيير في سجل النشاط.','dy.askOffYes':'إيقاف DY',
  'dy.cancel':'إلغاء','dy.okOn':'تم تفعيل DY. التحويلات متوقفة.','dy.okOff':'تم إيقاف DY. التحويلات متاحة.',
  'dy.e.forbidden':'حسابك غير مخوَّل بهذا الإجراء.','dy.e.generic':'لم تنجح العملية. لم يتغير شيء؛ حاول مرة أخرى.'
});

const DY = (() => {
  let cache = { enabled: false, updatedAt: null, known: false };
  let inflight = null, shown = false;

  /* The server's answer is the only truth. If it cannot be read the app does NOT guess: it lets the person go on, and the server still refuses
     (TRANSFER_UNAVAILABLE) at the moment of sending. */
  async function status(force){
    if (!force && cache.known) return cache;
    if (inflight) return inflight;
    inflight = (async () => {
      try {
        if (typeof supabaseReady !== 'undefined' && !supabaseReady) return cache;
        const { data, error } = await sb.rpc('dy_status');
        if (!error && data && typeof data.enabled === 'boolean') cache = { enabled: data.enabled, updatedAt: data.updatedAt || null, known: true };
      } catch(e){ /* the server will decide at sending time */ }
      return cache;
    })().finally(() => { inflight = null; });
    return inflight;
  }
  const isBlocked = data => !!(data && data.ok === false && data.error === 'TRANSFER_UNAVAILABLE');

  /* Same wording, always in Arabic AND English (the sender may read either); the exact texts of the product. */
  function noticeHtml(){
    return '<div class="dy-modal" role="alertdialog" aria-labelledby="dy-t-ar dy-t-en">' +
      '<span class="dy-ic" aria-hidden="true">' + icon('warn', 30) + '</span>' +
      '<section lang="ar" dir="rtl"><h2 id="dy-t-ar">التحويل غير متاح مؤقتًا</h2><p>عزيزي العميل،<br>خدمة تحويل الأموال غير متاحة حاليًا.<br>يرجى المحاولة مرة أخرى لاحقًا.</p></section>' +
      '<hr class="dy-hr">' +
      '<section lang="en" dir="ltr"><h3 id="dy-t-en">Transfer Temporarily Unavailable</h3><p>Dear Customer,<br>The money transfer service is currently unavailable.<br>Please try again later.</p></section>' +
    '</div>';
  }
  function open(inner, okId, onClose){
    const close = R.overlay.open(inner + '<button type="button" class="btn btn-primary dy-ok" id="' + okId + '"><span lang="ar" dir="rtl">موافق</span><small lang="en" dir="ltr">OK</small></button>', { kind: 'modal', onClose });
    setTimeout(() => { const b = document.getElementById(okId); if (b) b.onclick = () => close(); }, 40);
    return close;
  }
  /* one window at a time: it is shown again on the next attempt once it has been closed */
  function showUnavailable(){
    if (shown) return null; shown = true;
    try { UIKit.haptic('warning'); } catch(e){ /* rien */ }
    return open(noticeHtml(), 'dy-ok', () => { shown = false; });
  }
  /* A REAL technical error only (the server answered with an unexpected error). Never triggered by DY. */
  function showSystemError(){
    open('<div class="dy-modal dy-err" role="alertdialog" aria-labelledby="dy-e-ar dy-e-en"><span class="dy-ic dy-ic-err" aria-hidden="true">' + icon('warn', 30) + '</span>' +
      '<section lang="ar" dir="rtl"><h2 id="dy-e-ar">خطأ في النظام</h2><p>معذرةً، تعذر تنفيذ العملية حاليًا بسبب مشكلة تقنية. يرجى المحاولة مرة أخرى لاحقًا.</p></section><hr class="dy-hr">' +
      '<section lang="en" dir="ltr"><h3 id="dy-e-en">System Error</h3><p>Sorry, the transaction could not be completed due to a technical issue. Please try again later.</p></section></div>', 'dy-eok');
    try { UIKit.haptic('error'); } catch(e){ /* rien */ }
  }

  /* DY ON, on the recipient screen: the server looks the number up in the authorised directory (beneficiary_lookup, Oman numbers) and the name is
     shown ONLY if it matches; then the caller shows the notice. -> { blocked:false } | { blocked:true, name } */
  async function gate(dst, digits){
    const s = await status(true);
    if (!s.enabled) return { blocked: false };
    let name = '';
    if (dst && dst.iso === 'OM' && /^[79]\d{7}$/.test(String(digits || ''))){
      try {
        const { data, error } = await sb.rpc('beneficiary_lookup', { p_phone: '+968' + digits });
        if (!error && data && data.found === true && typeof data.name === 'string') name = data.name.trim().slice(0, 80);
      } catch(e){ /* no name: nothing is invented */ }
    }
    return { blocked: true, name };
  }
  return { status, isBlocked, noticeHtml, showUnavailable, showSystemError, gate };
})();
