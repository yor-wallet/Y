'use strict';

/* ============================================================
   16.3.0 — two-step verification (TOTP) with Supabase Auth MFA (owner's brief of 26/11, §7)
   - turn on: Supabase creates the secret and the QR code; the factor is active ONLY after a correct 6-digit code (challenge + verify);
     closing the sheet before that removes the unverified factor
   - sign-in: password first; if the account has a verified factor, the session stays at level aal1 and nothing is loaded until the code
     is verified (level aal2). The server enforces it too (migration 20261128_mfa_totp.sql: data, money and admin require aal2)
   - turn off: from an aal2 session, after confirmation
   - no phone number involved. This is the sign-in code, NOT the transaction code (two separate mechanisms).
   ============================================================ */
Object.assign(TR.en, { 'mfa.title':'Two-step verification', 'mfa.on':'On', 'mfa.off':'Off', 'mfa.subOn':'An authenticator app code is asked at every sign-in', 'mfa.subOff':'Add a code from an authenticator app at sign-in',
  'mfa.setupT':'Turn on two-step verification', 'mfa.step1':'Open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…) and scan this QR code.', 'mfa.manual':'Cannot scan? Enter this key:',
  'mfa.step2':'Enter the 6-digit code shown by the app to finish.', 'mfa.code':'6-digit code', 'mfa.verify':'Verify and turn on', 'mfa.done':'Two-step verification is on.', 'mfa.bad':'Wrong or expired code. Try the new code.',
  'mfa.err':'Two-step verification is not available right now.', 'mfa.offT':'Turn off two-step verification?', 'mfa.offD':'Your account will only be protected by your password at sign-in.', 'mfa.offYes':'Turn off', 'mfa.offDone':'Two-step verification is off.',
  'mfa.gateT':'Two-step verification', 'mfa.gateD':'Enter the 6-digit code from your authenticator app.', 'mfa.gateGo':'Continue', 'mfa.signout':'Sign out', 'mfa.copy':'Copy', 'mfa.copied':'Copied' });
Object.assign(TR.fr, { 'mfa.title':'Vérification en deux étapes', 'mfa.on':'Activée', 'mfa.off':'Désactivée', 'mfa.subOn':'Un code de votre application d’authentification est demandé à chaque connexion', 'mfa.subOff':'Ajoutez un code d’application d’authentification à la connexion',
  'mfa.setupT':'Activer la vérification en deux étapes', 'mfa.step1':'Ouvrez une application d’authentification (Google Authenticator, Microsoft Authenticator, 1Password…) et scannez ce QR code.', 'mfa.manual':'Impossible de scanner ? Saisissez cette clé :',
  'mfa.step2':'Saisissez le code à 6 chiffres affiché par l’application pour terminer.', 'mfa.code':'Code à 6 chiffres', 'mfa.verify':'Vérifier et activer', 'mfa.done':'La vérification en deux étapes est activée.', 'mfa.bad':'Code incorrect ou expiré. Essayez le nouveau code.',
  'mfa.err':'La vérification en deux étapes est indisponible pour le moment.', 'mfa.offT':'Désactiver la vérification en deux étapes ?', 'mfa.offD':'Votre compte ne sera plus protégé que par votre mot de passe à la connexion.', 'mfa.offYes':'Désactiver', 'mfa.offDone':'La vérification en deux étapes est désactivée.',
  'mfa.gateT':'Vérification en deux étapes', 'mfa.gateD':'Saisissez le code à 6 chiffres de votre application d’authentification.', 'mfa.gateGo':'Continuer', 'mfa.signout':'Se déconnecter', 'mfa.copy':'Copier', 'mfa.copied':'Copié' });
Object.assign(TR.ar, { 'mfa.title':'التحقق بخطوتين', 'mfa.on':'مفعّل', 'mfa.off':'غير مفعّل', 'mfa.subOn':'يُطلب رمز من تطبيق المصادقة عند كل تسجيل دخول', 'mfa.subOff':'أضف رمزاً من تطبيق مصادقة عند تسجيل الدخول',
  'mfa.setupT':'تفعيل التحقق بخطوتين', 'mfa.step1':'افتح تطبيق مصادقة (Google Authenticator أو Microsoft Authenticator أو 1Password…) وامسح رمز QR هذا.', 'mfa.manual':'لا يمكنك المسح؟ أدخل هذا المفتاح:',
  'mfa.step2':'أدخل الرمز المكوّن من 6 أرقام الظاهر في التطبيق للإنهاء.', 'mfa.code':'رمز من 6 أرقام', 'mfa.verify':'تحقق وفعّل', 'mfa.done':'تم تفعيل التحقق بخطوتين.', 'mfa.bad':'الرمز غير صحيح أو منتهي الصلاحية. جرّب الرمز الجديد.',
  'mfa.err':'التحقق بخطوتين غير متاح حالياً.', 'mfa.offT':'إيقاف التحقق بخطوتين؟', 'mfa.offD':'لن يحمي حسابك عند الدخول سوى كلمة المرور.', 'mfa.offYes':'إيقاف', 'mfa.offDone':'تم إيقاف التحقق بخطوتين.',
  'mfa.gateT':'التحقق بخطوتين', 'mfa.gateD':'أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة.', 'mfa.gateGo':'متابعة', 'mfa.signout':'تسجيل الخروج', 'mfa.copy':'نسخ', 'mfa.copied':'تم النسخ' });

const Mfa = (() => {
  let state = { known: false, on: false, factorId: null };
  const totp = list => ((list && (list.totp || list.all)) || []).filter(f => f.factor_type === 'totp');
  async function refresh(){
    try {
      const { data, error } = await sb.auth.mfa.listFactors();
      if (error) throw error;
      const v = totp(data).find(f => f.status === 'verified');
      state = { known: true, on: !!v, factorId: v ? v.id : null };
    } catch(e){ state = { known: false, on: false, factorId: null }; }
    return state;
  }
  function row(){
    const on = state.on;
    return '<button class="settings-row mfa-row' + (on ? ' is-on' : '') + '" type="button" data-action="settings-mfa">' +
      '<div class="tile">' + icon('shield', 20) + '</div>' +
      '<div class="settings-row-body"><div class="settings-row-title">' + escapeHtml(t('mfa.title')) + '</div><div class="settings-row-sub">' + escapeHtml(t(on ? 'mfa.subOn' : 'mfa.subOff')) + '</div></div>' +
      '<span class="settings-value fid-state ' + (on ? 'on' : 'off') + '">' + escapeHtml(state.known ? t(on ? 'mfa.on' : 'mfa.off') : '…') + '</span></button>';
  }
  const codeField = id => '<div class="field"><label class="field-label" for="' + id + '">' + escapeHtml(t('mfa.code')) + '</label><div class="field-box"><input id="' + id + '" class="ltr mfa-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" dir="ltr"></div></div>';
  const digits = v => String(v || '').replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660)).replace(/\D/g, '').slice(0, 6);

  /* turn on: enrol → QR + key → code verified → active */
  async function setup(){
    let fid = null, verified = false;
    try {
      const pending = totp((await sb.auth.mfa.listFactors()).data).filter(f => f.status !== 'verified');      /* leftovers of an abandoned set-up */
      for (const f of pending){ try { await sb.auth.mfa.unenroll({ factorId: f.id }); } catch(e){} }
      const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'OM Wallet ' + new Date().toISOString().slice(0, 10) });
      if (error || !data) throw error || new Error('enroll');
      fid = data.id;
      const qr = data.totp && data.totp.qr_code, secret = data.totp && data.totp.secret;
      const close = R.overlay.open(
        '<div class="mfa-sheet"><h2 class="h2">' + escapeHtml(t('mfa.setupT')) + '</h2>' +
        '<p class="mfa-p">' + escapeHtml(t('mfa.step1')) + '</p>' +
        '<div class="mfa-qr"><img alt="QR" width="200" height="200" src="' + escapeHtml(qr) + '"></div>' +
        '<p class="mfa-p small">' + escapeHtml(t('mfa.manual')) + '</p><div class="mfa-secret"><code class="ltr" dir="ltr">' + escapeHtml(secret) + '</code><button type="button" class="btn btn-secondary btn-sm" id="mfa-copy">' + escapeHtml(t('mfa.copy')) + '</button></div>' +
        '<p class="mfa-p">' + escapeHtml(t('mfa.step2')) + '</p>' + codeField('mfa-in') +
        '<div class="field-err" id="mfa-err" role="alert"></div>' +
        '<button class="btn btn-primary" id="mfa-go" type="button">' + escapeHtml(t('mfa.verify')) + '</button></div>',
        { kind: 'sheet', onClose: async () => { if (!verified && fid){ try { await sb.auth.mfa.unenroll({ factorId: fid }); } catch(e){} } } });
      setTimeout(() => {
        const inp = document.getElementById('mfa-in'), go = document.getElementById('mfa-go'), err = document.getElementById('mfa-err');
        if (!inp) return;
        inp.addEventListener('input', () => { inp.value = digits(inp.value); });
        const cp = document.getElementById('mfa-copy');
        cp.onclick = () => { try { navigator.clipboard.writeText(secret); cp.textContent = t('mfa.copied'); } catch(e){} };
        go.onclick = async () => {
          const code = digits(inp.value); if (code.length !== 6){ err.textContent = t('mfa.bad'); return; }
          UIKit.loading(go, true);
          const { error: e2 } = await sb.auth.mfa.challengeAndVerify({ factorId: fid, code });
          UIKit.loading(go, false);
          if (e2){ err.textContent = t('mfa.bad'); inp.value = ''; inp.focus(); return; }
          verified = true; await refresh(); close(); toast(t('mfa.done'), 'success');
          try { if (R.current() === 'settings' || R.current() === 'profile') R.go(R.current(), { force: true }); } catch(e){}
        };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); });
      }, 60);
    } catch(e){
      console.warn('mfa setup', e);
      if (fid && !verified){ try { await sb.auth.mfa.unenroll({ factorId: fid }); } catch(_){} }
      toast(t('mfa.err'), 'error');
    }
  }
  async function disable(){
    await refresh(); if (!state.on) return;
    const yes = await new Promise(res => {
      const close = R.overlay.open('<div class="mfa-sheet"><h2 class="h2">' + escapeHtml(t('mfa.offT')) + '</h2><p class="mfa-p">' + escapeHtml(t('mfa.offD')) + '</p>' +
        '<button class="btn btn-danger" id="mfa-off" type="button">' + escapeHtml(t('mfa.offYes')) + '</button><button class="btn btn-ghost" id="mfa-keep" type="button">' + escapeHtml(t('pin.cancel')) + '</button></div>',
        { kind: 'modal', onClose: () => res(false) });
      setTimeout(() => { const o = document.getElementById('mfa-off'), k = document.getElementById('mfa-keep');
        if (o) o.onclick = () => { res(true); close(); }; if (k) k.onclick = () => { res(false); close(); }; }, 60);
    });
    if (!yes) return;
    const { error } = await sb.auth.mfa.unenroll({ factorId: state.factorId });
    if (error){ toast(t('mfa.err'), 'error'); return; }
    await refresh(); toast(t('mfa.offDone'), 'success');
    try { R.go(R.current(), { force: true }); } catch(e){}
  }
  function toggle(){ return state.on ? disable() : setup(); }

  /* sign-in gate: resolves true once the session is aal2 (or no factor), false if the person signs out */
  async function gate(){
    let lvl;
    try { const r = await sb.auth.mfa.getAuthenticatorAssuranceLevel(); lvl = r.data; } catch(e){ return true; }
    if (!lvl || lvl.nextLevel !== 'aal2' || lvl.currentLevel === 'aal2') return true;
    const f = (await refresh()).factorId; if (!f) return true;
    return new Promise(resolve => {
      let done = false;
      const end = v => { if (done) return; done = true; resolve(v); };
      /* own layer, outside the router: a navigation during start-up (which closes the router's overlays) cannot remove it */
      const host = document.createElement('div'); host.className = 'ov is-modal is-open mfa-ov'; host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true');
      const close = () => { host.remove(); };
      host.innerHTML = '<div class="ov-backdrop"></div><div class="ov-panel" tabindex="-1">' + (
        '<div class="mfa-sheet mfa-gate"><div class="ce-ic" aria-hidden="true">' + icon('shield', 30) + '</div><h2 class="h2">' + escapeHtml(t('mfa.gateT')) + '</h2>' +
        '<p class="mfa-p">' + escapeHtml(t('mfa.gateD')) + '</p>' + codeField('mfa-gin') + '<div class="field-err" id="mfa-gerr" role="alert"></div>' +
        '<button class="btn btn-primary" id="mfa-ggo" type="button">' + escapeHtml(t('mfa.gateGo')) + '</button>' +
        '<button class="btn btn-ghost" id="mfa-gout" type="button">' + escapeHtml(t('mfa.signout')) + '</button></div>') + '</div>';
      document.body.appendChild(host);
      setTimeout(() => {
        const inp = document.getElementById('mfa-gin'), go = document.getElementById('mfa-ggo'), err = document.getElementById('mfa-gerr');
        if (!inp) return end(false);
        inp.focus();
        inp.addEventListener('input', () => { inp.value = digits(inp.value); if (inp.value.length === 6) go.click(); });
        go.onclick = async () => {
          const code = digits(inp.value); if (code.length !== 6){ err.textContent = t('mfa.bad'); return; }
          UIKit.loading(go, true);
          const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: f, code });
          UIKit.loading(go, false);
          if (error){ err.textContent = t('mfa.bad'); inp.value = ''; inp.focus(); try { UIKit.haptic('error'); } catch(e){} return; }
          close(); end(true);
        };
        document.getElementById('mfa-gout').onclick = () => { close(); end(false); };
      }, 60);
    });
  }
  return { refresh, row, toggle, gate, state: () => state };
})();
