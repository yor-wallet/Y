'use strict';

/* ============================================================
   DYT 14 — WITHDRAWALS (Retrait — Withdraw)
   - to an Omani bank account in OMR: withdraw_overview / withdraw_request / withdraw_cancel (existing rules, unchanged: minimum, KYC, 3 open requests, bank list, IBAN check)
   - crypto to an external address: crypto_withdraw_overview / crypto_withdraw_request (server-checked PIN grant, address format, network) / crypto_withdraw_cancel
   Crypto withdrawals are paid MANUALLY by an administrator who records the real blockchain hash; nothing is shown as confirmed before that.
   The tracking screen shows the REAL status of the request; its animation is chosen from that status only.
   ============================================================ */
Object.assign(TR.en, {
  'wd.t':'Withdraw','wd.sub':'Choose where the money goes','wd.bank':'To a bank account','wd.bankD':'Omani rial · Omani banks · checked by our team','wd.crypto':'Crypto to an external address','wd.cryptoD':'Choose the crypto and the network · paid after review',
  'wd.mine':'Your withdrawals','wd.none':'No withdrawal yet','wd.noneD':'Your withdrawal requests and their real status will appear here.','wd.load':'Loading…','wd.loadErr':'Your withdrawals could not be loaded.','wd.retry':'Try again',
  'wd.avail':'Available','wd.min':'Minimum {v}','wd.amount':'Amount','wd.holder':'Account holder name','wd.bankSel':'Bank','wd.bankPick':'Choose your bank','wd.acc':'Account number','wd.iban':'IBAN (optional)','wd.ibanH':'OM + 21 characters, e.g. OM81 0180 0000 0123 4567 890',
  'wd.fee':'Fee','wd.network':'Network','wd.netFee':'Network fee','wd.address':'Destination address','wd.addrPh':'Paste the address','wd.paste':'Paste','wd.memo':'Destination tag (optional)','wd.memoH':'Numbers only. Required by most exchanges on XRP.',
  'wd.max':'Max','wd.final':'Amount received','wd.total':'Total debited','wd.asset':'Crypto','wd.pickAsset':'Choose the crypto','wd.noCrypto':'No crypto balance to withdraw','wd.noCryptoD':'A withdrawal needs an available crypto balance.',
  'wd.continue':'Continue','wd.review':'Check your withdrawal','wd.check':'I have checked the address and the network. A blockchain transfer cannot be reversed.','wd.checkBank':'I have checked the bank details.','wd.confirm':'Confirm the withdrawal',
  'wd.warnAddr':'Send only to a {a} address on {n}. Another network would lose the funds.','wd.manual':'Reviewed then paid by our team. You see each real step here.',
  'wd.err.amount':'Enter a valid amount.','wd.err.min':'The minimum is {v}.','wd.err.funds':'The amount and the fee exceed your available balance.','wd.err.holder':'Enter the holder’s full name (3 to 80 characters).','wd.err.bank':'Choose a bank.','wd.err.acc':'Enter a valid account number (4 to 34 letters or digits).',
  'wd.err.iban':'This IBAN is not valid.','wd.err.addr':'This is not a valid {n} address.','wd.err.memo':'The tag contains numbers only (up to 10 digits).','wd.err.net':'Choose a network.',
  'wd.e.idempotency_key_required':'The request could not be prepared. Try again.','wd.e.withdraw_disabled':'Withdrawals are paused for now.','wd.e.kyc_required':'Verify your identity before withdrawing.','wd.e.amount_out_of_range':'The amount is below the minimum.',
  'wd.e.invalid_holder':'The holder name is not valid.','wd.e.invalid_bank':'This bank is not available.','wd.e.invalid_account':'The account number is not valid.','wd.e.invalid_iban':'This IBAN is not valid.','wd.e.too_many_open':'You already have 3 withdrawals in progress.',
  'wd.e.insufficient_balance':'Insufficient available balance.','wd.e.invalid_address':'This address is not valid for the network.','wd.e.internal_address_not_allowed':'This address belongs to DYT. Choose an external address.','wd.e.invalid_memo':'The tag is not valid.',
  'wd.e.invalid_amount':'The amount is not valid.','wd.e.unsupported_asset_network':'This crypto is not available on this network.','wd.e.sender_inactive':'Your account cannot make withdrawals.','wd.e.pin_required':'Confirm with your code.','wd.e.invalid_state':'This request can no longer be changed.',
  'wd.e.unknown':'The withdrawal could not be sent.','wd.e.uncertain':'No answer from the server. Check your withdrawals before trying again: the same request will never be counted twice.',
  'wd.st.prep':'Submitted','wd.st.verif':'','wd.st.proc':'In progress','wd.st.wait':'In progress','wd.st.done':'Completed','wd.st.fail':'Failed','wd.st.cancel':'Cancelled',
  'wd.s.SUBMIT':'Preparing your request…','wd.s.PENDING':'In progress','wd.s.APPROVED':'In progress','wd.s.PROCESSING':'In progress',
  'wd.s.PAID':'Paid to your bank account','wd.s.COMPLETED':'Confirmed on the blockchain','wd.s.REJECTED':'Refused — the amount was returned to your balance','wd.s.CANCELLED':'Cancelled — the amount was returned to your balance','wd.s.FAILED':'Not sent','wd.s.UNKNOWN':'Status unknown',
  'wd.ref':'Reference','wd.date':'Date','wd.hash':'Blockchain hash','wd.explorer':'View on the explorer','wd.bankRef':'Bank reference','wd.note':'Reason','wd.cancel':'Cancel the withdrawal','wd.cancelQ':'Cancel this withdrawal? The amount returns to your available balance.','wd.cancelled':'Withdrawal cancelled',
  'wd.receipt':'Receipt (PDF)','wd.share':'Share','wd.back':'Back to withdrawals','wd.again':'Try again','wd.title.bank':'Bank withdrawal','wd.title.crypto':'Crypto withdrawal','wd.yes':'Yes, cancel','wd.no':'Keep it',
  'op.CRYPTO_WITHDRAWAL':'Crypto withdrawal','op.BANK_WITHDRAWAL':'Bank withdrawal',
  'wd.updated':'Updated {t}'
});
Object.assign(TR.fr, {
  'wd.t':'Retrait','wd.sub':'Choisissez où va l’argent','wd.bank':'Vers un compte bancaire','wd.bankD':'Rial omanais · banques omanaises · vérifié par notre équipe','wd.crypto':'Crypto vers une adresse externe','wd.cryptoD':'Choisissez la crypto et le réseau · payé après vérification',
  'wd.mine':'Vos retraits','wd.none':'Aucun retrait','wd.noneD':'Vos demandes de retrait et leur statut réel apparaîtront ici.','wd.load':'Chargement…','wd.loadErr':'Vos retraits n’ont pas pu être chargés.','wd.retry':'Réessayer',
  'wd.avail':'Disponible','wd.min':'Minimum {v}','wd.amount':'Montant','wd.holder':'Nom du titulaire du compte','wd.bankSel':'Banque','wd.bankPick':'Choisissez votre banque','wd.acc':'Numéro de compte','wd.iban':'IBAN (facultatif)','wd.ibanH':'OM + 21 caractères, ex. OM81 0180 0000 0123 4567 890',
  'wd.fee':'Frais','wd.network':'Réseau','wd.netFee':'Frais de réseau','wd.address':'Adresse de destination','wd.addrPh':'Collez l’adresse','wd.paste':'Coller','wd.memo':'Tag de destination (facultatif)','wd.memoH':'Chiffres uniquement. Exigé par la plupart des plateformes sur XRP.',
  'wd.max':'Max','wd.final':'Montant reçu','wd.total':'Total débité','wd.asset':'Crypto','wd.pickAsset':'Choisissez la crypto','wd.noCrypto':'Aucun solde crypto à retirer','wd.noCryptoD':'Un retrait nécessite un solde crypto disponible.',
  'wd.continue':'Continuer','wd.review':'Vérifiez votre retrait','wd.check':'J’ai vérifié l’adresse et le réseau. Un transfert blockchain est irréversible.','wd.checkBank':'J’ai vérifié les coordonnées bancaires.','wd.confirm':'Confirmer le retrait',
  'wd.warnAddr':'Envoyez uniquement vers une adresse {a} sur {n}. Un autre réseau ferait perdre les fonds.','wd.manual':'Vérifié puis payé par notre équipe. Vous voyez ici chaque étape réelle.',
  'wd.err.amount':'Saisissez un montant valide.','wd.err.min':'Le minimum est de {v}.','wd.err.funds':'Le montant et les frais dépassent votre solde disponible.','wd.err.holder':'Saisissez le nom complet du titulaire (3 à 80 caractères).','wd.err.bank':'Choisissez une banque.','wd.err.acc':'Saisissez un numéro de compte valide (4 à 34 lettres ou chiffres).',
  'wd.err.iban':'Cet IBAN n’est pas valide.','wd.err.addr':'Ce n’est pas une adresse {n} valide.','wd.err.memo':'Le tag ne contient que des chiffres (10 au maximum).','wd.err.net':'Choisissez un réseau.',
  'wd.e.idempotency_key_required':'La demande n’a pas pu être préparée. Réessayez.','wd.e.withdraw_disabled':'Les retraits sont suspendus pour le moment.','wd.e.kyc_required':'Vérifiez votre identité avant de retirer.','wd.e.amount_out_of_range':'Le montant est inférieur au minimum.',
  'wd.e.invalid_holder':'Le nom du titulaire n’est pas valide.','wd.e.invalid_bank':'Cette banque n’est pas disponible.','wd.e.invalid_account':'Le numéro de compte n’est pas valide.','wd.e.invalid_iban':'Cet IBAN n’est pas valide.','wd.e.too_many_open':'Vous avez déjà 3 retraits en cours.',
  'wd.e.insufficient_balance':'Solde disponible insuffisant.','wd.e.invalid_address':'Cette adresse n’est pas valide pour le réseau.','wd.e.internal_address_not_allowed':'Cette adresse appartient à DYT. Choisissez une adresse externe.','wd.e.invalid_memo':'Le tag n’est pas valide.',
  'wd.e.invalid_amount':'Le montant n’est pas valide.','wd.e.unsupported_asset_network':'Cette crypto n’est pas disponible sur ce réseau.','wd.e.sender_inactive':'Votre compte ne peut pas effectuer de retrait.','wd.e.pin_required':'Confirmez avec votre code.','wd.e.invalid_state':'Cette demande ne peut plus être modifiée.',
  'wd.e.unknown':'Le retrait n’a pas pu être envoyé.','wd.e.uncertain':'Aucune réponse du serveur. Vérifiez vos retraits avant de réessayer : la même demande ne sera jamais comptée deux fois.',
  'wd.st.prep':'Soumis','wd.st.verif':'','wd.st.proc':'En cours','wd.st.wait':'En cours','wd.st.done':'Terminé','wd.st.fail':'Échec','wd.st.cancel':'Annulé',
  'wd.s.SUBMIT':'Préparation de votre demande…','wd.s.PENDING':'En cours','wd.s.APPROVED':'En cours','wd.s.PROCESSING':'En cours',
  'wd.s.PAID':'Payé sur votre compte bancaire','wd.s.COMPLETED':'Confirmé sur la blockchain','wd.s.REJECTED':'Refusé — le montant a été restitué sur votre solde','wd.s.CANCELLED':'Annulé — le montant a été restitué sur votre solde','wd.s.FAILED':'Non envoyé','wd.s.UNKNOWN':'Statut inconnu',
  'wd.ref':'Référence','wd.date':'Date','wd.hash':'Hash blockchain','wd.explorer':'Voir sur l’explorateur','wd.bankRef':'Référence bancaire','wd.note':'Motif','wd.cancel':'Annuler le retrait','wd.cancelQ':'Annuler ce retrait ? Le montant revient sur votre solde disponible.','wd.cancelled':'Retrait annulé',
  'wd.receipt':'Reçu (PDF)','wd.share':'Partager','wd.back':'Retour aux retraits','wd.again':'Réessayer','wd.title.bank':'Retrait bancaire','wd.title.crypto':'Retrait crypto','wd.yes':'Oui, annuler','wd.no':'Le garder',
  'op.CRYPTO_WITHDRAWAL':'Retrait crypto','op.BANK_WITHDRAWAL':'Retrait bancaire',
  'wd.updated':'Mis à jour {t}'
});
Object.assign(TR.ar, {
  'wd.t':'سحب','wd.sub':'اختر وجهة الأموال','wd.bank':'إلى حساب مصرفي','wd.bankD':'ريال عماني · بنوك عُمانية · يراجعه فريقنا','wd.crypto':'عملة رقمية إلى عنوان خارجي','wd.cryptoD':'اختر العملة والشبكة · يُدفع بعد المراجعة',
  'wd.mine':'عمليات السحب','wd.none':'لا توجد عمليات سحب','wd.noneD':'ستظهر هنا طلبات السحب وحالتها الحقيقية.','wd.load':'جارٍ التحميل…','wd.loadErr':'تعذّر تحميل عمليات السحب.','wd.retry':'إعادة المحاولة',
  'wd.avail':'المتاح','wd.min':'الحد الأدنى {v}','wd.amount':'المبلغ','wd.holder':'اسم صاحب الحساب','wd.bankSel':'البنك','wd.bankPick':'اختر بنكك','wd.acc':'رقم الحساب','wd.iban':'رقم الآيبان (اختياري)','wd.ibanH':'OM + 21 حرفاً، مثال OM81 0180 0000 0123 4567 890',
  'wd.fee':'الرسوم','wd.network':'الشبكة','wd.netFee':'رسوم الشبكة','wd.address':'عنوان الوجهة','wd.addrPh':'الصق العنوان','wd.paste':'لصق','wd.memo':'وسم الوجهة (اختياري)','wd.memoH':'أرقام فقط. تطلبه معظم المنصات على شبكة XRP.',
  'wd.max':'الحد الأقصى','wd.final':'المبلغ المستلم','wd.total':'إجمالي الخصم','wd.asset':'العملة','wd.pickAsset':'اختر العملة','wd.noCrypto':'لا يوجد رصيد رقمي للسحب','wd.noCryptoD':'يتطلب السحب رصيداً رقمياً متاحاً.',
  'wd.continue':'متابعة','wd.review':'راجع عملية السحب','wd.check':'تحققت من العنوان والشبكة. لا يمكن عكس التحويل على البلوكشين.','wd.checkBank':'تحققت من البيانات المصرفية.','wd.confirm':'تأكيد السحب',
  'wd.warnAddr':'أرسل فقط إلى عنوان {a} على شبكة {n}. أي شبكة أخرى ستُفقد الأموال.','wd.manual':'يراجعه فريقنا ثم يدفعه. ترى هنا كل خطوة حقيقية.',
  'wd.err.amount':'أدخل مبلغاً صحيحاً.','wd.err.min':'الحد الأدنى {v}.','wd.err.funds':'المبلغ والرسوم تتجاوز رصيدك المتاح.','wd.err.holder':'أدخل الاسم الكامل لصاحب الحساب (3 إلى 80 حرفاً).','wd.err.bank':'اختر بنكاً.','wd.err.acc':'أدخل رقم حساب صحيحاً (4 إلى 34 حرفاً أو رقماً).',
  'wd.err.iban':'رقم الآيبان غير صحيح.','wd.err.addr':'هذا ليس عنوان {n} صحيحاً.','wd.err.memo':'الوسم أرقام فقط (10 أرقام كحد أقصى).','wd.err.net':'اختر شبكة.',
  'wd.e.idempotency_key_required':'تعذّر تجهيز الطلب. حاول مرة أخرى.','wd.e.withdraw_disabled':'السحب متوقف حالياً.','wd.e.kyc_required':'وثّق هويتك قبل السحب.','wd.e.amount_out_of_range':'المبلغ أقل من الحد الأدنى.',
  'wd.e.invalid_holder':'اسم صاحب الحساب غير صحيح.','wd.e.invalid_bank':'هذا البنك غير متاح.','wd.e.invalid_account':'رقم الحساب غير صحيح.','wd.e.invalid_iban':'رقم الآيبان غير صحيح.','wd.e.too_many_open':'لديك بالفعل 3 عمليات سحب قيد التنفيذ.',
  'wd.e.insufficient_balance':'الرصيد المتاح غير كافٍ.','wd.e.invalid_address':'هذا العنوان غير صالح لهذه الشبكة.','wd.e.internal_address_not_allowed':'هذا العنوان تابع لـ DYT. اختر عنواناً خارجياً.','wd.e.invalid_memo':'الوسم غير صحيح.',
  'wd.e.invalid_amount':'المبلغ غير صحيح.','wd.e.unsupported_asset_network':'هذه العملة غير متاحة على هذه الشبكة.','wd.e.sender_inactive':'لا يمكن لحسابك إجراء عمليات سحب.','wd.e.pin_required':'أكّد برمزك.','wd.e.invalid_state':'لم يعد بالإمكان تعديل هذا الطلب.',
  'wd.e.unknown':'تعذّر إرسال طلب السحب.','wd.e.uncertain':'لا يوجد رد من الخادم. تحقق من عمليات السحب قبل إعادة المحاولة: لن يُحتسب الطلب نفسه مرتين أبداً.',
  'wd.st.prep':'تم الإرسال','wd.st.verif':'','wd.st.proc':'قيد التنفيذ','wd.st.wait':'قيد التنفيذ','wd.st.done':'مكتمل','wd.st.fail':'فشل','wd.st.cancel':'أُلغي',
  'wd.s.SUBMIT':'جارٍ تحضير طلبك…','wd.s.PENDING':'قيد التنفيذ','wd.s.APPROVED':'قيد التنفيذ','wd.s.PROCESSING':'قيد التنفيذ',
  'wd.s.PAID':'تم الدفع إلى حسابك المصرفي','wd.s.COMPLETED':'مؤكد على البلوكشين','wd.s.REJECTED':'مرفوض — أُعيد المبلغ إلى رصيدك','wd.s.CANCELLED':'أُلغي — أُعيد المبلغ إلى رصيدك','wd.s.FAILED':'لم يُرسل','wd.s.UNKNOWN':'الحالة غير معروفة',
  'wd.ref':'المرجع','wd.date':'التاريخ','wd.hash':'معرّف المعاملة على البلوكشين','wd.explorer':'عرض في المستكشف','wd.bankRef':'المرجع المصرفي','wd.note':'السبب','wd.cancel':'إلغاء السحب','wd.cancelQ':'إلغاء هذا السحب؟ يعود المبلغ إلى رصيدك المتاح.','wd.cancelled':'أُلغي السحب',
  'wd.receipt':'الإيصال (PDF)','wd.share':'مشاركة','wd.back':'العودة إلى عمليات السحب','wd.again':'إعادة المحاولة','wd.title.bank':'سحب مصرفي','wd.title.crypto':'سحب رقمي','wd.yes':'نعم، إلغاء','wd.no':'الإبقاء عليه',
  'op.CRYPTO_WITHDRAWAL':'سحب رقمي','op.BANK_WITHDRAWAL':'سحب مصرفي',
  'wd.updated':'آخر تحديث {t}'
});

const OMXWithdraw = (() => {
  const S = { bank: null, crypto: null, loadErr: false, loading: false, form: { b: {}, c: {} }, review: null, track: null, pollT: 0, at: 0 };
  const ADDR = {
    bitcoin: /^(bc1[02-9ac-hj-np-z]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/, litecoin: /^(ltc1[02-9ac-hj-np-z]{11,71}|[LM3][1-9A-HJ-NP-Za-km-z]{26,33})$/,
    ethereum: /^0x[0-9a-fA-F]{40}$/, bsc: /^0x[0-9a-fA-F]{40}$/, polygon: /^0x[0-9a-fA-F]{40}$/, tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
    solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, xrp: /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/
  };
  const OMR = v => moneyHtml(CurrencyEngine.format(v, 'OMR'));
  const OMRt = v => CurrencyEngine.format(v, 'OMR');
  const dt = ms => { try { return new Date(ms).toLocaleString(LANG === 'ar' ? 'ar-OM-u-nu-latn' : LANG === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch(e){ return ''; } };
  const ms = v => v ? new Date(v).getTime() : 0;
  const top = (title, back) => refTop(title, back);
  const errText = e => { const m = String(e && (e.message || e.code) || e || ''); const k = (m.match(/[a-z_]{5,}/g) || []).find(x => TR.en['wd.e.' + x]); return t(k ? 'wd.e.' + k : 'wd.e.unknown'); };
  const isNetErr = e => { const m = String(e && e.message || e || ''); return /Failed to fetch|NetworkError|network|timeout|aborted|Load failed/i.test(m) && !/[a-z]+_[a-z_]+/.test(m); };
  const bankName = b => b ? (b[LANG] || b.en || b.code) : '';

  /* ---------- data ---------- */
  async function load(force){
    if (S.loading) return;
    if (!force && S.bank && S.crypto && Date.now() - S.at < 15000) return;
    S.loading = true;
    try {
      const [b, c] = await Promise.all([sb.rpc('withdraw_overview'), sb.rpc('crypto_withdraw_overview')]);
      if (b.error) throw b.error; if (c.error) throw c.error;
      S.bank = b.data || {}; S.crypto = c.data || {}; S.loadErr = false; S.at = Date.now();
      if (typeof OMX !== 'undefined'){ OMX.state.wdNets = S.crypto.networks || []; }
    } catch(e){ S.loadErr = true; console.warn('[withdraw] load', e); }
    finally { S.loading = false; }
  }
  function allItems(){
    const b = ((S.bank && S.bank.items) || []).map(x => ({ kind: 'bank', id: x.id, reference: x.reference, status: x.status, amount: Number(x.amount), at: ms(x.created_at), raw: x }));
    const c = ((S.crypto && S.crypto.items) || []).map(x => ({ kind: 'crypto', id: x.id, reference: x.reference, status: x.status, amount: Number(x.amount), asset: x.asset, at: ms(x.created_at), raw: x }));
    return b.concat(c).sort((x, y) => y.at - x.at);
  }
  const stateOf = st => ({ PAID: 'success', COMPLETED: 'success', REJECTED: 'failed', CANCELLED: 'failed', FAILED: 'failed' })[st] || 'pending';
  const chip = st => '<span class="wd-chip s-' + stateOf(st) + '">' + escapeHtml(t(stageLabel(st))) + '</span>';
  function stageLabel(st){ return ({ SUBMIT: 'wd.st.prep', PENDING: 'wd.st.wait', APPROVED: 'wd.st.proc', PROCESSING: 'wd.st.proc', PAID: 'wd.st.done', COMPLETED: 'wd.st.done', REJECTED: 'wd.st.fail', FAILED: 'wd.st.fail', CANCELLED: 'wd.st.cancel' })[st] || 'wd.st.wait'; }

  /* ---------- HUB ---------- */
  function itemRow(it){
    const amt = it.kind === 'bank' ? OMR(it.amount) : escapeHtml(omxQty(it.amount, it.asset));
    return '<button type="button" class="omx-row wd-item" data-wd-open="' + it.kind + ':' + it.id + '"><span class="wd-ic">' + (it.kind === 'bank' ? icon('bank', 22) : omxLogo(it.asset, 34)) + '</span>' +
      '<span class="omx-rn"><b>' + escapeHtml(t(it.kind === 'bank' ? 'wd.title.bank' : 'wd.title.crypto')) + '</b><small class="ltr">' + escapeHtml(dispId(it.reference || '')) + ' · ' + escapeHtml(dt(it.at)) + '</small></span>' +
      '<span class="omx-rv"><b class="ltr">' + amt + '</b>' + chip(it.status) + '</span></button>';
  }
  function renderHub(){
    const items = allItems();
    let list;
    if (S.loadErr && !S.bank) list = '<div class="omx-block">' + icon('warn', 28) + '<p>' + escapeHtml(t('wd.loadErr')) + '</p><button class="omx-retry" data-wd="reload">' + escapeHtml(t('wd.retry')) + '</button></div>';
    else if (!S.bank) list = skeletonRows(3);
    else if (!items.length) list = '<div class="omx-empty">' + icon('history', 28) + '<b>' + escapeHtml(t('wd.none')) + '</b><p>' + escapeHtml(t('wd.noneD')) + '</p></div>';
    else list = '<div class="omx-list">' + items.slice(0, 30).map(itemRow).join('') + '</div>';
    const avail = S.bank ? OMR(S.bank.available) : '—';
    return top(t('wd.t')) + '<div class="screen-body omx-page wd-page"><p class="omx-lead">' + escapeHtml(t('wd.sub')) + '</p>' +
      '<button type="button" class="omx-card wd-method" data-nav="withdraw-bank"><span class="wd-mi">' + icon('bank', 28) + '</span><span class="wd-mt"><b>' + escapeHtml(t('wd.bank')) + '</b><small>' + escapeHtml(t('wd.bankD')) + '</small><small class="ltr">' + escapeHtml(t('wd.avail')) + ' ' + avail + '</small></span><span class="hub-chev dir-flip">' + icon('chev', 18) + '</span></button>' +
      '<button type="button" class="omx-card wd-method" data-wd="crypto"><span class="wd-mi">' + icon('crypto', 28) + '</span><span class="wd-mt"><b>' + escapeHtml(t('wd.crypto')) + '</b><small>' + escapeHtml(t('wd.cryptoD')) + '</small></span><span class="hub-chev dir-flip">' + icon('chev', 18) + '</span></button>' +
      '<section class="omx-card omx-sec"><div class="omx-sh"><h2>' + escapeHtml(t('wd.mine')) + '</h2></div>' + list + '</section></div>';
  }

  /* ---------- BANK FORM ---------- */
  function ibanOk(v){
    const s = String(v || '').replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
    if (s.slice(0, 2) === 'OM' && s.length !== 23) return false;
    const r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
    let m = 0; for (let i = 0; i < r.length; i++) m = (m * 10 + Number(r[i])) % 97;
    return m === 1;
  }
  function renderBank(){
    if (!S.bank){ setTimeout(() => { load().then(() => { if (R.current() === 'withdraw-bank') R.go('withdraw-bank', { force: true }); }); }, 0); return top(t('wd.title.bank')) + '<div class="screen-body omx-page">' + (S.loadErr ? '<div class="omx-block">' + icon('warn', 28) + '<p>' + escapeHtml(t('wd.loadErr')) + '</p><button class="omx-retry" data-wd="reload">' + escapeHtml(t('wd.retry')) + '</button></div>' : skeletonRows(4)) + '</div>'; }
    const f = S.form.b, p = Runtime.profile || {};
    if (f.holder == null) f.holder = [p.firstName, p.lastName].filter(Boolean).join(' ');
    const banks = S.bank.banks || [];
    const dis = S.bank.enabled === false;
    return top(t('wd.title.bank')) + '<div class="screen-body omx-page wd-form">' +
      (dis ? '<p class="omx-warn">' + icon('warn', 18) + escapeHtml(t('wd.e.withdraw_disabled')) + '</p>' : '') +
      '<section class="omx-card wd-amt"><label for="wb-amt">' + escapeHtml(t('wd.amount')) + '</label><div class="wd-amt-in"><input id="wb-amt" inputmode="decimal" autocomplete="off" placeholder="0.000" value="' + escapeHtml(f.amount || '') + '"><span>OMR</span></div>' +
        '<div class="wd-meta"><span>' + escapeHtml(t('wd.avail')) + ' <b class="ltr">' + OMR(S.bank.available) + '</b></span><span>' + escapeHtml(tf('wd.min', { v: OMRt(S.bank.min || 10) })) + '</span></div><p class="wd-err" id="wb-e-amt" role="alert"></p></section>' +
      '<section class="omx-card wd-fields">' +
        '<label for="wb-holder">' + escapeHtml(t('wd.holder')) + '</label><input id="wb-holder" class="input" autocomplete="name" maxlength="80" value="' + escapeHtml(f.holder || '') + '"><p class="wd-err" id="wb-e-holder" role="alert"></p>' +
        '<label for="wb-bank">' + escapeHtml(t('wd.bankSel')) + '</label><select id="wb-bank" class="input"><option value="">' + escapeHtml(t('wd.bankPick')) + '</option>' + banks.map(b => '<option value="' + escapeHtml(b.code) + '"' + (f.bank === b.code ? ' selected' : '') + '>' + escapeHtml(bankName(b)) + '</option>').join('') + '</select><p class="wd-err" id="wb-e-bank" role="alert"></p>' +
        '<label for="wb-acc">' + escapeHtml(t('wd.acc')) + '</label><input id="wb-acc" class="input ltr" dir="ltr" inputmode="text" autocomplete="off" maxlength="34" value="' + escapeHtml(f.acc || '') + '"><p class="wd-err" id="wb-e-acc" role="alert"></p>' +
        '<label for="wb-iban">' + escapeHtml(t('wd.iban')) + '</label><input id="wb-iban" class="input ltr" dir="ltr" autocomplete="off" maxlength="42" placeholder="OM" value="' + escapeHtml(f.iban || '') + '"><small class="wd-hint">' + escapeHtml(t('wd.ibanH')) + '</small><p class="wd-err" id="wb-e-iban" role="alert"></p>' +
      '</section><p class="omx-muted">' + escapeHtml(t('wd.manual')) + '</p>' +
      '<button class="btn btn-primary btn-block" id="wb-next"' + (dis ? ' disabled' : '') + '>' + escapeHtml(t('wd.continue')) + '</button></div>';
  }
  function checkBank(show){
    const f = S.form.b, ov = S.bank || {}, e = {};
    const amt = Number(String(f.amount || '').replace(',', '.'));
    if (!(amt > 0) || !/^\d+([.,]\d{0,3})?$/.test(String(f.amount || '').trim())) e.amt = t('wd.err.amount');
    else if (amt < Number(ov.min || 10)) e.amt = tf('wd.err.min', { v: OMRt(ov.min || 10) });
    else if (amt > Number(ov.available || 0)) e.amt = t('wd.err.funds');
    const h = String(f.holder || '').trim(); if (h.length < 3 || h.length > 80) e.holder = t('wd.err.holder');
    if (!f.bank) e.bank = t('wd.err.bank');
    if (!/^[0-9A-Za-z -]{4,34}$/.test(String(f.acc || ''))) e.acc = t('wd.err.acc');
    if (String(f.iban || '').trim() && !ibanOk(f.iban)) e.iban = t('wd.err.iban');
    if (show) ['amt', 'holder', 'bank', 'acc', 'iban'].forEach(k => { const el = document.getElementById('wb-e-' + k); if (el) el.textContent = e[k] || ''; });
    return Object.keys(e).length ? null : { amount: Math.round(amt * 1000) / 1000, holder: h, bank: f.bank, acc: String(f.acc).trim(), iban: String(f.iban || '').replace(/\s+/g, '').toUpperCase() };
  }

  /* ---------- CRYPTO FORM ---------- */
  function cryptoAssets(){
    const bal = (S.crypto && S.crypto.balances) || {}, nets = (S.crypto && S.crypto.networks) || [];
    return Object.keys(bal).filter(s => Number(bal[s]) > 0 && nets.some(n => n.asset === s)).map(s => ({ sym: s, avail: Number(bal[s]) }));
  }
  function feeOf(sym, net){ const n = ((S.crypto && S.crypto.networks) || []).find(x => x.asset === sym && x.network === net); return n ? Number(n.fee || 0) : 0; }
  function renderCrypto(){
    if (!S.crypto){ setTimeout(() => { load().then(() => { if (R.current() === 'withdraw-crypto') R.go('withdraw-crypto', { force: true }); }); }, 0); return top(t('wd.title.crypto')) + '<div class="screen-body omx-page">' + (S.loadErr ? '<div class="omx-block">' + icon('warn', 28) + '<p>' + escapeHtml(t('wd.loadErr')) + '</p><button class="omx-retry" data-wd="reload">' + escapeHtml(t('wd.retry')) + '</button></div>' : skeletonRows(4)) + '</div>'; }
    const f = S.form.c, list = cryptoAssets(), dis = S.crypto.enabled === false;
    if (!list.length) return top(t('wd.title.crypto')) + '<div class="screen-body omx-page"><section class="omx-card omx-block big">' + icon('crypto', 36) + '<b>' + escapeHtml(t('wd.noCrypto')) + '</b><p>' + escapeHtml(t('wd.noCryptoD')) + '</p><button class="btn btn-secondary" data-nav="markets">' + escapeHtml(t('omx.seeMarkets')) + '</button></section></div>';
    if (!f.asset || !list.some(x => x.sym === f.asset)) f.asset = list[0].sym;
    const cur = list.find(x => x.sym === f.asset), n = f.net ? OMX_NETWORKS[f.net] : null, fee = f.net ? feeOf(f.asset, f.net) : 0;
    const k = OMXMarket.get(f.asset), amt = Number(String(f.amount || '').replace(',', '.')) || 0;
    return top(t('wd.title.crypto')) + '<div class="screen-body omx-page wd-form">' +
      (dis ? '<p class="omx-warn">' + icon('warn', 18) + escapeHtml(t('wd.e.withdraw_disabled')) + '</p>' : '') +
      (S.crypto.kyc_required ? '<p class="omx-warn">' + icon('shield', 18) + escapeHtml(t('wd.e.kyc_required')) + '</p>' : '') +
      '<section class="omx-card omx-sec"><div class="omx-sh"><h2>' + escapeHtml(t('wd.pickAsset')) + '</h2></div><div class="omx-grid">' +
        list.map(a => '<button type="button" class="omx-pick' + (a.sym === f.asset ? ' on' : '') + '" data-wd-asset="' + a.sym + '" aria-pressed="' + (a.sym === f.asset) + '">' + omxLogo(a.sym, 34) + '<b>' + a.sym + '</b><small class="ltr">' + escapeHtml(omxQty(a.avail, a.sym)) + '</small></button>').join('') + '</div></section>' +
      '<section class="omx-card omx-sec"><div class="omx-sh"><h2>' + escapeHtml(t('wd.network')) + '</h2></div>' +
        (n ? '<button type="button" class="omx-net pick sel" data-wd="net">' + omxNetLogo(f.net, 34) + '<span class="omx-nt"><b>' + escapeHtml(n.name) + ' <small>' + escapeHtml(n.std) + '</small></b><small>' + escapeHtml(t('wd.netFee')) + ' ' + escapeHtml(fee > 0 ? omxQty(fee, f.asset) : '0') + '</small></span><span class="hub-chev dir-flip">' + icon('chev', 18) + '</span></button>'
          : '<button type="button" class="btn btn-secondary btn-block" data-wd="net">' + escapeHtml(t('omx.netPick')) + '</button>') + '<p class="wd-err" id="wc-e-net" role="alert"></p></section>' +
      '<section class="omx-card wd-fields"><label for="wc-addr">' + escapeHtml(t('wd.address')) + '</label><div class="wd-addr"><input id="wc-addr" class="input ltr" dir="ltr" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + escapeHtml(t('wd.addrPh')) + '" value="' + escapeHtml(f.addr || '') + '">' +
        (navigator.clipboard && navigator.clipboard.readText ? '<button type="button" class="wd-paste" data-wd="paste">' + escapeHtml(t('wd.paste')) + '</button>' : '') + '</div><p class="wd-err" id="wc-e-addr" role="alert"></p>' +
        (n && n.memo ? '<label for="wc-memo">' + escapeHtml(t('wd.memo')) + '</label><input id="wc-memo" class="input ltr" dir="ltr" inputmode="numeric" maxlength="10" value="' + escapeHtml(f.memo || '') + '"><small class="wd-hint">' + escapeHtml(t('wd.memoH')) + '</small><p class="wd-err" id="wc-e-memo" role="alert"></p>' : '') +
        (n ? '<p class="omx-warn sm">' + icon('warn', 16) + escapeHtml(tf('wd.warnAddr', { a: f.asset, n: n.name })) + '</p>' : '') + '</section>' +
      '<section class="omx-card wd-amt"><label for="wc-amt">' + escapeHtml(t('wd.amount')) + '</label><div class="wd-amt-in"><input id="wc-amt" inputmode="decimal" autocomplete="off" placeholder="0" value="' + escapeHtml(f.amount || '') + '"><span>' + escapeHtml(f.asset) + '</span><button type="button" class="wd-max" data-wd="max">' + escapeHtml(t('wd.max')) + '</button></div>' +
        '<div class="wd-meta"><span>' + escapeHtml(t('wd.avail')) + ' <b class="ltr">' + escapeHtml(omxQty(cur.avail, f.asset)) + '</b></span><span class="ltr" id="wc-usd">' + (k && amt ? '≈ ' + escapeHtml(omxUsd(amt * k.price)) : '') + '</span></div><p class="wd-err" id="wc-e-amt" role="alert"></p>' +
        '<dl class="wd-sum"><div><dt>' + escapeHtml(t('wd.netFee')) + '</dt><dd class="ltr" id="wc-fee">' + escapeHtml(n ? (fee > 0 ? omxQty(fee, f.asset) : '0 ' + f.asset) : '—') + '</dd></div>' +
        '<div><dt>' + escapeHtml(t('wd.final')) + '</dt><dd class="ltr" id="wc-final">' + escapeHtml(amt > 0 ? omxQty(amt, f.asset) : '—') + '</dd></div>' +
        '<div class="tot"><dt>' + escapeHtml(t('wd.total')) + '</dt><dd class="ltr" id="wc-total">' + escapeHtml(amt > 0 && n ? omxQty(amt + fee, f.asset) : '—') + '</dd></div></dl></section>' +
      '<p class="omx-muted">' + escapeHtml(t('wd.manual')) + '</p><button class="btn btn-primary btn-block" id="wc-next"' + (dis ? ' disabled' : '') + '>' + escapeHtml(t('wd.continue')) + '</button></div>';
  }
  function checkCrypto(show){
    const f = S.form.c, e = {}, cur = cryptoAssets().find(x => x.sym === f.asset);
    const n = f.net ? OMX_NETWORKS[f.net] : null, fee = f.net ? feeOf(f.asset, f.net) : 0;
    if (!n) e.net = t('wd.err.net');
    const addr = String(f.addr || '').trim();
    if (n && !(ADDR[f.net] && ADDR[f.net].test(addr))) e.addr = tf('wd.err.addr', { n: n.name });
    const memo = String(f.memo || '').trim();
    if (n && n.memo && memo && !/^\d{1,10}$/.test(memo)) e.memo = t('wd.err.memo');
    const raw = String(f.amount || '').trim().replace(',', '.'), amt = Number(raw);
    if (!(amt > 0) || !/^\d+(\.\d{0,8})?$/.test(raw)) e.amt = t('wd.err.amount');
    else if (!cur || amt + fee > cur.avail + 1e-12) e.amt = t('wd.err.funds');
    if (show) ['net', 'addr', 'memo', 'amt'].forEach(k => { const el = document.getElementById('wc-e-' + k); if (el) el.textContent = e[k] || ''; });
    return Object.keys(e).length ? null : { asset: f.asset, net: f.net, addr, memo: n && n.memo && memo ? memo : null, amount: amt, fee, total: amt + fee };
  }

  /* ---------- REVIEW (both kinds) ---------- */
  function renderReview(){
    const r = S.review; if (!r){ setTimeout(() => R.go('withdraw', { replace: true }), 0); return ''; }
    const line = (k, v, cls) => '<div class="' + (cls || '') + '"><dt>' + escapeHtml(k) + '</dt><dd class="ltr" dir="auto">' + v + '</dd></div>';
    let body;
    if (r.kind === 'bank'){
      const b = ((S.bank && S.bank.banks) || []).find(x => x.code === r.d.bank);
      body = '<div class="wd-rv-amt ltr">' + OMR(r.d.amount) + '</div><dl class="wd-sum">' + line(t('wd.holder'), escapeHtml(r.d.holder)) + line(t('wd.bankSel'), escapeHtml(bankName(b))) + line(t('wd.acc'), escapeHtml(r.d.acc)) +
        (r.d.iban ? line('IBAN', escapeHtml(r.d.iban.replace(/(.{4})/g, '$1 ').trim())) : '') + line(t('wd.fee'), OMR(0)) + line(t('wd.total'), OMR(r.d.amount), 'tot') + '</dl>';
    } else {
      const n = OMX_NETWORKS[r.d.net], k = OMXMarket.get(r.d.asset);
      body = '<div class="wd-rv-amt ltr">' + omxLogo(r.d.asset, 34) + escapeHtml(omxQty(r.d.amount, r.d.asset)) + '</div>' + (k ? '<p class="wd-rv-usd ltr">≈ ' + escapeHtml(omxUsd(r.d.amount * k.price)) + '</p>' : '') +
        '<dl class="wd-sum">' + line(t('wd.network'), omxNetLogo(r.d.net, 20) + ' ' + escapeHtml(n.name + ' (' + n.std + ')')) + line(t('wd.address'), '<span class="wd-addr-v">' + escapeHtml(r.d.addr) + '</span>') +
        (r.d.memo ? line(t('wd.memo'), escapeHtml(r.d.memo)) : '') + line(t('wd.netFee'), escapeHtml(r.d.fee > 0 ? omxQty(r.d.fee, r.d.asset) : '0 ' + r.d.asset)) +
        line(t('wd.final'), escapeHtml(omxQty(r.d.amount, r.d.asset))) + line(t('wd.total'), escapeHtml(omxQty(r.d.total, r.d.asset)), 'tot') + '</dl>';
    }
    return top(t('wd.review')) + '<div class="screen-body omx-page wd-form"><section class="omx-card wd-review">' + body + '</section>' +
      '<label class="wd-check"><input type="checkbox" id="wr-ok"><span>' + escapeHtml(t(r.kind === 'bank' ? 'wd.checkBank' : 'wd.check')) + '</span></label>' +
      '<p class="omx-muted">' + escapeHtml(t('wd.manual')) + '</p><button class="btn btn-primary btn-block" id="wr-go" disabled>' + icon('lock', 18) + '<span>' + escapeHtml(t('wd.confirm')) + '</span></button></div>';
  }
  async function submit(btn){
    const r = S.review; if (!r || r.busy) return;
    if (navigator.onLine === false){ toast(t('px.offlineSend'), 'error'); return; }
    r.busy = true; UIKit.loading(btn, true);
    /* 16.4.0 — bank (OMR): code only above 500 USD; crypto: no server price, the code is always asked */
    const pin = await PinEngine.authorize(r.kind === 'bank' ? { usd: PinEngine.usdOf(r.d.amount, 'OMR') } : undefined);
    if (!pin.ok){ r.busy = false; UIKit.loading(btn, false); if (pin.error) toast(t(pin.error), 'error'); return; }
    S.track = { kind: r.kind, id: null, submitting: true, review: r };
    R.go('withdraw-track', { reset: true });
    let res;
    try {
      res = r.kind === 'bank'
        ? await sb.rpc('withdraw_request', { p_amount: r.d.amount, p_holder: r.d.holder, p_bank_code: r.d.bank, p_account: r.d.acc, p_iban: r.d.iban || null, p_key: r.idem })
        : await sb.rpc('crypto_withdraw_request', { p_asset: r.d.asset, p_network: r.d.net, p_address: r.d.addr, p_memo: r.d.memo, p_amount: r.d.amount, p_idempotency_key: r.idem, p_pin_grant: pin.grant });
    } catch(e){ res = { error: e }; }
    r.busy = false;
    if (res.error){
      S.track = { kind: r.kind, id: null, submitting: false, error: isNetErr(res.error) ? t('wd.e.uncertain') : errText(res.error), uncertain: isNetErr(res.error), review: r };
    } else {
      const d = res.data || {};
      S.track = { kind: r.kind, id: d.id, submitting: false };
      S.review = null; S.form[r.kind === 'bank' ? 'b' : 'c'] = {};
      await load(true);
      try { await AuthEngine.hydrateRuntime(); } catch(e){}
    }
    if (R.current() === 'withdraw-track') R.go('withdraw-track', { force: true });
  }

  /* ---------- TRACKING ---------- */
  function findItem(kind, id){
    const src = kind === 'bank' ? (S.bank && S.bank.items) : (S.crypto && S.crypto.items);
    return (src || []).find(x => x.id === id) || null;
  }
  function stages(kind, st){
    /* the steps of a withdrawal and where the REAL status is; nothing advances by itself */
    const steps = ['prep', 'wait', 'done'];                  /* what the person sees: submitted → in progress → completed (nothing about who handles it) */
    const at = { SUBMIT: 0, PENDING: 1, APPROVED: 1, PROCESSING: 1, PAID: 2, COMPLETED: 2 }[st];
    const fail = st === 'REJECTED' || st === 'CANCELLED' || st === 'FAILED';
    const failAt = st === 'FAILED' ? 0 : 1;
    return '<ol class="wd-steps" aria-label="' + escapeHtml(t('wd.mine')) + '">' + steps.map((s, i) => {
      let c = 'todo';
      if (fail){ c = i < failAt ? 'ok' : i === failAt ? 'ko' : 'todo'; }
      else if (at != null){ c = i < at ? 'ok' : i === at ? (i === 2 ? 'ok' : 'now') : 'todo'; }
      const lbl = fail && i === failAt ? (st === 'CANCELLED' ? 'wd.st.cancel' : 'wd.st.fail') : 'wd.st.' + s;
      return '<li class="wd-step ' + c + '"' + (c === 'now' ? ' aria-current="step"' : '') + '><i aria-hidden="true"></i><span>' + escapeHtml(t(lbl)) + '</span></li>';
    }).join('') + '</ol>';
  }
  function anim(st){
    const k = { SUBMIT: 'prep', PENDING: 'wait', APPROVED: 'proc', PROCESSING: 'proc', PAID: 'done', COMPLETED: 'done', REJECTED: 'fail', CANCELLED: 'cancel', FAILED: 'fail' }[st] || 'wait';
    const g = {
      prep: '<circle class="a-ring" cx="40" cy="40" r="30"/>',
      wait: '<circle class="a-face" cx="40" cy="40" r="30"/><path class="a-hand" d="M40 40V22"/><path class="a-hand2" d="M40 40h12"/>',
      proc: '<circle class="a-face" cx="40" cy="40" r="30"/><path class="a-flow" d="M20 40h40M48 30l12 10-12 10"/>',
      done: '<circle class="a-face ok" cx="40" cy="40" r="30"/><path class="a-check" pathLength="1" d="M27 41l9 9 18-20"/>',
      fail: '<circle class="a-face ko" cx="40" cy="40" r="30"/><path class="a-x" pathLength="1" d="M29 29l22 22M51 29L29 51"/>',
      cancel: '<circle class="a-face mu" cx="40" cy="40" r="30"/><path class="a-x" pathLength="1" d="M28 40h24"/>'
    }[k];
    return '<div class="wd-anim k-' + k + '" aria-hidden="true"><svg viewBox="0 0 80 80" width="96" height="96">' + g + '</svg></div>';
  }
  function renderTrack(){
    const tr = S.track; if (!tr){ setTimeout(() => R.go('withdraw', { replace: true }), 0); return ''; }
    const line = (k, v) => '<div><dt>' + escapeHtml(k) + '</dt><dd class="ltr" dir="auto">' + v + '</dd></div>';
    if (tr.submitting || tr.error){
      const st = tr.submitting ? 'SUBMIT' : 'FAILED', r = tr.review || {};
      const amt = r.kind === 'bank' ? OMR(r.d.amount) : escapeHtml(omxQty(r.d.amount, r.d.asset));
      return top(t(tr.kind === 'bank' ? 'wd.title.bank' : 'wd.title.crypto')) + '<div class="screen-body omx-page wd-track">' +
        '<section class="omx-card wd-hero s-' + (tr.submitting ? 'pending' : 'failed') + '" aria-live="polite">' + anim(tr.uncertain ? 'PENDING' : st) + '<div class="wd-hamt ltr">' + amt + '</div><b>' + escapeHtml(tr.submitting ? t('wd.s.SUBMIT') : (tr.uncertain ? t('wd.s.UNKNOWN') : t('wd.s.FAILED'))) + '</b>' +
          (tr.error ? '<p class="wd-msg">' + escapeHtml(tr.error) + '</p>' : '') + '</section>' + (tr.uncertain ? '' : stages(tr.kind, st)) +
        (tr.error ? '<div class="omx-btns">' + (r.d ? '<button class="btn btn-primary" data-wd="again">' + escapeHtml(t('wd.again')) + '</button>' : '') + '<button class="btn btn-secondary" data-wd="hub">' + escapeHtml(t('wd.back')) + '</button></div>' : '') + '</div>';
    }
    const it = findItem(tr.kind, tr.id);
    if (!it){ setTimeout(() => { load(true).then(() => { if (R.current() === 'withdraw-track') R.go('withdraw-track', { force: true }); }); }, 0); return top(t('wd.t')) + '<div class="screen-body omx-page">' + (S.loadErr ? '<div class="omx-block">' + icon('warn', 28) + '<p>' + escapeHtml(t('wd.loadErr')) + '</p><button class="omx-retry" data-wd="reload">' + escapeHtml(t('wd.retry')) + '</button></div>' : skeletonRows(4)) + '</div>'; }
    const st = it.status, bank = tr.kind === 'bank';
    const amt = bank ? OMR(it.amount) : escapeHtml(omxQty(it.amount, it.asset));
    let rows = line(t('wd.ref'), escapeHtml(dispId(it.reference || ''))) + line(t('wd.date'), escapeHtml(dt(ms(it.created_at))));
    if (bank){
      const b = ((S.bank && S.bank.banks) || []).find(x => x.code === it.bank_code);
      rows += line(t('wd.holder'), escapeHtml(it.holder || '')) + line(t('wd.bankSel'), escapeHtml(b ? bankName(b) : (it.bank_name || it.bank_code || ''))) + line(t('wd.acc'), escapeHtml(it.account_number || '')) +
        (it.iban ? line('IBAN', escapeHtml(it.iban)) : '') + line(t('wd.fee'), OMR(0)) + (it.paid_ref ? line(t('wd.bankRef'), escapeHtml(it.paid_ref)) : '');
    } else {
      const n = OMX_NETWORKS[it.network] || { name: it.network, std: '' };
      rows += line(t('wd.asset'), omxLogo(it.asset, 20) + ' ' + escapeHtml(it.asset)) + line(t('wd.network'), omxNetLogo(it.network, 20) + ' ' + escapeHtml(n.name + (n.std ? ' (' + n.std + ')' : ''))) +
        line(t('wd.address'), '<span class="wd-addr-v">' + escapeHtml(it.address || '') + '</span>') + (it.memo ? line(t('wd.memo'), escapeHtml(it.memo)) : '') +
        line(t('wd.netFee'), escapeHtml(Number(it.fee) > 0 ? omxQty(it.fee, it.asset) : '0 ' + it.asset)) + line(t('wd.total'), escapeHtml(omxQty(Number(it.amount) + Number(it.fee || 0), it.asset))) +
        (it.tx_hash ? line(t('wd.hash'), '<span class="wd-addr-v">' + escapeHtml(it.tx_hash) + '</span>') : '');
    }
    if (it.admin_note && (st === 'REJECTED')) rows += line(t('wd.note'), escapeHtml(it.admin_note));
    const exp = !bank && it.tx_hash && OMX_NETWORKS[it.network] && OMX_NETWORKS[it.network].tx ? OMX_NETWORKS[it.network].tx.replace('{h}', encodeURIComponent(it.tx_hash)) : null;
    const upd = S.at ? new Date(S.at).toLocaleTimeString(LANG === 'ar' ? 'ar-OM-u-nu-latn' : LANG === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
    return top(t(bank ? 'wd.title.bank' : 'wd.title.crypto')) + '<div class="screen-body omx-page wd-track">' +
      '<section class="omx-card wd-hero s-' + stateOf(st) + '" aria-live="polite">' + anim(st) + '<div class="wd-hamt ltr">' + amt + '</div><b>' + escapeHtml(t('wd.s.' + st) || st) + '</b>' + (st === 'PENDING' || st === 'APPROVED' || st === 'PROCESSING' ? '<div class="omx-prog" aria-hidden="true"><i></i><i></i><i></i></div>' : '') + (upd ? '<small class="ltr">' + escapeHtml(tf('wd.updated', { t: upd })) + '</small>' : '') + '</section>' +
      stages(tr.kind, st) + '<section class="omx-card"><dl class="wd-sum">' + rows + '</dl></section>' +
      '<div class="omx-btns">' + (exp ? '<a class="btn btn-secondary" href="' + escapeHtml(exp) + '" target="_blank" rel="noopener noreferrer">' + icon('globe', 18) + '<span>' + escapeHtml(t('wd.explorer')) + '</span></a>' : '') +
        '<button class="btn btn-secondary" data-wd="pdf">' + icon('download', 18) + '<span>' + escapeHtml(t('wd.receipt')) + '</span></button><button class="btn btn-secondary" data-wd="share">' + icon('share', 18) + '<span>' + escapeHtml(t('wd.share')) + '</span></button></div>' +
      (st === 'PENDING' ? '<button class="btn btn-ghost btn-block wd-cancel" data-wd="cancel">' + escapeHtml(t('wd.cancel')) + '</button>' : '') + '</div>';
  }
  function receipt(kind){
    const tr = S.track, it = tr && findItem(tr.kind, tr.id); if (!it) return;
    const bank = tr.kind === 'bank', st = it.status, d = new Date(ms(it.created_at));
    const loc = LANG === 'ar' ? 'ar-OM-u-nu-latn' : LANG === 'fr' ? 'fr-FR' : 'en-GB';
    const extra = [];
    if (bank){ const b = ((S.bank && S.bank.banks) || []).find(x => x.code === it.bank_code); extra.push([t('wd.bankSel'), b ? bankName(b) : (it.bank_name || '')], [t('wd.acc'), it.account_number || '', 'mono']); if (it.paid_ref) extra.push([t('wd.bankRef'), it.paid_ref, 'mono']); }
    else { const n = OMX_NETWORKS[it.network] || { name: it.network, std: '' }; extra.push([t('wd.network'), n.name + (n.std ? ' (' + n.std + ')' : '')], [t('wd.address'), String(it.address || ''), 'mono']); if (it.memo) extra.push([t('wd.memo'), it.memo, 'mono']); if (it.tx_hash) extra.push([t('wd.hash'), String(it.tx_hash), 'mono']); }
    const fee = Number(it.fee || 0);
    window.__YOR_LAST_RECEIPT__ = { id: it.id, transactionId: it.transaction_id || it.id, reference: it.reference, status: st, fee: bank ? 0 : fee };
    window.__YOR_LAST_RECEIPT_VIEW__ = {
      state: stateOf(st), title: t(bank ? 'wd.title.bank' : 'wd.title.crypto'), eyebrow: 'DYT', sub: t('wd.s.' + st),
      amtFmt: bank ? OMRt(it.amount) : omxQty(it.amount, it.asset), feeFmt: bank ? OMRt(0) : omxQty(fee, it.asset),
      totalFmt: bank ? OMRt(it.amount) : omxQty(Number(it.amount) + fee, it.asset), hasCost: true,
      date: d.toLocaleDateString(loc, { day: '2-digit', month: 'long', year: 'numeric' }), time: d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' }),
      statusTxt: t(stageLabel(st)), extra
    };
    ReceiptExport.run(kind);
  }
  function startPoll(){
    clearInterval(S.pollT);
    S.pollT = setInterval(async () => {
      if (document.visibilityState === 'hidden' || R.current() !== 'withdraw-track' || !S.track || !S.track.id) return;
      const before = (findItem(S.track.kind, S.track.id) || {}).status;
      await load(true);
      const after = (findItem(S.track.kind, S.track.id) || {}).status;
      if (R.current() === 'withdraw-track' && after !== before){ R.go('withdraw-track', { force: true }); try { await AuthEngine.hydrateRuntime(); } catch(e){} }
      else { const u = document.querySelector('.wd-hero small'); if (u && S.at) u.textContent = tf('wd.updated', { t: new Date(S.at).toLocaleTimeString(LANG === 'ar' ? 'ar-OM-u-nu-latn' : LANG === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }); }
    }, 15000);
    R.onLeave(() => clearInterval(S.pollT));
  }
  function confirmSheet(msg, yes, no){
    return new Promise(res => {
      let done = false;
      const close = R.overlay.open('<div class="omx-sheet wd-ask"><p>' + escapeHtml(msg) + '</p><div class="omx-btns"><button class="btn btn-secondary" data-ask="no">' + escapeHtml(no) + '</button><button class="btn btn-danger" data-ask="yes">' + escapeHtml(yes) + '</button></div></div>', { kind: 'modal', onClose: () => { if (!done){ done = true; res(false); } } });
      setTimeout(() => document.querySelectorAll('.wd-ask [data-ask]').forEach(b => { b.onclick = () => { const v = b.getAttribute('data-ask') === 'yes'; done = true; close(); res(v); }; }), 30);
    });
  }

  /* ---------- wiring ---------- */
  function bind(info){
    const id = info.id, el = info.el;
    if (id === 'withdraw'){ OMXMarket.start(); if (!S.bank || Date.now() - S.at > 15000) load(true).then(() => { if (R.current() === 'withdraw') R.go('withdraw', { force: true }); }); }
    if (id === 'withdraw-bank'){
      const f = S.form.b;
      [['wb-amt', 'amount'], ['wb-holder', 'holder'], ['wb-acc', 'acc'], ['wb-iban', 'iban']].forEach(x => { const i = el.querySelector('#' + x[0]); if (i) i.oninput = () => { f[x[1]] = i.value; }; });
      const sel = el.querySelector('#wb-bank'); if (sel) sel.onchange = () => { f.bank = sel.value; };
      const nx = el.querySelector('#wb-next'); if (nx) nx.onclick = () => { const d = checkBank(true); if (!d) { const e = el.querySelector('.wd-err:not(:empty)'); if (e) e.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; } S.review = { kind: 'bank', d, idem: uuid() }; R.go('withdraw-confirm'); };
    }
    if (id === 'withdraw-crypto'){
      OMXMarket.start();
      const f = S.form.c;
      const upd = () => {
        const amt = Number(String(f.amount || '').replace(',', '.')) || 0, fee = f.net ? feeOf(f.asset, f.net) : 0, k = OMXMarket.get(f.asset);
        const set = (i, v) => { const n = el.querySelector('#' + i); if (n) n.textContent = v; };
        set('wc-final', amt > 0 ? omxQty(amt, f.asset) : '—'); set('wc-total', amt > 0 && f.net ? omxQty(amt + fee, f.asset) : '—'); set('wc-usd', k && amt ? '≈ ' + omxUsd(amt * k.price) : '');
      };
      const a = el.querySelector('#wc-amt'); if (a) a.oninput = () => { f.amount = a.value; upd(); };
      const ad = el.querySelector('#wc-addr'); if (ad) ad.oninput = () => { f.addr = ad.value.trim(); };
      const m = el.querySelector('#wc-memo'); if (m) m.oninput = () => { f.memo = m.value; };
      const nx = el.querySelector('#wc-next'); if (nx) nx.onclick = () => { const d = checkCrypto(true); if (!d){ const e = el.querySelector('.wd-err:not(:empty)'); if (e) e.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; } S.review = { kind: 'crypto', d, idem: uuid() }; R.go('withdraw-confirm'); };
    }
    if (id === 'withdraw-confirm'){
      const ok = el.querySelector('#wr-ok'), go = el.querySelector('#wr-go');
      if (ok && go){ ok.onchange = () => { go.disabled = !ok.checked; }; go.onclick = () => submit(go); }
    }
    if (id === 'withdraw-track' && S.track && S.track.id){ const it = findItem(S.track.kind, S.track.id); if (it && ['PENDING', 'APPROVED', 'PROCESSING'].indexOf(it.status) !== -1) startPoll(); }
    if (['withdraw', 'withdraw-bank', 'withdraw-crypto', 'withdraw-confirm', 'withdraw-track'].indexOf(id) === -1 || el.__wd) return;
    el.__wd = true;
    el.addEventListener('click', async e => {
      const o = e.target.closest && e.target.closest('[data-wd-open]');
      if (o){ const p = o.getAttribute('data-wd-open').split(':'); S.track = { kind: p[0], id: p[1] }; R.go('withdraw-track'); return; }
      const as = e.target.closest && e.target.closest('[data-wd-asset]');
      if (as){ const f = S.form.c; if (f.asset !== as.getAttribute('data-wd-asset')){ S.form.c = { asset: as.getAttribute('data-wd-asset') }; R.go('withdraw-crypto', { force: true }); } return; }
      const b = e.target.closest && e.target.closest('[data-wd]'); if (!b) return;
      const a = b.getAttribute('data-wd');
      if (a === 'reload'){ await load(true); R.go(R.current(), { force: true }); }
      else if (a === 'crypto') startCrypto();
      else if (a === 'net'){
        const f = S.form.c, nets = ((S.crypto && S.crypto.networks) || []).filter(n => n.asset === f.asset);
        const fees = {}; nets.forEach(n => { fees[n.network] = Number(n.fee || 0); });
        OMX.pickNetwork(f.asset, nets.map(n => n.network), fees, net => { f.net = net; if (!(OMX_NETWORKS[net] && OMX_NETWORKS[net].memo)) f.memo = ''; R.go('withdraw-crypto', { force: true }); });
      }
      else if (a === 'paste'){ try { const v = (await navigator.clipboard.readText() || '').trim(); const i = el.querySelector('#wc-addr'); if (i && v){ i.value = v; S.form.c.addr = v; } } catch(x){} }
      else if (a === 'max'){
        const f = S.form.c, cur = cryptoAssets().find(x => x.sym === f.asset); if (!cur) return;
        const fee = f.net ? feeOf(f.asset, f.net) : 0, dp = (omxAsset(f.asset) || { dp: 8 }).dp;
        const v = Math.max(0, Math.floor((cur.avail - fee) * Math.pow(10, dp)) / Math.pow(10, dp));
        f.amount = v > 0 ? String(v) : ''; const i = el.querySelector('#wc-amt'); if (i){ i.value = f.amount; i.dispatchEvent(new Event('input')); }
      }
      else if (a === 'again'){
        const tr = S.track, r = tr && tr.review; if (!r) return;
        if (tr.uncertain){ S.review = r; R.go('withdraw-confirm', { replace: true }); }      /* same request key: never counted twice */
        else R.go(r.kind === 'bank' ? 'withdraw-bank' : 'withdraw-crypto', { replace: true });  /* the server refused the details: back to the form, as typed */
      }
      else if (a === 'hub'){ R.go('withdraw', { replace: true }); }
      else if (a === 'pdf') receipt('pdf');
      else if (a === 'share') receipt('share');
      else if (a === 'cancel'){
        const tr = S.track; if (!tr || !tr.id) return;
        if (!(await confirmSheet(t('wd.cancelQ'), t('wd.yes'), t('wd.no')))) return;
        UIKit.loading(b, true);
        try {
          const { error } = await sb.rpc(tr.kind === 'bank' ? 'withdraw_cancel' : 'crypto_withdraw_cancel', { p_id: tr.id });
          if (error) throw error;
          toast(t('wd.cancelled'), 'success');
          await load(true); try { await AuthEngine.hydrateRuntime(); } catch(x){}
          R.go('withdraw-track', { force: true });
        } catch(x){ UIKit.loading(b, false); toast(errText(x), 'error'); }
      }
    });
  }
  async function startCrypto(sym){
    if (sym) S.form.c = { asset: String(sym).toUpperCase() };
    R.go('withdraw-crypto');
  }
  function init(){
    R.register({ withdraw: renderHub, 'withdraw-bank': renderBank, 'withdraw-crypto': renderCrypto, 'withdraw-confirm': renderReview, 'withdraw-track': renderTrack });
    R.on(info => { try { bind(info); } catch(e){ console.error('[withdraw]', e); } });
  }
  init();
  function open(kind, id){ S.track = { kind, id }; R.go('withdraw-track'); }
  return { startCrypto, open, load, state: S, stateOf, stageLabel, ibanOk, ADDR };
})();
