'use strict';

/* ============================================================
   ACCOUNT HUB (13.2.0) — « Profil et paramètres » : the page behind the bottom bar's last tab, laid out like the OM Wallet reference.
   Profile card, wallet card, account level, then one list that opens the existing pages (security → Settings, notifications, language → Settings,
   help, about) and the red « Log out » button. Everything shown is read from the signed-in account (name, number, verified status, balance);
   nothing is invented: "Verified account" appears only when the server's KYC status says so.
   ============================================================ */
Object.assign(TR.en, {
  'nav.account':'Account','nav.tx':'Transactions','hm.transfer':'Transfer','hm.welcome':'Welcome, {n}','hm.dear':'dear customer','hm.sub':'to your OM Wallet digital wallet',
  'ac.title':'Profile & settings','ac.sub':'Manage your account and app preferences','ac.user':'OM Wallet user','ac.verified':'Verified account','ac.unverified':'Account not verified',
  'ac.wallet':'Wallet','ac.avail':'Available balance','ac.level':'Account level','ac.full':'Fully verified','ac.notyet':'Not verified yet',
  'ac.sec':'Security & protection','ac.secD':'Password, Face ID, app lock','ac.notif':'Notifications','ac.notifD':'Manage alerts and messages','ac.lang':'Language','ac.help':'Help & support','ac.helpD':'Contact the support team',
  'ac.about':'About OM Wallet','ac.aboutD':'App version, terms and policies','ac.logout':'Log out','ac.admin':'Admin control','ac.adminD':'Transfer settings and payouts','ac.edit':'Edit profile'
});
Object.assign(TR.fr, {
  'nav.account':'Compte','nav.tx':'Opérations','hm.transfer':'Transférer','hm.welcome':'Bienvenue, {n}','hm.dear':'cher client','hm.sub':'dans votre portefeuille numérique OM Wallet',
  'ac.title':'Profil et paramètres','ac.sub':'Gérez votre compte et les préférences de l’application','ac.user':'Utilisateur OM Wallet','ac.verified':'Compte vérifié','ac.unverified':'Compte non vérifié',
  'ac.wallet':'Portefeuille','ac.avail':'Solde disponible','ac.level':'Niveau du compte','ac.full':'Entièrement vérifié','ac.notyet':'Pas encore vérifié',
  'ac.sec':'Sécurité et protection','ac.secD':'Mot de passe, Face ID, verrou de l’application','ac.notif':'Notifications','ac.notifD':'Gérer les alertes et les messages','ac.lang':'Langue','ac.help':'Aide et assistance','ac.helpD':'Contacter l’équipe d’assistance',
  'ac.about':'À propos d’OM Wallet','ac.aboutD':'Version, conditions et politiques','ac.logout':'Se déconnecter','ac.admin':'Contrôle administrateur','ac.adminD':'Réglages des transferts et versements','ac.edit':'Modifier le profil'
});
Object.assign(TR.ar, {
  'nav.account':'الحساب','nav.tx':'العمليات','hm.transfer':'تحويل','hm.welcome':'مرحباً، {n}','hm.dear':'عزيزي العميل','hm.sub':'في محفظة OM Wallet الرقمية',
  'ac.title':'الملف الشخصي والإعدادات','ac.sub':'إدارة حسابك وتفضيلات التطبيق','ac.user':'مستخدم OM Wallet','ac.verified':'حساب موثّق','ac.unverified':'حساب غير موثّق',
  'ac.wallet':'المحفظة','ac.avail':'الرصيد المتاح','ac.level':'مستوى الحساب','ac.full':'موثّق بالكامل','ac.notyet':'غير موثّق بعد',
  'ac.sec':'الأمان والحماية','ac.secD':'كلمة المرور، بصمة الوجه، قفل التطبيق','ac.notif':'الإشعارات','ac.notifD':'إدارة التنبيهات والرسائل','ac.lang':'اللغة','ac.help':'مساعدة ودعم','ac.helpD':'تواصل مع فريق الدعم',
  'ac.about':'عن OM Wallet','ac.aboutD':'إصدار التطبيق، الشروط والسياسات','ac.logout':'تسجيل الخروج','ac.admin':'لوحة التحكم الإدارية','ac.adminD':'إعدادات التحويل والدفعات','ac.edit':'تعديل الملف'
});

/* the OM PAY logo of the reference, light and dark variants (the stylesheet shows the one that matches the theme) */
function omLogoHtml(w){ const h = Math.round(w * 0.73); return '<span class="px-logo" role="img" aria-label="OM Wallet"><img class="lg-l" src="assets/brand/om-pay-logo.png" alt="" width="' + w + '" height="' + h + '" decoding="async"><img class="lg-d" src="assets/brand/om-pay-logo-dark.png" alt="" width="' + w + '" height="' + h + '" decoding="async"></span>'; }
function renderAccount(){
  const p = Runtime.profile || {}, main = (typeof mainAccount === 'function') ? mainAccount() : {};
  const hide = !!Runtime.hideBalance;
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || p.displayName || t('hm.dear');
  const phone = p.phone ? formatPhoneIntl(p.phone) : '';
  const kyc = String((p.kyc && p.kyc.status) || '').toUpperCase();
  const verified = kyc === 'VERIFIED' || kyc === 'APPROVED';
  const isAdmin = !!(Runtime.ctx && Runtime.ctx.role === 'admin');
  const notifsOn = !(Runtime.settings && Runtime.settings.notifications === false);
  const tile = (cls, ic) => '<span class="hub-i ' + cls + '">' + icon(ic, 22) + '</span>';
  const row = (nav, cls, ic, title, sub, extra) => '<button type="button" class="hub-row" data-nav="' + nav + '">' + tile(cls, ic) +
    '<span class="hub-t"><b>' + escapeHtml(title) + '</b><small>' + escapeHtml(sub) + '</small></span>' + (extra || '') + '<span class="hub-chev dir-flip">' + icon('chev', 18) + '</span></button>';
  return '<div class="hub">' +
    '<header class="hub-top"><button class="hub-circ" data-action="back" aria-label="' + escapeHtml(t('ui.back')) + '">' + icon('back', 22) + '</button>' +
      omLogoHtml(86) +
      '<button class="hub-circ" data-action="notifications" aria-label="' + escapeHtml(t('ui.notifications')) + '">' + icon('bell', 22) + (((Runtime.notifications || []).some(n => !n.read)) ? '<span class="rv-bdg dot"></span>' : '') + '</button></header>' +
    '<section class="hub-head"><h1>' + escapeHtml(t('ac.title')) + '</h1><p>' + escapeHtml(t('ac.sub')) + '</p></section>' +
    '<section class="hub-card hub-me"><button type="button" class="hub-me-go" data-nav="profile" aria-label="' + escapeHtml(name) + '"><span class="hub-chev dir-flip">' + icon('chev', 18) + '</span></button>' +
      '<div class="hub-ava">' + pxAvatar(p) + '<button type="button" class="hub-edit" data-nav="profile-edit" aria-label="' + escapeHtml(t('ac.edit')) + '">' + '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>' + '</button></div>' +
      '<div class="hub-who"><b>' + escapeHtml(name) + '</b>' + (phone ? '<span class="ltr" dir="ltr">' + escapeHtml(phone) + '</span>' : '') +
        '<div class="hub-badges"><span class="hub-badge">' + escapeHtml(t('ac.user')) + '</span><span class="hub-badge ' + (verified ? 'ok' : 'no') + '">' + icon(verified ? 'shield' : 'info', 14) + escapeHtml(t(verified ? 'ac.verified' : 'ac.unverified')) + '</span></div></div></section>' +
    '<div class="hub-two">' +
      '<section class="hub-card hub-wallet"><span class="hub-chev dir-flip">' + icon('chev', 16) + '</span><div><small>' + escapeHtml(t('ac.avail')) + '</small><b>' + escapeHtml(t('ac.wallet')) + '</b><span class="hub-amt ltr" dir="ltr">' +
        (hide ? '••••••' : moneyHtml(CurrencyEngine.format(main.availableBalance != null ? main.availableBalance : main.balance, main.currency || 'OMR'))) + '</span></div><span class="hub-wi">' + icon('wallet', 26) + '</span></section>' +
      '<section class="hub-card hub-level"><span class="hub-chev dir-flip">' + icon('chev', 16) + '</span><div><b>' + escapeHtml(t('ac.level')) + '</b><span class="' + (verified ? 'ok' : 'no') + '">' + escapeHtml(t(verified ? 'ac.full' : 'ac.notyet')) + '</span></div><span class="hub-wi crown">' + icon(verified ? 'shield' : 'info', 26) + '</span></section>' +
    '</div>' +
    '<section class="hub-card hub-list">' +
      row('settings', 'c-blue', 'lock', t('ac.sec'), t('ac.secD')) +
      '<div class="hub-row"><span class="hub-i c-violet">' + icon('bell', 22) + '</span><span class="hub-t"><b>' + escapeHtml(t('ac.notif')) + '</b><small>' + escapeHtml(t('ac.notifD')) + '</small></span>' +
        '<button type="button" class="switch" role="switch" aria-checked="' + (notifsOn ? 'true' : 'false') + '" aria-label="' + escapeHtml(t('ac.notif')) + '" data-action="settings-toggle-notifs"></button></div>' +
      row('settings', 'c-blue', 'globe', t('ac.lang'), 'العربية، English، Français') +
      row('help', 'c-green', 'help', t('ac.help'), t('ac.helpD')) +
      row('about', 'c-blue', 'info', t('ac.about'), t('ac.aboutD')) +
      (isAdmin ? row('dy-control', 'c-navy', 'shield', t('ac.admin'), t('ac.adminD')) : '') +
      '<button type="button" class="hub-out" data-action="sign-out">' + escapeHtml(t('ac.logout')) + icon('logout', 20) + '</button>' +
    '</section><div style="height:calc(120px + var(--safe-b))"></div></div>';
}
R.register({ account: renderAccount });
