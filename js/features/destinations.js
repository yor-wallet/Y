'use strict';

/* ============================================================
   DESTINATIONS (12.16.0) — where a transfer can be sent.
   Oman (mobile number, rials) stays exactly as it was: server function fiat_send_external, recorded and confirmed at once.
   New: Orange Money Mali (and, switched off for now, Orange Money Côte d'Ivoire) through the server's international flow, intl_send:
     - the recipient's first and last name are required, the number is +223 + 8 digits (Mali) / +225 + 10 digits (Côte d'Ivoire);
     - the rials are debited and the transfer is recorded as "in progress" (status PROCESSING): for Orange Money Mali an administrator pays it out and
       confirms it (admin_payout_confirm), the transfer then becomes COMPLETED and the sender is notified. The app never says "confirmed" before that.
     - the amount in XOF is computed by the server (rounded down); the figure shown here is an ESTIMATE from the same indicative rate table.
   Côte d'Ivoire is behind FEATURES.orangeMoneyCI (off): the server has no payout path for it yet (it would only run the demonstration engine).
   ============================================================ */
Object.assign(TR.en, {
  'dst.title':'Send to','dst.om':'Mobile number','dst.orange':'Orange Money',
  'dst.hint.OM':'Oman · 8 digits, starting with 7 or 9','dst.hint.ML':'Mali · 8 digits, for example 76 12 34 56','dst.hint.CI':'Côte d’Ivoire · 10 digits, for example 07 07 07 07 07',
  'dst.err_short.ML':'The number must have 8 digits.','dst.err_short.CI':'The number must have 10 digits.','dst.err_zero.ML':'A number in Mali does not start with 0.','dst.err_zero.CI':'A number in Côte d’Ivoire starts with 0.',
  'dst.first':'Recipient’s first name','dst.last':'Recipient’s last name','dst.err_name':'Enter the recipient’s first and last name, as on their Orange Money account.',
  'dst.note.orange':'The recipient needs an active Orange Money account on this number. Use the name registered on that account.',
  'dst.est':'Recipient receives (estimate)','dst.rate':'Indicative rate','dst.estNote':'Estimate from the indicative rate table, rounded down. The exact amount is shown on the receipt.',
  'dst.payoutNote':'The transfer shows as “In progress” until the money is paid out to the Orange Money account. You are notified when it is done.',
  'dst.recorded':'Transfer recorded','dst.st4':'Recorded','dst.min':'Minimum for Orange Money: {n}',
  'dst.type.ML':'Orange Money · Mali','dst.type.CI':'Orange Money · Côte d’Ivoire','dst.country.ML':'Mali','dst.country.CI':'Côte d’Ivoire','dst.country.OM':'Oman'
});
Object.assign(TR.fr, {
  'dst.title':'Envoyer vers','dst.om':'Numéro de mobile','dst.orange':'Orange Money',
  'dst.hint.OM':'Oman · 8 chiffres, commence par 7 ou 9','dst.hint.ML':'Mali · 8 chiffres, par exemple 76 12 34 56','dst.hint.CI':'Côte d’Ivoire · 10 chiffres, par exemple 07 07 07 07 07',
  'dst.err_short.ML':'Le numéro doit avoir 8 chiffres.','dst.err_short.CI':'Le numéro doit avoir 10 chiffres.','dst.err_zero.ML':'Un numéro du Mali ne commence pas par 0.','dst.err_zero.CI':'Un numéro de Côte d’Ivoire commence par 0.',
  'dst.first':'Prénom du destinataire','dst.last':'Nom du destinataire','dst.err_name':'Saisissez le prénom et le nom du destinataire, comme sur son compte Orange Money.',
  'dst.note.orange':'Le destinataire doit avoir un compte Orange Money actif sur ce numéro. Utilisez le nom enregistré sur ce compte.',
  'dst.est':'Le destinataire reçoit (estimation)','dst.rate':'Taux indicatif','dst.estNote':'Estimation d’après la table de taux indicatifs, arrondie à l’inférieur. Le montant exact figure sur le reçu.',
  'dst.payoutNote':'Le transfert reste « En cours » jusqu’au versement de l’argent sur le compte Orange Money. Vous êtes prévenu(e) à ce moment-là.',
  'dst.recorded':'Transfert enregistré','dst.st4':'Enregistré','dst.min':'Minimum pour Orange Money : {n}',
  'dst.type.ML':'Orange Money · Mali','dst.type.CI':'Orange Money · Côte d’Ivoire','dst.country.ML':'Mali','dst.country.CI':'Côte d’Ivoire','dst.country.OM':'Oman'
});
Object.assign(TR.ar, {
  'dst.title':'الإرسال إلى','dst.om':'رقم الهاتف','dst.orange':'Orange Money',
  'dst.hint.OM':'عُمان · 8 أرقام تبدأ بـ 7 أو 9','dst.hint.ML':'مالي · 8 أرقام، مثال 76 12 34 56','dst.hint.CI':'ساحل العاج · 10 أرقام، مثال 07 07 07 07 07',
  'dst.err_short.ML':'يجب أن يتكون الرقم من 8 أرقام.','dst.err_short.CI':'يجب أن يتكون الرقم من 10 أرقام.','dst.err_zero.ML':'لا يبدأ رقم مالي بالصفر.','dst.err_zero.CI':'يبدأ رقم ساحل العاج بالصفر.',
  'dst.first':'الاسم الأول للمستلم','dst.last':'اسم عائلة المستلم','dst.err_name':'أدخل الاسم الأول واسم العائلة للمستلم كما في حسابه على Orange Money.',
  'dst.note.orange':'يحتاج المستلم إلى حساب Orange Money نشط على هذا الرقم. استخدم الاسم المسجّل في ذلك الحساب.',
  'dst.est':'يستلم المستفيد (تقدير)','dst.rate':'سعر استرشادي','dst.estNote':'تقدير من جدول الأسعار الاسترشادي مع التقريب للأسفل. المبلغ الدقيق يظهر في الإيصال.',
  'dst.payoutNote':'يبقى التحويل «قيد المعالجة» إلى أن يُدفع المبلغ إلى حساب Orange Money. سيتم إشعارك عند ذلك.',
  'dst.recorded':'تم تسجيل التحويل','dst.st4':'تم التسجيل','dst.min':'الحد الأدنى لـ Orange Money: {n}',
  'dst.type.ML':'Orange Money · مالي','dst.type.CI':'Orange Money · ساحل العاج','dst.country.ML':'مالي','dst.country.CI':'ساحل العاج','dst.country.OM':'عُمان'
});

const Destinations = (() => {
  /* local = digits typed after the country code (grouping is display only).
     rpc: 'external' = fiat_send_external (Oman, instant)  |  'intl' = intl_send (Orange Money, recorded as in progress, paid out by an administrator) */
  const ALL = Object.freeze([
    Object.freeze({ iso:'OM', serviceId:'local_phone',     cur:'OMR', dial:'+968', len:8,  group:[4, 4],          placeholder:'9123 4567',      kind:'local',        identifierType:'PHONE',        brand:'friendly', rpc:'external', names:false, minOMR:null }),
    Object.freeze({ iso:'ML', serviceId:'orange_money_ml', cur:'XOF', dial:'+223', len:8,  group:[2, 2, 2, 2],    placeholder:'76 12 34 56',    kind:'mobile_money', identifierType:'MOBILE_MONEY', brand:'orange',   rpc:'intl', method:'MOBILE_MONEY', provider:'Orange Money', names:true, minOMR:0.5 }),
    Object.freeze({ iso:'CI', serviceId:'orange_money_ci', cur:'XOF', dial:'+225', len:10, group:[2, 2, 2, 2, 2], placeholder:'07 07 07 07 07', kind:'mobile_money', identifierType:'MOBILE_MONEY', brand:'orange',   rpc:'intl', method:'MOBILE_MONEY', provider:'Orange Money', names:true, minOMR:0.5, flag:'orangeMoneyCI' })
  ]);
  const enabled = d => !d.flag || (typeof FEATURES !== 'undefined' && !!FEATURES[d.flag]);
  const list = () => ALL.filter(enabled);
  let cur = 'OM';
  const of = iso => list().find(d => d.iso === String(iso || '').toUpperCase()) || ALL[0];
  const get = () => of(cur);
  function set(iso){ cur = of(iso).iso; return get(); }
  function normDigits(raw){
    return String(raw == null ? '' : raw)
      .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660))
      .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x6F0));
  }
  /* everything typed or pasted (+223 76 12 34 56, 00225 07…) -> the local digits, at most d.len */
  function digits(raw, d){
    d = d || get();
    if (d.iso === 'OM') return omLocalDigits(raw);                                 /* Oman: unchanged rules */
    const compact = normDigits(raw).replace(/[\s\-().]/g, '');
    const code = d.dial.replace('+', '');
    let n = compact.replace(/\D/g, '');
    if (/^(\+|00)/.test(compact) && n.replace(/^(00)?/, '').indexOf(code) === 0) n = n.replace(/^(00)?/, '').slice(code.length);
    else if (n.length > d.len && n.indexOf(code) === 0) n = n.slice(code.length);  /* code + number pasted without the "+" */
    return n.slice(0, d.len);
  }
  function format(n, d){
    d = d || get();
    if (d.iso === 'OM') return omFormatLocal(n);
    const out = []; let i = 0;
    for (const g of d.group){ if (i >= n.length) break; out.push(n.slice(i, i + g)); i += g; }
    return out.join(' ');
  }
  const intl = (n, d) => (d || get()).dial + n;
  const display = (n, d) => (d || get()).dial + ' ' + format(n, d);
  /* -> { ok:true } or { ok:false, key } ; "final" = the person left the field (a short number is only reported then) */
  function validate(n, d, final){
    d = d || get();
    if (!n) return { ok:false, key:'' };
    if (d.iso === 'OM'){
      if (!/^[79]/.test(n)) return { ok:false, key:'sp.err_prefix' };
      if (n.length < 8) return { ok:false, key: final ? 'sp.err_short' : '' };
      return { ok:true };
    }
    if (d.iso === 'ML' && /^0/.test(n)) return { ok:false, key:'dst.err_zero.ML' };
    if (d.iso === 'CI' && !/^0/.test(n)) return { ok:false, key:'dst.err_zero.CI' };
    if (n.length < d.len) return { ok:false, key: final ? 'dst.err_short.' + d.iso : '' };
    return { ok:true };
  }
  /* a recipient name: letters, spaces, apostrophes, dots, hyphens (same rule as the profile) */
  const NAME = /^[\p{L}][\p{L}\p{M}' .-]{0,59}$/u;
  const cleanName = s => String(s == null ? '' : s).trim().replace(/\s+/g, ' ');
  const validName = s => NAME.test(cleanName(s));
  /* "+22376123456" -> "+223 76 12 34 56". Anything else is returned unchanged (null). */
  function formatIntl(p){
    const raw = String(p == null ? '' : p).trim();
    const compact = raw.replace(/[\s\-().]/g, '');
    for (const d of ALL){
      if (d.iso === 'OM') continue;
      const code = d.dial.replace('+', '');
      const m = compact.match(/^(?:\+|00)?(\d+)$/);
      if (m && m[1].indexOf(code) === 0 && m[1].length === code.length + d.len && /^(\+|00)/.test(compact)) return display(m[1].slice(code.length), d);
    }
    return null;
  }
  /* the destination a stored beneficiary belongs to (old transfers have no country: Oman) */
  const forBeneficiary = b => of(b && b.country);
  const serviceFor = d => CountryTransferEngine.getService(d.iso, d.serviceId);
  const typeLabel = d => d.iso === 'OM' ? t('sp.type') : t('dst.type.' + d.iso);
  const countryName = d => t('dst.country.' + d.iso);
  const minOMR = d => (d && d.minOMR) || CONFIG.LIMITS.minOMR;
  /* indicative amount in the destination currency (same table value as the server's fx_rates; the server rounds DOWN, so does this); null for rials */
  function quote(amountOMR, d){
    d = d || get();
    if (d.cur === 'OMR') return null;
    const rate = typeof FX_RATES !== 'undefined' ? FX_RATES[d.cur] : null;
    if (!rate || !isFinite(rate)) return null;
    return { rate, cur: d.cur, amount: Math.floor(Number(amountOMR) * rate) };
  }
  const destCurrency = d => (d || get()).cur;
  /* what the server receives as the beneficiary: Oman keeps its original shape; Orange Money needs the names and the +code number */
  function beneficiaryReq(b, d){
    d = d || forBeneficiary(b);
    if (!d.names) return { firstName:'', lastName:'', phone: b.phone, country: d.iso, identifierType: d.identifierType };
    return { firstName: b.firstName || '', lastName: b.lastName || '', phone: b.phone };
  }
  const fullName = (f, l) => cleanName(cleanName(f) + ' ' + cleanName(l));
  function orangeMark(){ return '<span class="dst-om" aria-hidden="true"><i></i></span>'; }
  /* the picker: one tile per enabled destination; "radiogroup" semantics */
  function pickerHtml(){
    const sel = get(), L = list();
    return '<div class="dst n' + L.length + '" role="radiogroup" aria-label="' + escapeHtml(t('dst.title')) + '">' + L.map(d => {
      const on = d.iso === sel.iso;
      return '<button type="button" class="dst-opt' + (on ? ' on' : '') + '" role="radio" aria-checked="' + (on ? 'true' : 'false') + '" data-dst="' + d.iso + '">' +
        '<span class="dst-flag">' + flag(d.iso) + '</span>' +
        '<span class="dst-name">' + escapeHtml(countryName(d)) + '</span>' +
        '<span class="dst-sub">' + (d.brand === 'orange' ? orangeMark() + escapeHtml(t('dst.orange')) : escapeHtml(t('dst.om'))) + '</span>' +
      '</button>';
    }).join('') + '</div>';
  }
  return { list, get, set, of, digits, format, intl, display, validate, validName, cleanName, fullName, formatIntl, forBeneficiary, serviceFor, typeLabel, countryName, minOMR, quote, destCurrency, beneficiaryReq, pickerHtml, orangeMark };
})();
