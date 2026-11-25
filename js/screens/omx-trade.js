'use strict';

/* ============================================================
   OM WALLET 14.5 — SPOT · SWAP
   - Live market (public Binance stream, data-stream.binance.vision): order book, market trades, candles, last price. The state of the
     feed is always shown (« En direct » / « Actualisé à … » / « Hors ligne — dernier cours à … »). Nothing is invented: no data → « — ».
   - REAL execution, same rules as every money movement in OM Wallet:
       1. the server function crypto-swap fixes the price (Binance, read on the server) for 30 seconds — the app never sets a price;
       2. swap_execute (PIN checked by the server, one request per idempotency key) sets the amount paid aside and records the
          operation IN PROGRESS; nothing is credited;
       3. only the administrator confirms: the crypto bought is credited, one e-mail. Until then the screen says « En cours ».
   - Spot = market order (buy / sell against USDT). Limit orders are not offered (no button that would not really execute).
   ============================================================ */
Object.assign(TR.en, {
  'tr.spot':'Spot','tr.swap':'Swap','tr.navAssets':'Assets','tr.activity':'Activity',
  'tr.live':'Live','tr.delayed':'Updated at {t}','tr.offline':'Offline — last price at {t}','tr.connecting':'Connecting to the market…',
  'tr.h24':'24h high','tr.l24':'24h low','tr.v24':'24h vol (USDT)','tr.book':'Order book','tr.trades':'Market trades','tr.price':'Price','tr.qty':'Amount','tr.time':'Time',
  'tr.buy':'Buy','tr.sell':'Sell','tr.market':'Market order','tr.marketInfo':'Executed at the market price fixed when you ask. Limit orders are not offered.',
  'tr.spend':'Amount to spend','tr.sellQ':'Amount to sell','tr.avail':'Available: {v}','tr.est':'≈ {v}','tr.buyX':'Buy {a}','tr.sellX':'Sell {a}',
  'lt.convertT':'Convert {a}','lt.bal':'Balance: {v}','lt.pay':'You pay','lt.get':'You get','lt.preview':'Preview conversion','lt.del':'Delete','lt.keypad':'Keypad',
  'tr.from':'From','tr.to':'To (estimated)','tr.flip':'Swap the two cryptos','tr.rate':'Live rate: 1 {a} ≈ {v}','tr.rateL':'Live rate:','tr.max':'Max',
  'tr.fee':'Fees','tr.priceL':'Price','tr.priceV':'fixed when you ask (valid 30 s)','tr.follow':'Tracking','tr.followV':'In progress, then Confirmed','tr.src':'Price source','tr.go':'Swap',
  'tr.review':'Check your swap','tr.pay':'You pay','tr.get':'You receive','tr.valid':'Price valid for {s} s','tr.expired':'This price has expired','tr.refresh':'Get a new price','tr.confirm':'Confirm',
  'tr.rule':'The amount you pay is set aside until OM Wallet confirms. You receive exactly the amount shown here.',
  'tr.pick':'Choose a pair','tr.pickA':'Choose a crypto','tr.noBal':'No available balance','tr.risk':'Crypto prices are volatile.','tr.data':'Market data: Binance (public).',
  'tr.s.SUBMIT':'Recording your swap…','tr.s.PENDING':'In progress','tr.s.CONFIRMED':'Swap confirmed','tr.s.REJECTED':'Refused — the amount was returned to your balance','tr.s.FAILED':'Not recorded',
  'tr.st.rec':'Submitted','tr.st.wait':'In progress','tr.st.done':'Confirmed','tr.again':'Back','tr.home':'Back to Swap',
  'tr.e.insufficient_balance':'Insufficient available balance.','tr.e.min_amount':'The minimum is 1 USD of value.','tr.e.price_unavailable':'The price is unavailable right now. Try again.',
  'tr.e.quote_expired':'This price has expired. Get a new price.','tr.e.quote_used':'This price was already used.','tr.e.too_many_requests':'Too many requests. Wait a minute.',
  'tr.e.unsupported_pair':'This pair is not available.','tr.e.unsupported_asset_network':'This crypto is not available on this network.','tr.e.sender_inactive':'Your account cannot swap.',
  'tr.e.sender_wallet_missing':'You have no balance in this crypto.','tr.e.invalid_amount':'Enter a valid amount.','tr.e.amount_too_small':'The amount is too small.','tr.e.pin_required':'Confirm with your code.',
  'tr.e.server_off':'Swapping is not activated on the server yet.','tr.e.unknown':'The swap could not be recorded.','tr.e.offline':'You are offline.',
  'tr.e.uncertain':'No answer from the server. Check Activity before trying again: the same swap is never counted twice.'
});
Object.assign(TR.fr, {
  'tr.spot':'Spot','tr.swap':'Swap','tr.navAssets':'Actifs','tr.activity':'Activité',
  'tr.live':'En direct','tr.delayed':'Actualisé à {t}','tr.offline':'Hors ligne — dernier cours à {t}','tr.connecting':'Connexion au marché…',
  'tr.h24':'Haut 24 h','tr.l24':'Bas 24 h','tr.v24':'Vol. 24 h (USDT)','tr.book':'Carnet d’ordres','tr.trades':'Transactions du marché','tr.price':'Prix','tr.qty':'Quantité','tr.time':'Heure',
  'tr.buy':'Acheter','tr.sell':'Vendre','tr.market':'Ordre au marché','tr.marketInfo':'Exécuté au prix du marché fixé au moment de la demande. Les ordres à cours limité ne sont pas proposés.',
  'tr.spend':'Montant à dépenser','tr.sellQ':'Quantité à vendre','tr.avail':'Disponible : {v}','tr.est':'≈ {v}','tr.buyX':'Acheter {a}','tr.sellX':'Vendre {a}',
  'lt.convertT':'Convertir {a}','lt.bal':'Solde : {v}','lt.pay':'Vous payez','lt.get':'Vous recevez','lt.preview':'Aperçu de la conversion','lt.del':'Effacer','lt.keypad':'Pavé numérique',
  'tr.from':'De','tr.to':'Vers (estimé)','tr.flip':'Inverser les deux cryptos','tr.rate':'Cours en direct : 1 {a} ≈ {v}','tr.rateL':'Cours en direct :','tr.max':'Max',
  'tr.fee':'Frais','tr.priceL':'Prix','tr.priceV':'fixé au moment de la demande (valable 30 s)','tr.follow':'Suivi','tr.followV':'En cours, puis Confirmé','tr.src':'Source du prix','tr.go':'Échanger',
  'tr.review':'Vérifiez votre échange','tr.pay':'Vous payez','tr.get':'Vous recevez','tr.valid':'Prix valable {s} s','tr.expired':'Ce prix a expiré','tr.refresh':'Obtenir un nouveau prix','tr.confirm':'Confirmer',
  'tr.rule':'Le montant payé est mis de côté jusqu’à la confirmation par OM Wallet. Vous recevez exactement le montant affiché ici.',
  'tr.pick':'Choisir une paire','tr.pickA':'Choisir une crypto','tr.noBal':'Aucun solde disponible','tr.risk':'Les prix des cryptos sont volatils.','tr.data':'Données de marché : Binance (public).',
  'tr.s.SUBMIT':'Enregistrement de votre échange…','tr.s.PENDING':'En cours','tr.s.CONFIRMED':'Échange confirmé','tr.s.REJECTED':'Refusé — le montant est revenu sur votre solde','tr.s.FAILED':'Non enregistré',
  'tr.st.rec':'Soumis','tr.st.wait':'En cours','tr.st.done':'Confirmé','tr.again':'Retour','tr.home':'Retour au Swap',
  'tr.e.insufficient_balance':'Solde disponible insuffisant.','tr.e.min_amount':'Le minimum est de 1 USD de valeur.','tr.e.price_unavailable':'Le prix est indisponible pour le moment. Réessayez.',
  'tr.e.quote_expired':'Ce prix a expiré. Obtenez un nouveau prix.','tr.e.quote_used':'Ce prix a déjà été utilisé.','tr.e.too_many_requests':'Trop de demandes. Patientez une minute.',
  'tr.e.unsupported_pair':'Cette paire n’est pas disponible.','tr.e.unsupported_asset_network':'Cette crypto n’est pas disponible sur ce réseau.','tr.e.sender_inactive':'Votre compte ne peut pas échanger.',
  'tr.e.sender_wallet_missing':'Vous n’avez pas de solde dans cette crypto.','tr.e.invalid_amount':'Saisissez un montant valide.','tr.e.amount_too_small':'Le montant est trop petit.','tr.e.pin_required':'Confirmez avec votre code.',
  'tr.e.server_off':'L’échange n’est pas encore activé sur le serveur.','tr.e.unknown':'L’échange n’a pas pu être enregistré.','tr.e.offline':'Vous êtes hors ligne.',
  'tr.e.uncertain':'Aucune réponse du serveur. Vérifiez l’Activité avant de réessayer : le même échange n’est jamais compté deux fois.'
});
Object.assign(TR.ar, {
  'tr.spot':'سبوت','tr.swap':'تبديل','tr.navAssets':'الأصول','tr.activity':'النشاط',
  'tr.live':'مباشر','tr.delayed':'حُدّث في {t}','tr.offline':'غير متصل — آخر سعر في {t}','tr.connecting':'جارٍ الاتصال بالسوق…',
  'tr.h24':'أعلى 24 س','tr.l24':'أدنى 24 س','tr.v24':'حجم 24 س (USDT)','tr.book':'دفتر الأوامر','tr.trades':'صفقات السوق','tr.price':'السعر','tr.qty':'الكمية','tr.time':'الوقت',
  'tr.buy':'شراء','tr.sell':'بيع','tr.market':'أمر بسعر السوق','tr.marketInfo':'يُنفَّذ بسعر السوق المثبّت عند الطلب. الأوامر المحددة السعر غير متاحة.',
  'tr.spend':'المبلغ المراد إنفاقه','tr.sellQ':'الكمية المراد بيعها','tr.avail':'المتاح: {v}','tr.est':'≈ {v}','tr.buyX':'شراء {a}','tr.sellX':'بيع {a}',
  'lt.convertT':'تحويل {a}','lt.bal':'الرصيد: {v}','lt.pay':'تدفع','lt.get':'تستلم','lt.preview':'معاينة التحويل','lt.del':'حذف','lt.keypad':'لوحة الأرقام',
  'tr.from':'من','tr.to':'إلى (تقديري)','tr.flip':'تبديل العملتين','tr.rate':'السعر المباشر: 1 {a} ≈ {v}','tr.rateL':'السعر المباشر:','tr.max':'الكل',
  'tr.fee':'الرسوم','tr.priceL':'السعر','tr.priceV':'مثبّت عند الطلب (صالح 30 ث)','tr.follow':'المتابعة','tr.followV':'قيد التنفيذ، ثم مؤكَّد','tr.src':'مصدر السعر','tr.go':'تبديل',
  'tr.review':'راجع عملية التبديل','tr.pay':'تدفع','tr.get':'تستلم','tr.valid':'السعر صالح لمدة {s} ث','tr.expired':'انتهت صلاحية هذا السعر','tr.refresh':'الحصول على سعر جديد','tr.confirm':'تأكيد',
  'tr.rule':'يُحجز المبلغ المدفوع حتى يؤكده OM Wallet. تستلم بالضبط المبلغ المعروض هنا.',
  'tr.pick':'اختر زوجاً','tr.pickA':'اختر عملة','tr.noBal':'لا يوجد رصيد متاح','tr.risk':'أسعار العملات الرقمية متقلبة.','tr.data':'بيانات السوق: Binance (عامة).',
  'tr.s.SUBMIT':'جارٍ تسجيل عملية التبديل…','tr.s.PENDING':'قيد التنفيذ','tr.s.CONFIRMED':'تم تأكيد التبديل','tr.s.REJECTED':'مرفوض — أُعيد المبلغ إلى رصيدك','tr.s.FAILED':'لم يُسجَّل',
  'tr.st.rec':'أُرسل','tr.st.wait':'قيد التنفيذ','tr.st.done':'مؤكَّد','tr.again':'رجوع','tr.home':'العودة إلى التبديل',
  'tr.e.insufficient_balance':'الرصيد المتاح غير كافٍ.','tr.e.min_amount':'الحد الأدنى قيمة 1 دولار.','tr.e.price_unavailable':'السعر غير متاح حالياً. حاول مرة أخرى.',
  'tr.e.quote_expired':'انتهت صلاحية هذا السعر. احصل على سعر جديد.','tr.e.quote_used':'استُخدم هذا السعر من قبل.','tr.e.too_many_requests':'طلبات كثيرة. انتظر دقيقة.',
  'tr.e.unsupported_pair':'هذا الزوج غير متاح.','tr.e.unsupported_asset_network':'هذه العملة غير متاحة على هذه الشبكة.','tr.e.sender_inactive':'لا يمكن لحسابك إجراء التبديل.',
  'tr.e.sender_wallet_missing':'ليس لديك رصيد من هذه العملة.','tr.e.invalid_amount':'أدخل مبلغاً صحيحاً.','tr.e.amount_too_small':'المبلغ صغير جداً.','tr.e.pin_required':'أكّد برمزك.',
  'tr.e.server_off':'التبديل غير مفعّل على الخادم بعد.','tr.e.unknown':'تعذّر تسجيل التبديل.','tr.e.offline':'أنت غير متصل.',
  'tr.e.uncertain':'لا يوجد رد من الخادم. تحقق من النشاط قبل المحاولة مجدداً: لا تُحتسب العملية نفسها مرتين.'
});

const OMXTrade = (() => {
  const SUP = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'XRP', 'LTC'];            /* assets the server can swap (public.asset_networks) */
  const SRV_NETS = { BTC: ['bitcoin'], ETH: ['ethereum'], USDT: ['tron', 'ethereum', 'bsc', 'polygon'], USDC: ['ethereum', 'bsc', 'polygon', 'solana'], BNB: ['bsc'], SOL: ['solana'], XRP: ['xrp'], LTC: ['litecoin'] };
  const DEF_NET = { BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tron', USDC: 'ethereum', BNB: 'bsc', SOL: 'solana', XRP: 'xrp', LTC: 'litecoin' };
  const PAIRS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'LTC', 'USDC'];                  /* Spot pairs, all against USDT */
  const TFS = { '15m': '15m', '1H': '1h', '4H': '4h', '1D': '1d' };
  const REST = 'https://data-api.binance.vision/api/v3', WSU = 'wss://data-stream.binance.vision/stream?streams=';
  const TTL = 30;
  const S = { base: 'BTC', tf: '1H', side: 'BUY', amt: '', sw: { from: 'USDT', to: 'BTC', amt: '' }, quote: null, done: null, back: 'exchange' };
  const M = { tag: '', pair: '', candles: [], bids: [], asks: [], trades: [], last: null, dir: 0, state: 'idle', at: 0, ws: null, retry: 0, timer: 0, poll: 0, prevBook: {} };
  const top = (title, back) => refTop(title, back);
  const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };
  const hhmm = ts => { try { return new Date(ts).toLocaleTimeString(LANG === 'ar' ? 'ar-OM' : LANG === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch(e){ return ''; } };

  /* ---------- account balances (Runtime.wallets, from the server) ---------- */
  const ws = () => (Runtime.wallets || []).filter(w => SUP.indexOf(String(w.asset).toUpperCase()) !== -1 && (SRV_NETS[String(w.asset).toUpperCase()] || []).indexOf(w.network) !== -1);
  function walletsOf(sym){ return ws().filter(w => String(w.asset).toUpperCase() === sym).sort((a, b) => Number(b.availableBalance || 0) - Number(a.availableBalance || 0)); }
  function fromNet(sym){ const l = walletsOf(sym); return l.length ? l[0].network : DEF_NET[sym]; }
  function toNet(sym){ const l = walletsOf(sym).sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0)); return l.length ? l[0].network : DEF_NET[sym]; }
  function avail(sym, net){ const w = ws().find(x => String(x.asset).toUpperCase() === sym && x.network === net); return w ? Math.max(0, Number(w.availableBalance) || 0) : 0; }
  /* price in USDT (USDT = 1, as the server counts it) */
  function px(sym){ if (sym === 'USDT') return 1; if (sym === S.base && M.last > 0 && M.pair === sym + 'USDT') return M.last; const k = OMXMarket.get(sym); return k && k.price > 0 ? k.price : null; }
  const dpOf = v => { const a = Math.abs(Number(v)); return a >= 1000 ? 2 : a >= 10 ? 3 : a >= 1 ? 4 : a >= 0.01 ? 5 : 8; };
  /* number formatters are built once per precision (toLocaleString with options builds one on every call: ~40 per frame here) */
  const NF = {}, nf = (mn, mx) => NF[mn + ':' + mx] || (NF[mn + ':' + mx] = new Intl.NumberFormat('en-US', { minimumFractionDigits: mn, maximumFractionDigits: mx }));
  const fmtP = v => !(Number(v) > 0) ? '—' : nf(dpOf(v), dpOf(v)).format(Number(v));
  const fmtQ = v => { const n = Number(v); if (!isFinite(n)) return '—'; const d = n >= 1000 ? 2 : n >= 1 ? 4 : 6; return nf(0, d).format(n); };
  const cut8 = n => Math.floor(Number(n) * 1e8 + 1e-6) / 1e8;
  /* « 1 BTC = 96,972 USDT » rather than « 1 USDT = 0.00001 BTC »: the side worth more than 1 is named first */
  const rateTxt = (fa, ta, price, approx) => !(price > 0) ? '—' : price >= 1 ? '1 ' + fa + (approx ? ' ≈ ' : ' = ') + fmtP(price) + ' ' + ta : '1 ' + ta + (approx ? ' ≈ ' : ' = ') + fmtP(1 / price) + ' ' + fa;
  const srcTxt = s2 => String(s2 || 'binance').replace(/^binance:?/i, 'Binance · ').replace(/ · $/, '');
  const num = v => { const n = Number(String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : NaN; };

  /* ---------- live market for the Spot screen ---------- */
  async function snapshot(tag){
    const pair = M.pair, j = u => fetch(u, { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject(new Error('http ' + r.status)));
    const [k, d, tr] = await Promise.all([
      j(REST + '/klines?symbol=' + pair + '&interval=' + TFS[S.tf] + '&limit=64'), j(REST + '/depth?symbol=' + pair + '&limit=10'), j(REST + '/trades?symbol=' + pair + '&limit=16')]);
    if (M.tag !== tag) return;
    M.candles = (Array.isArray(k) ? k : []).map(x => ({ t: +x[0], o: +x[1], h: +x[2], l: +x[3], c: +x[4] })).filter(c => c.c > 0);
    M.bids = ((d && d.bids) || []).map(r => [+r[0], +r[1]]); M.asks = ((d && d.asks) || []).map(r => [+r[0], +r[1]]);
    M.trades = (Array.isArray(tr) ? tr : []).slice(-16).reverse().map(x => ({ p: +x.price, q: +x.qty, t: +x.time, sell: !!x.isBuyerMaker }));
    const L = M.candles[M.candles.length - 1]; if (L) setLast(L.c, true);
    M.at = Date.now();
  }
  function open(){
    close();
    const tag = S.base + '|' + S.tf + '|' + Date.now(); M.tag = tag; M.pair = S.base + 'USDT';
    M.candles = []; M.bids = []; M.asks = []; M.trades = []; M.last = null; M.dir = 0; M.state = 'connecting'; M.prevBook = {};
    paint('all');
    snapshot(tag).then(() => { if (M.tag === tag){ if (M.state !== 'live') M.state = 'delayed'; paint('all'); } })
      .catch(() => { if (M.tag === tag){ M.state = 'offline'; paint('status'); } })
      .then(() => { if (M.tag === tag) connect(tag); });
  }
  function close(){
    M.tag = ''; clearTimeout(M.timer); clearInterval(M.poll); M.poll = 0; clearTimeout(feedT); feedT = 0; pend.clear();
    if (M.ws){ const w = M.ws; M.ws = null; try { w.onclose = null; w.close(); } catch(e){} }
  }
  /* hidden tab / screen off: the stream is closed (no data, no battery spent); the figures stay, dated « Actualisé à … ».
     Back on screen: a fresh snapshot, then the stream again. */
  function pause(){
    if (!M.tag) return;
    clearTimeout(M.timer);
    if (M.ws){ const w = M.ws; M.ws = null; try { w.onclose = null; w.close(); } catch(e){} }
    if (M.at) M.state = 'delayed';
  }
  function resume(){
    const tag = M.tag; if (!tag || M.ws || R.current() !== 'spot') return;
    snapshot(tag).then(() => { if (M.tag === tag && M.state !== 'live'){ M.state = 'delayed'; paint('all'); } }).catch(() => {})
      .then(() => { if (M.tag === tag && !M.ws && document.visibilityState !== 'hidden') connect(tag); });
  }
  function startPoll(tag){
    if (M.poll) return;
    M.poll = setInterval(() => {
      if (M.tag !== tag || R.current() !== 'spot' || document.visibilityState === 'hidden') return;
      snapshot(tag).then(() => { if (M.tag === tag && M.state !== 'live'){ M.state = 'delayed'; paint('all'); } }).catch(() => { if (M.tag === tag && M.state !== 'live'){ M.state = 'offline'; paint('status'); } });
    }, 10000);
  }
  function connect(tag){
    if (typeof WebSocket === 'undefined'){ startPoll(tag); return; }
    const p = M.pair.toLowerCase(), url = WSU + [p + '@depth10@1000ms', p + '@aggTrade', p + '@kline_' + TFS[S.tf]].join('/');
    let w; try { w = new WebSocket(url); } catch(e){ startPoll(tag); return; }
    M.ws = w;
    w.onopen = () => { if (M.tag !== tag){ try { w.close(); } catch(e){} return; } M.retry = 0; M.state = 'live'; clearInterval(M.poll); M.poll = 0; paint('status'); };
    w.onmessage = ev => {
      if (M.tag !== tag) return;
      let m; try { m = JSON.parse(ev.data); } catch(e){ return; }
      const s = (m && m.stream) || '', d = m && m.data; if (!d) return;
      M.at = Date.now();
      if (s.indexOf('@depth') !== -1){ M.bids = (d.bids || []).map(r => [+r[0], +r[1]]); M.asks = (d.asks || []).map(r => [+r[0], +r[1]]); feed('book'); }
      else if (d.e === 'aggTrade'){ M.trades.unshift({ p: +d.p, q: +d.q, t: +d.T, sell: !!d.m, fresh: true }); if (M.trades.length > 16) M.trades.length = 16; setLast(+d.p); feed('trades'); feed('price'); }
      else if (d.e === 'kline' && d.k){
        const k = d.k, c = { t: +k.t, o: +k.o, h: +k.h, l: +k.l, c: +k.c }, L = M.candles[M.candles.length - 1];
        if (L && L.t === c.t) Object.assign(L, c); else if (!L || c.t > L.t){ M.candles.push(c); if (M.candles.length > 64) M.candles.shift(); }
        setLast(c.c); feed('chart'); feed('price');
      }
      if (M.state !== 'live'){ M.state = 'live'; paint('status'); }
    };
    w.onclose = () => {
      if (M.ws === w) M.ws = null;
      if (M.tag !== tag) return;
      M.state = M.at ? 'delayed' : 'offline'; paint('status'); startPoll(tag);
      const wait = Math.min(30000, 2000 * Math.pow(2, M.retry++));
      M.timer = setTimeout(() => { if (M.tag === tag && R.current() === 'spot' && document.visibilityState !== 'hidden') connect(tag); }, wait);
    };
    w.onerror = () => { /* onclose follows */ };
  }
  function setLast(p, quiet){
    if (!(p > 0)) return;
    if (M.last > 0 && !quiet) M.dir = p > M.last ? 1 : p < M.last ? -1 : M.dir;
    M.last = p;
  }

  /* stream updates are painted at most every FEED_MS: a busy market sends dozens of messages a second, the eye reads ~5 updates
     (every message is still applied to the data at once, so nothing is lost or late by more than FEED_MS) */
  const FEED_MS = 200, pend = new Set(); let feedT = 0, feedAt = 0;
  function feed(part){
    pend.add(part);
    if (feedT) return;
    feedT = setTimeout(() => { feedT = 0; feedAt = Date.now(); pend.forEach(p => paint(p)); pend.clear(); }, Math.max(0, feedAt + FEED_MS - Date.now()));
  }
  /* batched painting: one frame for everything that changed */
  const dirty = new Set(); let raf = 0;
  function paint(part){
    dirty.add(part);
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0; const parts = new Set(dirty); dirty.clear();
      if (R.current() !== 'spot') return;
      const all = parts.has('all');
      if (all || parts.has('status')) paintStatus();
      if (all || parts.has('price')) paintPrice();
      if (all || parts.has('chart')) drawChart();
      if (all || parts.has('book')) paintBook();
      if (all || parts.has('trades')) paintTrades();
      if (all || parts.has('price')) paintOrderEst();
    });
  }
  function statusHtml(){
    const st = M.state;
    if (st === 'live') return '<span class="tr-dot live"></span>' + escapeHtml(t('tr.live'));
    if (st === 'delayed') return '<span class="tr-dot"></span>' + escapeHtml(tf('tr.delayed', { t: hhmm(M.at) }));
    if (st === 'offline') return '<span class="tr-dot off"></span>' + escapeHtml(M.at ? tf('tr.offline', { t: hhmm(M.at) }) : t('tr.e.price_unavailable'));
    return '<span class="tr-dot wait"></span>' + escapeHtml(t('tr.connecting'));
  }
  /* writes the HTML only when it changed (no needless layout) */
  function setHtml(el, h){ if (el && el.__h !== h){ el.innerHTML = h; el.__h = h; } }
  /* restarts a flash without forcing a layout: two identical animations, used in turn */
  function flash(el){ if (reduced()) return; const f = el.classList.contains('flash') ? 'flash2' : 'flash'; el.classList.remove('flash', 'flash2'); el.classList.add(f); }
  function paintStatus(){ setHtml(document.getElementById('tr-status'), statusHtml()); }
  function paintPrice(){
    const el = document.getElementById('tr-px'); if (!el) return;
    const txt = fmtP(M.last);
    if (el.textContent !== txt){
      el.textContent = txt;
      el.classList.toggle('up', M.dir > 0); el.classList.toggle('down', M.dir < 0);
      flash(el);
    }
    const k = OMXMarket.get(S.base), u = document.getElementById('tr-pxu');
    if (u){ const v = M.last > 0 ? '≈ ' + omxUsd(M.last) : ''; if (u.textContent !== v) u.textContent = v; }
    const c = document.getElementById('tr-chg');
    if (c && k && k.pct != null){ const v = omxPct(k.pct); if (c.textContent !== v){ c.textContent = v; c.classList.toggle('up', k.pct >= 0); c.classList.toggle('down', k.pct < 0); } }
    const st = document.getElementById('tr-stats');
    if (st && k) setHtml(st, stat(t('tr.h24'), fmtP(k.high)) + stat(t('tr.l24'), fmtP(k.low)) + stat(t('tr.v24'), k.qvol ? compact(k.qvol) : '—'));
  }
  const stat = (a, b) => '<div><small>' + escapeHtml(a) + '</small><b class="ltr">' + escapeHtml(b) + '</b></div>';
  function compact(n){ n = Number(n); if (!isFinite(n)) return '—'; const u = [[1e9, LANG === 'fr' ? ' Md' : 'B'], [1e6, LANG === 'fr' ? ' M' : 'M'], [1e3, LANG === 'fr' ? ' k' : 'K']]; for (const [v, s] of u) if (n >= v) return (n / v).toFixed(2) + s; return n.toFixed(2); }

  /* candlestick chart (canvas), with a live last-price line; touch / pointer shows the candle under the finger */
  let hoverI = -1, cvW = 0, pal = null, palKey = '';
  function css(v, d){ try { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || d; } catch(e){ return d; } }
  /* chart colours read once per tone (day / night), not on every frame */
  function colors(){ const k = document.documentElement.getAttribute('data-tone') || ''; if (!pal || palKey !== k){ palKey = k; pal = { POS: css('--w-pos', '#45E39A'), NEG: css('--w-neg', '#FF7D89') }; } return pal; }
  /* width of the chart's content box (inside the card padding), kept up to date by a ResizeObserver: no layout read per frame */
  function chartWidth(cv){
    if (cvW > 0) return cvW;
    const p = cv.parentElement, s = getComputedStyle(p);
    return (cvW = Math.round(p.clientWidth - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0)));
  }
  function drawChart(){
    const cv = document.getElementById('tr-cv'); if (!cv) return;
    const W = Math.max(220, chartWidth(cv)), H = 200, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)){ cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
    const g = cv.getContext('2d'); if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const { POS, NEG } = colors(), cs = M.candles;
    g.font = '600 10px -apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif';   /* 15.3.0: the UI font (SF on Apple devices, Inter elsewhere) */
    if (!cs.length){ g.fillStyle = 'rgba(225,238,255,.6)'; g.textAlign = 'center'; g.fillText('—', W / 2, H / 2); g.textAlign = 'start'; return; }
    const padR = 64, padT = 12, padB = 20, n = cs.length, cw = (W - padR - 8) / n;
    let lo = Math.min.apply(null, cs.map(c => c.l)), hi = Math.max.apply(null, cs.map(c => c.h));
    if (M.last > 0){ lo = Math.min(lo, M.last); hi = Math.max(hi, M.last); }
    const span = (hi - lo) || hi * 0.002 || 1; lo -= span * 0.08; hi += span * 0.08;
    const y = v => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
    g.lineWidth = 1;
    for (let i = 0; i < 4; i++){
      const v = lo + (hi - lo) * (i + 0.5) / 4, yy = Math.round(y(v)) + 0.5;
      g.strokeStyle = 'rgba(255,255,255,.09)'; g.beginPath(); g.moveTo(4, yy); g.lineTo(W - padR, yy); g.stroke();
      g.fillStyle = 'rgba(225,238,255,.62)'; g.fillText(fmtP(v), W - padR + 6, yy + 3);
    }
    cs.forEach((c, i) => {
      const up = c.c >= c.o, x = 4 + i * cw + cw / 2, bw = Math.max(1.6, cw * 0.62);
      g.strokeStyle = g.fillStyle = up ? POS : NEG;
      g.beginPath(); g.moveTo(Math.round(x) + 0.5, y(c.h)); g.lineTo(Math.round(x) + 0.5, y(c.l)); g.stroke();
      const t0 = y(Math.max(c.o, c.c)), b0 = y(Math.min(c.o, c.c));
      g.fillRect(x - bw / 2, t0, bw, Math.max(1.4, b0 - t0));
    });
    const last = cs[n - 1], L = M.last > 0 ? M.last : last.c, ly = Math.round(y(L)) + 0.5, upL = L >= last.o;
    g.setLineDash([4, 4]); g.strokeStyle = upL ? POS : NEG; g.beginPath(); g.moveTo(4, ly); g.lineTo(W - padR, ly); g.stroke(); g.setLineDash([]);
    g.fillStyle = upL ? POS : NEG; roundRect(g, W - padR + 1, ly - 9, padR - 3, 18, 6); g.fill();
    g.fillStyle = '#04204F'; g.fillText(fmtP(L), W - padR + 6, ly + 3.5);
    /* time marks */
    g.fillStyle = 'rgba(225,238,255,.5)';
    [0, Math.floor(n / 2), n - 1].forEach(i => { const d = new Date(cs[i].t), lab = S.tf === '1D' ? d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }) : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      g.fillText(lab, Math.min(W - padR - 34, Math.max(4, 4 + i * cw)), H - 5); });
    if (hoverI >= 0 && hoverI < n){
      const x = Math.round(4 + hoverI * cw + cw / 2) + 0.5; g.strokeStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(x, padT); g.lineTo(x, H - padB); g.stroke();
      const c = cs[hoverI], o = document.getElementById('tr-ohlc');
      if (o) o.textContent = 'O ' + fmtP(c.o) + '  H ' + fmtP(c.h) + '  L ' + fmtP(c.l) + '  C ' + fmtP(c.c);
    }
  }
  function roundRect(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  function paintBook(){
    const el = document.getElementById('tr-book'); if (!el) return;
    const asks = M.asks.slice(0, 7).reverse(), bids = M.bids.slice(0, 7);
    if (!asks.length && !bids.length){ el.innerHTML = '<p class="tr-empty">—</p>'; return; }
    const mx = Math.max.apply(null, asks.concat(bids).map(r => r[1]).concat([1e-12])), prev = M.prevBook, next = {};
    const row = (r, side) => { const k = side + r[0]; next[k] = r[1]; const ch = prev[k] != null && prev[k] !== r[1] && !reduced();
      return '<div class="tb-row ' + side + (ch ? ' chg' : '') + '"><i style="transform:scaleX(' + Math.min(1, r[1] / mx).toFixed(3) + ')"></i><span class="ltr">' + fmtP(r[0]) + '</span><span class="ltr">' + fmtQ(r[1]) + '</span></div>'; };
    el.innerHTML = '<div class="tb-h"><span>' + escapeHtml(t('tr.price')) + '</span><span>' + escapeHtml(t('tr.qty')) + '</span></div>' +
      asks.map(r => row(r, 'ask')).join('') + '<div class="tb-mid ltr' + (M.dir > 0 ? ' up' : M.dir < 0 ? ' down' : '') + '">' + fmtP(M.last) + '</div>' + bids.map(r => row(r, 'bid')).join('');
    M.prevBook = next;
  }
  function paintTrades(){
    const el = document.getElementById('tr-trades'); if (!el) return;
    if (!M.trades.length){ el.innerHTML = '<p class="tr-empty">—</p>'; return; }
    el.innerHTML = '<div class="tt-h"><span>' + escapeHtml(t('tr.price')) + '</span><span>' + escapeHtml(t('tr.qty')) + '</span><span>' + escapeHtml(t('tr.time')) + '</span></div>' +
      M.trades.slice(0, 12).map(x => '<div class="tt-row' + (x.fresh && !reduced() ? ' fresh' : '') + '"><span class="ltr ' + (x.sell ? 'down' : 'up') + '">' + fmtP(x.p) + '</span><span class="ltr">' + fmtQ(x.q) + '</span><span class="ltr">' + escapeHtml(hhmm(x.t)) + '</span></div>').join('');
    M.trades.forEach(x => { x.fresh = false; });
  }

  /* ---------- Spot: order panel (market order = a swap against USDT) ---------- */
  function spotLegs(){
    return S.side === 'BUY' ? { fa: 'USDT', fn: fromNet('USDT'), ta: S.base, tn: toNet(S.base) } : { fa: S.base, fn: fromNet(S.base), ta: 'USDT', tn: toNet('USDT') };
  }
  function paintOrderEst(){
    const el = document.getElementById('tr-est'); if (!el) return;
    const a = num(S.amt), p = px(S.base);
    el.textContent = a > 0 && p ? tf('tr.est', { v: S.side === 'BUY' ? omxQty(a / p, S.base) : omxQty(a * p, 'USDT') }) : '';
  }
  function renderSpot(){
    const b = S.base, k = OMXMarket.get(b), L = spotLegs(), av = avail(L.fa, L.fn), buy = S.side === 'BUY';
    const tfs = Object.keys(TFS).map(x => '<button class="chip" data-tr-tf="' + x + '" aria-pressed="' + (S.tf === x) + '">' + x + '</button>').join('');
    return top(t('tr.spot'), false) + '<div class="screen-body omx-page tr-page" id="tr-spot">' +
      '<section class="tr-pairbar"><button class="tr-pairbtn w-press" data-tr="pair" aria-haspopup="dialog">' + omxLogo(b, 30) + '<b class="ltr">' + escapeHtml(b) + '/USDT</b>' + icon('chevron-down', 18) + '</button>' +
        '<span class="tr-status" id="tr-status" aria-live="polite">' + statusHtml() + '</span></section>' +
      '<section class="tr-head"><div><b id="tr-px" class="tr-px ltr">' + fmtP(M.last || (k && k.price)) + '</b><small id="tr-pxu" class="ltr"></small></div>' +
        '<span id="tr-chg" class="tr-chg ltr' + (k && k.pct != null ? (k.pct >= 0 ? ' up' : ' down') : '') + '">' + (k ? omxPct(k.pct) : '—') + '</span></section>' +
      '<section class="omx-card tr-stats" id="tr-stats">' + (k ? stat(t('tr.h24'), fmtP(k.high)) + stat(t('tr.l24'), fmtP(k.low)) + stat(t('tr.v24'), k.qvol ? compact(k.qvol) : '—') : '') + '</section>' +
      '<div class="chips tr-tfs" role="group">' + tfs + '</div>' +
      '<section class="omx-card tr-chart"><canvas id="tr-cv" role="img" aria-label="' + escapeHtml(b) + '/USDT"></canvas><div id="tr-ohlc" class="tr-ohlc ltr"></div></section>' +
      '<div class="tr-two">' +
        '<section class="omx-card tr-order"><div class="tr-side" role="group"><button data-tr-side="BUY" class="' + (buy ? 'on buy' : '') + '" aria-pressed="' + buy + '">' + escapeHtml(t('tr.buy')) + '</button>' +
          '<button data-tr-side="SELL" class="' + (!buy ? 'on sell' : '') + '" aria-pressed="' + !buy + '">' + escapeHtml(t('tr.sell')) + '</button></div>' +
          '<p class="tr-kind">' + escapeHtml(t('tr.market')) + '</p>' +
          '<label class="tr-lbl" for="tr-amt">' + escapeHtml(t(buy ? 'tr.spend' : 'tr.sellQ')) + '</label>' +
          '<div class="tr-field"><input id="tr-amt" class="ltr" inputmode="decimal" autocomplete="off" placeholder="0" value="' + escapeHtml(S.amt) + '"><span>' + escapeHtml(L.fa) + '</span></div>' +
          '<div class="tr-pcts">' + [25, 50, 75, 100].map(p => '<button data-tr-pct="' + p + '">' + p + '%</button>').join('') + '</div>' +
          '<small class="tr-av ltr">' + escapeHtml(tf('tr.avail', { v: omxQty(av, L.fa) })) + '</small><small class="tr-est ltr" id="tr-est"></small>' +
          '<button class="btn ' + (buy ? 'tr-buy' : 'tr-sell') + ' btn-block" id="tr-go">' + escapeHtml(tf(buy ? 'tr.buyX' : 'tr.sellX', { a: b })) + '</button>' +
          '<p class="tr-note">' + escapeHtml(t('tr.marketInfo')) + '</p></section>' +
        '<section class="omx-card tr-bookc"><h3>' + escapeHtml(t('tr.book')) + '</h3><div id="tr-book" class="tr-book"></div></section>' +
      '</div>' +
      '<section class="omx-card tr-tradesc"><h3>' + escapeHtml(t('tr.trades')) + '</h3><div id="tr-trades" class="tr-trades"></div></section>' +
      '<p class="omx-info">' + icon('info', 18) + '<span>' + escapeHtml(t('tr.risk') + ' ' + t('tr.data')) + '</span></p></div>';
  }

  /* ---------- Swap ---------- */
  function swapRate(){ const a = px(S.sw.from), b = px(S.sw.to); return a && b ? a / b : null; }
  function renderSwap(){
    const s = S.sw, fn = fromNet(s.from), tn = toNet(s.to), av = avail(s.from, fn), r = swapRate(), a = num(s.amt);
    const out = a > 0 && r ? cut8(a * r) : null;
    const assetBtn = (which, sym, net) => '<button class="tr-asset w-press" data-tr="pick-' + which + '" aria-haspopup="dialog">' + omxLogo(sym, 32) + '<span><b>' + escapeHtml(sym) + '</b><small>' + escapeHtml((OMX_NETWORKS[net] || { name: net }).name) + '</small></span>' + icon('chevron-down', 16) + '</button>';
    const det = (k2, v) => '<div><dt>' + escapeHtml(t(k2)) + '</dt><dd>' + escapeHtml(v) + '</dd></div>';
    /* 14.7.0 — « Convert » of the owner's reference image: you pay / you get, a dark round swap button, « Preview conversion » and a keypad.
       The flow behind it is unchanged (server price for 30 s, review, PIN, « In progress » until the administrator confirms). On a phone the
       keypad replaces the system keyboard (inputmode none); a computer keyboard still types into the field. */
    const fa = omxAsset(s.from), keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
    return top(tf('lt.convertT', { a: fa ? fa.name : s.from }), false) + '<div class="screen-body omx-page tr-page lt-conv" id="tr-swap">' +
      '<p class="lt-convbal ltr">' + escapeHtml(tf('lt.bal', { v: omxQty(av, s.from) })) + '</p>' +
      '<section class="omx-card tr-sw"><label class="tr-lbl" for="sw-amt">↑ ' + escapeHtml(t('lt.pay')) + '</label><div class="tr-swr">' + assetBtn('from', s.from, fn) +
        '<input id="sw-amt" class="tr-amt ltr" inputmode="none" autocomplete="off" placeholder="0" value="' + escapeHtml(s.amt) + '"></div>' +
        '<div class="tr-swm"><span class="ltr">' + escapeHtml(tf('tr.avail', { v: omxQty(av, s.from) })) + '</span><button class="tr-max" data-tr="max">' + escapeHtml(t('tr.max')) + '</button></div></section>' +
      '<div class="tr-flipw"><button class="tr-flip w-press" data-tr="flip" aria-label="' + escapeHtml(t('tr.flip')) + '">' + icon('swap', 24) + '</button></div>' +
      '<section class="omx-card tr-sw"><span class="tr-lbl">↓ ' + escapeHtml(t('lt.get')) + '</span><div class="tr-swr">' + assetBtn('to', s.to, tn) +
        '<b id="sw-out" class="tr-out ltr">' + (out != null ? escapeHtml(fmtQ(out)) : '—') + '</b></div>' +
        '<div class="tr-swm"><span id="sw-rate" class="ltr">' + (r ? escapeHtml(t('tr.rateL') + ' ' + rateTxt(s.from, s.to, r, true)) : '—') + '</span><span class="tr-status sm" id="sw-live">' + liveDot() + '</span></div></section>' +
      '<dl class="omx-card tr-det">' + det('tr.fee', '0 ' + s.from) + det('tr.priceL', t('tr.priceV')) + det('tr.follow', t('tr.followV')) + det('tr.src', 'Binance') + '</dl>' +
      '<button class="btn btn-primary btn-block" id="sw-go"><span>' + escapeHtml(t('lt.preview')) + '</span></button>' +
      '<div class="lt-keys" role="group" aria-label="' + escapeHtml(t('lt.keypad')) + '">' + keys.map(k => '<button type="button" class="lt-key" data-tr="key" data-k="' + k + '"' + (k === 'del' ? ' aria-label="' + escapeHtml(t('lt.del')) + '"' : '') + '>' + (k === 'del' ? '⌫' : k) + '</button>').join('') + '</div>' +
      '<p class="omx-info">' + icon('shield', 18) + '<span>' + escapeHtml(t('tr.rule')) + '</span></p></div>';
  }
  function liveDot(){ const st = OMXMarket.status(); return st.state === 'live' ? '<span class="tr-dot live"></span>' + escapeHtml(t('tr.live')) : st.lastSync ? '<span class="tr-dot"></span>' + escapeHtml(tf('tr.delayed', { t: hhmm(st.lastSync) })) : '<span class="tr-dot wait"></span>' + escapeHtml(t('tr.connecting')); }
  function paintSwapLive(){
    if (R.current() !== 'exchange') return;
    const s = S.sw, r = swapRate(), a = num(s.amt), o = document.getElementById('sw-out'), rt = document.getElementById('sw-rate'), lv = document.getElementById('sw-live');
    if (o){ const v = a > 0 && r ? fmtQ(cut8(a * r)) : '—'; if (o.textContent !== v){ o.textContent = v; flash(o); } }
    if (rt) rt.textContent = r ? t('tr.rateL') + ' ' + rateTxt(s.from, s.to, r, true) : '—';
    if (lv) lv.innerHTML = liveDot();
  }

  /* ---------- pickers ---------- */
  function pickAsset(title, list, onPick){
    const close = R.overlay.open('<div class="omx-sheet tr-sheet"><h2>' + escapeHtml(title) + '</h2><div class="omx-nets">' + list.map(x => {
      const k = OMXMarket.get(x.sym);
      return '<button type="button" class="omx-net pick" data-sym="' + x.sym + '">' + omxLogo(x.sym, 34) + '<span class="omx-nt"><b>' + escapeHtml(x.label || x.sym) + '</b><small class="ltr">' + escapeHtml(x.sub || '') + '</small></span>' +
        (k && x.showPx !== false ? '<span class="tr-pk ltr"><b>' + escapeHtml(fmtP(x.sym === 'USDT' ? 1 : k.price)) + '</b><small class="' + (k.pct >= 0 ? 'up' : 'down') + '">' + escapeHtml(omxPct(k.pct)) + '</small></span>' : '') + '</button>'; }).join('') + '</div></div>');
    setTimeout(() => { document.querySelectorAll('.tr-sheet [data-sym]').forEach(b => { b.onclick = () => { close(); onPick(b.getAttribute('data-sym')); }; }); }, 40);
  }
  const nameOf = s => (omxAsset(s) || { name: s }).name;
  function pickPair(){ pickAsset(t('tr.pick'), PAIRS.map(s => ({ sym: s, label: s + '/USDT', sub: nameOf(s) })), s => { S.base = s; S.amt = ''; R.go('spot', { force: true }); }); }
  function pickSwap(which){
    const s = S.sw, other = which === 'from' ? s.to : s.from;
    const list = SUP.filter(x => x !== other).map(x => { const n = which === 'from' ? fromNet(x) : toNet(x); return { sym: x, label: x, sub: which === 'from' ? tf('tr.avail', { v: omxQty(avail(x, n), x) }) : nameOf(x) }; });
    pickAsset(t('tr.pickA'), list, x => { if (which === 'from') s.from = x; else s.to = x; if (s.from === s.to) s.to = s.from === 'USDT' ? 'BTC' : 'USDT'; R.go('exchange', { force: true }); });
  }

  /* ---------- quote → review → execute ---------- */
  const isNetErr = e => { const m = String(e && e.message || e || ''); return /Failed to fetch|NetworkError|network|timeout|aborted|Load failed/i.test(m) && !/[a-z]+_[a-z_]+/.test(m); };
  function errCode(e){
    const m = String((e && (e.code === 'PGRST202' ? 'server_off' : e.message)) || e || '');
    if (/could not find the function|PGRST202|function .* does not exist/i.test(m)) return 'server_off';
    const k = (m.match(/[a-z]+(?:_[a-z]+)+/) || [m])[0];
    return TR.en['tr.e.' + k] ? k : 'unknown';
  }
  async function getQuote(p){
    if (navigator.onLine === false) throw 'offline';
    let res; try { res = await sb.functions.invoke('crypto-swap', { body: p }); } catch(e){ throw isNetErr(e) ? 'price_unavailable' : 'unknown'; }
    const { data, error } = res || {};
    if (error){
      let code = '';
      try { const ctx = error.context; if (ctx && ctx.status === 404) code = 'server_off'; else if (ctx && typeof ctx.json === 'function'){ const j = await ctx.json(); code = j && j.error; } } catch(x){}
      if (!code && /not.?found|404/i.test(String(error.message || ''))) code = 'server_off';
      throw code || (isNetErr(error) ? 'price_unavailable' : 'unknown');
    }
    if (!data || data.ok === false || !data.quote) throw (data && data.error) || 'unknown';
    const q = data.quote;
    return { id: q.id, fa: q.from_asset, fn: q.from_network, ta: q.to_asset, tn: q.to_network, fAmt: Number(q.from_amount), tAmt: Number(q.to_amount), price: Number(q.price),
      src: q.source, side: q.side || null, exp: Date.parse(q.expires_at) || (Date.now() + TTL * 1000), idem: uuid() };
  }
  async function ask(btn, p, back){
    if (btn.__busy) return; btn.__busy = true; UIKit.loading(btn, true);
    try { S.quote = await getQuote(p); S.back = back; R.go('trade-review'); }
    catch(c){ const k = TR.en['tr.e.' + c] ? c : 'unknown'; toast(t('tr.e.' + k), 'error'); try { UIKit.haptic('error'); } catch(x){} }
    finally { btn.__busy = false; UIKit.loading(btn, false); }
  }
  function validAmount(a, sym, net){
    if (!(a > 0)) return 'invalid_amount';
    if (a > avail(sym, net) + 1e-12) return 'insufficient_balance';
    return '';
  }
  function renderReview(){
    const q = S.quote; if (!q){ setTimeout(() => R.go('exchange', { replace: true }), 0); return ''; }
    const left = Math.max(0, Math.ceil((q.exp - Date.now()) / 1000)), exp = left <= 0;
    const line = (a, b) => '<div><dt>' + escapeHtml(a) + '</dt><dd class="ltr" dir="auto">' + b + '</dd></div>';
    return top(t('tr.review')) + '<div class="screen-body omx-page tr-page"><section class="omx-card tr-rv">' +
        '<div class="tr-rv-leg"><small>' + escapeHtml(t('tr.pay')) + '</small><b class="ltr">' + omxLogo(q.fa, 30) + escapeHtml(omxQty(q.fAmt, q.fa)) + '</b></div>' +
        '<div class="tr-rv-arrow" aria-hidden="true">' + icon('arrow-down', 20) + '</div>' +
        '<div class="tr-rv-leg"><small>' + escapeHtml(t('tr.get')) + '</small><b class="ltr">' + omxLogo(q.ta, 30) + escapeHtml(omxQty(q.tAmt, q.ta)) + '</b></div>' +
        '<dl class="wd-sum">' + line(t('tr.priceL'), escapeHtml(rateTxt(q.fa, q.ta, q.price))) + line(t('tr.fee'), escapeHtml('0 ' + q.fa)) +
          line(t('wd.network'), escapeHtml((OMX_NETWORKS[q.fn] || { name: q.fn }).name + ' → ' + (OMX_NETWORKS[q.tn] || { name: q.tn }).name)) + line(t('tr.src'), escapeHtml(srcTxt(q.src))) + '</dl>' +
        '<div class="tr-ttl' + (exp ? ' exp' : '') + '" id="tr-ttl" role="timer"><svg viewBox="0 0 36 36" width="34" height="34" aria-hidden="true"><circle cx="18" cy="18" r="15" class="bg"/><circle cx="18" cy="18" r="15" class="fg" pathLength="100" style="stroke-dashoffset:' + (100 - left / TTL * 100).toFixed(1) + '"/></svg>' +
          '<span>' + escapeHtml(exp ? t('tr.expired') : tf('tr.valid', { s: left })) + '</span></div></section>' +
      '<p class="omx-info">' + icon('shield', 18) + '<span>' + escapeHtml(t('tr.rule')) + '</span></p>' +
      (exp ? '<button class="btn btn-secondary btn-block" id="tr-requote">' + icon('refresh', 18) + '<span>' + escapeHtml(t('tr.refresh')) + '</span></button>'
           : '<button class="btn btn-primary btn-block" id="tr-confirm">' + icon('lock', 18) + '<span>' + escapeHtml(t('tr.confirm')) + '</span></button>') + '</div>';
  }
  async function execute(btn){
    const q = S.quote; if (!q || q.busy) return;
    if (Date.now() >= q.exp){ R.go('trade-review', { force: true }); return; }
    if (navigator.onLine === false){ toast(t('tr.e.offline'), 'error'); return; }
    q.busy = true; UIKit.loading(btn, true);
    const pin = await PinEngine.authorize();
    if (!pin.ok){ q.busy = false; UIKit.loading(btn, false); if (pin.error) toast(t(pin.error), 'error'); return; }
    if (Date.now() >= q.exp){ q.busy = false; UIKit.loading(btn, false); toast(t('tr.e.quote_expired'), 'error'); R.go('trade-review', { force: true }); return; }
    S.done = { submitting: true, q }; R.go('trade-done', { reset: true });
    let res; try { res = await sb.rpc('swap_execute', { p_quote: q.id, p_idempotency_key: q.idem, p_pin_grant: pin.grant }); } catch(e){ res = { error: e }; }
    q.busy = false;
    if (res.error || !res.data || res.data.ok === false){
      const e = res.error || (res.data && res.data.error) || 'unknown';
      S.done = { q, error: isNetErr(e) ? t('tr.e.uncertain') : t('tr.e.' + errCode(e)), uncertain: isNetErr(e) };
    } else {
      S.done = { q, id: res.data.transaction_id, reference: res.data.reference, status: String(res.data.status || 'PENDING').toUpperCase() };
      S.quote = null; S.amt = ''; S.sw.amt = '';
      try { await AuthEngine.hydrateRuntime(); } catch(e){}
    }
    if (R.current() === 'trade-done') R.go('trade-done', { force: true });
  }
  /* the REAL status of the operation, read from the account's transactions; a normal user sees only « En cours » until it is decided */
  function liveStatus(){
    const d = S.done; if (!d || !d.id) return d && d.status;
    const tx = (Runtime.transactions || []).find(x => x.id === d.id); if (!tx) return d.status;
    const s = String(tx.status || '').toUpperCase();
    return s === 'SUCCESS' || s === 'CONFIRMED' ? 'CONFIRMED' : s === 'REJECTED' || s === 'REFUNDED' ? 'REJECTED' : 'PENDING';
  }
  function renderDone(){
    const d = S.done; if (!d){ setTimeout(() => R.go('exchange', { replace: true }), 0); return ''; }
    const q = d.q || {}, st = d.submitting ? 'SUBMIT' : d.error ? 'FAILED' : liveStatus(), fail = st === 'REJECTED' || st === 'FAILED';
    const k = { SUBMIT: 'prep', PENDING: 'wait', CONFIRMED: 'done', REJECTED: 'fail', FAILED: 'fail' }[st] || 'wait';
    const g = { prep: '<circle class="a-ring" cx="40" cy="40" r="30"/>', wait: '<circle class="a-face" cx="40" cy="40" r="30"/><path class="a-hand" d="M40 40V22"/><path class="a-hand2" d="M40 40h12"/>',
      done: '<circle class="a-face ok" cx="40" cy="40" r="30"/><path class="a-check" pathLength="1" d="M27 41l9 9 18-20"/>', fail: '<circle class="a-face ko" cx="40" cy="40" r="30"/><path class="a-x" pathLength="1" d="M29 29l22 22M51 29L29 51"/>' }[k];
    const at = { SUBMIT: 0, PENDING: 1, CONFIRMED: 3 }[st];
    const steps = ['tr.st.rec', 'tr.st.wait', 'tr.st.done'].map((s, i) => {
      let c = 'todo'; if (fail) c = i === 0 && st === 'REJECTED' ? 'ok' : i === (st === 'REJECTED' ? 1 : 0) ? 'ko' : 'todo'; else if (at != null) c = i < at ? 'ok' : i === at ? 'now' : 'todo';
      return '<li class="wd-step ' + c + '"' + (c === 'now' ? ' aria-current="step"' : '') + '><i aria-hidden="true"></i><span>' + escapeHtml(t(s)) + '</span></li>'; }).join('');
    const legs = q.fa ? escapeHtml(omxQty(q.fAmt, q.fa)) + ' → ' + escapeHtml(omxQty(q.tAmt, q.ta)) : '';
    return top(t('tr.swap'), false) + '<div class="screen-body omx-page wd-track"><section class="omx-card wd-hero s-' + (st === 'CONFIRMED' ? 'success' : fail ? 'failed' : 'pending') + '" aria-live="polite">' +
        '<div class="wd-anim k-' + k + '" aria-hidden="true"><svg viewBox="0 0 80 80" width="96" height="96">' + g + '</svg></div><div class="wd-hamt ltr">' + legs + '</div><b>' + escapeHtml(t('tr.s.' + st)) + '</b>' +
        (d.error ? '<p class="wd-msg">' + escapeHtml(d.error) + '</p>' : '') + '</section>' +
      (d.uncertain ? '' : '<ol class="wd-steps si-steps">' + steps + '</ol>') +
      (d.reference ? '<section class="omx-card"><dl class="wd-sum"><div><dt>' + escapeHtml(t('wd.ref')) + '</dt><dd class="ltr">' + escapeHtml(d.reference) + '</dd></div></dl></section>' : '') +
      '<div class="omx-btns">' + (d.error && !d.uncertain ? '<button class="btn btn-secondary" data-tr="again">' + escapeHtml(t('tr.again')) + '</button>' : '') +
        '<button class="btn btn-primary" data-tr="done">' + escapeHtml(t('tr.home')) + '</button></div></div>';
  }

  /* ---------- wiring ---------- */
  let ttlT = 0, pollT = 0;
  function bind(info){
    const id = info.id, el = info.el;
    if (id !== 'spot') close();
    clearInterval(ttlT);
    if (['spot', 'exchange', 'trade-review', 'trade-done'].indexOf(id) === -1) return;
    OMXMarket.start();
    if (id === 'spot'){
      open();
      const a = el.querySelector('#tr-amt'); if (a) a.oninput = () => { S.amt = a.value; paintOrderEst(); };
      const cv = el.querySelector('#tr-cv');
      if (cv){
        const hov = e => { const r = cv.getBoundingClientRect(), n = M.candles.length; if (!n) return; const cw = (r.width - 64 - 8) / n; hoverI = Math.max(0, Math.min(n - 1, Math.floor((e.clientX - r.left - 4) / cw))); drawChart(); };
        cv.addEventListener('pointermove', hov); cv.addEventListener('pointerdown', hov);
        cv.addEventListener('pointerleave', () => { hoverI = -1; const o = document.getElementById('tr-ohlc'); if (o) o.textContent = ''; drawChart(); });
      }
      cvW = 0;
      let ro = null;
      if (cv && typeof ResizeObserver !== 'undefined'){
        ro = new ResizeObserver(es => { const w = Math.round(es[0].contentRect.width); if (w > 0 && w !== cvW){ cvW = w; paint('chart'); } });
        ro.observe(cv.parentElement);
      }
      const onR = () => { if (!ro){ cvW = 0; paint('chart'); } };
      const onVis = () => { if (document.visibilityState === 'hidden') pause(); else resume(); };
      window.addEventListener('resize', onR); document.addEventListener('visibilitychange', onVis);
      R.onLeave(() => { window.removeEventListener('resize', onR); document.removeEventListener('visibilitychange', onVis); if (ro) ro.disconnect(); cvW = 0; close(); });
    }
    if (id === 'exchange'){ const a = el.querySelector('#sw-amt'); if (a) a.oninput = () => { S.sw.amt = a.value; paintSwapLive(); }; }
    if (id === 'trade-review'){
      const q = S.quote;
      if (q && Date.now() < q.exp){
        ttlT = setInterval(() => {
          const x = document.getElementById('tr-ttl'); if (!x || !S.quote){ clearInterval(ttlT); return; }
          const left = Math.max(0, Math.ceil((S.quote.exp - Date.now()) / 1000));
          if (left <= 0){ clearInterval(ttlT); R.go('trade-review', { force: true }); return; }
          const fg = x.querySelector('.fg'); if (fg) fg.style.strokeDashoffset = (100 - left / TTL * 100).toFixed(1);
          const sp = x.querySelector('span'); if (sp) sp.textContent = tf('tr.valid', { s: left });
        }, 500);
        R.onLeave(() => clearInterval(ttlT));
      }
      const c = el.querySelector('#tr-confirm'); if (c) c.onclick = () => execute(c);
      const rq = el.querySelector('#tr-requote');
      if (rq) rq.onclick = () => { const o = S.quote; if (!o) return; ask(rq, { from_asset: o.fa, from_network: o.fn, to_asset: o.ta, to_network: o.tn, from_amount: o.fAmt, side: o.side }, S.back).then(() => { if (R.current() === 'trade-review') R.go('trade-review', { force: true }); }); };
    }
    if (id === 'trade-done'){
      clearInterval(pollT);
      if (S.done && S.done.id && liveStatus() === 'PENDING'){
        pollT = setInterval(async () => {
          if (document.visibilityState === 'hidden' || R.current() !== 'trade-done') return;
          const before = liveStatus(); try { await AuthEngine.hydrateRuntime(); } catch(e){ return; }
          if (liveStatus() !== before && R.current() === 'trade-done') R.go('trade-done', { force: true });
        }, 5000);
        R.onLeave(() => clearInterval(pollT));
      }
    }
    if (el.__tr) return; el.__tr = true;
    el.addEventListener('click', e => {
      const q = sel => e.target.closest && e.target.closest(sel);
      const tfb = q('[data-tr-tf]'); if (tfb){ S.tf = tfb.getAttribute('data-tr-tf'); el.querySelectorAll('[data-tr-tf]').forEach(c => c.setAttribute('aria-pressed', c === tfb ? 'true' : 'false')); open(); return; }
      const sd = q('[data-tr-side]'); if (sd){ const v = sd.getAttribute('data-tr-side'); if (v !== S.side){ S.side = v; S.amt = ''; R.go('spot', { force: true }); } return; }
      const pc = q('[data-tr-pct]'); if (pc){ const L = spotLegs(), av = avail(L.fa, L.fn), p = Number(pc.getAttribute('data-tr-pct')); S.amt = av > 0 ? String(cut8(av * p / 100)) : ''; const a = el.querySelector('#tr-amt'); if (a) a.value = S.amt; paintOrderEst(); return; }
      const b = q('[data-tr]'), go = q('#tr-go,#sw-go');
      if (go && go.id === 'tr-go'){
        const L = spotLegs(), a = num(S.amt), bad = validAmount(a, L.fa, L.fn);
        if (bad){ toast(t('tr.e.' + bad), 'error'); return; }
        ask(go, { from_asset: L.fa, from_network: L.fn, to_asset: L.ta, to_network: L.tn, from_amount: cut8(a), side: S.side }, 'spot'); return;
      }
      if (go && go.id === 'sw-go'){
        const s = S.sw, fn = fromNet(s.from), a = num(s.amt), bad = validAmount(a, s.from, fn);
        if (bad){ toast(t('tr.e.' + bad), 'error'); return; }
        ask(go, { from_asset: s.from, from_network: fn, to_asset: s.to, to_network: toNet(s.to), from_amount: cut8(a), side: null }, 'exchange'); return;
      }
      if (!b) return;
      const a = b.getAttribute('data-tr');
      if (a === 'pair') pickPair();
      else if (a === 'pick-from') pickSwap('from');
      else if (a === 'pick-to') pickSwap('to');
      else if (a === 'key'){
        const k = b.getAttribute('data-k'), i = el.querySelector('#sw-amt'); let v = S.sw.amt || '';
        if (k === 'del') v = v.slice(0, -1);
        else if (k === '.') v = v.indexOf('.') !== -1 ? v : (v ? v + '.' : '0.');
        else { const n = v === '0' ? k : v + k; const dec = n.indexOf('.') === -1 ? '' : n.split('.')[1]; if (n.length <= 18 && dec.length <= 8) v = n; }
        S.sw.amt = v; if (i) i.value = v; paintSwapLive();
      }
      else if (a === 'max'){ const s = S.sw, v = avail(s.from, fromNet(s.from)); s.amt = v > 0 ? String(cut8(v)) : ''; const i = el.querySelector('#sw-amt'); if (i) i.value = s.amt; paintSwapLive(); }
      else if (a === 'flip'){ const s = S.sw, x = s.from; s.from = s.to; s.to = x; s.amt = ''; if (!reduced()) b.classList.add('spin'); setTimeout(() => R.go('exchange', { force: true }), reduced() ? 0 : 260); }
      else if (a === 'done'){ S.done = null; R.go(S.back === 'spot' ? 'spot' : 'exchange', { reset: true }); }
      else if (a === 'again'){ S.done = null; R.go(S.back === 'spot' ? 'spot' : 'exchange'); }
    });
  }
  function init(){
    R.register({ spot: renderSpot, exchange: renderSwap, 'trade-review': renderReview, 'trade-done': renderDone });
    R.on(info => { try { bind(info); } catch(e){ console.error('[trade]', e); } });
    OMXMarket.on(() => { try { if (R.current() === 'exchange') paintSwapLive(); else if (R.current() === 'spot') paint('price'); } catch(e){ console.error('[trade] live', e); } });
  }
  init();
  return { state: S, market: M };
})();
