'use strict';

/* ============================================================
   OM WALLET 14 — crypto screens: home (dashboard), Crypto (portfolio), Markets, asset detail, networks, deposit, exchange.
   Every figure comes from the account (Runtime.wallets / Runtime.accounts) or from OMXMarket (real Binance market data).
   What is not connected to a real service says so: deposit addresses (none configured), exchange (no real execution).
   ============================================================ */
Object.assign(TR.en, {
  'omx.welcome':'Welcome, {n}','omx.total':'Total assets','omx.omr':'≈ {v} OMR','omx.chg':'24 h','omx.pfNote':'Value of your current holdings at market prices (Binance)',
  'omx.deposit':'Deposit','omx.withdraw':'Withdraw','omx.exchange':'Exchange','omx.markets':'Markets','omx.crypto':'Crypto','omx.activity':'Activity','omx.account':'Account',
  'omx.yourAssets':'Your assets','omx.noAssets':'No crypto yet','omx.noAssetsD':'Your crypto holdings will appear here with their real value.','omx.seeMarkets':'See the markets',
  'lt.movers':'Movers and Shakers','lt.walletTab':'Wallet','lt.watchlist':'Watchlist','lt.wallet':'Your wallet','lt.myAssets':'My Assets','lt.receive':'Receive','lt.share':'share of your wallet','lt.chg24':'{v} over 24 h',
  'omx.movers':'Markets','omx.all':'All','omx.fav':'Favourites','omx.search':'Search an asset','omx.price':'Price','omx.value':'Value','omx.holding':'Holding',
  'omx.st.live':'Live','omx.st.polling':'Refreshed every 20 s','omx.st.connecting':'Connecting…','omx.st.offline':'Offline — last prices','omx.st.error':'Market data unavailable','omx.st.idle':'—',
  'omx.sync':'Last sync {t}','omx.retry':'Try again','omx.source':'Source: Binance market data · prices in USDT ≈ USD',
  'omx.noChart':'Chart unavailable for now.','omx.chartLbl':'Price chart','omx.high':'24 h high','omx.low':'24 h low','omx.vol':'24 h volume','omx.yours':'Your balance',
  'omx.networks':'Networks','omx.contract':'Contract','omx.native':'Native coin','omx.chain':'Chain ID','omx.explorer':'Explorer','omx.fee':'Network fee','omx.avail':'Available',
  'omx.unsupported':'Not supported by OM Wallet','omx.wdOk':'Withdrawals','omx.depNo':'Deposits: no address configured',
  'omx.favAdd':'Add to favourites','omx.favDel':'Remove from favourites','omx.noFav':'No favourite yet','omx.noFavD':'Tap the star of an asset to follow it here.',
  'omx.noResult':'No asset matches your search.',
  'omx.depT':'Deposit crypto','omx.dep1':'Choose the crypto','omx.dep2':'Choose the network','omx.depNoAddrT':'No deposit address for this network',
  'omx.depNoAddrD':'OM Wallet has no real receiving address for {a} on {n} yet. Do NOT send funds: there is no address to receive them. Deposits will open as soon as a real address is configured.',
  'omx.depWarn':'Send only {a} on {n}. Any other asset or network would be lost.','omx.depMemo':'This network needs a destination tag: always add it.',
  'omx.depErr':'The deposit address could not be read. Try again.',
  'omx.exT':'Exchange','omx.exNoT':'Crypto exchange is unavailable','omx.exNoD':'Exchange is not connected to a real trading service yet. It stays off so that no order is ever executed at an invented price.',
  'omx.netPick':'Select a network','omx.netCompat':'Compatible with {a}','omx.netNo':'Not available for {a}',
  'omx.depInfo':'Your personal deposit address for this network: it belongs to your account only. Scan the QR code or copy the address.','omx.qrAlt':'QR code of your deposit address','omx.share':'Share',
  'omx.home':'Home',
  'omx.navCrypto':'Crypto',
  'omx.back':'Back','omx.copy':'Copy','omx.copied':'Copied',
  'omx.details':'View details','omx.myAssets':'My assets','omx.digital':'Digital wallet',
  'omx.pr1':'Deposit your crypto safely','omx.pr1d':'Your own address and QR code','omx.pr2':'Send to an OM Wallet user','omx.pr2d':'By e-mail, in a few steps','omx.pr3':'Follow the markets live','omx.pr3d':'Real prices from Binance'
});
Object.assign(TR.fr, {
  'omx.welcome':'Bienvenue, {n}','omx.total':'Total des actifs','omx.omr':'≈ {v} OMR','omx.chg':'24 h','omx.pfNote':'Valeur de vos avoirs actuels aux cours du marché (Binance)',
  'omx.deposit':'Dépôt','omx.withdraw':'Retrait','omx.exchange':'Échange','omx.markets':'Marchés','omx.crypto':'Crypto','omx.activity':'Activité','omx.account':'Compte',
  'omx.yourAssets':'Vos actifs','omx.noAssets':'Pas encore de crypto','omx.noAssetsD':'Vos avoirs crypto apparaîtront ici avec leur valeur réelle.','omx.seeMarkets':'Voir les marchés',
  'lt.movers':'Plus fortes variations','lt.walletTab':'Portefeuille','lt.watchlist':'Favoris','lt.wallet':'Votre portefeuille','lt.myAssets':'Mes actifs','lt.receive':'Recevoir','lt.share':'part de votre portefeuille','lt.chg24':'{v} sur 24 h',
  'omx.movers':'Marchés','omx.all':'Tous','omx.fav':'Favoris','omx.search':'Rechercher un actif','omx.price':'Cours','omx.value':'Valeur','omx.holding':'Solde',
  'omx.st.live':'En direct','omx.st.polling':'Actualisé toutes les 20 s','omx.st.connecting':'Connexion…','omx.st.offline':'Hors ligne — derniers cours','omx.st.error':'Données de marché indisponibles','omx.st.idle':'—',
  'omx.sync':'Dernière synchro {t}','omx.retry':'Réessayer','omx.source':'Source : données de marché Binance · cours en USDT ≈ USD',
  'omx.noChart':'Graphique indisponible pour le moment.','omx.chartLbl':'Graphique du cours','omx.high':'Plus haut 24 h','omx.low':'Plus bas 24 h','omx.vol':'Volume 24 h','omx.yours':'Votre solde',
  'omx.networks':'Réseaux','omx.contract':'Contrat','omx.native':'Devise native','omx.chain':'Identifiant de chaîne','omx.explorer':'Explorateur','omx.fee':'Frais de réseau','omx.avail':'Disponible',
  'omx.unsupported':'Non pris en charge par OM Wallet','omx.wdOk':'Retraits','omx.depNo':'Dépôts : aucune adresse configurée',
  'omx.favAdd':'Ajouter aux favoris','omx.favDel':'Retirer des favoris','omx.noFav':'Aucun favori','omx.noFavD':'Touchez l’étoile d’un actif pour le suivre ici.',
  'omx.noResult':'Aucun actif ne correspond à votre recherche.',
  'omx.depT':'Déposer des cryptos','omx.dep1':'Choisissez la crypto','omx.dep2':'Choisissez le réseau','omx.depNoAddrT':'Aucune adresse de dépôt pour ce réseau',
  'omx.depNoAddrD':'OM Wallet n’a pas encore d’adresse de réception réelle pour {a} sur {n}. N’envoyez AUCUN fonds : aucune adresse ne pourrait les recevoir. Les dépôts ouvriront dès qu’une adresse réelle sera configurée.',
  'omx.depWarn':'Envoyez uniquement du {a} sur {n}. Tout autre actif ou réseau serait perdu.','omx.depMemo':'Ce réseau exige un tag de destination : ajoutez-le toujours.',
  'omx.depErr':'L’adresse de dépôt n’a pas pu être lue. Réessayez.',
  'omx.exT':'Échange','omx.exNoT':'L’échange crypto est indisponible','omx.exNoD':'L’échange n’est pas encore relié à un vrai service de marché. Il reste désactivé pour qu’aucun ordre ne soit jamais exécuté à un prix inventé.',
  'omx.netPick':'Choisir un réseau','omx.netCompat':'Compatible avec {a}','omx.netNo':'Indisponible pour {a}',
  'omx.depInfo':'Votre adresse de dépôt personnelle pour ce réseau : elle appartient à votre compte seulement. Scannez le QR code ou copiez l’adresse.','omx.qrAlt':'QR code de votre adresse de dépôt','omx.share':'Partager',
  'omx.home':'Accueil',
  'omx.navCrypto':'Crypto',
  'omx.back':'Retour','omx.copy':'Copier','omx.copied':'Copié',
  'omx.details':'Voir les détails','omx.myAssets':'Mes actifs','omx.digital':'Portefeuille numérique',
  'omx.pr1':'Déposez vos cryptos en sécurité','omx.pr1d':'Votre adresse et votre QR code personnels','omx.pr2':'Envoyez à un utilisateur OM Wallet','omx.pr2d':'Par e-mail, en quelques étapes','omx.pr3':'Suivez les marchés en direct','omx.pr3d':'Cours réels Binance'
});
Object.assign(TR.ar, {
  'omx.welcome':'مرحباً، {n}','omx.total':'إجمالي الأصول','omx.omr':'≈ {v} ر.ع.','omx.chg':'24 ساعة','omx.pfNote':'قيمة أصولك الحالية بأسعار السوق (Binance)',
  'omx.deposit':'إيداع','omx.withdraw':'سحب','omx.exchange':'تبادل','omx.markets':'الأسواق','omx.crypto':'العملات الرقمية','omx.activity':'النشاط','omx.account':'الحساب',
  'omx.yourAssets':'أصولك','omx.noAssets':'لا توجد عملات رقمية بعد','omx.noAssetsD':'ستظهر أصولك الرقمية هنا بقيمتها الحقيقية.','omx.seeMarkets':'عرض الأسواق',
  'lt.movers':'الأكثر تحركاً','lt.walletTab':'المحفظة','lt.watchlist':'المفضلة','lt.wallet':'محفظتك','lt.myAssets':'أصولي','lt.receive':'استلام','lt.share':'حصتها من محفظتك','lt.chg24':'{v} خلال 24 ساعة',
  'omx.movers':'الأسواق','omx.all':'الكل','omx.fav':'المفضلة','omx.search':'ابحث عن أصل','omx.price':'السعر','omx.value':'القيمة','omx.holding':'الرصيد',
  'omx.st.live':'مباشر','omx.st.polling':'تحديث كل 20 ثانية','omx.st.connecting':'جارٍ الاتصال…','omx.st.offline':'غير متصل — آخر الأسعار','omx.st.error':'بيانات السوق غير متاحة','omx.st.idle':'—',
  'omx.sync':'آخر مزامنة {t}','omx.retry':'إعادة المحاولة','omx.source':'المصدر: بيانات سوق Binance · الأسعار بعملة USDT ≈ دولار',
  'omx.noChart':'الرسم البياني غير متاح حالياً.','omx.chartLbl':'رسم بياني للسعر','omx.high':'أعلى 24 ساعة','omx.low':'أدنى 24 ساعة','omx.vol':'حجم 24 ساعة','omx.yours':'رصيدك',
  'omx.networks':'الشبكات','omx.contract':'العقد','omx.native':'العملة الأصلية','omx.chain':'معرّف السلسلة','omx.explorer':'المستكشف','omx.fee':'رسوم الشبكة','omx.avail':'المتاح',
  'omx.unsupported':'غير مدعوم في OM Wallet','omx.wdOk':'السحب','omx.depNo':'الإيداع: لا يوجد عنوان مُعدّ',
  'omx.favAdd':'إضافة إلى المفضلة','omx.favDel':'إزالة من المفضلة','omx.noFav':'لا توجد مفضلة بعد','omx.noFavD':'المس نجمة أي أصل لمتابعته هنا.',
  'omx.noResult':'لا يوجد أصل مطابق لبحثك.',
  'omx.depT':'إيداع عملات رقمية','omx.dep1':'اختر العملة','omx.dep2':'اختر الشبكة','omx.depNoAddrT':'لا يوجد عنوان إيداع لهذه الشبكة',
  'omx.depNoAddrD':'لا يملك OM Wallet بعد عنوان استلام حقيقياً لـ {a} على شبكة {n}. لا ترسل أي أموال: لا يوجد عنوان يستقبلها. سيُفتح الإيداع فور إعداد عنوان حقيقي.',
  'omx.depWarn':'أرسل {a} فقط على شبكة {n}. أي أصل أو شبكة أخرى ستضيع.','omx.depMemo':'تتطلب هذه الشبكة وسم الوجهة: أضفه دائماً.',
  'omx.depErr':'تعذّرت قراءة عنوان الإيداع. حاول مرة أخرى.',
  'omx.exT':'التبادل','omx.exNoT':'تبادل العملات الرقمية غير متاح','omx.exNoD':'التبادل غير مرتبط بعد بخدمة تداول حقيقية. يبقى معطلاً حتى لا يُنفَّذ أي أمر بسعر غير حقيقي.',
  'omx.netPick':'اختر الشبكة','omx.netCompat':'متوافقة مع {a}','omx.netNo':'غير متاحة لـ {a}',
  'omx.depInfo':'عنوان الإيداع الشخصي لهذه الشبكة: يخص حسابك وحده. امسح رمز QR أو انسخ العنوان.','omx.qrAlt':'رمز QR لعنوان الإيداع','omx.share':'مشاركة',
  'omx.home':'الرئيسية',
  'omx.navCrypto':'الكريبتو',
  'omx.back':'رجوع','omx.copy':'نسخ','omx.copied':'تم النسخ',
  'omx.details':'عرض التفاصيل','omx.myAssets':'أصولي','omx.digital':'المحفظة الرقمية',
  'omx.pr1':'أودع عملاتك الرقمية بأمان','omx.pr1d':'عنوانك ورمز QR الخاص بك','omx.pr2':'أرسل إلى مستخدم OM Wallet','omx.pr2d':'عبر البريد الإلكتروني بخطوات قليلة','omx.pr3':'تابع الأسواق مباشرة','omx.pr3d':'أسعار حقيقية من Binance'
});

const OMX = (() => {
  const S = { cur: 'BTC', tab: 'all', q: '', period: '1D', dep: { asset: null, net: null }, wdNets: null };
  const top = (title, back) => refTop(title, back);
  /* ---------- holdings and totals (real) ---------- */
  function holdings(){
    const m = {};
    (Runtime.wallets || []).forEach(w => { const s = String(w.asset || '').toUpperCase(); const q = Number(w.balance || 0); if (q > 0) m[s] = (m[s] || 0) + q; });
    return Object.keys(m).map(s => ({ sym: s, qty: m[s] }));
  }
  function totals(){
    let usd = 0, ago = 0, missing = false;
    holdings().forEach(h => { const k = OMXMarket.get(h.sym); if (!k){ missing = true; return; } usd += h.qty * k.price; ago += h.qty * (k.open || k.price); });
    (Runtime.accounts || []).forEach(a => { const r = OMX_FIAT_USD[String(a.currency || '').toUpperCase()]; if (r){ const v = Number(a.balance || 0) * r; usd += v; ago += v; } });
    return { usd, omr: usd / OMX_FIAT_USD.OMR, pct: ago > 0 ? (usd / ago - 1) * 100 : null, missing, hasCrypto: holdings().length > 0 };
  }
  const favs = () => (Runtime.settings && Array.isArray(Runtime.settings.omxFavorites)) ? Runtime.settings.omxFavorites : [];
  async function toggleFav(sym){
    const cur = favs(), next = cur.indexOf(sym) === -1 ? cur.concat(sym) : cur.filter(x => x !== sym);
    Runtime.settings = Object.assign({}, Runtime.settings, { omxFavorites: next });
    try { const uid = UserContext.requireCtx().uid; await UserDataEngine.writeDoc(uid, 'preferences', Runtime.settings); }
    catch(e){ toast(t('errors.UNKNOWN_ERROR'), 'error'); }
    return next.indexOf(sym) !== -1;
  }
  /* ---------- market status line ---------- */
  function statusLine(){
    const s = OMXMarket.status();
    const time = s.lastSync ? new Date(s.lastSync).toLocaleTimeString(LANG === 'ar' ? 'ar-OM-u-nu-latn' : LANG === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
    return '<div class="omx-status st-' + s.state + '" role="status"><i aria-hidden="true"></i><span>' + escapeHtml(t('omx.st.' + s.state)) + '</span>' +
      (time ? '<small class="ltr">' + escapeHtml(tf('omx.sync', { t: time })) + '</small>' : '') +
      (s.state === 'error' || s.state === 'offline' ? '<button type="button" class="omx-retry" data-omx="retry">' + escapeHtml(t('omx.retry')) + '</button>' : '') + '</div>';
  }
  /* ---------- rows ---------- */
  function assetRow(a, opts){
    const k = OMXMarket.get(a.sym), held = opts && opts.qty != null, mask = held && !!opts.mask;
    const pct = k ? k.pct : null, up = pct != null && pct >= 0;
    return '<button type="button" class="omx-row" data-omx-asset="' + a.sym + '">' + omxLogo(a.sym, 40) +
      '<span class="omx-rn"><b>' + escapeHtml(a.name) + '</b><small>' + escapeHtml(mask ? '•••• ' + a.sym : held ? omxQty(opts.qty, a.sym) : a.sym) + '</small></span>' +
      '<span class="omx-rs" data-omx-spark="' + a.sym + '">' + (opts && opts.spark ? OMXChart.spark(opts.spark, up) : '<span class="omx-spark none"></span>') + '</span>' +
      '<span class="omx-rv"><b class="ltr" data-omx-v="' + a.sym + '"' + (held && !mask ? ' data-omx-q="' + opts.qty + '"' : mask ? ' data-omx-mask="1"' : '') + '>' + escapeHtml(mask ? '••••' : held ? (k ? omxUsd(opts.qty * k.price) : '—') : (k ? omxUsd(k.price) : '—')) + '</b>' +
      '<small class="ltr ' + (pct == null ? '' : up ? 'up' : 'down') + '" data-omx-p="' + a.sym + '">' + escapeHtml(omxPct(pct)) + '</small></span></button>';
  }
  function fillSparks(root){
    (root || document).querySelectorAll('[data-omx-spark]').forEach(async el => {
      const s = el.getAttribute('data-omx-spark'); const v = await OMXMarket.spark(s);
      if (v && el.isConnected){ const k = OMXMarket.get(s); el.innerHTML = OMXChart.spark(v, k ? k.pct >= 0 : v[v.length - 1] >= v[0]); }
    });
  }
  /* the balance with its decimals in a lighter weight (Liv X / Binance style); the text of the figure is exactly omxUsd()'s */
  function balHtml(txt){ const m = /^(.*?)(\.\d+)$/.exec(String(txt)); return m ? escapeHtml(m[1]) + '<span class="lt-dec">' + escapeHtml(m[2]) + '</span>' : escapeHtml(txt); }
  /* ---------- HOME ---------- */
  function renderHome(){
    const p = Runtime.profile || {}, hide = !!Runtime.hideBalance, tt = totals();
    const unread = (Runtime.notifications || []).filter(n => !n.read).length;
    const name = p.firstName || p.displayName || t('hm.dear');
    const hs = holdings().sort((x, y) => { const kx = OMXMarket.get(x.sym), ky = OMXMarket.get(y.sym); return (ky ? y.qty * ky.price : 0) - (kx ? x.qty * kx.price : 0); });
    const act = (nav, ic, lbl, p1) => '<button class="omx-act' + (p1 ? ' p' : '') + '" data-nav="' + nav + '"><i>' + icon(ic, 26) + '</i><span>' + escapeHtml(lbl) + '</span></button>';
    const totalTxt = hide ? '••••••' : (tt.missing && !OMXMarket.status().lastSync ? '—' : omxUsd(tt.usd, { dp: 2 }));
    const movers = OMX_ASSETS.filter(a => OMXMarket.get(a.sym)).sort((x, y) => Math.abs(OMXMarket.get(y.sym).pct || 0) - Math.abs(OMXMarket.get(x.sym).pct || 0)).slice(0, 6);
    const promos = [['deposit', 'omx.pr1', 'omx.pr1d'], ['send-internal', 'omx.pr2', 'omx.pr2d'], ['markets', 'omx.pr3', 'omx.pr3d']];
    /* 14.7.0 — composition of the owner's reference image (24/11), with the real content: a blue-violet header with the balance and its
       24 h change, three round actions on its edge, the biggest market moves as cards, the favourites, the recent activity. */
    const favList = favs().map(s2 => omxAsset(s2)).filter(Boolean);
    const card = a => { const k = OMXMarket.get(a.sym), pct = k ? k.pct : null, up = pct != null && pct >= 0;
      return '<button type="button" class="lt-mv" data-omx-asset="' + a.sym + '">' +
        '<span class="lt-mv-h">' + omxLogo(a.sym, 30) + '<b>' + escapeHtml(a.name) + '</b></span>' +
        '<small class="ltr">' + escapeHtml(a.sym) + ' <span data-omx-v="' + a.sym + '">' + escapeHtml(k ? omxUsd(k.price) : '—') + '</span></small>' +
        '<span class="lt-mv-f"><b class="ltr ' + (pct == null ? '' : up ? 'up' : 'down') + '" data-omx-p="' + a.sym + '">' + escapeHtml(omxPct(pct)) + '</b>' +
        '<span class="omx-rs" data-omx-spark="' + a.sym + '"><span class="omx-spark none"></span></span></span></button>'; };
    S.moverCard = card;
    return '<div class="omx-home w-home lt-home">' +
      '<section class="lt-hero">' +
        '<header class="omx-head w-hdr lt-top"><button class="hub-circ lt-hb" data-nav="account" aria-label="' + escapeHtml(t('px.openProfile')) + '">' + icon('menu', 22) + '</button>' +
          '<span class="lt-mark" role="img" aria-label="OM Wallet"></span>' +
          '<span class="w-hdr-end"><button class="hub-circ lt-hb" data-nav="history" aria-label="' + escapeHtml(t('tr.activity')) + '">' + icon('history', 20) + '</button>' +
          '<button class="hub-circ lt-hb" data-action="notifications" aria-label="' + escapeHtml(t('px.notifs')) + '">' + icon('bell', 20) + (unread ? '<span class="lt-badge ltr">' + (unread > 99 ? '99+' : unread) + '</span>' : '') + '</button></span></header>' +
        '<div class="omx-tl lt-bal"><span>' + escapeHtml(t('omx.total')) + '</span><button class="ds-eye" data-action="toggle-balance" aria-pressed="' + (hide ? 'true' : 'false') + '" aria-label="' + escapeHtml(t(hide ? 'px.showBal' : 'px.hideBal')) + '">' + icon(hide ? 'eyeOff' : 'eye', 18) + '</button></div>' +
        '<div class="omx-tv ltr" id="omx-total-v" data-omx-total>' + balHtml(totalTxt) + '</div>' +
        '<div class="omx-ts">' + (hide ? '' : (tt.pct != null && tt.hasCrypto ? '<span class="omx-chip ' + (tt.pct >= 0 ? 'up' : 'down') + '">' + escapeHtml(omxPct(tt.pct)) + '</span>' : '') +
          '<span class="ltr" data-omx-omr>≈ ' + moneyHtml(CurrencyEngine.format(Math.round(tt.omr * 1000) / 1000, 'OMR')) + '</span>') + '</div>' +
      '</section>' +
      '<nav class="omx-acts lt-acts" aria-label="' + escapeHtml(t('omx.total')) + '">' + act('deposit', 'receive', t('omx.deposit')) + act('withdraw', 'withdraw', t('omx.withdraw')) + act('send-internal', 'send', t('si.short')) + (Runtime.ctx && Runtime.ctx.role === 'admin' ? act('topup', 'mobile', t('tp.short')) : '') + '</nav>' +
      '<section class="lt-sec"><div class="omx-sh"><h2>' + escapeHtml(t('lt.movers')) + '</h2><button data-nav="markets">' + escapeHtml(t('px.seeAll')) + '</button></div>' + statusLine() +
        '<div class="lt-movers" id="omx-home-mk">' + (movers.length ? movers.map(card).join('') : skeletonRows(2)) + '</div></section>' +
      '<section class="lt-sec"><div class="omx-sh"><h2>' + escapeHtml(t('lt.watchlist')) + '</h2><button data-nav="markets">' + escapeHtml(t('px.seeAll')) + '</button></div>' +
        (favList.length ? '<div class="omx-list">' + favList.map(a => assetRow(a)).join('') + '</div>' : '<p class="lt-empty">' + escapeHtml(t('omx.noFavD')) + '</p>') + '</section>' +
      '<section class="lt-sec"><div class="omx-sh"><h2>' + escapeHtml(t('px.recent')) + '</h2><button data-nav="history">' + escapeHtml(t('px.seeAll')) + '</button></div>' +
        ((visibleTransactions(Runtime.transactions || []).slice(0, 4)).length ? txGroupedHtml(visibleTransactions(Runtime.transactions || []).slice(0, 4), hide) : '<div class="rv-list">' + emptyState('history', V12.vt('noTx'), t('ds.nohist_body')) + '</div>') + '</section>' +
      '</div>';
  }
  /* the logo lockup heads the page, as in the owner's references (light and dark files) */
  function omxLogoLine(){ return '<span class="omx-brand w-brand" role="img" aria-label="OM Wallet"><img class="w-l" src="assets/brand/om-logo-horizontal.png" alt="" width="150" height="54" decoding="async"><img class="w-d" src="assets/brand/om-logo-horizontal-white.png" alt="" width="150" height="54" decoding="async"></span>'; }
  async function paintPortfolio(){
    const host = document.getElementById('omx-pf'); if (!host || Runtime.hideBalance) return;
    const hs = holdings(); if (!hs.length){ host.innerHTML = ''; return; }
    try {
      const series = await Promise.all(hs.map(h => omxAsset(h.sym) ? OMXMarket.candles(h.sym, '1W') : Promise.resolve(null)));
      const base = series.find(x => x && x.length); if (!base) return;
      let fiat = 0; (Runtime.accounts || []).forEach(a => { const r = OMX_FIAT_USD[String(a.currency || '').toUpperCase()]; if (r) fiat += Number(a.balance || 0) * r; });
      const data = base.map((pt, i) => ({ t: pt.t, c: fiat + hs.reduce((s, h, j) => s + (series[j] && series[j][i] ? h.qty * series[j][i].c : 0), 0) }));
      if (host.isConnected) OMXChart.area(host, data, v => omxUsd(v, { dp: 2 }));
    } catch(e){ host.innerHTML = ''; }
  }
  /* ---------- CRYPTO (portfolio) ---------- */
  function renderWallet(){
    const hs = holdings(), held = new Set(hs.map(h => h.sym)), hide = !!Runtime.hideBalance, tt = totals();
    /* 14.7.0 — « Your wallet » + « My Assets » of the owner's reference image, with the real content: the balance, its 24 h change in
       value (each asset's own 24 h change, live prices), the share of each asset, Send / Receive (= the person's own deposit addresses),
       then one row per asset with its real 24 h curve, then the other markets. */
    const vals = hs.map(h => { const k = OMXMarket.get(h.sym); return { sym: h.sym, v: k ? h.qty * k.price : null }; }).filter(x => x.v != null && x.v > 0);
    const sum = vals.reduce((n, x) => n + x.v, 0);
    let now = 0, before = 0;
    hs.forEach(h => { const k = OMXMarket.get(h.sym); if (k && k.pct != null){ const v = h.qty * k.price; now += v; before += v / (1 + k.pct / 100); } });
    const diff = now - before;
    return '<div class="w-assets lt-wallet">' +
      '<div class="w-title lt-title"><button class="w-sq" data-nav="account" aria-label="' + escapeHtml(t('px.openProfile')) + '">' + icon('menu', 22) + '</button>' +
        '<h1>' + escapeHtml(t('lt.wallet')) + '</h1><span class="lt-mark sm" role="img" aria-label="OM Wallet"></span></div>' +
      '<section class="lt-wbal"><span class="lt-lbl">' + escapeHtml(t('omx.total')) + '</span>' +
        '<div class="lt-wv"><b class="ltr" data-omx-total>' + (hide ? '••••••' : balHtml(omxUsd(tt.usd, { dp: 2 }))) + '</b>' +
          (!hide && tt.pct != null && tt.hasCrypto ? '<span class="omx-chip ' + (tt.pct >= 0 ? 'up' : 'down') + '">' + escapeHtml(omxPct(tt.pct)) + '</span>' : '') + '</div>' +
        (!hide && before > 0 ? '<p class="lt-chg ' + (diff >= 0 ? 'up' : 'down') + '">' + (diff >= 0 ? '↗ ' : '↘ ') + escapeHtml(tf('lt.chg24', { v: '\u2066' + (diff >= 0 ? '+' : '−') + omxUsd(Math.abs(diff), { dp: 2 }) + '\u2069' })) + '</p>' : '') +
        (!hide && sum > 0 ? '<div class="lt-alloc" aria-label="' + escapeHtml(t('lt.share')) + '">' + vals.map(x => '<span class="lt-al">' + omxLogo(x.sym, 18) + '<span class="ltr">' + escapeHtml(x.sym + ': ' + (x.v / sum * 100).toFixed(1) + '%') + '</span></span>').join('') + '</div>' : '') +
        '<div class="lt-two"><button class="btn btn-primary" data-nav="send-internal">' + icon('send', 18) + '<span>' + escapeHtml(t('si.short')) + '</span></button>' +
          '<button class="btn btn-primary" data-nav="deposit">' + icon('receive', 18) + '<span>' + escapeHtml(t('lt.receive')) + '</span></button></div>' +
      '</section>' +
      '<div class="omx-sh lt-sh"><h2>' + escapeHtml(t('lt.myAssets')) + '</h2><button class="lt-plus" data-nav="deposit" aria-label="' + escapeHtml(t('omx.deposit')) + '">' + icon('plus', 18) + '</button></div>' +
      (hs.length ? '<div class="omx-list">' + hs.map(h => assetRow(omxAsset(h.sym) || { sym: h.sym, name: h.sym }, { qty: h.qty, mask: hide })).join('') + '</div>'
        : '<section class="omx-card omx-empty">' + icon('crypto', 30) + '<b>' + escapeHtml(t('omx.noAssets')) + '</b><p>' + escapeHtml(t('omx.noAssetsD')) + '</p></section>') +
      '<h3 class="w-sec-t">' + escapeHtml(t('omx.markets')) + '</h3>' + statusLine() +
      '<div class="omx-list">' + OMX_ASSETS.filter(a => !held.has(a.sym)).map(a => assetRow(a)).join('') + '</div></div>';
  }
  /* ---------- MARKETS ---------- */
  function marketRows(){
    const q = S.q.trim().toLowerCase(), f = favs();
    let list = OMX_ASSETS.filter(a => !q || a.sym.toLowerCase().indexOf(q) !== -1 || a.name.toLowerCase().indexOf(q) !== -1);
    if (S.tab === 'fav') list = list.filter(a => f.indexOf(a.sym) !== -1);
    if (!list.length) return S.tab === 'fav' && !q ? '<div class="omx-empty">' + icon('sparkle', 28) + '<b>' + escapeHtml(t('omx.noFav')) + '</b><p>' + escapeHtml(t('omx.noFavD')) + '</p></div>' : '<div class="omx-empty"><p>' + escapeHtml(t('omx.noResult')) + '</p></div>';
    return list.map(a => assetRow(a)).join('');
  }
  function renderMarkets(){
    return top(t('omx.markets'), false) + '<div class="screen-body omx-page">' +
      '<div class="field-box omx-search">' + icon('search', 18) + '<input type="search" id="omx-q" placeholder="' + escapeHtml(t('omx.search')) + '" value="' + escapeHtml(S.q) + '" autocomplete="off" aria-label="' + escapeHtml(t('omx.search')) + '"></div>' +
      '<div class="chips" role="group"><button class="chip" data-omx-tab="all" aria-pressed="' + (S.tab === 'all') + '">' + escapeHtml(t('omx.all')) + '</button><button class="chip" data-omx-tab="fav" aria-pressed="' + (S.tab === 'fav') + '">' + icon('star', 15) + ' ' + escapeHtml(t('omx.fav')) + '</button></div>' +
      statusLine() + '<section class="omx-card omx-sec"><div class="omx-list" id="omx-mk">' + marketRows() + '</div></section><p class="omx-src">' + escapeHtml(t('omx.source')) + '</p></div>';
  }
  /* ---------- ASSET DETAIL ---------- */
  function renderAsset(){
    const a = omxAsset(S.cur) || OMX_ASSETS[0], k = OMXMarket.get(a.sym), isFav = favs().indexOf(a.sym) !== -1;
    const qty = holdings().filter(h => h.sym === a.sym).reduce((s, h) => s + h.qty, 0), hide = !!Runtime.hideBalance;
    const wdNets = (S.wdNets || []).filter(n => n.asset === a.sym).map(n => n.network);
    const stat = (l, v) => '<div class="omx-stat"><small>' + escapeHtml(l) + '</small><b class="ltr">' + escapeHtml(v) + '</b></div>';
    return top(a.name) + '<div class="screen-body omx-page">' +
      '<section class="omx-card omx-asset"><div class="omx-ah">' + omxLogo(a.sym, 52) + '<div><b>' + escapeHtml(a.name) + '</b><small>' + escapeHtml(a.sym) + '</small></div>' +
        '<button type="button" class="omx-star' + (isFav ? ' on' : '') + '" data-omx="fav" aria-pressed="' + isFav + '" aria-label="' + escapeHtml(t(isFav ? 'omx.favDel' : 'omx.favAdd')) + '">' + icon('star', 20) + '</button></div>' +
        '<div class="omx-ap ltr" data-omx-v="' + a.sym + '">' + escapeHtml(k ? omxUsd(k.price) : '—') + '</div>' +
        '<div class="omx-apc ' + (k && k.pct != null ? (k.pct >= 0 ? 'up' : 'down') : '') + ' ltr" data-omx-p="' + a.sym + '">' + escapeHtml(k ? omxPct(k.pct) + ' · 24 h' : '—') + '</div>' +
        '<div class="omx-ch" id="omx-ch"></div>' +
        '<div class="chips omx-per" role="group">' + Object.keys(OMXMarket.PERIODS).map(p => '<button class="chip" data-omx-per="' + p + '" aria-pressed="' + (S.period === p) + '">' + p + '</button>').join('') + '</div>' +
        statusLine() + '</section>' +
      '<section class="omx-card omx-stats">' + stat(t('omx.high'), k && k.high ? omxUsd(k.high) : '—') + stat(t('omx.low'), k && k.low ? omxUsd(k.low) : '—') + stat(t('omx.vol'), k && k.qvol ? omxUsd(k.qvol, { dp: 0 }) : '—') +
        stat(t('omx.yours'), hide ? '••••' : omxQty(qty, a.sym)) + '</section>' +
      '<div class="omx-acts two"><button class="omx-act p" data-omx="dep">' + '<i>' + icon('receive', 24) + '</i><span>' + escapeHtml(t('omx.deposit')) + '</span></button>' +
        '<button class="omx-act" data-omx="wd"><i>' + icon('withdraw', 24) + '</i><span>' + escapeHtml(t('omx.withdraw')) + '</span></button></div>' +
      '<section class="omx-card omx-sec"><div class="omx-sh"><h2>' + escapeHtml(t('omx.networks')) + '</h2></div><div class="omx-nets">' +
        (a.nets.length ? a.nets.map(n => netRow(a.sym, n, wdNets.indexOf(n) !== -1)).join('') : '<p class="omx-muted">' + escapeHtml(t('omx.unsupported')) + '</p>') + '</div></section>' +
      '<p class="omx-src">' + escapeHtml(t('omx.source')) + '</p></div>';
  }
  function netRow(sym, id, withdrawOk, fee){
    const n = OMX_NETWORKS[id]; if (!n) return '';
    const c = OMX_CONTRACTS[sym + '/' + id];
    return '<div class="omx-net">' + omxNetLogo(id, 34) + '<div class="omx-nt"><b>' + escapeHtml(n.name) + ' <small>' + escapeHtml(n.std) + '</small></b>' +
      '<small>' + escapeHtml(t('omx.native')) + ' ' + escapeHtml(n.native) + (n.chain ? ' · ' + escapeHtml(t('omx.chain')) + ' ' + n.chain : '') + (fee != null ? ' · ' + escapeHtml(t('omx.fee')) + ' ' + escapeHtml(fee > 0 ? omxQty(fee, sym) : '0') : '') + '</small>' +
      (c ? '<small class="omx-ct ltr" dir="ltr">' + escapeHtml(t('omx.contract')) + ' ' + escapeHtml(c.slice(0, 8) + '…' + c.slice(-6)) + '</small>' : '') +
      '<span class="omx-tags"><span class="omx-tag ' + (withdrawOk ? 'ok' : 'no') + '">' + escapeHtml(withdrawOk ? t('omx.wdOk') + ' ✓' : t('omx.unsupported')) + '</span><span class="omx-tag no">' + escapeHtml(t('omx.depNo')) + '</span></span></div></div>';
  }
  async function paintChart(){
    const host = document.getElementById('omx-ch'); if (!host) return;
    host.innerHTML = '<div class="omx-chart-load" aria-busy="true"></div>';
    try { const d = await OMXMarket.candles(S.cur, S.period); if (host.isConnected) OMXChart.area(host, d, v => omxUsd(v)); }
    catch(e){ if (host.isConnected) host.innerHTML = '<div class="omx-chart-empty">' + escapeHtml(t('omx.noChart')) + ' <button class="omx-retry" data-omx="chart">' + escapeHtml(t('omx.retry')) + '</button></div>'; }
  }
  /* ---------- NETWORK SHEET ---------- */
  function pickNetwork(sym, allowed, fees, onPick){
    const a = omxAsset(sym) || { sym, nets: [] };
    const list = Array.from(new Set(a.nets.concat(allowed)));
    const close = R.overlay.open('<div class="omx-sheet"><h2>' + escapeHtml(t('omx.netPick')) + '</h2><div class="omx-nets">' +
      list.map(id => { const ok = allowed.indexOf(id) !== -1, n = OMX_NETWORKS[id]; if (!n) return '';
        return '<button type="button" class="omx-net pick' + (ok ? '' : ' off') + '" data-net="' + id + '"' + (ok ? '' : ' disabled aria-disabled="true"') + '>' + omxNetLogo(id, 34) +
          '<span class="omx-nt"><b>' + escapeHtml(n.name) + ' <small>' + escapeHtml(n.std) + '</small></b><small>' + escapeHtml(ok ? tf('omx.netCompat', { a: sym }) : tf('omx.netNo', { a: sym })) +
          (ok && fees && fees[id] != null ? ' · ' + escapeHtml(t('omx.fee')) + ' ' + escapeHtml(fees[id] > 0 ? omxQty(fees[id], sym) : '0') : '') + '</small></span></button>'; }).join('') + '</div></div>');
    setTimeout(() => { document.querySelectorAll('.omx-sheet [data-net]:not([disabled])').forEach(b => { b.onclick = () => { close(); onPick(b.getAttribute('data-net')); }; }); }, 40);
  }
  async function loadNets(){
    if (S.wdNets) return S.wdNets;
    try { const { data, error } = await sb.rpc('crypto_withdraw_overview'); if (error) throw error; S.wdNets = (data && data.networks) || []; S.wdOverview = data; }
    catch(e){ S.wdNets = null; }
    return S.wdNets || [];
  }
  /* ---------- DEPOSIT ---------- */
  function renderDeposit(){
    const d = S.dep;
    const assets = Array.from(new Set((S.wdNets || []).map(n => n.asset))).map(omxAsset).filter(Boolean);
    let body = '<section class="omx-card omx-sec"><div class="omx-sh"><h2>1 · ' + escapeHtml(t('omx.dep1')) + '</h2></div><div class="omx-grid">' +
      (assets.length ? assets : OMX_ASSETS.filter(a => a.nets.length)).map(a => '<button type="button" class="omx-pick' + (d.asset === a.sym ? ' on' : '') + '" data-dep-asset="' + a.sym + '">' + omxLogo(a.sym, 34) + '<b>' + a.sym + '</b></button>').join('') + '</div></section>';
    if (d.asset) body += '<section class="omx-card omx-sec"><div class="omx-sh"><h2>2 · ' + escapeHtml(t('omx.dep2')) + '</h2></div>' +
      (d.net ? '<button type="button" class="omx-net pick sel" data-omx="dep-net">' + omxNetLogo(d.net, 34) + '<span class="omx-nt"><b>' + escapeHtml(OMX_NETWORKS[d.net].name) + ' <small>' + escapeHtml(OMX_NETWORKS[d.net].std) + '</small></b></span><span class="hub-chev dir-flip">' + icon('chev', 18) + '</span></button>'
        : '<button type="button" class="btn btn-secondary" data-omx="dep-net">' + escapeHtml(t('omx.netPick')) + '</button>') + '</section>';
    if (d.asset && d.net) body += '<section class="omx-card omx-sec" id="omx-dep-res" aria-live="polite">' + skeletonRows(1) + '</section>';
    return top(t('omx.depT')) + '<div class="screen-body omx-page"><p class="omx-info">' + icon('shield', 18) + '<span>' + escapeHtml(t('omx.depInfo')) + '</span></p>' + body + '</div>';
  }
  /* the server creates this account's addresses the first time (idempotent), then returns the saved one */
  async function ensureAddresses(){
    const s = await sb.auth.getSession(), tok = s && s.data && s.data.session && s.data.session.access_token;
    if (!tok) throw new Error('unauthenticated');
    const r = await fetch(SUPABASE_URL + '/functions/v1/wallet-addresses', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok, apikey: SUPABASE_ANON_KEY }, body: '{}' });
    if (!r.ok) throw new Error('address_creation_failed');
  }
  async function readAddress(asset, net){
    let r = await sb.rpc('get_receive_address', { p_asset: asset, p_network: net });
    if (r.error && /address_pending/.test(String(r.error.message || ''))){ await ensureAddresses(); r = await sb.rpc('get_receive_address', { p_asset: asset, p_network: net }); }
    if (r.error) throw r.error;
    const addr = String(r.data || '');
    let qr = '';
    try { const q = await sb.rpc('my_deposit_addresses'); const row = ((q && q.data) || []).find(x => x.network === net && x.address === addr); if (row && typeof row.qr_svg === 'string' && row.qr_svg.indexOf('<svg') === 0) qr = row.qr_svg; } catch(e){ /* the QR is drawn locally if the saved one cannot be read */ }
    return { addr, qr };
  }
  async function depAddress(){
    const host = document.getElementById('omx-dep-res'); if (!host) return;
    const d = S.dep, n = OMX_NETWORKS[d.net];
    const warn = '<p class="omx-warn">' + icon('warn', 18) + escapeHtml(tf('omx.depWarn', { a: d.asset, n: n.name })) + (n.memo ? ' ' + escapeHtml(t('omx.depMemo')) : '') + '</p>';
    try {
      const { addr, qr } = await readAddress(d.asset, d.net);
      /* the account's own address for this network (a real key behind it, created by the server) and its saved QR code: shown as an image, never as markup */
      host.innerHTML = '<div class="omx-addr"><small>' + escapeHtml(n.name) + '</small><b class="ltr" dir="ltr">' + escapeHtml(addr) + '</b>' +
        (qr ? '<div class="omx-qr"><img class="omx-qrsvg" alt="' + escapeHtml(t('omx.qrAlt')) + '" src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qr) + '"></div>'
          : (typeof OMXQR !== 'undefined' ? '<div class="omx-qr">' + OMXQR.svg(addr) + '</div>' : '')) +
        '<div class="omx-btns"><button class="btn btn-secondary" data-omx="dep-copy">' + icon('copy', 18) + '<span>' + escapeHtml(t('omx.copy')) + '</span></button>' +
        (navigator.share ? '<button class="btn btn-secondary" data-omx="dep-share">' + icon('share', 18) + '<span>' + escapeHtml(t('omx.share')) + '</span></button>' : '') + '</div></div>' + warn;
      S.dep.addr = addr;
    } catch(e){
      const m = String(e && e.message || '');
      host.innerHTML = /deposit_address_unavailable/.test(m)
        ? '<div class="omx-block">' + icon('lock', 30) + '<b>' + escapeHtml(t('omx.depNoAddrT')) + '</b><p>' + escapeHtml(tf('omx.depNoAddrD', { a: d.asset, n: n.name })) + '</p></div>'
        : '<div class="omx-block">' + icon('warn', 30) + '<p>' + escapeHtml(t('omx.depErr')) + '</p><button class="omx-retry" data-omx="dep-retry">' + escapeHtml(t('omx.retry')) + '</button></div>';
    }
  }
  /* ---------- EXCHANGE (honest: not connected) ---------- */
  function renderExchange(){
    return top(t('omx.exT')) + '<div class="screen-body omx-page"><section class="omx-card omx-block big">' + icon('swap', 40) + '<b>' + escapeHtml(t('omx.exNoT')) + '</b><p>' + escapeHtml(t('omx.exNoD')) + '</p>' +
      '<button class="btn btn-primary" data-nav="markets">' + escapeHtml(t('omx.seeMarkets')) + '</button></section></div>';
  }
  /* ---------- live refresh of what is on screen ---------- */
  function live(){
    const id = R.current();
    if (id === 'markets'){ const h = document.getElementById('omx-mk'); if (h){ if (!MOTION.patchList(h, marketRows())) fillSparks(h); } }           /* 14.10.0: numbers are patched in place (flash, no flicker) */
    document.querySelectorAll('.omx-status').forEach(el => { if (!MOTION.patchStatus(el, statusLine())) el.outerHTML = statusLine(); });
    document.querySelectorAll('[data-omx-p]').forEach(el => { const k = OMXMarket.get(el.getAttribute('data-omx-p')); if (k){ el.textContent = omxPct(k.pct) + (el.classList.contains('omx-apc') ? ' · 24 h' : ''); el.classList.toggle('up', k.pct >= 0); el.classList.toggle('down', k.pct < 0); } });
    if (id === 'asset'){ const el = document.querySelector('.omx-ap'), k = OMXMarket.get(S.cur); if (el && k) el.textContent = omxUsd(k.price); }
    if (id === 'home' || id === 'wallet'){
      document.querySelectorAll('[data-omx-v]').forEach(el => {
        const s = el.getAttribute('data-omx-v'), k = OMXMarket.get(s); if (!k || el.hasAttribute('data-omx-mask')) return;
        const q = el.getAttribute('data-omx-q');
        el.textContent = q != null ? omxUsd(Number(q) * k.price) : omxUsd(k.price);
      });
      const tv = document.querySelector('[data-omx-total]'); if (tv && !Runtime.hideBalance){ const tt = totals(); document.querySelectorAll('[data-omx-total]').forEach(x => { x.innerHTML = balHtml(omxUsd(tt.usd, { dp: 2 })); }); const o = document.querySelector('[data-omx-omr]'); if (o) o.innerHTML = '≈ ' + moneyHtml(CurrencyEngine.format(Math.round(tt.omr * 1000) / 1000, 'OMR')); }
      const mk = document.getElementById('omx-home-mk');
      if (mk && mk.querySelector('.sk-row')){ const movers = OMX_ASSETS.filter(a => OMXMarket.get(a.sym)).sort((x, y) => Math.abs(OMXMarket.get(y.sym).pct || 0) - Math.abs(OMXMarket.get(x.sym).pct || 0)).slice(0, 6); mk.innerHTML = movers.map(a => (S.moverCard ? S.moverCard(a) : assetRow(a))).join(''); fillSparks(mk); }
    }
  }
  /* ---------- wiring ---------- */
  function bind(info){
    const id = info.id, el = info.el;
    if (['home', 'wallet', 'markets', 'asset', 'deposit'].indexOf(id) === -1) return;
    OMXMarket.start();
    fillSparks(el);
    if (id === 'home') paintPortfolio();
    if (id === 'home'){ const tv = el.querySelector('[data-omx-total]'); if (tv) try { fitBalance(tv); } catch(e){} }
    if (id === 'asset'){ paintChart(); if (!S.wdNets) loadNets().then(() => { if (S.wdNets && R.current() === 'asset') R.go('asset', { force: true }); }); }
    if (id === 'deposit'){ if (!S.wdNets) loadNets().then(() => { if (S.wdNets && R.current() === 'deposit') R.go('deposit', { force: true }); }); depAddress(); }
    if (id === 'markets'){ const q = el.querySelector('#omx-q'); if (q) q.oninput = () => { S.q = q.value; const h = document.getElementById('omx-mk'); if (h){ h.innerHTML = marketRows(); fillSparks(h); } }; }
    if (el.__omx) return; el.__omx = true;
    el.addEventListener('click', async e => {
      const row = e.target.closest && e.target.closest('[data-omx-asset]');
      if (row){ S.cur = row.getAttribute('data-omx-asset'); S.period = '1D'; R.go('asset'); return; }
      const tab = e.target.closest && e.target.closest('[data-omx-tab]');
      if (tab){ S.tab = tab.getAttribute('data-omx-tab'); el.querySelectorAll('[data-omx-tab]').forEach(c => c.setAttribute('aria-pressed', c === tab ? 'true' : 'false')); const h = document.getElementById('omx-mk'); if (h){ h.innerHTML = marketRows(); fillSparks(h); } return; }
      const per = e.target.closest && e.target.closest('[data-omx-per]');
      if (per){ S.period = per.getAttribute('data-omx-per'); el.querySelectorAll('[data-omx-per]').forEach(c => c.setAttribute('aria-pressed', c === per ? 'true' : 'false')); paintChart(); return; }
      const da = e.target.closest && e.target.closest('[data-dep-asset]');
      if (da){ S.dep = { asset: da.getAttribute('data-dep-asset'), net: null }; R.go('deposit', { force: true }); return; }
      const b = e.target.closest && e.target.closest('[data-omx]'); if (!b) return;
      const a = b.getAttribute('data-omx');
      if (a === 'retry'){ OMXMarket.refresh(); }
      else if (a === 'chart') paintChart();
      else if (a === 'fav'){ const on = await toggleFav(S.cur); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', t(on ? 'omx.favDel' : 'omx.favAdd')); try { UIKit.haptic('tap'); } catch(x){} }
      else if (a === 'dep'){ S.dep = { asset: S.cur, net: null }; R.go('deposit'); }
      else if (a === 'wd'){ if (typeof OMXWithdraw !== 'undefined') OMXWithdraw.startCrypto(S.cur); else R.go('withdraw'); }
      else if (a === 'dep-net'){
        const nets = await loadNets(), allowed = nets.filter(n => n.asset === S.dep.asset).map(n => n.network);
        pickNetwork(S.dep.asset, allowed, null, id2 => { S.dep.net = id2; R.go('deposit', { force: true }); });
      }
      else if (a === 'dep-retry') depAddress();
      else if (a === 'dep-copy' && S.dep.addr){ try { await navigator.clipboard.writeText(S.dep.addr); toast(t('omx.copied'), 'success'); } catch(x){ toast(t('errors.UNKNOWN_ERROR'), 'error'); } }
      else if (a === 'dep-share' && S.dep.addr){ try { await navigator.share({ text: S.dep.addr }); } catch(x){} }
    });
  }
  function init(){
    R.register({ home: renderHome, wallet: renderWallet, markets: renderMarkets, asset: renderAsset, deposit: renderDeposit, exchange: renderExchange });
    R.on(info => { try { bind(info); } catch(e){ console.error('[omx]', e); } });
    OMXMarket.on(() => { try { live(); } catch(e){ console.error('[omx] live', e); } });
  }
  init();
  return { holdings, totals, pickNetwork, loadNets, state: S, statusLine };
})();
