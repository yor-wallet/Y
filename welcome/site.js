/* OM Wallet — showcase site (/welcome): languages (fr / en / ar, right to left), real app screenshots per language,
   live market prices (Binance public API, never invented: if they cannot be read, the page says so), reveal on scroll. */
(() => {
  'use strict';
  const T = {
    fr: {},   /* French is the text written in the page */
    en: {
      'skip':'Skip to content','nav.features':'Features','nav.markets':'Markets','nav.security':'Security','nav.faq':'Questions',
      'cta.login':'Sign in','cta.signup':'Create my account','cta.open':'Open the app',
      'hero.eyebrow':'Crypto wallet · Arabic · English · French','hero.title':'Your crypto wallet, simple and safe.',
      'hero.lead':'Deposit, swap and follow your cryptocurrencies in one place. Every operation is checked before it is credited, and you see its status in real time.',
      'fact1.b':'Web','fact1.s':'on phone and computer','fact2.b':'0 fees','fact2.s':'on swaps','fact3.b':'3 languages','fact3.s':'Arabic, English, French',
      'chip.live':'Live prices · Binance','chip.ok':'Swap confirmed',
      'mk.title':'Markets, live','mk.loading':'Loading prices…','mk.live':'Live · updated at {t}','mk.off':'Prices unavailable right now','mk.stale':'Last price read at {t}',
      'mk.note':'Public Binance prices (pairs against USDT), refreshed every 15 seconds. Cryptocurrencies are volatile: their value can go down as well as up.',
      'ft.eyebrow':'Features','ft.title':'Everything you need, nothing superfluous',
      'f1.t':'Your deposit address','f1.p':'A personal address per network, created by our server for your account, with its QR code. Bitcoin, Ethereum, USDT and XRP.',
      'f2.t':'Swap at a fixed price','f2.p':'The price is fixed by the server when you ask and stays valid for 30 seconds. No swap fee. You see exactly what you will receive.',
      'f3.t':'Spot and live markets','f3.p':'Charts, order book and latest trades in real time for BTC, ETH, BNB, SOL, XRP, LTC and USDC.',
      'f4.t':'Send to a user','f4.p':'Send crypto to another OM Wallet user with their ID or e-mail address, with no blockchain address to copy.',
      'f5.t':'Bank and crypto withdrawals','f5.p':'Withdraw to a bank account in Omani rial or to a crypto address. Every request is followed step by step.',
      'f6.t':'Arabic, English, French','f6.p':'The app and the e-mails speak your language, with a right-to-left layout for Arabic.',
      'sh.eyebrow':'The app','sh.title':'Designed for the phone','sh.lead':'A clear glass-and-blue interface, readable amounts, and the status of every operation always visible: submitted, in progress, confirmed.',
      'tab.home':'Home','tab.markets':'Markets','tab.spot':'Spot','tab.swap':'Swap','sh.note':'Real screenshots of the app (sample data).',
      'hw.eyebrow':'Get started','hw.title':'Three steps',
      's1.t':'Create your account','s1.p':'Name, e-mail, phone number and password. Confirm your e-mail address with the link you receive.',
      's2.t':'Protect it with a code','s2.p':'Choose your 6-digit code: it protects every sensitive operation (send, swap, withdraw).',
      's3.t':'Deposit and swap','s3.p':'Copy your deposit address or scan its QR code, then follow your assets and the markets live.',
      'sc.eyebrow':'Security','sc.title':'Your money is credited only once checked','sc.lead':'We prefer an honest « in progress » to a false confirmation.',
      'k1.t':'Checked before credit','k1.p':'Sends, swaps and withdrawals stay « in progress » until they are checked; one credit, one confirmation e-mail.',
      'k2.t':'A code for every sensitive operation','k2.p':'Your 6-digit code is asked to send, swap or withdraw.',
      'k3.t':'Prices fixed on the server','k3.p':'A swap price comes from Binance and is fixed by our server, never by the device.',
      'k4.t':'Real addresses only','k4.p':'A deposit address is never made up: if the server has none, the app says so clearly.',
      'fq.eyebrow':'Questions','fq.title':'Frequently asked questions',
      'q1':'How do I create an account?','a1':'Tap « Create my account », enter your name, e-mail, phone number and a password of at least 8 characters, then open the confirmation link sent by e-mail.',
      'q2':'Which cryptocurrencies can I use?','a2':'Deposits in Bitcoin, Ethereum, USDT and XRP. Swaps and markets: BTC, ETH, USDT, USDC, BNB, SOL, XRP and LTC.',
      'q3':'Are there fees?','a3':'Swaps are free. For a withdrawal, any fee (for example the network fee) is shown before you confirm.',
      'q4':'Why is my operation « in progress »?','a4':'Every operation is checked before it is credited. It then turns « Confirmed » and you receive an e-mail in your language.',
      'q5':'Is there an Android app?','a5':'The app already works in the browser of your phone and computer. An Android app is being prepared.',
      'fn.title':'Ready to start?','fn.p':'Create your account in a few minutes.',
      'ftr.p':'Crypto wallet in Arabic, English and French.','ftr.contact':'Contact us',
      'ftr.risk':'Cryptocurrencies are volatile assets: their value can go down. Only invest what you can afford to lose. Prices shown: Binance public API.',
      'title':'OM Wallet — Simple and safe crypto wallet'
    },
    ar: {
      'skip':'انتقل إلى المحتوى','nav.features':'المزايا','nav.markets':'الأسواق','nav.security':'الأمان','nav.faq':'الأسئلة',
      'cta.login':'تسجيل الدخول','cta.signup':'إنشاء حسابي','cta.open':'فتح التطبيق',
      'hero.eyebrow':'محفظة عملات رقمية · العربية · الإنجليزية · الفرنسية','hero.title':'محفظتك للعملات الرقمية، بسيطة وآمنة.',
      'hero.lead':'أودِع عملاتك الرقمية وبدّلها وتابعها في مكان واحد. يتم التحقق من كل عملية قبل إضافتها إلى رصيدك، وترى حالتها لحظة بلحظة.',
      'fact1.b':'الويب','fact1.s':'على الهاتف والحاسوب','fact2.b':'بدون رسوم','fact2.s':'على عمليات التبديل','fact3.b':'3 لغات','fact3.s':'العربية والإنجليزية والفرنسية',
      'chip.live':'أسعار مباشرة · Binance','chip.ok':'تم تأكيد التبديل',
      'mk.title':'الأسواق مباشرة','mk.loading':'جارٍ تحميل الأسعار…','mk.live':'مباشر · آخر تحديث {t}','mk.off':'الأسعار غير متاحة حالياً','mk.stale':'آخر سعر مسجَّل عند {t}',
      'mk.note':'أسعار Binance العامة (مقابل USDT)، تُحدَّث كل 15 ثانية. العملات الرقمية متقلبة: قد تنخفض قيمتها كما قد ترتفع.',
      'ft.eyebrow':'المزايا','ft.title':'كل ما تحتاجه، دون تعقيد',
      'f1.t':'عنوان الإيداع الخاص بك','f1.p':'عنوان شخصي لكل شبكة يُنشئه خادمنا لحسابك، مع رمز QR الخاص به. بيتكوين وإيثريوم وUSDT وXRP.',
      'f2.t':'تبديل بسعر مثبّت','f2.p':'يحدد الخادم السعر لحظة الطلب ويبقى صالحاً 30 ثانية. بدون رسوم تبديل. ترى بالضبط ما ستستلمه.',
      'f3.t':'سبوت وأسواق مباشرة','f3.p':'رسوم بيانية ودفتر أوامر وآخر الصفقات لحظياً لـ BTC وETH وBNB وSOL وXRP وLTC وUSDC.',
      'f4.t':'الإرسال إلى مستخدم','f4.p':'أرسل العملات الرقمية إلى مستخدم آخر في OM Wallet بمعرّفه أو بريده الإلكتروني، دون نسخ عنوان بلوكشين.',
      'f5.t':'سحب إلى البنك أو بالعملات الرقمية','f5.p':'اسحب إلى حساب مصرفي بالريال العُماني أو إلى عنوان عملة رقمية. تُتابَع كل عملية خطوة بخطوة.',
      'f6.t':'العربية والإنجليزية والفرنسية','f6.p':'التطبيق والرسائل الإلكترونية بلغتك، مع اتجاه من اليمين إلى اليسار للعربية.',
      'sh.eyebrow':'التطبيق','sh.title':'مصمَّم للهاتف','sh.lead':'واجهة واضحة من الزجاج والأزرق، ومبالغ سهلة القراءة، وحالة كل عملية ظاهرة دائماً: مُرسلة، قيد التنفيذ، مؤكدة.',
      'tab.home':'الرئيسية','tab.markets':'الأسواق','tab.spot':'سبوت','tab.swap':'تبديل','sh.note':'لقطات حقيقية من التطبيق (بيانات توضيحية).',
      'hw.eyebrow':'ابدأ','hw.title':'ثلاث خطوات',
      's1.t':'أنشئ حسابك','s1.p':'الاسم والبريد الإلكتروني ورقم الهاتف وكلمة المرور. أكّد بريدك عبر الرابط الذي يصلك.',
      's2.t':'احمِه برمز','s2.p':'اختر رمزك المكوّن من 6 أرقام: يحمي كل عملية حساسة (إرسال، تبديل، سحب).',
      's3.t':'أودِع وبدّل','s3.p':'انسخ عنوان الإيداع أو امسح رمز QR، ثم تابع أصولك والأسواق مباشرة.',
      'sc.eyebrow':'الأمان','sc.title':'لا يُضاف المبلغ إلى رصيدك إلا بعد التحقق','sc.lead':'نفضّل حالة « قيد التنفيذ » الصادقة على تأكيد غير صحيح.',
      'k1.t':'تحقق قبل الإضافة','k1.p':'تبقى عمليات الإرسال والتبديل والسحب « قيد التنفيذ » حتى التحقق منها؛ إضافة واحدة ورسالة تأكيد واحدة.',
      'k2.t':'رمز لكل عملية حساسة','k2.p':'يُطلب رمزك المكوّن من 6 أرقام للإرسال أو التبديل أو السحب.',
      'k3.t':'أسعار يحددها الخادم','k3.p':'سعر التبديل مصدره Binance ويثبّته خادمنا، وليس الجهاز.',
      'k4.t':'عناوين حقيقية فقط','k4.p':'لا يُختلق عنوان إيداع أبداً: إن لم يتوفر لدى الخادم، يوضح التطبيق ذلك.',
      'fq.eyebrow':'الأسئلة','fq.title':'الأسئلة الشائعة',
      'q1':'كيف أنشئ حساباً؟','a1':'اضغط « إنشاء حسابي »، وأدخل اسمك وبريدك الإلكتروني ورقم هاتفك وكلمة مرور من 8 أحرف على الأقل، ثم افتح رابط التأكيد المرسل إلى بريدك.',
      'q2':'ما العملات الرقمية المتاحة؟','a2':'الإيداع بالبيتكوين والإيثريوم وUSDT وXRP. التبديل والأسواق: BTC وETH وUSDT وUSDC وBNB وSOL وXRP وLTC.',
      'q3':'هل توجد رسوم؟','a3':'التبديل مجاني. وفي السحب تُعرض أي رسوم (مثل رسوم الشبكة) قبل أن تؤكد.',
      'q4':'لماذا عمليتي « قيد التنفيذ »؟','a4':'يتم التحقق من كل عملية قبل إضافتها. ثم تصبح « مؤكدة » وتصلك رسالة بلغتك.',
      'q5':'هل يوجد تطبيق أندرويد؟','a5':'يعمل التطبيق الآن في متصفح هاتفك وحاسوبك. وتطبيق أندرويد قيد الإعداد.',
      'fn.title':'جاهز للبدء؟','fn.p':'أنشئ حسابك في دقائق.',
      'ftr.p':'محفظة عملات رقمية بالعربية والإنجليزية والفرنسية.','ftr.contact':'تواصل معنا',
      'ftr.risk':'العملات الرقمية أصول متقلبة: قد تنخفض قيمتها. لا تستثمر إلا ما يمكنك تحمّل خسارته. الأسعار المعروضة: واجهة Binance العامة.',
      'title':'OM Wallet — محفظة عملات رقمية بسيطة وآمنة'
    }
  };
  const FR = {};                                    /* original French texts, read from the page once */
  document.querySelectorAll('[data-i]').forEach(el => { FR[el.getAttribute('data-i')] = el.textContent; });
  FR['title'] = document.title;
  FR['mk.live'] = 'En direct · mis à jour à {t}'; FR['mk.off'] = 'Cours indisponibles pour le moment'; FR['mk.stale'] = 'Dernier cours relevé à {t}';
  T.fr = FR;
  const store = { get(){ try { return localStorage.getItem('omw.site.lang'); } catch(e){ return null; } }, set(v){ try { localStorage.setItem('omw.site.lang', v); } catch(e){} } };
  const pick = () => { const s = store.get(); if (s && T[s]) return s; const n = (navigator.language || 'fr').slice(0, 2); return T[n] ? n : 'fr'; };
  let lang = pick(), shot = 'home';
  const t = k => (T[lang] && T[lang][k]) || FR[k] || '';

  function apply(){
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i]').forEach(el => { const v = t(el.getAttribute('data-i')); if (v) el.textContent = v; });
    document.title = t('title');
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)));
    document.querySelectorAll('img[data-shot]').forEach(img => { img.src = '/welcome/img/' + img.getAttribute('data-shot') + '-' + lang + '.webp'; });
    const si = document.getElementById('show-img'); if (si) si.src = '/welcome/img/' + shot + '-' + lang + '.webp';
    paintStatus();
    paintTicker();
  }
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => { lang = b.getAttribute('data-lang'); store.set(lang); apply(); }));

  /* showcase tabs */
  const tabs = [...document.querySelectorAll('[data-tab]')];
  tabs.forEach(b => b.addEventListener('click', () => {
    shot = b.getAttribute('data-tab');
    tabs.forEach(x => x.setAttribute('aria-selected', String(x === b)));
    const si = document.getElementById('show-img'); if (!si) return;
    si.style.opacity = '0';
    setTimeout(() => { si.src = '/welcome/img/' + shot + '-' + lang + '.webp'; si.onload = () => { si.style.opacity = '1'; }; }, 180);
  }));
  tabs.forEach((b, i) => b.addEventListener('keydown', e => {
    const d = (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0) * (lang === 'ar' ? -1 : 1);
    if (d){ const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); n.click(); }
  }));

  /* live market: real public prices only */
  const SYMS = [['BTC', 'Bitcoin'], ['ETH', 'Ethereum'], ['BNB', 'BNB'], ['SOL', 'Solana'], ['XRP', 'XRP'], ['LTC', 'Litecoin']];
  const M = { rows: null, at: 0, state: 'wait', prev: {} };
  const dp = v => v >= 1 ? 2 : v >= 0.01 ? 4 : 6;
  const nf = {}; const fmt = v => { const d = dp(v); return (nf[d] || (nf[d] = new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }))).format(v); };
  const hhmm = ms => new Date(ms).toLocaleTimeString(lang === 'ar' ? 'ar-OM-u-nu-latn' : lang, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  function paintStatus(){
    const el = document.getElementById('mk-status'); if (!el) return;
    const cls = M.state === 'live' ? '' : M.state === 'off' ? ' off' : ' wait';
    const txt = M.state === 'live' ? t('mk.live').replace('{t}', hhmm(M.at)) : M.state === 'stale' ? t('mk.stale').replace('{t}', hhmm(M.at)) : M.state === 'off' ? t('mk.off') : t('mk.loading');
    el.innerHTML = '<span class="dot' + cls + '"></span><span></span>'; el.lastChild.textContent = txt;
  }
  function paintTicker(){
    const box = document.getElementById('ticker'); if (!box) return;
    if (!M.rows){
      if (!box.children.length) box.innerHTML = SYMS.map(() => '<div class="tk sk" role="listitem"></div>').join('');
      if (M.state === 'off') box.innerHTML = '';
      return;
    }
    box.innerHTML = M.rows.map(r => {
      const up = r.pct >= 0, ch = M.prev[r.sym] != null && M.prev[r.sym] !== r.price;
      return '<div class="tk" role="listitem"><div class="tk-h"><img src="/assets/crypto/tokens/' + r.sym + '.svg" alt="" width="32" height="32" loading="lazy"><div><b>' + r.sym + '</b><small>' + r.name + '</small></div></div>' +
        '<div class="tk-p' + (ch ? ' flash' : '') + '">$' + fmt(r.price) + '</div><div class="tk-c ' + (up ? 'up' : 'down') + '">' + (up ? '+' : '') + r.pct.toFixed(2) + '%</div></div>';
    }).join('');
  }
  async function load(){
    if (document.visibilityState === 'hidden') return;
    try {
      const q = encodeURIComponent(JSON.stringify(SYMS.map(s => s[0] + 'USDT')));
      const r = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr?symbols=' + q, { cache: 'no-store' });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json(); const by = {}; j.forEach(x => { by[x.symbol] = x; });
      const rows = SYMS.map(([s, n]) => { const x = by[s + 'USDT']; return x ? { sym: s, name: n, price: +x.lastPrice, pct: +x.priceChangePercent } : null; }).filter(x => x && x.price > 0);
      if (!rows.length) throw new Error('empty');
      if (M.rows) M.rows.forEach(x => { M.prev[x.sym] = x.price; });
      M.rows = rows; M.at = Date.now(); M.state = 'live';
    } catch (e) {
      M.state = M.rows ? 'stale' : 'off';         /* keeps the last real prices, dated as such; never invents any */
    }
    paintStatus(); paintTicker();
  }
  load(); setInterval(load, 15000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') load(); });

  /* reveal on scroll (skipped when the person asked for less motion) */
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window){
    const els = document.querySelectorAll('.card, .steps li, .checks li, details, .final-in, .sec-head, .show .phone');
    els.forEach(el => el.classList.add('rv'));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  }
  const yr = document.getElementById('yr'); if (yr) yr.textContent = String(new Date().getFullYear());
  apply();
})();
