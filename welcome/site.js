/* DYT — showcase site (/welcome): languages (fr / en / ar, right to left), real app screenshots per language,
   live market prices (Binance public API, never invented: if they cannot be read, the page says so), reveal on scroll. */
(() => {
  'use strict';
  const T = {
    fr: {},   /* French is the text written in the page */
    en: {
      'sv.dep.t':'Deposit crypto','sv.dep.p':'Receive Bitcoin, Ethereum, USDT or XRP on your personal address, created by our server for your account.','sv.dep.s1':'Open Deposit and choose the asset and the network.','sv.dep.s2':'Copy your address or scan its QR code.','sv.dep.s3':'Send from your other wallet or platform; the amount is credited once the operation is checked.','sv.dep.k':'Only send the chosen asset on the chosen network. If an address is not available, the app says so: it never makes one up.','sv.swp.t':'Swap','sv.swp.p':'Convert one asset into another at a price fixed by the server, valid for 30 seconds, with no swap fee.','sv.swp.s1':'Choose the asset to pay, the one to receive, then the amount.','sv.swp.s2':'Check the price and the amount you receive before confirming.','sv.swp.s3':'Follow the operation: “In progress”, then “Confirmed”, with an e-mail in your language.','sv.swp.k':'Minimum: 1 USD of value. The price is never calculated by your device.','sv.mkt.t':'Markets and Spot','sv.mkt.p':'Follow BTC, ETH, BNB, SOL, XRP, LTC and USDC: chart, order book and latest trades in real time.','sv.mkt.s1':'Open Markets to see prices and your favourites.','sv.mkt.s2':'Tap an asset: its chart shows over several periods.','sv.mkt.s3':'Go to Spot for the order book and the latest trades.','sv.mkt.k':'Public Binance prices. Cryptocurrencies are volatile: their value can fall as well as rise.','sv.snd.t':'Send to a user','sv.snd.p':'Send crypto to another DYT user without copying a blockchain address.','sv.snd.s1':'Tap Send on the home screen.','sv.snd.s2':'Enter the recipient’s DYT ID or e-mail address, then the amount.','sv.snd.s3':'Check the summary, then confirm.','sv.snd.k':'The recipient must already have an DYT account.','sv.wd.t':'Withdraw','sv.wd.p':'Withdraw to an Omani rial bank account or to an external crypto address.','sv.wd.s1':'Open Withdraw and choose bank or crypto.','sv.wd.s2':'Enter the details and the amount; any fees are shown before you confirm.','sv.wd.s3':'Follow the request step by step until “Confirmed”.','sv.wd.k':'A withdrawal request is checked before it is carried out: it stays “In progress” until then.','sv.hst.t':'Tracking and history','sv.hst.p':'Every operation has its status, its receipt and its confirmation e-mail in your language.','sv.hst.s1':'History lists all your operations.','sv.hst.s2':'Tap an operation to see its details and receipt.','sv.hst.s3':'Notifications tell you about movements on your account.','sv.hst.k':'Nothing is “confirmed” until the server has confirmed it.','sv.acc.t':'Account and devices','sv.acc.p':'Arabic, English or French, dark or light theme, and management of your sessions and connected devices.','sv.acc.s1':'Settings: language, theme and notifications.','sv.acc.s2':'Devices and sessions: see where your account is open.','sv.acc.s3':'Help: frequently asked questions and support contact.','sv.acc.k':'Web app: nothing to install, or add it to your phone’s home screen.','sv.how':'How it works','sv.know':'Good to know','nav.services':'Services','sv.eyebrow':'Services','sv.title':'Everything DYT offers','sv.lead':'Every service below exists in the app today. You can explore it here without creating an account.','sv.cta':'Create my account to use them','cta.discover':'Explore the services','nav.support':'Support','k5.t':'Each account only sees its own data','k5.p':'The database access rules limit each account to its own information.','k7.t':'Two-step verification','k7.p':'Optional: a code from an authenticator app at every sign-in, checked by the server — no phone number needed.','k6.t':'Address keys are protected','k6.p':'Deposit address keys are generated and kept encrypted on the server, never in the app.','q6':'I forgot my password.','a6':'On the sign-in screen, tap “Forgot password” and enter your e-mail: you receive a link to choose a new one.','q7':'Which languages are available?','a7':'Arabic, English and French, including e-mails; Arabic is shown right to left.','q8':'Can I explore without an account?','a8':'Yes: this site shows the services and live prices without signing up. An account is only needed to use your wallet.','q9':'I do not recognise an activity on my account.','a9':'Change your password, then contact support by e-mail straight away.','q10':'How do I contact support?','a10':'By e-mail at yordigitalefinance@gmail.com, or from the Help screen of the app.','su.eyebrow':'Support','su.title':'A question? Write to us.','su.p':'Support replies by e-mail. In the app, the Help screen gathers the frequently asked questions and the same contact.','su.btn':'Write to support',
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
      'f4.t':'Send to a user','f4.p':'Send crypto to another DYT user with their ID or e-mail address, with no blockchain address to copy.',
      'f5.t':'Bank and crypto withdrawals','f5.p':'Withdraw to a bank account in Omani rial or to a crypto address. Every request is followed step by step.',
      'f6.t':'Arabic, English, French','f6.p':'The app and the e-mails speak your language, with a right-to-left layout for Arabic.',
      'sh.eyebrow':'The app','sh.title':'Designed for the phone','sh.lead':'A dark, clear interface with yellow accents, readable amounts, and the status of every operation always visible: submitted, in progress, confirmed.',
      'tab.home':'Home','tab.markets':'Markets','tab.spot':'Spot','tab.swap':'Swap','sh.note':'Real screenshots of the app (sample data).',
      'hw.eyebrow':'Get started','hw.title':'Three steps',
      's1.t':'Create your account','s1.p':'First name, last name, e-mail and password — no phone number. Confirm your e-mail address with the link you receive.',
      's2.t':'Protect it with a code','s2.p':'Choose your 6-digit code: it is asked for operations above 500 USD and for every crypto send or withdrawal. Add two-step verification at sign-in if you wish.',
      's3.t':'Deposit and swap','s3.p':'Copy your deposit address or scan its QR code, then follow your assets and the markets live.',
      'sc.eyebrow':'Security','sc.title':'Your money is credited only once checked','sc.lead':'We prefer an honest « in progress » to a false confirmation.',
      'k1.t':'Checked before credit','k1.p':'Sends, swaps and withdrawals stay « in progress » until they are checked; one credit, one confirmation e-mail.',
      'k2.t':'A code above 500 USD','k2.p':'Above 500 USD (or its equivalent), and for every crypto send or withdrawal, your 6-digit code is checked by our server. No biometrics are used to validate a transaction.',
      'k3.t':'Prices fixed on the server','k3.p':'A swap price comes from Binance and is fixed by our server, never by the device.',
      'k4.t':'Real addresses only','k4.p':'A deposit address is never made up: if the server has none, the app says so clearly.',
      'fq.eyebrow':'Questions','fq.title':'Frequently asked questions',
      'q1':'How do I create an account?','a1':'Tap « Create my account », enter your first name, last name, e-mail and a password of at least 8 characters, then open the confirmation link sent by e-mail.',
      'q2':'Which cryptocurrencies can I use?','a2':'Deposits in Bitcoin, Ethereum, USDT and XRP. Swaps and markets: BTC, ETH, USDT, USDC, BNB, SOL, XRP and LTC.',
      'q3':'Are there fees?','a3':'Swaps are free. For a withdrawal, any fee (for example the network fee) is shown before you confirm.',
      'q4':'Why is my operation « in progress »?','a4':'Every operation is checked before it is credited. It then turns « Confirmed » and you receive an e-mail in your language.',
      'q5':'Is there an Android app?','a5':'The app already works in the browser of your phone and computer. An Android app is being prepared.',
      'fn.title':'Ready to start?','fn.p':'Create your account in a few minutes.',
      'ftr.p':'Crypto wallet in Arabic, English and French.','ftr.contact':'Contact us',
      'ftr.risk':'Cryptocurrencies are volatile assets: their value can go down. Only invest what you can afford to lose. Prices shown: Binance public API.',
      'title':'DYT — Simple and safe crypto wallet'
    },
    ar: {
      'sv.dep.t':'إيداع العملات الرقمية','sv.dep.p':'استقبل بيتكوين وإيثيريوم وUSDT وXRP على عنوانك الشخصي الذي يُنشئه خادمنا لحسابك.','sv.dep.s1':'افتح «إيداع» واختر العملة والشبكة.','sv.dep.s2':'انسخ عنوانك أو امسح رمز QR الخاص به.','sv.dep.s3':'أرسل من محفظتك أو منصتك الأخرى؛ يُضاف المبلغ إلى رصيدك بعد التحقق من العملية.','sv.dep.k':'أرسل فقط العملة المختارة على الشبكة المختارة. إن لم يتوفر عنوان فالتطبيق يذكر ذلك، ولا يختلق عنواناً أبداً.','sv.swp.t':'المبادلة (Swap)','sv.swp.p':'حوّل عملة إلى أخرى بسعر يحدده الخادم وصالح لمدة 30 ثانية، دون رسوم مبادلة.','sv.swp.s1':'اختر العملة التي تدفعها والتي تستلمها ثم المبلغ.','sv.swp.s2':'تحقق من السعر ومن المبلغ الذي ستستلمه قبل التأكيد.','sv.swp.s3':'تابع العملية: «قيد التنفيذ» ثم «مؤكدة» مع رسالة بريد بلغتك.','sv.swp.k':'الحد الأدنى: ما يعادل 1 دولار. لا يُحسب السعر على جهازك أبداً.','sv.mkt.t':'الأسواق وSpot','sv.mkt.p':'تابع BTC وETH وBNB وSOL وXRP وLTC وUSDC: رسم بياني ودفتر أوامر وآخر الصفقات لحظةً بلحظة.','sv.mkt.s1':'افتح «الأسواق» لترى الأسعار ومفضلتك.','sv.mkt.s2':'المس عملة ليظهر رسمها البياني على عدة فترات.','sv.mkt.s3':'انتقل إلى Spot لدفتر الأوامر وآخر الصفقات.','sv.mkt.k':'أسعار Binance العامة. العملات الرقمية متقلبة: قد تنخفض قيمتها كما قد ترتفع.','sv.snd.t':'الإرسال إلى مستخدم','sv.snd.p':'أرسل عملات رقمية إلى مستخدم آخر في DYT دون نسخ عنوان بلوكتشين.','sv.snd.s1':'المس «إرسال» في الشاشة الرئيسية.','sv.snd.s2':'أدخل معرّف DYT أو البريد الإلكتروني للمستلم ثم المبلغ.','sv.snd.s3':'راجع الملخص ثم أكّد.','sv.snd.k':'يجب أن يكون لدى المستلم حساب في DYT.','sv.wd.t':'السحب','sv.wd.p':'اسحب إلى حساب مصرفي بالريال العماني أو إلى عنوان عملات رقمية خارجي.','sv.wd.s1':'افتح «سحب» واختر مصرفاً أو عملة رقمية.','sv.wd.s2':'أدخل البيانات والمبلغ؛ تظهر الرسوم إن وُجدت قبل التأكيد.','sv.wd.s3':'تابع الطلب خطوةً بخطوة حتى «مؤكد».','sv.wd.k':'يُراجَع طلب السحب قبل تنفيذه: يبقى «قيد التنفيذ» إلى حين ذلك.','sv.hst.t':'المتابعة والسجل','sv.hst.p':'لكل عملية حالتها وإيصالها ورسالة تأكيدها بلغتك.','sv.hst.s1':'يعرض السجل جميع عملياتك.','sv.hst.s2':'المس عملية لترى تفاصيلها وإيصالها.','sv.hst.s3':'تنبّهك الإشعارات بالحركات على حسابك.','sv.hst.k':'لا شيء يُعرض «مؤكداً» ما لم يؤكده الخادم.','sv.acc.t':'الحساب والأجهزة','sv.acc.p':'العربية أو الإنجليزية أو الفرنسية، سمة داكنة أو فاتحة، وإدارة جلساتك وأجهزتك المتصلة.','sv.acc.s1':'الإعدادات: اللغة والسمة والإشعارات.','sv.acc.s2':'الأجهزة والجلسات: اطّلع على الأماكن المفتوح فيها حسابك.','sv.acc.s3':'المساعدة: الأسئلة الشائعة وبيانات التواصل مع الدعم.','sv.acc.k':'تطبيق ويب: لا حاجة للتثبيت، أو أضفه إلى الشاشة الرئيسية لهاتفك.','sv.how':'كيف تعمل','sv.know':'من المفيد معرفته','nav.services':'الخدمات','sv.eyebrow':'الخدمات','sv.title':'كل ما يقدّمه DYT','sv.lead':'كل خدمة أدناه متوفرة في التطبيق اليوم. يمكنك استكشافها هنا دون إنشاء حساب.','sv.cta':'أنشئ حسابي لاستخدامها','cta.discover':'اكتشف الخدمات','nav.support':'المساعدة','k5.t':'كل حساب يرى بياناته فقط','k5.p':'تقصر قواعد الوصول في قاعدة البيانات كل حساب على معلوماته الخاصة.','k7.t':'التحقق بخطوتين','k7.p':'اختياري: رمز من تطبيق مصادقة عند كل تسجيل دخول يتحقق منه الخادم، دون الحاجة إلى رقم هاتف.','k6.t':'مفاتيح العناوين محمية','k6.p':'تُنشأ مفاتيح عناوين الإيداع وتُحفظ مشفّرة على الخادم، وليس في التطبيق أبداً.','q6':'نسيت كلمة المرور.','a6':'في شاشة الدخول اضغط «نسيت كلمة المرور» وأدخل بريدك الإلكتروني: ستصلك رسالة برابط لاختيار كلمة مرور جديدة.','q7':'ما اللغات المتاحة؟','a7':'العربية والإنجليزية والفرنسية، بما فيها رسائل البريد؛ وتُعرض العربية من اليمين إلى اليسار.','q8':'هل أستطيع الاستكشاف دون حساب؟','a8':'نعم: يعرض هذا الموقع الخدمات والأسعار المباشرة دون تسجيل. الحساب ضروري فقط لاستخدام محفظتك.','q9':'لا أتعرف على نشاط في حسابي.','a9':'غيّر كلمة المرور ثم تواصل فوراً مع الدعم عبر البريد الإلكتروني.','q10':'كيف أتواصل مع الدعم؟','a10':'عبر البريد الإلكتروني yordigitalefinance@gmail.com أو من شاشة المساعدة في التطبيق.','su.eyebrow':'المساعدة','su.title':'لديك سؤال؟ راسلنا.','su.p':'يردّ الدعم عبر البريد الإلكتروني. وفي التطبيق تجمع شاشة المساعدة الأسئلة الشائعة وبيانات التواصل نفسها.','su.btn':'راسل الدعم',
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
      'f4.t':'الإرسال إلى مستخدم','f4.p':'أرسل العملات الرقمية إلى مستخدم آخر في DYT بمعرّفه أو بريده الإلكتروني، دون نسخ عنوان بلوكشين.',
      'f5.t':'سحب إلى البنك أو بالعملات الرقمية','f5.p':'اسحب إلى حساب مصرفي بالريال العُماني أو إلى عنوان عملة رقمية. تُتابَع كل عملية خطوة بخطوة.',
      'f6.t':'العربية والإنجليزية والفرنسية','f6.p':'التطبيق والرسائل الإلكترونية بلغتك، مع اتجاه من اليمين إلى اليسار للعربية.',
      'sh.eyebrow':'التطبيق','sh.title':'مصمَّم للهاتف','sh.lead':'واجهة داكنة وواضحة بلمسات صفراء، ومبالغ سهلة القراءة، وحالة كل عملية ظاهرة دائماً: مُرسلة، قيد التنفيذ، مؤكدة.',
      'tab.home':'الرئيسية','tab.markets':'الأسواق','tab.spot':'سبوت','tab.swap':'تبديل','sh.note':'لقطات حقيقية من التطبيق (بيانات توضيحية).',
      'hw.eyebrow':'ابدأ','hw.title':'ثلاث خطوات',
      's1.t':'أنشئ حسابك','s1.p':'الاسم الأول واسم العائلة والبريد الإلكتروني وكلمة المرور، دون رقم هاتف. أكّد بريدك عبر الرابط الذي يصلك.',
      's2.t':'احمِه برمز','s2.p':'اختر رمزك المكوّن من 6 أرقام: يُطلب للعمليات التي تتجاوز 500 دولار ولكل إرسال أو سحب للعملات الرقمية. ويمكنك إضافة التحقق بخطوتين عند تسجيل الدخول.',
      's3.t':'أودِع وبدّل','s3.p':'انسخ عنوان الإيداع أو امسح رمز QR، ثم تابع أصولك والأسواق مباشرة.',
      'sc.eyebrow':'الأمان','sc.title':'لا يُضاف المبلغ إلى رصيدك إلا بعد التحقق','sc.lead':'نفضّل حالة « قيد التنفيذ » الصادقة على تأكيد غير صحيح.',
      'k1.t':'تحقق قبل الإضافة','k1.p':'تبقى عمليات الإرسال والتبديل والسحب « قيد التنفيذ » حتى التحقق منها؛ إضافة واحدة ورسالة تأكيد واحدة.',
      'k2.t':'رمز فوق 500 دولار','k2.p':'فوق 500 دولار (أو ما يعادلها)، ولكل إرسال أو سحب للعملات الرقمية، يتحقق خادمنا من رمزك المكوّن من 6 أرقام. لا تُستخدم القياسات الحيوية لتأكيد أي عملية.',
      'k3.t':'أسعار يحددها الخادم','k3.p':'سعر التبديل مصدره Binance ويثبّته خادمنا، وليس الجهاز.',
      'k4.t':'عناوين حقيقية فقط','k4.p':'لا يُختلق عنوان إيداع أبداً: إن لم يتوفر لدى الخادم، يوضح التطبيق ذلك.',
      'fq.eyebrow':'الأسئلة','fq.title':'الأسئلة الشائعة',
      'q1':'كيف أنشئ حساباً؟','a1':'اضغط « إنشاء حسابي »، وأدخل اسمك الأول واسم العائلة وبريدك الإلكتروني وكلمة مرور من 8 أحرف على الأقل، ثم افتح رابط التأكيد المرسل إلى بريدك.',
      'q2':'ما العملات الرقمية المتاحة؟','a2':'الإيداع بالبيتكوين والإيثريوم وUSDT وXRP. التبديل والأسواق: BTC وETH وUSDT وUSDC وBNB وSOL وXRP وLTC.',
      'q3':'هل توجد رسوم؟','a3':'التبديل مجاني. وفي السحب تُعرض أي رسوم (مثل رسوم الشبكة) قبل أن تؤكد.',
      'q4':'لماذا عمليتي « قيد التنفيذ »؟','a4':'يتم التحقق من كل عملية قبل إضافتها. ثم تصبح « مؤكدة » وتصلك رسالة بلغتك.',
      'q5':'هل يوجد تطبيق أندرويد؟','a5':'يعمل التطبيق الآن في متصفح هاتفك وحاسوبك. وتطبيق أندرويد قيد الإعداد.',
      'fn.title':'جاهز للبدء؟','fn.p':'أنشئ حسابك في دقائق.',
      'ftr.p':'محفظة عملات رقمية بالعربية والإنجليزية والفرنسية.','ftr.contact':'تواصل معنا',
      'ftr.risk':'العملات الرقمية أصول متقلبة: قد تنخفض قيمتها. لا تستثمر إلا ما يمكنك تحمّل خسارته. الأسعار المعروضة: واجهة Binance العامة.',
      'title':'DYT — محفظة عملات رقمية بسيطة وآمنة'
    }
  };
  const FR = {};                                    /* original French texts, read from the page once */
  document.querySelectorAll('[data-i]').forEach(el => { FR[el.getAttribute('data-i')] = el.textContent; });
  FR['title'] = document.title;
  FR['mk.live'] = 'En direct · mis à jour à {t}'; FR['mk.off'] = 'Cours indisponibles pour le moment'; FR['mk.stale'] = 'Dernier cours relevé à {t}';
  T.fr = FR;
  const store = { get(){ try { return localStorage.getItem('omw.site.lang'); } catch(e){ return null; } }, set(v){ try { localStorage.setItem('omw.site.lang', v); } catch(e){} } };
  const pick = () => { const q = (new URLSearchParams(location.search).get('lang') || '').slice(0, 2); if (T[q]) { store.set(q); return q; } const s = store.get(); if (s && T[s]) return s; const n = (navigator.language || 'fr').slice(0, 2); return T[n] ? n : 'fr'; };
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
    const built = box.querySelectorAll('.tk[data-sym]').length === M.rows.length;
    if (!built){
      box.innerHTML = M.rows.map(r => '<div class="tk" role="listitem" data-sym="' + r.sym + '"><div class="tk-h"><img src="/assets/crypto/tokens/' + r.sym + '.svg" alt="" width="32" height="32" loading="lazy"><div><b>' + r.sym + '</b><small>' + r.name + '</small></div></div>' +
        '<div class="tk-p"></div><div class="tk-c"></div></div>').join('');
    }
    M.rows.forEach(r => {                           /* update in place: the card stays, the figure moves */
      const card = box.querySelector('.tk[data-sym="' + r.sym + '"]'); if (!card) return;
      const p = card.querySelector('.tk-p'), c = card.querySelector('.tk-c'), up = r.pct >= 0;
      const text = '$' + fmt(r.price), was = M.prev[r.sym];
      if (p.textContent !== text){
        p.textContent = text;
        if (built && was != null && was !== r.price){ const cls = r.price > was ? 'flash-up' : 'flash-down'; p.classList.remove('flash-up', 'flash-down'); void p.offsetWidth; p.classList.add(cls); }
      }
      c.className = 'tk-c ' + (up ? 'up' : 'down'); c.textContent = (up ? '+' : '') + r.pct.toFixed(2) + '%';
    });
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
    const els = document.querySelectorAll('.card, .svc, .steps li, .checks li, details, .final-in, .sec-head, .show .phone, .support-in');
    els.forEach(el => el.classList.add('rv'));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  }
  const yr = document.getElementById('yr'); if (yr) yr.textContent = String(new Date().getFullYear());
  apply();
})();
