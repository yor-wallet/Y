'use strict';

/* ============================================================
   DESTINATIONS (12.16.0) — where a transfer can be sent.
   Oman (mobile number, rials) stays exactly as it was. New: Orange Money in Mali and in Côte d'Ivoire (West African CFA franc, XOF).
   The money logic is unchanged: the server function fiat_send_external records the transfer, debits the rials and computes the
   amount in XOF from its own rate table; this module only describes the destinations, validates the number and shows an ESTIMATE
   (the built-in indicative table, same value as the server's table). The exact amount is the one on the receipt.
   ============================================================ */
Object.assign(TR.en, {
  'dst.title':'Send to','dst.om':'Mobile number','dst.orange':'Orange Money',
  'dst.hint.OM':'Oman · 8 digits, starting with 7 or 9','dst.hint.ML':'Mali · 8 digits, for example 76 12 34 56','dst.hint.CI':'Côte d’Ivoire · 10 digits, for example 07 07 07 07 07',
  'dst.err_short.ML':'The number must have 8 digits.','dst.err_short.CI':'The number must have 10 digits.','dst.err_zero.ML':'A number in Mali does not start with 0.','dst.err_zero.CI':'A number in Côte d’Ivoire starts with 0.',
  'dst.note.orange':'The recipient needs an active Orange Money account on this number.',
  'dst.est':'Recipient receives (estimate)','dst.rate':'Indicative rate','dst.estNote':'Estimate from the indicative rate table. The exact amount is shown on the receipt.',
  'dst.type.ML':'Orange Money · Mali','dst.type.CI':'Orange Money · Côte d’Ivoire','dst.country.ML':'Mali','dst.country.CI':'Côte d’Ivoire','dst.country.OM':'Oman'
});
Object.assign(TR.fr, {
  'dst.title':'Envoyer vers','dst.om':'Numéro de mobile','dst.orange':'Orange Money',
  'dst.hint.OM':'Oman · 8 chiffres, commence par 7 ou 9','dst.hint.ML':'Mali · 8 chiffres, par exemple 76 12 34 56','dst.hint.CI':'Côte d’Ivoire · 10 chiffres, par exemple 07 07 07 07 07',
  'dst.err_short.ML':'Le numéro doit avoir 8 chiffres.','dst.err_short.CI':'Le numéro doit avoir 10 chiffres.','dst.err_zero.ML':'Un numéro du Mali ne commence pas par 0.','dst.err_zero.CI':'Un numéro de Côte d’Ivoire commence par 0.',
  'dst.note.orange':'Le destinataire doit avoir un compte Orange Money actif sur ce numéro.',
  'dst.est':'Le destinataire reçoit (estimation)','dst.rate':'Taux indicatif','dst.estNote':'Estimation d’après la table de taux indicatifs. Le montant exact figure sur le reçu.',
  'dst.type.ML':'Orange Money · Mali','dst.type.CI':'Orange Money · Côte d’Ivoire','dst.country.ML':'Mali','dst.country.CI':'Côte d’Ivoire','dst.country.OM':'Oman'
});
Object.assign(TR.ar, {
  'dst.title':'الإرسال إلى','dst.om':'رقم الهاتف','dst.orange':'Orange Money',
  'dst.hint.OM':'عُمان · 8 أرقام تبدأ بـ 7 أو 9','dst.hint.ML':'مالي · 8 أرقام، مثال 76 12 34 56','dst.hint.CI':'ساحل العاج · 10 أرقام، مثال 07 07 07 07 07',
  'dst.err_short.ML':'يجب أن يتكون الرقم من 8 أرقام.','dst.err_short.CI':'يجب أن يتكون الرقم من 10 أرقام.','dst.err_zero.ML':'لا يبدأ رقم مالي بالصفر.','dst.err_zero.CI':'يبدأ رقم ساحل العاج بالصفر.',
  'dst.note.orange':'يحتاج المستلم إلى حساب Orange Money نشط على هذا الرقم.',
  'dst.est':'يستلم المستفيد (تقدير)','dst.rate':'سعر استرشادي','dst.estNote':'تقدير من جدول الأسعار الاسترشادي. المبلغ الدقيق يظهر في الإيصال.',
  'dst.type.ML':'Orange Money · مالي','dst.type.CI':'Orange Money · ساحل العاج','dst.country.ML':'مالي','dst.country.CI':'ساحل العاج','dst.country.OM':'عُمان'
});

const Destinations = (() => {
  /* local = digits typed after the country code; grouping is display only */
  const LIST = Object.freeze([
    Object.freeze({ iso:'OM', serviceId:'local_phone',     cur:'OMR', dial:'+968', len:8,  group:[4, 4],          placeholder:'9123 4567',     kind:'local',        identifierType:'PHONE',        brand:'friendly' }),
    Object.freeze({ iso:'ML', serviceId:'orange_money_ml', cur:'XOF', dial:'+223', len:8,  group:[2, 2, 2, 2],    placeholder:'76 12 34 56',   kind:'mobile_money', identifierType:'MOBILE_MONEY', brand:'orange' }),
    Object.freeze({ iso:'CI', serviceId:'orange_money_ci', cur:'XOF', dial:'+225', len:10, group:[2, 2, 2, 2, 2], placeholder:'07 07 07 07 07', kind:'mobile_money', identifierType:'MOBILE_MONEY', brand:'orange' })
  ]);
  let cur = 'OM';
  const of = iso => LIST.find(d => d.iso === String(iso || '').toUpperCase()) || LIST[0];
  const get = () => of(cur);
  function set(iso){ cur = of(iso).iso; return get(); }
  const list = () => LIST;
  function normDigits(raw){
    return String(raw == null ? '' : raw)
      .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660))
      .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x6F0));
  }
  /* everything typed or pasted (+223 76 12 34 56, 00225 07…, 076…) -> the local digits, at most d.len */
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
  /* "+22376123456" -> "+223 76 12 34 56". Anything else is returned unchanged. */
  function formatIntl(p){
    const raw = String(p == null ? '' : p).trim();
    const compact = raw.replace(/[\s\-().]/g, '');
    for (const d of LIST){
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
  /* indicative amount in the destination currency (same table value as the server's fx_rates); null when the currency is the rial */
  function quote(amountOMR, d){
    d = d || get();
    if (d.cur === 'OMR') return null;
    const rate = typeof FX_RATES !== 'undefined' ? FX_RATES[d.cur] : null;
    if (!rate || !isFinite(rate)) return null;
    return { rate, cur: d.cur, amount: Number(amountOMR) * rate };
  }
  /* dest currency for the server request */
  const destCurrency = d => (d || get()).cur;
  const beneficiaryReq = (phone, d) => ({ firstName:'', lastName:'', phone, country:(d || get()).iso, identifierType:(d || get()).identifierType });
  function orangeMark(){ return '<span class="dst-om" aria-hidden="true"><i></i></span>'; }
  /* the picker (three choices); "radiogroup" semantics, one tile each */
  function pickerHtml(){
    const sel = get();
    return '<div class="dst" role="radiogroup" aria-label="' + escapeHtml(t('dst.title')) + '">' + LIST.map(d => {
      const on = d.iso === sel.iso;
      return '<button type="button" class="dst-opt' + (on ? ' on' : '') + '" role="radio" aria-checked="' + (on ? 'true' : 'false') + '" data-dst="' + d.iso + '">' +
        '<span class="dst-flag">' + flag(d.iso) + '</span>' +
        '<span class="dst-name">' + escapeHtml(countryName(d)) + '</span>' +
        '<span class="dst-sub">' + (d.brand === 'orange' ? orangeMark() + escapeHtml(t('dst.orange')) : escapeHtml(t('dst.om'))) + '</span>' +
      '</button>';
    }).join('') + '</div>';
  }
  return { list, get, set, of, digits, format, intl, display, validate, formatIntl, forBeneficiary, serviceFor, typeLabel, countryName, quote, destCurrency, beneficiaryReq, pickerHtml, orangeMark };
})();
