'use strict';

/* ============================================================
   ADMIN CONTROL (DYT 14) — administrators only. Screen id kept: 'dy-control'.
   Every section is a window on the server; each admin_* function checks is_admin() itself and writes the audit log.
   Sections: dashboard (admin_console_stats + open withdrawals), users (admin_recent_users / admin_search_users),
   bank withdrawals (admin_withdrawal_list / decide / mark_paid), crypto withdrawals (admin_crypto_withdrawal_list / process / complete with the
   real blockchain hash / reject), assets & networks (crypto_withdraw_overview + verified contracts), settings (withdraw_enabled), logs.
   Transfers were removed from the app: the DY switch is no longer offered; its history and blocked attempts stay readable (archive),
   and the old transfer payouts stay reachable (data-nav="payouts"). Nothing is deleted.
   ============================================================ */
Object.assign(TR.en, { 'adm.dash':'Dashboard','adm.transfers':'Transfers (archive)','adm.settings':'System Settings','adm.logs':'Activity Logs','adm.exit':'Back to app','adm.status':'System Status','adm.online':'Online','adm.offline':'Not reachable',
  'adm.users':'Users','adm.tt':'Total Transfers','adm.today':'Today’s Transactions','adm.bal':'Total Balance','adm.role':'Administrator','adm.note':'Note',
  'adm.txs':'Transactions to confirm','adm.wdBank':'Bank withdrawals','adm.wdCrypto':'Crypto withdrawals','adm.assets':'Assets & networks','adm.open':'Open withdrawals',
  'adm.n1':'Transfers are removed from the app. Their history, receipts and payouts stay available (archive).','adm.n2':'A crypto withdrawal is confirmed only with the real blockchain hash of the payment.' });
Object.assign(TR.fr, { 'adm.dash':'Tableau de bord','adm.transfers':'Transferts (archives)','adm.settings':'Paramètres du système','adm.logs':'Journal d’activité','adm.exit':'Retour à l’application','adm.status':'État du système','adm.online':'En ligne','adm.offline':'Injoignable',
  'adm.users':'Utilisateurs','adm.tt':'Total des transferts','adm.today':'Opérations du jour','adm.bal':'Solde total','adm.role':'Administrateur','adm.note':'Remarque',
  'adm.txs':'Transactions à confirmer','adm.wdBank':'Retraits bancaires','adm.wdCrypto':'Retraits crypto','adm.assets':'Actifs et réseaux','adm.open':'Retraits en cours',
  'adm.n1':'Les transferts sont retirés de l’application. Leur historique, leurs reçus et leurs paiements restent consultables (archives).','adm.n2':'Un retrait crypto n’est confirmé qu’avec le vrai hash blockchain du paiement.' });
Object.assign(TR.ar, { 'adm.dash':'الرئيسية','adm.transfers':'التحويلات (أرشيف)','adm.settings':'إعدادات النظام','adm.logs':'سجل النشاط','adm.exit':'العودة إلى التطبيق','adm.status':'حالة النظام','adm.online':'يعمل الآن','adm.offline':'غير متاح',
  'adm.users':'المستخدمون','adm.tt':'إجمالي التحويلات','adm.today':'عمليات اليوم','adm.bal':'الرصيد الكلي','adm.role':'المدير','adm.note':'ملاحظة',
  'adm.txs':'معاملات بانتظار التأكيد','adm.wdBank':'السحب المصرفي','adm.wdCrypto':'السحب الرقمي','adm.assets':'الأصول والشبكات','adm.open':'عمليات سحب قيد التنفيذ',
  'adm.n1':'أُزيلت التحويلات من التطبيق. يبقى سجلها وإيصالاتها ومدفوعاتها متاحة (أرشيف).','adm.n2':'لا يُؤكَّد السحب الرقمي إلا بمعرّف المعاملة الحقيقي على البلوكشين.' });
Object.assign(TR.en, { 'ad.search':'Name, phone, email or ID','ad.noUsers':'No user found.','ad.joined':'Joined','ad.all':'All','ad.none':'Nothing here.','ad.err':'Could not load. Try again.','ad.retry':'Try again',
  'ad.approve':'Approve','ad.reject':'Reject','ad.paid':'Mark as paid','ad.process':'Start processing','ad.complete':'Confirm with the hash','ad.reason':'Reason (shown to the user)','ad.bankRef':'Bank transfer reference','ad.hash':'Blockchain transaction hash',
  'ad.hashH':'Paste the hash of the payment you made. It is checked (format, not reused) and becomes the proof shown to the user.','ad.go':'Confirm','ad.cancel':'Cancel','ad.done':'Saved','ad.e.forbidden':'Administrators only.','ad.e.invalid_state':'Its status changed meanwhile.',
  'ad.e.invalid_tx_hash':'This hash does not match the network format.','ad.e.tx_hash_already_used':'This hash is already used by another withdrawal.','ad.e.reason_required':'Give a reason (3 characters or more).','ad.e.generic':'The action failed.',
  'ad.wdOn':'Withdrawals enabled','ad.wdOnD':'When off, no new withdrawal request (bank or crypto) is accepted. Requests already made are not changed.','ad.dep':'Deposit address','ad.depNo':'Not configured — deposits refused','ad.fee':'Withdrawal fee',
  'ad.dyArchive':'DY (archive)','ad.dyArchiveD':'Transfer suspension switch, retired with transfers. Its history is kept.','ad.audit':'Each action is written to the audit log.' });
Object.assign(TR.fr, { 'ad.search':'Nom, téléphone, e-mail ou identifiant','ad.noUsers':'Aucun utilisateur trouvé.','ad.joined':'Inscrit','ad.all':'Tous','ad.none':'Rien ici.','ad.err':'Chargement impossible. Réessayez.','ad.retry':'Réessayer',
  'ad.approve':'Approuver','ad.reject':'Refuser','ad.paid':'Marquer comme payé','ad.process':'Lancer le traitement','ad.complete':'Confirmer avec le hash','ad.reason':'Motif (montré à l’utilisateur)','ad.bankRef':'Référence du virement bancaire','ad.hash':'Hash de la transaction blockchain',
  'ad.hashH':'Collez le hash du paiement effectué. Il est vérifié (format, non réutilisé) et devient la preuve montrée à l’utilisateur.','ad.go':'Confirmer','ad.cancel':'Annuler','ad.done':'Enregistré','ad.e.forbidden':'Réservé aux administrateurs.','ad.e.invalid_state':'Son statut a changé entre-temps.',
  'ad.e.invalid_tx_hash':'Ce hash ne correspond pas au format du réseau.','ad.e.tx_hash_already_used':'Ce hash est déjà utilisé par un autre retrait.','ad.e.reason_required':'Indiquez un motif (3 caractères ou plus).','ad.e.generic':'L’action a échoué.',
  'ad.wdOn':'Retraits activés','ad.wdOnD':'Désactivés, aucune nouvelle demande de retrait (banque ou crypto) n’est acceptée. Les demandes déjà faites ne changent pas.','ad.dep':'Adresse de dépôt','ad.depNo':'Non configurée — dépôts refusés','ad.fee':'Frais de retrait',
  'ad.dyArchive':'DY (archives)','ad.dyArchiveD':'Interrupteur de suspension des transferts, retiré avec les transferts. Son historique est conservé.','ad.audit':'Chaque action est inscrite au journal d’audit.' });
Object.assign(TR.ar, { 'ad.search':'الاسم أو الهاتف أو البريد أو المعرّف','ad.noUsers':'لا يوجد مستخدم.','ad.joined':'تاريخ التسجيل','ad.all':'الكل','ad.none':'لا شيء هنا.','ad.err':'تعذّر التحميل. حاول مرة أخرى.','ad.retry':'إعادة المحاولة',
  'ad.approve':'موافقة','ad.reject':'رفض','ad.paid':'تحديد كمدفوع','ad.process':'بدء المعالجة','ad.complete':'تأكيد بمعرّف المعاملة','ad.reason':'السبب (يظهر للمستخدم)','ad.bankRef':'مرجع التحويل المصرفي','ad.hash':'معرّف المعاملة على البلوكشين',
  'ad.hashH':'الصق معرّف الدفعة التي أجريتها. يُتحقق منه (الصيغة وعدم التكرار) ويصبح الدليل الذي يراه المستخدم.','ad.go':'تأكيد','ad.cancel':'إلغاء','ad.done':'تم الحفظ','ad.e.forbidden':'للمديرين فقط.','ad.e.invalid_state':'تغيّرت حالته في الأثناء.',
  'ad.e.invalid_tx_hash':'المعرّف لا يطابق صيغة الشبكة.','ad.e.tx_hash_already_used':'هذا المعرّف مستخدم في عملية سحب أخرى.','ad.e.reason_required':'اذكر سبباً (3 أحرف أو أكثر).','ad.e.generic':'فشل الإجراء.',
  'ad.wdOn':'السحب مفعّل','ad.wdOnD':'عند الإيقاف لا يُقبل أي طلب سحب جديد (مصرفي أو رقمي). لا تتغير الطلبات السابقة.','ad.dep':'عنوان الإيداع','ad.depNo':'غير مُعدّ — الإيداع مرفوض','ad.fee':'رسوم السحب',
  'ad.dyArchive':'DY (أرشيف)','ad.dyArchiveD':'مفتاح إيقاف التحويلات، أُزيل مع التحويلات. يُحتفظ بسجله.','ad.audit':'يُسجَّل كل إجراء في سجل التدقيق.' });
Object.assign(TR.en, { 'tx.confAt':'Confirmed at','tx.new':'New transactions ({n}) — refresh','tx.confirm':'Confirm the transaction','tx.reject':'Refuse','tx.pause':'Pause','tx.paused':'Paused','tx.pausedDone':'Transaction paused — still held, you can confirm or refuse it later','tx.pending':'Pending','tx.confirmed':'Confirmed','tx.rejected':'Refused','tx.none':'No transaction waiting.',
  'tx.from':'From','tx.to':'To','tx.at':'Confirmed on {t}','tx.done':'Transaction confirmed — recipient credited','tx.already':'Already confirmed — nothing was credited twice',
  'tx.mail.SENT':'E-mail sent {t}','tx.mail.wait':'E-mail queued: sent as soon as the e-mail service accepts it','tx.mail.none':'No e-mail address for the recipient','tx.mail.SKIPPED':'E-mail not sent',
  'tx.rule':'One click: confirm, refuse or pause. Confirming credits the recipient, records the exact time and sends the confirmation e-mails. The same three buttons arrive in the e-mail sent to you for each new sending.' });
Object.assign(TR.fr, { 'tx.confAt':'Heure de confirmation','tx.new':'Nouvelles transactions ({n}) — actualiser','tx.confirm':'Confirmer la transaction','tx.reject':'Refuser','tx.pause':'Mettre en pause','tx.paused':'En pause','tx.pausedDone':'Transaction mise en pause — le montant reste réservé, vous pourrez la confirmer ou la refuser','tx.pending':'En attente','tx.confirmed':'Confirmées','tx.rejected':'Refusées','tx.none':'Aucune transaction en attente.',
  'tx.from':'De','tx.to':'À','tx.at':'Confirmée le {t}','tx.done':'Transaction confirmée — destinataire crédité','tx.already':'Déjà confirmée — rien n’a été crédité deux fois',
  'tx.mail.SENT':'E-mail envoyé {t}','tx.mail.wait':'E-mail en file : envoyé dès que le service d’e-mail l’accepte','tx.mail.none':'Le destinataire n’a pas d’adresse e-mail','tx.mail.SKIPPED':'E-mail non envoyé',
  'tx.rule':'Un clic : confirmer, refuser ou mettre en pause. Confirmer crédite le destinataire, enregistre l’heure exacte et envoie les e-mails de confirmation. Les trois mêmes boutons arrivent dans l’e-mail qui vous est envoyé pour chaque nouvel envoi.' });
Object.assign(TR.ar, { 'tx.confAt':'وقت التأكيد','tx.new':'معاملات جديدة ({n}) — تحديث','tx.confirm':'تأكيد المعاملة','tx.reject':'رفض','tx.pause':'إيقاف مؤقت','tx.paused':'متوقفة مؤقتاً','tx.pausedDone':'تم إيقاف المعاملة مؤقتاً — يبقى المبلغ محجوزاً ويمكنك تأكيدها أو رفضها لاحقاً','tx.pending':'قيد الانتظار','tx.confirmed':'المؤكدة','tx.rejected':'المرفوضة','tx.none':'لا توجد معاملات بانتظار التأكيد.',
  'tx.from':'من','tx.to':'إلى','tx.at':'أُكدت في {t}','tx.done':'تم تأكيد المعاملة — أُضيف المبلغ للمستلم','tx.already':'مؤكدة مسبقاً — لم يُضف أي مبلغ مرتين',
  'tx.mail.SENT':'أُرسل البريد {t}','tx.mail.wait':'البريد في قائمة الانتظار: يُرسل فور قبول خدمة البريد له','tx.mail.none':'لا يملك المستلم بريداً إلكترونياً','tx.mail.SKIPPED':'لم يُرسل البريد',
  'tx.rule':'نقرة واحدة: تأكيد أو رفض أو إيقاف مؤقت. التأكيد يُضيف المبلغ للمستلم ويسجّل الوقت الدقيق ويرسل رسائل التأكيد. الأزرار الثلاثة نفسها تصلك في البريد عن كل إرسال جديد.' });
/* Admin Control is bilingual like the reference: Arabic first, English under it, whatever the language of the app */
const bi = k => '<b>' + escapeHtml(TR.ar[k] || k) + '</b><small>' + escapeHtml(TR.en[k] || k) + '</small>';

const AdminDY = (() => {
  const isAdmin = () => { try { return !!(Runtime && Runtime.ctx && Runtime.ctx.role === 'admin'); } catch(e){ return false; } };
  const S = { tab: 'dash', stats: null, statsErr: false, bank: null, crypto: null, users: null, q: '', dy: null, ov: null, txs: null, txPending: null, filter: { bank: 'open', crypto: 'open', tx: 'PENDING' }, err: {} };
  const loc = () => (LANG === 'ar' ? 'ar-OM-u-nu-latn' : LANG === 'fr' ? 'fr-FR' : 'en-GB');
  const when = iso => { try { return new Date(iso).toLocaleString(loc(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch(e){ return String(iso || ''); } };
  const num = n => { try { return Number(n || 0).toLocaleString('en-US'); } catch(e){ return String(n || 0); } };
  const OMR = v => moneyHtml(CurrencyEngine.format(Number(v || 0), 'OMR'));
  const errText = e => { const m = String(e && e.message || e || ''); const k = (m.match(/[a-z_]{5,}/g) || []).find(x => TR.en['ad.e.' + x]); return t(k ? 'ad.e.' + k : 'ad.e.generic'); };
  const main = () => document.getElementById('adm-main');
  const chipSt = st => '<span class="wd-chip s-' + (st === 'CONFIRMED' ? 'success' : typeof OMXWithdraw !== 'undefined' ? OMXWithdraw.stateOf(st) : 'pending') + '">' + escapeHtml(st) + '</span>';
  const exact = iso => { try { return new Date(iso).toLocaleString(loc(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch(e){ return String(iso || ''); } };

  /* ---------- loaders ---------- */
  async function rpc(fn, args){ const { data, error } = await sb.rpc(fn, args || {}); if (error) throw error; return data; }
  async function loadStats(){
    try { S.stats = await rpc('admin_console_stats'); S.statsErr = false; } catch(e){ S.stats = null; S.statsErr = true; }
    paintSide(); if (S.tab === 'dash') paint();
  }
  async function loadTab(k, force){
    S.err[k] = false;
    try {
      if (k === 'dash' || k === 'wdBank'){ if (force || !S.bank) S.bank = (await rpc('admin_withdrawal_list', { p_status: null, p_limit: 200 })) || []; }
      if (k === 'dash' || k === 'wdCrypto'){ if (force || !S.crypto) S.crypto = (await rpc('admin_crypto_withdrawal_list', { p_status: null, p_limit: 200 })) || []; }
      if (k === 'users'){ S.users = S.q.trim().length >= 2 ? (await rpc('admin_search_users', { p_query: S.q.trim() })) || [] : (await rpc('admin_recent_users', { p_limit: 50 })) || []; }
      if (k === 'logs' && (force || !S.dy)) S.dy = await rpc('admin_dy_overview');
      if (k === 'dash' || k === 'txs'){ S.txPending = (await rpc('admin_tx_list', { p_status: 'PENDING', p_limit: 200 })) || []; }
      if (k === 'txs'){ S.txs = S.filter.tx === 'PENDING' ? S.txPending : (await rpc('admin_tx_list', { p_status: S.filter.tx, p_limit: 100 })) || []; }
      if ((k === 'assets' || k === 'settings') && (force || !S.ov)) S.ov = await rpc('crypto_withdraw_overview');
    } catch(e){ console.error('[admin]', k, e); S.err[k] = errText(e); }
    if (S.tab === k) paint();
  }

  /* ---------- sections ---------- */
  const card = (ic, k, v) => '<div class="adm-stat"><span class="adm-si">' + icon(ic, 22) + '</span><span class="adm-sl">' + bi(k) + '</span><span class="adm-sv ltr" dir="ltr">' + v + '</span></div>';
  const head = (ic, k) => '<section class="adm-card adm-head"><span class="dy-ico">' + icon(ic, 22) + '</span><div class="adm-ht">' + bi(k) + '</div></section>';
  const errBox = k => '<section class="adm-card">' + emptyState('warn', S.err[k] || t('ad.err'), '', '<button type="button" class="btn btn-secondary" data-ad="reload">' + escapeHtml(t('ad.retry')) + '</button>') + '</section>';
  const filters = (kind, list) => '<div class="chips" role="group">' + list.map(f => '<button class="chip" data-ad-f="' + kind + ':' + f[0] + '" aria-pressed="' + (S.filter[kind] === f[0]) + '">' + escapeHtml(f[1]) + '</button>').join('') + '</div>';
  function secDash(){
    const openB = (S.bank || []).filter(x => x.status === 'PENDING' || x.status === 'APPROVED').length, openC = (S.crypto || []).filter(x => x.status === 'PENDING' || x.status === 'PROCESSING').length;
    const pend = S.txPending || [];
    return head('home', 'adm.dash') + '<section class="adm-card adm-grid">' + card('check', 'adm.txs', S.txPending ? escapeHtml(num(pend.length)) : '—') +
      card('bank', 'adm.wdBank', S.bank ? escapeHtml(num(openB)) : '—') + card('crypto', 'adm.wdCrypto', S.crypto ? escapeHtml(num(openC)) : '—') +
      card('user', 'adm.users', S.stats ? escapeHtml(num(S.stats.users)) : '—') + card('clock', 'adm.today', S.stats ? escapeHtml(num(S.stats.transactions_today)) : '—') +
      card('wallet', 'adm.bal', S.stats ? OMR(S.stats.balance_omr) : '—') + card('history', 'adm.tt', S.stats ? escapeHtml(num(S.stats.transfers_total)) : '—') + '</section>' +
      (pend.length ? '<section class="adm-card"><h2 class="dy-h">' + escapeHtml(t('adm.txs')) + '</h2>' + pend.slice(0, 5).map(txItem).join('') + '</section>' : '') +
      ((openB || openC) ? '<section class="adm-card"><h2 class="dy-h">' + escapeHtml(t('adm.open')) + '</h2>' + (S.bank || []).filter(x => x.status === 'PENDING' || x.status === 'APPROVED').slice(0, 5).map(bankItem).join('') + (S.crypto || []).filter(x => x.status === 'PENDING' || x.status === 'PROCESSING').slice(0, 5).map(cryptoItem).join('') + '</section>' : '');
  }
  function who(x){ return '<div class="ad-who"><b>' + escapeHtml(x.full_name || dispId(x.yor_id || '')) + '</b><small class="ltr" dir="ltr">' + escapeHtml([dispId(x.yor_id || ''), x.phone ? formatPhoneIntl(x.phone) : ''].filter(Boolean).join(' · ')) + '</small></div>'; }
  function bankItem(x){
    const acts = x.status === 'PENDING' ? '<button class="btn btn-primary" data-ad="b-approve" data-id="' + x.id + '">' + escapeHtml(t('ad.approve')) + '</button><button class="btn btn-secondary" data-ad="b-reject" data-id="' + x.id + '">' + escapeHtml(t('ad.reject')) + '</button>'
      : x.status === 'APPROVED' ? '<button class="btn btn-primary" data-ad="b-paid" data-id="' + x.id + '">' + escapeHtml(t('ad.paid')) + '</button>' : '';
    return '<article class="ad-item">' + '<div class="ad-row">' + who(x) + '<div class="ad-amt ltr">' + OMR(x.amount) + chipSt(x.status) + '</div></div>' +
      '<dl class="ad-dl"><div><dt>' + escapeHtml(t('wd.ref')) + '</dt><dd class="ltr">' + escapeHtml(x.reference || '') + '</dd></div><div><dt>' + escapeHtml(t('wd.holder')) + '</dt><dd>' + escapeHtml(x.holder || '') + '</dd></div>' +
      '<div><dt>' + escapeHtml(t('wd.bankSel')) + '</dt><dd>' + escapeHtml(x.bank_name || x.bank_code || '') + '</dd></div><div><dt>' + escapeHtml(t('wd.acc')) + '</dt><dd class="ltr">' + escapeHtml(x.account_number || '') + '</dd></div>' +
      (x.iban ? '<div><dt>IBAN</dt><dd class="ltr">' + escapeHtml(x.iban) + '</dd></div>' : '') + (x.paid_ref ? '<div><dt>' + escapeHtml(t('wd.bankRef')) + '</dt><dd class="ltr">' + escapeHtml(x.paid_ref) + '</dd></div>' : '') +
      (x.admin_note ? '<div><dt>' + escapeHtml(t('wd.note')) + '</dt><dd>' + escapeHtml(x.admin_note) + '</dd></div>' : '') + '<div><dt>' + escapeHtml(t('wd.date')) + '</dt><dd>' + escapeHtml(when(x.created_at)) + '</dd></div></dl>' +
      (acts ? '<div class="omx-btns">' + acts + '</div>' : '') + '</article>';
  }
  function cryptoItem(x){
    const n = (typeof OMX_NETWORKS !== 'undefined' && OMX_NETWORKS[x.network]) || { name: x.network, std: '' };
    const acts = x.status === 'PENDING' ? '<button class="btn btn-primary" data-ad="c-process" data-id="' + x.id + '">' + escapeHtml(t('ad.process')) + '</button><button class="btn btn-secondary" data-ad="c-reject" data-id="' + x.id + '">' + escapeHtml(t('ad.reject')) + '</button>'
      : x.status === 'PROCESSING' ? '<button class="btn btn-primary" data-ad="c-complete" data-id="' + x.id + '" data-net="' + escapeHtml(x.network) + '">' + escapeHtml(t('ad.complete')) + '</button><button class="btn btn-secondary" data-ad="c-reject" data-id="' + x.id + '">' + escapeHtml(t('ad.reject')) + '</button>' : '';
    const exp = x.tx_hash && n.tx ? n.tx.replace('{h}', encodeURIComponent(x.tx_hash)) : null;
    return '<article class="ad-item"><div class="ad-row">' + who(x) + '<div class="ad-amt ltr">' + (typeof omxLogo === 'function' ? omxLogo(x.asset, 22) : '') + escapeHtml(omxQty(x.amount, x.asset)) + chipSt(x.status) + '</div></div>' +
      '<dl class="ad-dl"><div><dt>' + escapeHtml(t('wd.ref')) + '</dt><dd class="ltr">' + escapeHtml(x.reference || '') + '</dd></div><div><dt>' + escapeHtml(t('wd.network')) + '</dt><dd>' + escapeHtml(n.name + (n.std ? ' (' + n.std + ')' : '')) + '</dd></div>' +
      '<div><dt>' + escapeHtml(t('wd.address')) + '</dt><dd class="ltr wd-addr-v">' + escapeHtml(x.address || '') + '</dd></div>' + (x.memo ? '<div><dt>' + escapeHtml(t('wd.memo')) + '</dt><dd class="ltr">' + escapeHtml(x.memo) + '</dd></div>' : '') +
      '<div><dt>' + escapeHtml(t('wd.netFee')) + '</dt><dd class="ltr">' + escapeHtml(omxQty(x.fee || 0, x.asset)) + '</dd></div>' +
      (x.tx_hash ? '<div><dt>' + escapeHtml(t('wd.hash')) + '</dt><dd class="ltr wd-addr-v">' + (exp ? '<a href="' + escapeHtml(exp) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(x.tx_hash) + '</a>' : escapeHtml(x.tx_hash)) + '</dd></div>' : '') +
      (x.admin_note ? '<div><dt>' + escapeHtml(t('wd.note')) + '</dt><dd>' + escapeHtml(x.admin_note) + '</dd></div>' : '') + '<div><dt>' + escapeHtml(t('wd.date')) + '</dt><dd>' + escapeHtml(when(x.created_at)) + '</dd></div></dl>' +
      (acts ? '<div class="omx-btns">' + acts + '</div>' : '') + '</article>';
  }
  /* 14.1.0 — transactions confirmed by the administrator: ONE button credits the recipient, records the exact time and queues ONE e-mail */
  const amtOf = x => (x.kind === 'CRYPTO_TRANSFER' || x.kind === 'CRYPTO_SWAP') ? (typeof omxLogo === 'function' ? omxLogo(x.asset, 20) : '') + escapeHtml(omxQty(x.amount, x.asset)) : OMR(x.amount);
  const party = p => escapeHtml((p && (p.name || dispId(p.yor_id || ''))) || '—') + (p && p.yor_id ? ' <small class="ltr" dir="ltr">' + escapeHtml(dispId(p.yor_id)) + '</small>' : '');
  function mailLine(x){
    if (x.status !== 'CONFIRMED') return '';
    if (!x.receiver || !x.receiver.has_email) return '<p class="tx-mail no">' + escapeHtml(t('tx.mail.none')) + '</p>';
    const e = x.email || {};
    if (e.status === 'SENT') return '<p class="tx-mail ok">' + icon('mail', 14) + escapeHtml(tf('tx.mail.SENT', { t: exact(e.sent_at) })) + '</p>';
    if (e.status === 'SKIPPED') return '<p class="tx-mail no">' + escapeHtml(t('tx.mail.SKIPPED')) + '</p>';
    return '<p class="tx-mail wait">' + icon('clock', 14) + escapeHtml(t('tx.mail.wait')) + '</p>';
  }
  function txItem(x){
    const pending = x.status === 'PENDING';
    return '<article class="ad-item tx-item" data-tx-item="' + x.id + '"><div class="ad-row"><div class="ad-who"><b>' + escapeHtml(t('tx.from')) + ' ' + party(x.sender) + '</b><b>' + escapeHtml(t('tx.to')) + ' ' + party(x.receiver) + '</b></div>' +
      '<div class="ad-amt ltr">' + amtOf(x) + chipSt(x.status) + (pending && x.paused ? ' <span class="wd-chip s-pending">' + escapeHtml(t('tx.paused')) + '</span>' : '') + '</div></div>' +
      '<dl class="ad-dl"><div><dt>' + escapeHtml(t('wd.ref')) + '</dt><dd class="ltr">' + escapeHtml(x.reference || '') + '</dd></div><div><dt>' + escapeHtml(t('wd.date')) + '</dt><dd>' + escapeHtml(exact(x.created_at)) + '</dd></div>' +
      (x.network ? '<div><dt>' + escapeHtml(t('wd.network')) + '</dt><dd>' + escapeHtml((OMX_NETWORKS[x.network] || { name: x.network }).name) + '</dd></div>' : '') +
      /* 14.5 — a swap: what is sold, what is received at the price fixed by the server at the request */
      (x.kind === 'CRYPTO_SWAP' && x.swap ? '<div><dt>' + escapeHtml(t('tr.swap')) + '</dt><dd class="ltr">' + escapeHtml(omxQty(x.amount, x.asset) + ' → ' + omxQty(x.swap.to_amount, x.swap.to_asset)) +
        ' <small>(' + escapeHtml((OMX_NETWORKS[x.swap.to_network] || { name: x.swap.to_network }).name) + ')</small></dd></div>' +
        '<div><dt>' + escapeHtml(t('tr.priceL')) + '</dt><dd class="ltr">' + escapeHtml(Number(x.swap.price) >= 1 ? '1 ' + x.asset + ' = ' + Number(x.swap.price).toLocaleString('en-US', { maximumFractionDigits: 4 }) + ' ' + x.swap.to_asset
          : '1 ' + x.swap.to_asset + ' = ' + (1 / Number(x.swap.price)).toLocaleString('en-US', { maximumFractionDigits: 4 }) + ' ' + x.asset) + '</dd></div>' : '') +
      (x.confirmed_at ? '<div><dt>' + escapeHtml(t('tx.confAt')) + '</dt><dd class="ltr">' + escapeHtml(exact(x.confirmed_at)) + '</dd></div>' : '') + '</dl>' +
      mailLine(x) +
      (pending ? '<div class="omx-btns"><button type="button" class="btn btn-primary tx-go" data-ad="t-confirm" data-id="' + x.id + '">' + icon('check', 18) + '<span>' + escapeHtml(t('tx.confirm')) + '</span></button>' +
        (x.paused ? '' : '<button type="button" class="btn btn-secondary" data-ad="t-pause" data-id="' + x.id + '">' + escapeHtml(t('tx.pause')) + '</button>') +
        '<button type="button" class="btn btn-ghost" data-ad="t-reject" data-id="' + x.id + '">' + escapeHtml(t('tx.reject')) + '</button></div>' : '') + '</article>';
  }
  function secTxs(){
    const top = head('check', 'adm.txs') + '<p class="omx-info">' + icon('info', 18) + '<span>' + escapeHtml(t('tx.rule')) + '</span></p>' +
      filters('tx', [['PENDING', t('tx.pending') + (S.txPending ? ' · ' + S.txPending.length : '')], ['CONFIRMED', t('tx.confirmed')], ['REJECTED', t('tx.rejected')]]);
    if (S.err.txs) return top + errBox('txs');
    if (!S.txs) return top + '<section class="adm-card">' + skeletonRows(3) + '</section>';
    return top + '<section class="adm-card">' + (S.txs.length ? S.txs.map(txItem).join('') : '<p class="dy-desc">' + escapeHtml(t('tx.none')) + '</p>') + '</section>';
  }
  async function confirmTx(id, b){
    if (b.disabled) return;
    b.disabled = true; UIKit.loading(b, true);                         /* one click: the button cannot be pressed twice; the server refuses a second credit anyway */
    try {
      const r = await rpc('admin_tx_confirm', { p_tx: id });
      toast(t(r && r.already ? 'tx.already' : 'tx.done') + (r && r.confirmed_at ? ' · ' + exact(r.confirmed_at) : ''), 'success');
      try { UIKit.haptic('success'); } catch(e){}
      /* the confirmed transaction stays WHERE IT WAS, shown as confirmed: nothing moves under the finger (a second tap can never land on the next one) */
      const it = (S.txs || []).concat(S.txPending || []).find(x => x.id === id);
      if (it){ it.status = 'CONFIRMED'; it.confirmed_at = (r && r.confirmed_at) || it.confirmed_at; it.email = it.receiver && it.receiver.has_email ? (it.email || { status: 'PENDING' }) : null; }
      S.txPending = (S.txPending || []).filter(x => x.id !== id);
      document.querySelectorAll('#adm-main [data-tx-item="' + id + '"]').forEach(a => { if (it) a.outerHTML = txItem(it); });
      const c = document.querySelector('#adm-main [data-ad-f="tx:PENDING"]'); if (c) c.textContent = t('tx.pending') + ' · ' + S.txPending.length;
    } catch(e){ console.warn('[admin] confirm refused', e); UIKit.loading(b, false); b.disabled = false; toast(errText(e), 'error'); }
  }
  function secBank(){
    if (S.err.wdBank) return head('bank', 'adm.wdBank') + errBox('wdBank');
    if (!S.bank) return head('bank', 'adm.wdBank') + '<section class="adm-card">' + skeletonRows(3) + '</section>';
    const f = S.filter.bank, l = S.bank.filter(x => f === 'all' || (f === 'open' ? (x.status === 'PENDING' || x.status === 'APPROVED') : x.status === f));
    return head('bank', 'adm.wdBank') + filters('bank', [['open', t('adm.open')], ['PAID', 'PAID'], ['REJECTED', 'REJECTED'], ['CANCELLED', 'CANCELLED'], ['all', t('ad.all')]]) +
      '<section class="adm-card">' + (l.length ? l.map(bankItem).join('') : '<p class="dy-desc">' + escapeHtml(t('ad.none')) + '</p>') + '</section>';
  }
  function secCrypto(){
    if (S.err.wdCrypto) return head('crypto', 'adm.wdCrypto') + errBox('wdCrypto');
    if (!S.crypto) return head('crypto', 'adm.wdCrypto') + '<section class="adm-card">' + skeletonRows(3) + '</section>';
    const f = S.filter.crypto, l = S.crypto.filter(x => f === 'all' || (f === 'open' ? (x.status === 'PENDING' || x.status === 'PROCESSING') : x.status === f));
    return head('crypto', 'adm.wdCrypto') + filters('crypto', [['open', t('adm.open')], ['COMPLETED', 'COMPLETED'], ['REJECTED', 'REJECTED'], ['CANCELLED', 'CANCELLED'], ['all', t('ad.all')]]) +
      '<section class="adm-card">' + (l.length ? l.map(cryptoItem).join('') : '<p class="dy-desc">' + escapeHtml(t('ad.none')) + '</p>') + '</section>';
  }
  function secUsers(){
    const list = S.users;
    return head('user', 'adm.users') + '<div class="field-box omx-search">' + icon('search', 18) + '<input type="search" id="ad-q" placeholder="' + escapeHtml(t('ad.search')) + '" value="' + escapeHtml(S.q) + '" autocomplete="off" aria-label="' + escapeHtml(t('ad.search')) + '"></div>' +
      (S.err.users ? errBox('users') : '<section class="adm-card">' + (!list ? skeletonRows(4) : !list.length ? '<p class="dy-desc">' + escapeHtml(t('ad.noUsers')) + '</p>' :
        list.map(u => '<article class="ad-item ad-user"><div class="ad-row"><div class="ad-who"><b>' + escapeHtml([u.first_name, u.last_name].filter(Boolean).join(' ') || dispId(u.yor_id || '')) + '</b><small class="ltr" dir="ltr">' + escapeHtml([dispId(u.yor_id || ''), u.phone ? formatPhoneIntl(u.phone) : '', u.email || ''].filter(Boolean).join(' · ')) + '</small></div>' +
          '<div class="ad-amt">' + chipSt(String(u.status || '').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : String(u.status || '—').toUpperCase()) + (u.role === 'admin' ? '<span class="wd-chip s-success">admin</span>' : '') + '</div></div>' +
          '<small class="ad-sub">' + escapeHtml(t('ad.joined')) + ' ' + escapeHtml(when(u.created_at)) + '</small></article>').join('')) + '</section>');
  }
  function secAssets(){
    if (S.err.assets) return head('crypto', 'adm.assets') + errBox('assets');
    if (!S.ov) return head('crypto', 'adm.assets') + '<section class="adm-card">' + skeletonRows(4) + '</section>';
    const by = {}; (S.ov.networks || []).forEach(n => { (by[n.asset] = by[n.asset] || []).push(n); });
    return head('crypto', 'adm.assets') + Object.keys(by).sort().map(sym => '<section class="adm-card"><div class="ad-row"><div class="ad-who ad-asset">' + omxLogo(sym, 30) + '<b>' + escapeHtml(sym) + '</b></div></div>' +
      by[sym].map(n => { const nn = OMX_NETWORKS[n.network] || { name: n.network, std: '' }, c = OMX_CONTRACTS[sym + '/' + n.network];
        return '<div class="omx-net">' + omxNetLogo(n.network, 28) + '<div class="omx-nt"><b>' + escapeHtml(nn.name) + ' <small>' + escapeHtml(nn.std || '') + '</small></b>' +
          '<small>' + escapeHtml(t('ad.fee')) + ' ' + escapeHtml(omxQty(n.fee || 0, sym)) + '</small>' + (c ? '<small class="omx-ct ltr" dir="ltr">' + escapeHtml(t('omx.contract')) + ' ' + escapeHtml(c) + '</small>' : '') +
          '<span class="omx-tags"><span class="omx-tag ok">' + escapeHtml(t('omx.wdOk')) + ' ✓</span><span class="omx-tag no">' + escapeHtml(t('ad.dep')) + ' : ' + escapeHtml(t('ad.depNo')) + '</span></span></div></div>'; }).join('') + '</section>').join('');
  }
  function secSettings(){
    if (S.err.settings) return head('settings', 'adm.settings') + errBox('settings');
    if (!S.ov) return head('settings', 'adm.settings') + '<section class="adm-card">' + skeletonRows(2) + '</section>';
    const on = S.ov.enabled !== false;
    return head('settings', 'adm.settings') + '<section class="dy-card"><div class="dy-row"><span class="dy-ico">' + icon('download', 22) + '</span><div class="dy-txt"><b id="ad-wd-t">' + escapeHtml(t('ad.wdOn')) + '</b><small>' + escapeHtml(t('ad.wdOnD')) + '</small></div>' +
      '<button type="button" class="switch" role="switch" aria-checked="' + on + '" aria-labelledby="ad-wd-t" data-ad="wd-toggle"></button></div><p class="dy-desc">' + escapeHtml(t('ad.audit')) + '</p></section>';
  }
  function secLogs(){
    if (S.err.logs) return head('doc', 'adm.logs') + errBox('logs');
    if (!S.dy) return head('doc', 'adm.logs') + '<section class="adm-card">' + skeletonRows(3) + '</section>';
    const st = S.dy, hist = Array.isArray(st.history) ? st.history : [];
    return head('doc', 'adm.logs') + '<section class="dy-card"><h2 class="dy-h">' + escapeHtml(t('ad.dyArchive')) + '</h2><p class="dy-desc">' + escapeHtml(t('ad.dyArchiveD')) + '</p>' +
      '<div class="dy-meta"><span>' + escapeHtml(t('dy.last')) + '</span><b>' + (st.updatedAt && (hist.length || st.updatedBy) ? escapeHtml(when(st.updatedAt)) + (st.updatedBy ? ' · ' + escapeHtml(t('dy.by')) + ' ' + escapeHtml(st.updatedBy) : '') : escapeHtml(t('dy.never'))) + '</b></div>' +
      '<div class="dy-state ' + (st.enabled ? 'on' : 'off') + '" role="status">' + escapeHtml(t(st.enabled ? 'dy.on' : 'dy.off')) + '</div></section>' +
      '<section class="dy-card"><h2 class="dy-h">' + escapeHtml(t('dy.blocked')) + '</h2><div class="dy-stats"><div><b class="ltr" dir="ltr">' + escapeHtml(num(st.blocked24h)) + '</b><small>' + escapeHtml(t('dy.b24')) + '</small></div>' +
        '<div><b class="ltr" dir="ltr">' + escapeHtml(num(st.blockedTotal)) + '</b><small>' + escapeHtml(t('dy.bAll')) + '</small></div></div></section>' +
      '<section class="dy-card"><h2 class="dy-h">' + escapeHtml(t('dy.history')) + '</h2>' + (hist.length ? '<ul class="dy-hist">' + hist.map(x => '<li><span class="dy-dot ' + (x.enabled ? 'on' : 'off') + '"></span><span>' + escapeHtml(t(x.enabled ? 'dy.hOn' : 'dy.hOff')) +
        (x.by ? ' · ' + escapeHtml(x.by) : '') + '</span><small class="ltr" dir="ltr">' + escapeHtml(when(x.at)) + '</small></li>').join('') + '</ul>' : '<p class="dy-desc">' + escapeHtml(t('dy.histEmpty')) + '</p>') + '</section>';
  }
  const SECTIONS = { dash: secDash, txs: secTxs, users: secUsers, wdBank: secBank, wdCrypto: secCrypto, assets: secAssets, settings: secSettings, logs: secLogs };
  function paint(){
    const h = main(); if (!h) return;
    h.innerHTML = SECTIONS[S.tab]();
    document.querySelectorAll('#dy-control [data-adm]').forEach(b => { const on = b.getAttribute('data-adm') === S.tab; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
    if (S.tab === 'users'){ const q = document.getElementById('ad-q'); if (q){ let tm = 0; q.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { S.q = q.value; S.users = null; paintList(); loadTab('users'); }, 300); }; } }
  }
  function paintList(){ /* keeps the search field (and the keyboard) while the list reloads */
    const box = document.querySelector('#adm-main .adm-card:last-child'); if (box && S.tab === 'users') box.innerHTML = skeletonRows(4);
  }
  function paintSide(){
    const h = document.getElementById('adm-right'); if (!h) return;
    h.innerHTML =
      '<section class="adm-card adm-brand">' + omLogoHtml(120) + '<div class="adm-bt">Admin Control</div></section>' +
      '<section class="adm-card adm-status ' + (S.statsErr ? 'bad' : 'ok') + '"><span class="adm-chk">' + icon(S.statsErr ? 'close' : 'check', 28) + '</span><div class="adm-sl">' + bi('adm.status') + '</div>' +
        '<div class="adm-pill" role="status">' + escapeHtml(TR.ar[S.statsErr ? 'adm.offline' : 'adm.online']) + '<small>' + escapeHtml(TR.en[S.statsErr ? 'adm.offline' : 'adm.online']) + '</small></div></section>';
  }

  /* ---------- actions (each one asks, the server decides) ---------- */
  function ask(title, field, onGo){
    const close = R.overlay.open('<div class="po-sheet"><h2>' + escapeHtml(title) + '</h2>' +
      (field ? '<label class="ad-lbl" for="ad-in">' + escapeHtml(field.label) + '</label><input id="ad-in" class="input ltr" dir="auto" autocomplete="off" spellcheck="false">' + (field.hint ? '<small class="wd-hint">' + escapeHtml(field.hint) + '</small>' : '') : '') +
      '<div class="field-err" id="ad-err" role="alert"></div><button type="button" class="btn btn-primary" id="ad-go">' + escapeHtml(t('ad.go')) + '</button><button type="button" class="btn btn-ghost" id="ad-no">' + escapeHtml(t('ad.cancel')) + '</button></div>', { kind: 'modal' });
    setTimeout(() => {
      const go = document.getElementById('ad-go'), no = document.getElementById('ad-no'), err = document.getElementById('ad-err'), inp = document.getElementById('ad-in'); if (!go) return;
      if (inp) inp.focus();
      no.onclick = () => close();
      go.onclick = async () => {
        const v = inp ? inp.value.trim() : '';
        if (field && field.min && v.length < field.min){ err.textContent = field.minMsg || t('ad.e.reason_required'); return; }
        err.textContent = ''; UIKit.loading(go, true);
        try { await onGo(v); close(); toast(t('ad.done'), 'success'); }
        catch(e){ console.warn('[admin] action refused', e); UIKit.loading(go, false); err.textContent = errText(e); }
      };
    }, 60);
  }
  async function act(a, id, b){
    const reload = async k => { await loadTab(k, true); if (S.tab === 'dash') await loadTab('dash', true); };
    if (a === 't-confirm') return confirmTx(id, b);
    if (a === 't-pause'){ try { await rpc('admin_tx_pause', { p_tx: id }); toast(t('tx.pausedDone'), 'success'); } catch(e){ console.warn('[admin] pause refused', e); toast(errText(e), 'error'); } return reload('txs'); }
    if (a === 't-reject') return ask(t('tx.reject'), { label: t('ad.reason'), min: 3 }, async v => { await rpc('admin_tx_reject', { p_tx: id, p_reason: v }); await reload('txs'); });
    if (a === 'b-approve') ask(t('ad.approve'), null, async () => { await rpc('admin_withdrawal_decide', { p_id: id, p_approve: true, p_note: null }); await reload('wdBank'); });
    else if (a === 'b-reject') ask(t('ad.reject'), { label: t('ad.reason'), min: 3 }, async v => { await rpc('admin_withdrawal_decide', { p_id: id, p_approve: false, p_note: v }); await reload('wdBank'); });
    else if (a === 'b-paid') ask(t('ad.paid'), { label: t('ad.bankRef'), min: 3, minMsg: t('ad.bankRef') }, async v => { await rpc('admin_withdrawal_mark_paid', { p_id: id, p_bank_ref: v }); await reload('wdBank'); });
    else if (a === 'c-process') ask(t('ad.process'), null, async () => { await rpc('admin_crypto_withdrawal_process', { p_id: id }); await reload('wdCrypto'); });
    else if (a === 'c-reject') ask(t('ad.reject'), { label: t('ad.reason'), min: 3 }, async v => { await rpc('admin_crypto_withdrawal_reject', { p_id: id, p_reason: v }); await reload('wdCrypto'); });
    else if (a === 'c-complete'){
      ask(t('ad.complete'), { label: t('ad.hash'), hint: t('ad.hashH'), min: 32, minMsg: t('ad.e.invalid_tx_hash') }, async v => { await rpc('admin_crypto_withdrawal_complete', { p_id: id, p_tx_hash: v }); await reload('wdCrypto'); });
    }
    else if (a === 'wd-toggle'){
      const next = !(S.ov && S.ov.enabled !== false);
      ask(t('ad.wdOn') + ' — ' + (next ? 'ON' : 'OFF'), null, async () => { await rpc('admin_set_setting', { p_key: 'withdraw_enabled', p_value: next }); S.ov = null; await loadTab('settings', true); });
    }
  }

  function render(){
    if (!isAdmin()){ setTimeout(() => R.go('home', { reset: true }), 0); return ''; }
    const p = Runtime.profile || {}, me = [p.firstName, p.lastName].filter(Boolean).join(' ') || t('adm.role');
    const nav = (ic, k, attrs) => '<button type="button" class="adm-nav" ' + attrs + '><span class="adm-ni">' + icon(ic, 22) + '</span><span class="adm-nl">' + bi(k) + '</span></button>';
    const tabs = [['dash', 'home', 'adm.dash'], ['txs', 'check', 'adm.txs'], ['wdBank', 'bank', 'adm.wdBank'], ['wdCrypto', 'crypto', 'adm.wdCrypto'], ['users', 'user', 'adm.users'], ['assets', 'network', 'adm.assets'], ['settings', 'settings', 'adm.settings'], ['logs', 'doc', 'adm.logs']];
    return '<div class="adm"><header class="adm-top"><button class="hub-circ" data-action="back" aria-label="' + escapeHtml(t('ui.back')) + '">' + icon('back', 22) + '</button>' +
        '<div class="adm-ttl"><h1>' + escapeHtml(TR.ar['dy.sub']) + '</h1><small>' + escapeHtml(TR.en['dy.sub']) + '</small></div>' +
        '<div class="adm-me"><span class="px-ava" aria-hidden="true">' + escapeHtml(pxInitials(p)) + '</span><span class="adm-mt"><b>' + escapeHtml(me) + '</b><small>' + escapeHtml(TR.en['adm.role']) + '</small></span></div></header>' +
      '<nav class="adm-tabs chips" aria-label="Admin">' + tabs.map(x => '<button type="button" class="chip" data-adm="' + x[0] + '">' + escapeHtml(t(x[2])) + '</button>').join('') + '<button type="button" class="chip" data-nav="payouts">' + escapeHtml(t('adm.transfers')) + '</button></nav>' +
      '<aside class="adm-side">' + omLogoHtml(110) + tabs.map(x => nav(x[1], x[2], 'data-adm="' + x[0] + '"')).join('') + nav('history', 'adm.transfers', 'data-nav="payouts"') + nav('logout', 'adm.exit', 'data-nav="home"') + '</aside>' +
      '<main class="adm-main" id="adm-main" aria-live="polite"></main>' +
      '<aside class="adm-right" id="adm-right"></aside>' +
      '<section class="adm-card adm-notes"><span class="dy-ico">' + icon('info', 22) + '</span><div><b>' + escapeHtml(TR.ar['adm.note']) + ':</b><ul><li>' + escapeHtml(TR.ar['adm.n1']) + '</li><li>' + escapeHtml(TR.ar['adm.n2']) + '</li></ul></div>' +
        '<div class="adm-en"><b>' + escapeHtml(TR.en['adm.note']) + ':</b><ul><li>' + escapeHtml(TR.en['adm.n1']) + '</li><li>' + escapeHtml(TR.en['adm.n2']) + '</li></ul></div></section></div>';
  }
  function bind(el){
    paint(); paintSide(); loadStats(); loadTab(S.tab, true);
    clearInterval(S.poll);
    /* new transactions are announced, never inserted under the finger: the list changes only when the administrator asks */
    S.poll = setInterval(async () => {
      if (document.visibilityState === 'hidden' || R.current() !== 'dy-control' || (S.tab !== 'txs' && S.tab !== 'dash')) return;
      try {
        const fresh = (await rpc('admin_tx_list', { p_status: 'PENDING', p_limit: 200 })) || [];
        const shown = new Set([...document.querySelectorAll('#adm-main [data-tx-item]')].map(a => a.getAttribute('data-tx-item')));
        const n = fresh.filter(x => !shown.has(x.id)).length, m = main();
        let bar = m && m.querySelector('.tx-new');
        if (n && m && !bar){ m.insertAdjacentHTML('afterbegin', '<button type="button" class="tx-new" data-ad="reload"></button>'); bar = m.querySelector('.tx-new'); }
        if (bar){ if (n) bar.textContent = tf('tx.new', { n: n }); else bar.remove(); }
      } catch(e){ /* next tick */ }
    }, 20000);
    R.onLeave(() => clearInterval(S.poll));
    if (el.__dyBound) return;
    el.__dyBound = true;
    el.addEventListener('click', e => {
      const nv = e.target.closest && e.target.closest('[data-adm]');
      if (nv){ S.tab = nv.getAttribute('data-adm'); paint(); loadTab(S.tab, S.tab !== 'users'); const m = main(); if (m && m.scrollIntoView && window.innerWidth < 1000) m.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      const f = e.target.closest && e.target.closest('[data-ad-f]');
      if (f){ const p = f.getAttribute('data-ad-f').split(':'); S.filter[p[0]] = p[1]; if (p[0] === 'tx'){ S.txs = null; paint(); loadTab('txs', true); return; } paint(); return; }
      const b = e.target.closest && e.target.closest('[data-ad]'); if (!b) return;
      const a = b.getAttribute('data-ad');
      if (a === 'reload'){ loadTab(S.tab, true); paint(); }
      else act(a, b.getAttribute('data-id'), b);
    });
  }
  function init(){
    R.register({ 'dy-control': render });
    R.on(info => { try { if (info.id === 'dy-control' && info.el.querySelector('#adm-main')) bind(info.el); } catch(e){ console.error('[admin]', e); } });
  }
  init();
  return { isAdmin, state: S };
})();
