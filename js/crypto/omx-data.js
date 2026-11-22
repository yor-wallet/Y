'use strict';

/* ============================================================
   OM WALLET 14 — CRYPTO DATA
   - OMX_ASSETS / OMX_NETWORKS : reference data. Logos: assets/crypto (web3icons, MIT, see assets/crypto/LICENSE.txt).
     Token contracts were checked on-chain on 2026-11-22 (symbol + decimals read from each contract / mint).
   - OMXMarket : REAL market data from Binance's public market-data service
       REST  https://data-api.binance.vision/api/v3/ticker/24hr  (snapshot)   ·   /api/v3/klines (charts)
       WS    wss://data-stream.binance.vision/stream?streams=…@miniTicker     (live)
     Prices are quoted in USDT (shown as USD, like Binance does). USDT itself is derived from the USDC/USDT market.
     The state is always visible: 'live' (WebSocket), 'polling' (REST every 20 s), 'offline' (last known values, with their time), 'error'.
     Nothing is ever invented: an asset without a market value shows « — ».
   - OMXChart : SVG charts (sparkline + interactive area chart).
   ============================================================ */
const OMX_ASSETS = [
  { sym: 'BTC',  name: 'Bitcoin',  pair: 'BTCUSDT',  dp: 8, nets: ['bitcoin'] },
  { sym: 'ETH',  name: 'Ethereum', pair: 'ETHUSDT',  dp: 8, nets: ['ethereum', 'arbitrum', 'base'] },
  { sym: 'USDT', name: 'Tether',   pair: null,       dp: 6, nets: ['tron', 'ethereum', 'bsc', 'polygon', 'solana'] },
  { sym: 'USDC', name: 'USD Coin', pair: 'USDCUSDT', dp: 6, nets: ['ethereum', 'bsc', 'polygon', 'solana', 'arbitrum', 'base', 'avalanche'] },
  { sym: 'BNB',  name: 'BNB',      pair: 'BNBUSDT',  dp: 8, nets: ['bsc'] },
  { sym: 'SOL',  name: 'Solana',   pair: 'SOLUSDT',  dp: 8, nets: ['solana'] },
  { sym: 'TRX',  name: 'TRON',     pair: 'TRXUSDT',  dp: 6, nets: ['tron'] },
  { sym: 'XRP',  name: 'XRP',      pair: 'XRPUSDT',  dp: 6, nets: ['xrp'] },
  { sym: 'LTC',  name: 'Litecoin', pair: 'LTCUSDT',  dp: 8, nets: ['litecoin'] },
  { sym: 'DOGE', name: 'Dogecoin', pair: 'DOGEUSDT', dp: 8, nets: [] },
  { sym: 'ADA',  name: 'Cardano',  pair: 'ADAUSDT',  dp: 6, nets: [] },
  { sym: 'AVAX', name: 'Avalanche', pair: 'AVAXUSDT', dp: 8, nets: ['avalanche'] },
  { sym: 'POL',  name: 'Polygon',  pair: 'POLUSDT',  dp: 8, nets: ['polygon'] }
];
const OMX_NETWORKS = {
  bitcoin:   { name: 'Bitcoin',           std: 'BTC',          native: 'BTC',  chain: null,  tx: 'https://mempool.space/tx/{h}' },
  ethereum:  { name: 'Ethereum',          std: 'ERC20',        native: 'ETH',  chain: 1,     tx: 'https://etherscan.io/tx/{h}' },
  bsc:       { name: 'BNB Smart Chain',   std: 'BEP20',        native: 'BNB',  chain: 56,    tx: 'https://bscscan.com/tx/{h}' },
  tron:      { name: 'TRON',              std: 'TRC20',        native: 'TRX',  chain: null,  tx: 'https://tronscan.org/#/transaction/{h}' },
  solana:    { name: 'Solana',            std: 'SPL',          native: 'SOL',  chain: null,  tx: 'https://solscan.io/tx/{h}' },
  polygon:   { name: 'Polygon PoS',       std: 'Polygon',      native: 'POL',  chain: 137,   tx: 'https://polygonscan.com/tx/{h}' },
  arbitrum:  { name: 'Arbitrum One',      std: 'Arbitrum',     native: 'ETH',  chain: 42161, tx: 'https://arbiscan.io/tx/{h}' },
  base:      { name: 'Base',              std: 'Base',         native: 'ETH',  chain: 8453,  tx: 'https://basescan.org/tx/{h}' },
  avalanche: { name: 'Avalanche C-Chain', std: 'C-Chain',      native: 'AVAX', chain: 43114, tx: 'https://snowtrace.io/tx/{h}' },
  xrp:       { name: 'XRP Ledger',        std: 'XRPL',         native: 'XRP',  chain: null,  tx: 'https://xrpscan.com/tx/{h}', memo: true },
  litecoin:  { name: 'Litecoin',          std: 'LTC',          native: 'LTC',  chain: null,  tx: 'https://litecoinspace.org/tx/{h}' }
};
/* token contracts, read on-chain on 2026-11-22 (symbol / decimals) */
const OMX_CONTRACTS = {
  'USDT/ethereum': '0xdAC17F958D2ee523a2206206994597C13D831ec7', 'USDT/bsc': '0x55d398326f99059fF775485246999027B3197955',
  'USDT/polygon': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 'USDT/tron': 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'USDT/solana': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'USDC/ethereum': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 'USDC/bsc': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  'USDC/polygon': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', 'USDC/solana': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
};
const OMX_FIAT_USD = { OMR: 2.6008, AED: 1 / 3.6725 };        /* official pegs: 1 OMR = 2.6008 USD (Central Bank of Oman), 1 USD = 3.6725 AED */
const omxAsset = s => OMX_ASSETS.find(a => a.sym === String(s || '').toUpperCase()) || null;
const omxLogo = (sym, size) => '<img class="omx-logo" src="assets/crypto/tokens/' + escapeHtml(String(sym).toUpperCase()) + '.svg" alt="" width="' + (size || 36) + '" height="' + (size || 36) + '" loading="lazy" decoding="async">';
const omxNetLogo = (id, size) => OMX_NETWORKS[id] ? '<img class="omx-logo net" src="assets/crypto/networks/' + escapeHtml(id) + '.svg" alt="" width="' + (size || 28) + '" height="' + (size || 28) + '" loading="lazy" decoding="async">' : '';
function omxUsd(v, opts){
  const n = Number(v);
  if (!isFinite(n)) return '—';
  const a = Math.abs(n), d = opts && opts.dp != null ? opts.dp : a >= 1000 ? 2 : a >= 1 ? 2 : a >= 0.01 ? 4 : 6;
  return (n < 0 ? '-' : '') + '$' + a.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function omxQty(v, sym){
  const n = Number(v); if (!isFinite(n)) return '—';
  const a = omxAsset(sym), dp = a ? Math.min(a.dp, n >= 1000 ? 2 : n >= 1 ? 4 : 8) : 6;
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: dp }) + ' ' + String(sym || '').toUpperCase();
}
const omxPct = p => !isFinite(Number(p)) ? '—' : (Number(p) >= 0 ? '+' : '−') + Math.abs(Number(p)).toFixed(2) + '%';

const OMXMarket = (() => {
  const REST = 'https://data-api.binance.vision/api/v3', WS = 'wss://data-stream.binance.vision/stream?streams=';
  const PAIRS = OMX_ASSETS.filter(a => a.pair).map(a => a.pair);
  const T = {};                          /* sym -> { price, open, high, low, vol, qvol, pct, at } */
  let state = 'idle', lastSync = 0, ws = null, pollT = 0, retry = 0, started = false, error = '';
  const subs = new Set(), sparks = {}, sparkAt = {};
  const emit = () => subs.forEach(f => { try { f(); } catch(e){ console.error(e); } });
  function setUsdt(){
    const u = T.USDC;
    if (u && u.price > 0) T.USDT = { price: 1 / u.price, open: u.open > 0 ? 1 / u.open : null, high: null, low: null, vol: null, qvol: null, pct: u.open > 0 ? ((1 / u.price) / (1 / u.open) - 1) * 100 : null, at: u.at, derived: true };
  }
  function put(sym, price, open, high, low, vol, qvol, at){
    if (!(price > 0)) return;
    T[sym] = { price, open, high, low, vol, qvol, pct: open > 0 ? (price / open - 1) * 100 : null, at };
  }
  const symOf = pair => { const a = OMX_ASSETS.find(x => x.pair === pair); return a ? a.sym : null; };
  async function snapshot(){
    const url = REST + '/ticker/24hr?symbols=' + encodeURIComponent(JSON.stringify(PAIRS));
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('http ' + r.status);
    const rows = await r.json();
    const now = Date.now();
    (Array.isArray(rows) ? rows : []).forEach(x => { const s = symOf(x.symbol); if (s) put(s, +x.lastPrice, +x.openPrice, +x.highPrice, +x.lowPrice, +x.volume, +x.quoteVolume, now); });
    setUsdt(); lastSync = now; error = '';
  }
  function connect(){
    try { if (ws) ws.close(); } catch(e){}
    if (typeof WebSocket === 'undefined'){ poll(); return; }
    let opened = false;
    try { ws = new WebSocket(WS + PAIRS.map(p => p.toLowerCase() + '@miniTicker').join('/')); } catch(e){ poll(); return; }
    const to = setTimeout(() => { if (!opened){ try { ws.close(); } catch(e){} } }, 8000);
    ws.onopen = () => { opened = true; clearTimeout(to); retry = 0; state = 'live'; clearInterval(pollT); pollT = 0; emit(); };
    ws.onmessage = ev => {
      try {
        const m = JSON.parse(ev.data), d = m && m.data; if (!d || d.e !== '24hrMiniTicker') return;
        const s = symOf(d.s); if (!s) return;
        const prev = T[s] || {};
        put(s, +d.c, +d.o, +d.h, +d.l, +d.v, +d.q, Date.now());
        T[s].dir = prev.price ? (T[s].price > prev.price ? 1 : T[s].price < prev.price ? -1 : 0) : 0;
        if (s === 'USDC') setUsdt();
        lastSync = Date.now(); emitSoon();
      } catch(e){ /* ignore one bad frame */ }
    };
    ws.onclose = () => { clearTimeout(to); ws = null; if (state === 'live') state = 'polling'; poll(); const wait = Math.min(60000, 3000 * Math.pow(2, retry++)); setTimeout(() => { if (document.visibilityState !== 'hidden') connect(); }, wait); emit(); };
    ws.onerror = () => { /* onclose follows */ };
  }
  let emitT = 0;
  function emitSoon(){ if (emitT) return; emitT = setTimeout(() => { emitT = 0; emit(); }, 400); }
  function poll(){
    if (pollT) return;
    if (state !== 'live') state = Object.keys(T).length ? 'polling' : state;
    pollT = setInterval(() => { refresh(); }, 20000);
  }
  async function refresh(){
    try { await snapshot(); if (state !== 'live') state = 'polling'; }
    catch(e){ error = String(e && e.message || e); state = Object.keys(T).length ? 'offline' : 'error'; }
    emit();
  }
  async function start(){
    if (started) return; started = true;
    state = 'connecting'; emit();
    await refresh();
    connect();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && state !== 'live'){ refresh(); connect(); } });
  }
  /* klines: [openTime, open, high, low, close, ...] -> [{t, c}] */
  const PERIODS = { '1H': ['1m', 60], '4H': ['5m', 48], '1D': ['15m', 96], '1W': ['1h', 168], '1M': ['4h', 180], '1Y': ['1d', 365] };
  async function candles(sym, period){
    const a = omxAsset(sym);
    const pair = a && a.pair ? a.pair : sym === 'USDT' ? 'USDCUSDT' : null; if (!pair) throw new Error('no_market');
    const p = PERIODS[period] || PERIODS['1D'];
    const r = await fetch(REST + '/klines?symbol=' + pair + '&interval=' + p[0] + '&limit=' + p[1], { cache: 'no-store' });
    if (!r.ok) throw new Error('http ' + r.status);
    const rows = await r.json();
    return rows.map(k => ({ t: +k[0], c: sym === 'USDT' ? 1 / +k[4] : +k[4] })).filter(x => x.c > 0);
  }
  /* 24 h of hourly closes for the small charts, refreshed at most every 5 minutes */
  async function spark(sym){
    if (sparks[sym] && Date.now() - sparkAt[sym] < 300000) return sparks[sym];
    try { const c = await candles(sym, '1W'); sparks[sym] = c.slice(-24).map(x => x.c); sparkAt[sym] = Date.now(); } catch(e){ sparks[sym] = sparks[sym] || null; }
    return sparks[sym];
  }
  return { start, refresh, candles, spark, PERIODS, get: s => T[String(s || '').toUpperCase()] || null, all: () => T,
    status: () => ({ state, lastSync, error }), on: f => { subs.add(f); return () => subs.delete(f); } };
})();

/* ---------- charts ---------- */
const OMXChart = (() => {
  function path(vals, w, h, pad){
    const mn = Math.min(...vals), mx = Math.max(...vals), span = (mx - mn) || 1, n = vals.length;
    const pts = vals.map((v, i) => [pad + (i / (n - 1 || 1)) * (w - pad * 2), pad + (1 - (v - mn) / span) * (h - pad * 2)]);
    return { d: 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L'), pts, mn, mx };
  }
  function spark(vals, up, w, h){
    w = w || 84; h = h || 30;
    if (!vals || vals.length < 2) return '<span class="omx-spark none" aria-hidden="true"></span>';
    const p = path(vals, w, h, 2);
    return '<svg class="omx-spark ' + (up ? 'up' : 'down') + '" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true"><path pathLength="1" d="' + p.d + '"/></svg>';
  }
  /* interactive area chart: data [{t, c}] ; the finger / pointer shows the value and the time of the point */
  function area(host, data, fmt){
    if (!host) return;
    if (!data || data.length < 2){ host.innerHTML = '<div class="omx-chart-empty">' + escapeHtml(t('omx.noChart')) + '</div>'; return; }
    const w = 360, h = 180, vals = data.map(x => x.c), p = path(vals, w, h, 6), up = vals[vals.length - 1] >= vals[0];
    const id = 'g' + Math.random().toString(36).slice(2, 8);
    host.innerHTML = '<div class="omx-chart ' + (up ? 'up' : 'down') + '"><div class="omx-scrub" aria-live="polite"></div>' +
      '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img" aria-label="' + escapeHtml(t('omx.chartLbl')) + '">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".28"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="omx-area" d="' + p.d + ' L' + (w - 6) + ' ' + h + ' L6 ' + h + ' Z" fill="url(#' + id + ')"/>' +
      '<path class="omx-line" pathLength="1" d="' + p.d + '"/><line class="omx-cross" x1="0" x2="0" y1="0" y2="' + h + '"/><circle class="omx-dot" r="4.5" cx="-10" cy="-10"/></svg></div>';
    const svg = host.querySelector('svg'), dot = host.querySelector('.omx-dot'), cross = host.querySelector('.omx-cross'), lab = host.querySelector('.omx-scrub');
    const show = ev => {
      const r = svg.getBoundingClientRect(), x = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) / r.width * w;
      let i = Math.round((x - 6) / (w - 12) * (data.length - 1)); i = Math.max(0, Math.min(data.length - 1, i));
      const pt = p.pts[i]; dot.setAttribute('cx', pt[0]); dot.setAttribute('cy', pt[1]); cross.setAttribute('x1', pt[0]); cross.setAttribute('x2', pt[0]);
      host.classList.add('scrub');
      lab.innerHTML = '<b class="ltr">' + escapeHtml(fmt(data[i].c)) + '</b><span class="ltr">' + escapeHtml(new Date(data[i].t).toLocaleString(LANG === 'ar' ? 'ar-OM-u-nu-latn' : LANG === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</span>';
    };
    const hide = () => { host.classList.remove('scrub'); lab.innerHTML = ''; dot.setAttribute('cx', -10); };
    svg.addEventListener('pointermove', show); svg.addEventListener('pointerdown', show); svg.addEventListener('pointerleave', hide);
    svg.addEventListener('touchmove', e => { show(e); }, { passive: true }); svg.addEventListener('touchend', hide);
  }
  return { spark, area };
})();
