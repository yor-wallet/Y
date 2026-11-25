'use strict';
/* ============================================================
   V12 — navigation, language and sign-in header (OM Wallet).
   14.10.0: the virtual cards (screens, actions, card faces, details, colours) were removed at the owner's request;
   the user data collection « cards » is left untouched in the database (nothing is ever deleted).
   ============================================================ */
const V12 = (() => {
  const D = {
    en: { cards:'Cards', addCard:'Add card', freeze:'Freeze', unfreeze:'Unfreeze', frozen:'Frozen', details:'Details', hide:'Hide', settings:'Settings', limits:'Limits', virtual:'Virtual', physical:'Physical',
      cardNumber:'Card number', expiry:'Expiry', cvv:'CVV', holder:'Cardholder', copied:'Copied', online:'Online payments', onlineD:'Use this card on websites and apps', contactless:'Contactless payments', contactlessD:'Tap to pay with this card',
      atm:'ATM withdrawals', atmD:'Withdraw cash at ATMs', monthly:'Monthly limit', noLimit:'No limit', design:'Card design', label:'Card name', terminate:'Terminate card', terminateQ:'Terminate this card? This cannot be undone.',
      confirm:'Confirm', cancel:'Cancel', activity:'Card activity', noPay:'No card payments yet', noPayD:'Payments made with your card will appear here.', security:'Security', spending:'Spending limits', appearance:'Appearance',
      saved:'Saved', froze:'Card frozen', unfroze:'Card unfrozen', gone:'Card terminated', chooseDesign:'Choose a design', create:'Create card', noCards:'No card yet', noCardsD:'Create an OM Wallet virtual card in seconds.', typeL:'Card type', save:'Save', failed:'Something went wrong',
      hello:'Hello', accounts:'Accounts', allAccounts:'All accounts', send:'Send', receive:'Receive', exchange:'Exchange', more:'More', seeAll:'See all', crypto:'Crypto', transactions:'Transactions', today:'Today', yesterday:'Yesterday', noTx:'No transactions yet',
      personal:'Personal', portfolio:'Portfolio', home:'Home', services:'Services', defName:'OM card' },
    fr: { cards:'Cartes', addCard:'Ajouter une carte', freeze:'Bloquer', unfreeze:'D\u00e9bloquer', frozen:'Bloqu\u00e9e', details:'D\u00e9tails', hide:'Masquer', settings:'R\u00e9glages', limits:'Plafonds', virtual:'Virtuelle', physical:'Physique',
      cardNumber:'Num\u00e9ro de carte', expiry:'Expiration', cvv:'CVV', holder:'Titulaire', copied:'Copi\u00e9', online:'Paiements en ligne', onlineD:'Utiliser cette carte sur les sites et applications', contactless:'Paiements sans contact', contactlessD:'Payer en approchant la carte',
      atm:'Retraits aux distributeurs', atmD:'Retirer des esp\u00e8ces', monthly:'Plafond mensuel', noLimit:'Sans plafond', design:'Design de la carte', label:'Nom de la carte', terminate:'R\u00e9silier la carte', terminateQ:'R\u00e9silier cette carte ? Cette action est d\u00e9finitive.',
      confirm:'Confirmer', cancel:'Annuler', activity:'Activit\u00e9 de la carte', noPay:'Aucun paiement par carte', noPayD:'Les paiements effectu\u00e9s avec votre carte appara\u00eetront ici.', security:'S\u00e9curit\u00e9', spending:'Plafonds de d\u00e9penses', appearance:'Apparence',
      saved:'Enregistr\u00e9', froze:'Carte bloqu\u00e9e', unfroze:'Carte d\u00e9bloqu\u00e9e', gone:'Carte r\u00e9sili\u00e9e', chooseDesign:'Choisissez un design', create:'Cr\u00e9er la carte', noCards:'Aucune carte', noCardsD:'Cr\u00e9ez une carte virtuelle OM Wallet en quelques secondes.', typeL:'Type de carte', save:'Enregistrer', failed:'Une erreur est survenue',
      hello:'Bonjour', accounts:'Comptes', allAccounts:'Tous les comptes', send:'Envoyer', receive:'Recevoir', exchange:'\u00c9changer', more:'Plus', seeAll:'Tout voir', crypto:'Crypto', transactions:'Transactions', today:'Aujourd\'hui', yesterday:'Hier', noTx:'Aucune transaction',
      personal:'Personnel', portfolio:'Portefeuille', home:'Accueil', services:'Services', defName:'Carte OM' },
    ar: { cards:'\u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062a', addCard:'\u0625\u0636\u0627\u0641\u0629 \u0628\u0637\u0627\u0642\u0629', freeze:'\u062a\u062c\u0645\u064a\u062f', unfreeze:'\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u062c\u0645\u064a\u062f', frozen:'\u0645\u062c\u0645\u0651\u062f\u0629', details:'\u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644', hide:'\u0625\u062e\u0641\u0627\u0621', settings:'\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', limits:'\u0627\u0644\u062d\u062f\u0648\u062f', virtual:'\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629', physical:'\u0645\u0627\u062f\u064a\u0629',
      cardNumber:'\u0631\u0642\u0645 \u0627\u0644\u0628\u0637\u0627\u0642\u0629', expiry:'\u0627\u0644\u0627\u0646\u062a\u0647\u0627\u0621', cvv:'CVV', holder:'\u0635\u0627\u062d\u0628 \u0627\u0644\u0628\u0637\u0627\u0642\u0629', copied:'\u062a\u0645 \u0627\u0644\u0646\u0633\u062e', online:'\u0627\u0644\u062f\u0641\u0639 \u0639\u0628\u0631 \u0627\u0644\u0625\u0646\u062a\u0631\u0646\u062a', onlineD:'\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0647\u0630\u0647 \u0627\u0644\u0628\u0637\u0627\u0642\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0648\u0627\u0644\u062a\u0637\u0628\u064a\u0642\u0627\u062a', contactless:'\u0627\u0644\u062f\u0641\u0639 \u0628\u062f\u0648\u0646 \u0644\u0645\u0633', contactlessD:'\u0627\u0644\u062f\u0641\u0639 \u0628\u062a\u0642\u0631\u064a\u0628 \u0627\u0644\u0628\u0637\u0627\u0642\u0629',
      atm:'\u0627\u0644\u0633\u062d\u0628 \u0645\u0646 \u0627\u0644\u0635\u0631\u0627\u0641', atmD:'\u0633\u062d\u0628 \u0627\u0644\u0646\u0642\u062f \u0645\u0646 \u0623\u062c\u0647\u0632\u0629 \u0627\u0644\u0635\u0631\u0627\u0641', monthly:'\u0627\u0644\u062d\u062f \u0627\u0644\u0634\u0647\u0631\u064a', noLimit:'\u0628\u062f\u0648\u0646 \u062d\u062f', design:'\u062a\u0635\u0645\u064a\u0645 \u0627\u0644\u0628\u0637\u0627\u0642\u0629', label:'\u0627\u0633\u0645 \u0627\u0644\u0628\u0637\u0627\u0642\u0629', terminate:'\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0628\u0637\u0627\u0642\u0629', terminateQ:'\u0647\u0644 \u062a\u0631\u064a\u062f \u0625\u0644\u063a\u0627\u0621 \u0647\u0630\u0647 \u0627\u0644\u0628\u0637\u0627\u0642\u0629\u061f \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639.',
      confirm:'\u062a\u0623\u0643\u064a\u062f', cancel:'\u0625\u0644\u063a\u0627\u0621', activity:'\u0646\u0634\u0627\u0637 \u0627\u0644\u0628\u0637\u0627\u0642\u0629', noPay:'\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u062f\u0641\u0648\u0639\u0627\u062a \u0628\u0627\u0644\u0628\u0637\u0627\u0642\u0629', noPayD:'\u0633\u062a\u0638\u0647\u0631 \u0647\u0646\u0627 \u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a \u0627\u0644\u062a\u064a \u062a\u062a\u0645 \u0628\u0628\u0637\u0627\u0642\u062a\u0643.', security:'\u0627\u0644\u0623\u0645\u0627\u0646', spending:'\u062d\u062f\u0648\u062f \u0627\u0644\u0625\u0646\u0641\u0627\u0642', appearance:'\u0627\u0644\u0645\u0638\u0647\u0631',
      saved:'\u062a\u0645 \u0627\u0644\u062d\u0641\u0638', froze:'\u062a\u0645 \u062a\u062c\u0645\u064a\u062f \u0627\u0644\u0628\u0637\u0627\u0642\u0629', unfroze:'\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u062a\u062c\u0645\u064a\u062f \u0627\u0644\u0628\u0637\u0627\u0642\u0629', gone:'\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0628\u0637\u0627\u0642\u0629', chooseDesign:'\u0627\u062e\u062a\u0631 \u062a\u0635\u0645\u064a\u0645\u0627\u064b', create:'\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0628\u0637\u0627\u0642\u0629', noCards:'\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u0637\u0627\u0642\u0629', noCardsD:'\u0623\u0646\u0634\u0626 \u0628\u0637\u0627\u0642\u0629 \u0641\u0631\u0646\u062f\u064a \u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629 \u0641\u064a \u062b\u0648\u0627\u0646\u064d.', typeL:'\u0646\u0648\u0639 \u0627\u0644\u0628\u0637\u0627\u0642\u0629', save:'\u062d\u0641\u0638', failed:'\u062d\u062f\u062b \u062e\u0637\u0623 \u0645\u0627',
      hello:'\u0645\u0631\u062d\u0628\u0627\u064b', accounts:'\u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a', allAccounts:'\u0643\u0644 \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a', send:'\u0625\u0631\u0633\u0627\u0644', receive:'\u0627\u0633\u062a\u0644\u0627\u0645', exchange:'\u062a\u0628\u062f\u064a\u0644', more:'\u0627\u0644\u0645\u0632\u064a\u062f', seeAll:'\u0639\u0631\u0636 \u0627\u0644\u0643\u0644', crypto:'\u0643\u0631\u064a\u0628\u062a\u0648', transactions:'\u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062a', today:'\u0627\u0644\u064a\u0648\u0645', yesterday:'\u0623\u0645\u0633', noTx:'\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0639\u0627\u0645\u0644\u0627\u062a',
      personal:'\u0634\u062e\u0635\u064a', portfolio:'\u0627\u0644\u0645\u062d\u0641\u0638\u0629', home:'\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629', services:'\u0627\u0644\u062e\u062f\u0645\u0627\u062a', defName:'\u0628\u0637\u0627\u0642\u0629 OM Wallet' }
  };

  Object.assign(D.en, { active:'Active', tagline:'Your money. Anywhere. Instantly.', signupSub:'Create your account in minutes.', resetSub:'Enter your e-mail and we will send you a reset link.', createAccount:'Create account', language:'Language', notifEmpty:'You are all caught up', notifEmptyD:'New alerts about your money and security will appear here.' });
  Object.assign(D.fr, { active:'Active', tagline:'Votre argent. Partout. Instantan\u00e9ment.', signupSub:'Cr\u00e9ez votre compte en quelques minutes.', resetSub:'Saisissez votre e-mail, nous vous enverrons un lien de r\u00e9initialisation.', createAccount:'Cr\u00e9er un compte', language:'Langue', notifEmpty:'Vous \u00eates \u00e0 jour', notifEmptyD:'Les nouvelles alertes sur votre argent et votre s\u00e9curit\u00e9 appara\u00eetront ici.' });
  Object.assign(D.ar, { active:'\u0646\u0634\u0637\u0629', tagline:'\u0623\u0645\u0648\u0627\u0644\u0643. \u0641\u064a \u0643\u0644 \u0645\u0643\u0627\u0646. \u0641\u0648\u0631\u0627\u064b.', signupSub:'\u0623\u0646\u0634\u0626 \u062d\u0633\u0627\u0628\u0643 \u0641\u064a \u062f\u0642\u0627\u0626\u0642.', resetSub:'\u0623\u062f\u062e\u0644 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0648\u0633\u0646\u0631\u0633\u0644 \u0644\u0643 \u0631\u0627\u0628\u0637 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0639\u064a\u064a\u0646.', createAccount:'\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628', language:'\u0627\u0644\u0644\u063a\u0629', notifEmpty:'\u0644\u0627 \u062c\u062f\u064a\u062f', notifEmptyD:'\u0633\u062a\u0638\u0647\u0631 \u0647\u0646\u0627 \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u062c\u062f\u064a\u062f\u0629 \u0639\u0646 \u0623\u0645\u0648\u0627\u0644\u0643 \u0648\u0623\u0645\u0627\u0646\u0643.' });
  Object.assign(D.en, { loginTitle:'Welcome back', loginSub:'Sign in to your wallet', resetTitle:'Reset your password' });
  Object.assign(D.fr, { loginTitle:'Bon retour parmi nous', loginSub:'Connectez-vous à votre portefeuille', resetTitle:'R\u00e9initialiser le mot de passe' });
  Object.assign(D.ar, { loginTitle:'أهلاً بك من جديد', loginSub:'سجّل دخولك إلى محفظتك', resetTitle:'إعادة تعيين كلمة المرور' });

  /* 12.4.0 — honest card states (a card is a "preview" until a real card issuer is connected), card details, themes */
  Object.assign(D.en, { idLabel:'OM card ID', idNote:'Reference of this card in OM Wallet. It is not a payment card number.',
    noActivityTitle:'No card activity', noActivityBody:'Card payments will be listed here.', cardDetails:'Card details',
    showId:'Show card ID', hideId:'Hide card ID', idShort:'Card ID', pinProtected:'Protected by your PIN', statusL:'Status', currencyL:'Currency', created:'Created', historyL:'History',

    th_obsidian:'Obsidian', th_midnight:'Midnight', th_graphite:'Graphite', th_violet:'Orange', th_aurora:'Aurora', th_minimal:'Minimal', th_metal:'Metal', cardOf:'Card', freezeD:'Temporarily block this card' });
  Object.assign(D.fr, { idLabel:'ID de carte OM', idNote:'Référence de cette carte dans OM Wallet. Ce n’est pas un numéro de carte bancaire.',
    noActivityTitle:'Aucune activité de carte', noActivityBody:'Les paiements par carte seront listés ici.', cardDetails:'Détails de la carte',
    showId:'Afficher l’ID de carte', hideId:'Masquer l’ID de carte', idShort:'ID carte', pinProtected:'Protégé par votre code PIN', statusL:'Statut', currencyL:'Devise', created:'Créée le', historyL:'Historique',

    th_obsidian:'Obsidienne', th_midnight:'Minuit', th_graphite:'Graphite', th_violet:'Orange', th_aurora:'Aurore', th_minimal:'Minimal', th_metal:'Métal', cardOf:'Carte', freezeD:'Bloquer temporairement cette carte' });
  Object.assign(D.ar, { idLabel:'معرّف بطاقة OM', idNote:'مرجع هذه البطاقة في OM Wallet. وهو ليس رقم بطاقة دفع.',
    noActivityTitle:'لا يوجد نشاط للبطاقة', noActivityBody:'ستُعرض مدفوعات البطاقة هنا.', cardDetails:'تفاصيل البطاقة',
    showId:'إظهار معرّف البطاقة', hideId:'إخفاء معرّف البطاقة', idShort:'المعرّف', pinProtected:'محمي برمز PIN', statusL:'الحالة', currencyL:'العملة', created:'تاريخ الإنشاء', historyL:'السجل',

    th_obsidian:'سبج', th_midnight:'منتصف الليل', th_graphite:'جرافيت', th_violet:'برتقالي', th_aurora:'شفق', th_minimal:'بسيط', th_metal:'معدني', cardOf:'بطاقة', freezeD:'حظر هذه البطاقة مؤقتاً' });
  const vt = k => (D[LANG] && D[LANG][k]) || D.en[k] || k;
  function buildNav(){
    const nav = document.getElementById('bottom-nav');
    if (!nav || nav.getAttribute('data-v12') === LANG) return;
    nav.setAttribute('data-v12', LANG);
    const it = (nav2, ic, lbl, cta) => cta
      ? '<a class="nav-item nav-cta" data-nav="' + nav2 + '"><span class="nav-cta-tile">' + icon(ic, 26) + '</span><span class="nav-lb">' + lbl + '</span></a>'
      : '<a class="nav-item" data-nav="' + nav2 + '"><span class="nav-ic">' + icon(ic, 24) + '</span><span class="nav-lb">' + lbl + '</span></a>';
    /* 14.7.0 (owner's reference image): Home · Markets · Swap (raised round button in the middle) · Wallet · Spot */
    nav.innerHTML = '<div class="nav-dock">' + it('home', 'home', t('omx.home')) + it('markets', 'chart', t('omx.markets')) + it('exchange', 'swap', t('tr.swap'), true) + it('wallet', 'wallet', t('lt.walletTab')) + it('spot', 'trending', t('tr.spot')) + '<i class="nav-ind" aria-hidden="true"></i></div>';
    requestAnimationFrame(placeInd);
  }
  /* The highlight pill glides under the active tab (12.9.0). Measured, so it also works in RTL and at any width. */
  function placeInd(){
    const nav = document.getElementById('bottom-nav'); if (!nav) return;
    const dock = nav.querySelector('.nav-dock'), ind = nav.querySelector('.nav-ind'); if (!dock || !ind) return;
    const a = nav.querySelector('.nav-item[aria-current="page"]:not(.nav-cta)');
    if (!a || nav.hidden || !dock.offsetWidth){ ind.style.opacity = '0'; return; }
    const d = dock.getBoundingClientRect(), r = a.getBoundingClientRect();
    ind.style.width = r.width + 'px';
    ind.style.transform = 'translateX(' + (r.left - d.left) + 'px)';
    ind.style.opacity = '1';
    if (!ind.classList.contains('ready')) requestAnimationFrame(() => requestAnimationFrame(() => ind.classList.add('ready')));
  }
  function watchNav(){
    const nav = document.getElementById('bottom-nav'); if (!nav || nav.__ind) return;
    nav.__ind = true;
    if (window.MutationObserver) new MutationObserver(() => requestAnimationFrame(placeInd)).observe(nav, { attributes:true, subtree:true, attributeFilter:['aria-current', 'hidden'] });
    window.addEventListener('resize', () => requestAnimationFrame(placeInd));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => placeInd()).catch(() => {});
  }
  const LANG_NAMES = { en:'English', fr:'Français', ar:'العربية' };
  function decorateAuth(id){
    const root = document.getElementById(id); if (!root || root.classList.contains('rv-auth')) return;
    const body = root.querySelector('.screen-body'); if (!body) return;
    root.classList.add('rv-auth');
    const oldLogo = body.querySelector('.logo-lockup'); if (oldLogo && oldLogo.parentElement !== body) oldLogo.parentElement.remove();
    const hero = document.createElement('div'); hero.className = 'rv-auth-hero';
    const brandName = LANG === 'ar' ? 'OM Wallet' : 'OM Wallet';
    /* sign-in header from the owner's reference: the glass app icon, the word mark, a greeting and one line */
    hero.innerHTML = '<span class="w-auth-icon" role="img" aria-label="' + brandName + '"></span><p class="w-auth-word" aria-hidden="true">OM Wallet</p><h1>' + vt(id === 'login' ? 'loginTitle' : id === 'signup' ? 'createAccount' : 'resetTitle') + '</h1><p>' + vt(id === 'login' ? 'loginSub' : id === 'signup' ? 'signupSub' : 'resetSub') + '</p>';
    body.insertBefore(hero, body.firstChild);
    if (id === 'signup'){ const tt = root.querySelector('.topbar-title'); if (tt) tt.textContent = vt('createAccount'); }
    if (id !== 'reset'){
      const lg = document.createElement('div'); lg.className = 'rv-lang'; lg.setAttribute('role', 'group'); lg.setAttribute('aria-label', vt('language'));
      lg.innerHTML = ['en', 'fr', 'ar'].map(l => '<button type="button" data-v12-lang="' + l + '" aria-pressed="' + (LANG === l) + '">' + LANG_NAMES[l] + '</button>').join('');
      body.appendChild(lg);
    }
  }
  function setLang(l){
    DeviceLang.set(l); LANG = l; applyI18n();
    const nv = document.getElementById('bottom-nav'); if (nv) nv.removeAttribute('data-v12');
    buildNav();
    try { if (typeof renderSidebar === 'function') renderSidebar(); } catch(e){}
    R.go(R.current(), { force:true, replace:true });
  }
  function onScreen(id){
    buildNav();
    if (id === 'login' || id === 'signup' || id === 'reset') decorateAuth(id);
  }
  function init(){
    buildNav(); watchNav();
    const nv = document.getElementById('bottom-nav'); if (nv) nv.__bound = true;
    document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('#bottom-nav [data-nav]'); if (a){ e.preventDefault(); R.go(a.getAttribute('data-nav')); } });
    document.addEventListener('click', e => { const l = e.target.closest && e.target.closest('[data-v12-lang]'); if (l){ e.preventDefault(); setLang(l.getAttribute('data-v12-lang')); } });
  }
  return { vt, init, onScreen, buildNav };
})();
