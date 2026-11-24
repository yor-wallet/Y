/* Banc d'essai UX : sert l'application depuis le dossier du dépôt, remplace le client Supabase du CDN par un faux client,
   ouvre l'accueil (code saisi au clavier) et fournit des captures. Aucun réseau externe n'est contacté. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROOT_APP = ROOT;
const MOCK = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'mock-supabase.js'), 'utf8');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.txt': 'text/plain' };

/* The production Content-Security-Policy (vercel.json) is applied to every page the tests open: a script, style or request it would refuse shows up as a console error. */
/* Binance public market data, answered locally with fixed, recognisable test values (the tests never reach the internet). opts.market: 'ok' (default) | 'down' */
const MK = { BTCUSDT: [97000, 95000], ETHUSDT: [3500, 3600], USDCUSDT: [1.0002, 1.0001], BNBUSDT: [690, 680], SOLUSDT: [210, 200], TRXUSDT: [0.25, 0.24], XRPUSDT: [2.4, 2.5],
  LTCUSDT: [110, 105], DOGEUSDT: [0.38, 0.4], ADAUSDT: [1.05, 1], AVAXUSDT: [42, 40], POLUSDT: [0.55, 0.5] };
function binance(u){
  const q = new URL(u);
  if (/\/ticker\/24hr/.test(q.pathname)){
    const syms = JSON.parse(q.searchParams.get('symbols') || '[]');
    return syms.filter(s => MK[s]).map(s => ({ symbol: s, lastPrice: String(MK[s][0]), openPrice: String(MK[s][1]), highPrice: String(MK[s][0] * 1.02), lowPrice: String(MK[s][1] * 0.98), volume: '1000', quoteVolume: String(MK[s][0] * 1000) }));
  }
  if (/\/klines/.test(q.pathname)){
    const s = q.searchParams.get('symbol'), n = Number(q.searchParams.get('limit') || 24), m = MK[s] || [1, 1], t0 = Date.UTC(2026, 10, 20);
    return Array.from({ length: n }, (_, i) => { const c = m[1] + (m[0] - m[1]) * (i / (n - 1)) + Math.sin(i / 3) * m[0] * 0.004; return [t0 + i * 3600e3, String(c), String(c), String(c), String(c), '1']; });
  }
  if (/\/depth/.test(q.pathname)){
    const m = MK[q.searchParams.get('symbol')] || [1, 1], p = m[0], st = p * 0.0001;
    return { lastUpdateId: 1, bids: Array.from({ length: 10 }, (_, i) => [String(p - st * (i + 1)), String(0.1 + (i % 4) * 0.25)]), asks: Array.from({ length: 10 }, (_, i) => [String(p + st * (i + 1)), String(0.15 + (i % 3) * 0.3)]) };
  }
  if (/\/trades/.test(q.pathname)){
    const m = MK[q.searchParams.get('symbol')] || [1, 1], n = Number(q.searchParams.get('limit') || 16), t0 = Date.UTC(2026, 10, 23, 12);
    return Array.from({ length: n }, (_, i) => ({ id: i, price: String(m[0] * (1 + Math.sin(i) * 0.0002)), qty: String(0.01 * (1 + i % 5)), time: t0 + i * 1500, isBuyerMaker: i % 3 === 0 }));
  }
  return [];
}
const CSP = (() => { try { const h = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).headers[0].headers.find(x => x.key === 'Content-Security-Policy'); return h ? h.value : ''; } catch (e) { return ''; } })();
export function serve(port = 0, root = ROOT_APP, index){
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = index ? '/' + index : (process.env.FP_DEV ? '/index.src.html' : '/index.html');
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); res.end('nf'); return; }
    const hdr = { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' };
    if (CSP && path.extname(f) === '.html') hdr['content-security-policy'] = CSP;
    res.writeHead(200, hdr);
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(port, '127.0.0.1', () => r({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })));
}

/* opts: { theme, lang, emptyTx, signedOut, width, height, reduced, scale, pin } */
export async function openApp(browser, base, opts = {}){
  const ctx = await browser.newContext({
    viewport: { width: opts.width || 390, height: opts.height || 844 }, deviceScaleFactor: opts.scale || 1,
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference', colorScheme: opts.scheme || 'light', locale: opts.lang === 'fr' ? 'fr-FR' : opts.lang === 'ar' ? 'ar-OM' : 'en-US',
    serviceWorkers: 'block', hasTouch: !!opts.touch, isMobile: !!opts.touch
  });
  const page = await ctx.newPage();
  const logs = []; page.on('pageerror', e => logs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error') logs.push('console.error ' + m.text()); });
  await page.addInitScript(() => { document.addEventListener('securitypolicyviolation', e => console.error('CSP violation: ' + e.violatedDirective + ' ' + e.blockedURI)); });
  await page.route('**/*', route => {
    const u = route.request().url();
    /* feature switches are patched into reference-data.js, which only exists as a separate file in the readable page: use that page for this context */
    if (opts.features && (u === base || u === base + 'index.html')){
      return route.fulfill({ status: 200, contentType: 'text/html', headers: CSP ? { 'content-security-policy': CSP } : {}, body: fs.readFileSync(path.join(ROOT, 'index.src.html'), 'utf8') });
    }
    if (opts.features && /\/js\/data\/reference-data\.js$/.test(u)){
      let body = fs.readFileSync(path.join(ROOT, 'js/data/reference-data.js'), 'utf8');
      for (const k of Object.keys(opts.features)) body = body.replace(new RegExp(k + '\\s*:\\s*(true|false)'), k + ': ' + opts.features[k]);
      return route.fulfill({ status: 200, contentType: 'text/javascript', body });
    }
    if (u.startsWith(base)) return route.continue();
    if (/^https:\/\/data-api\.binance\.vision\//.test(u)){
      if (opts.market === 'down') return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(binance(u)) });
    }
    if (/cdn\.jsdelivr\.net.*supabase/.test(u)){
      const fx = JSON.stringify({ theme: opts.theme, lang: opts.lang, emptyTx: !!opts.emptyTx, signedOut: !!opts.signedOut, admin: !!opts.admin, dy: !!opts.dy, dyName: opts.dyName || '', dyFlipOnPin: !!opts.dyFlipOnPin, swapOff: !!opts.swapOff, quoteTtl: opts.quoteTtl || 30 });
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.__FX=' + fx + ';' + MOCK });
    }
    return route.abort();
  });
  /* default: the live stream is refused (the app falls back to polling). opts.ws === 'live': a local stand-in of the Binance stream sends
     trades, a depth snapshot and the current candle a few times a second, so real-time painting can be checked (still no internet).
     opts.wsRate (ms between ticks, default 350): a small value imitates a very busy market (BTC can send dozens of trades a second). */
  try { await page.routeWebSocket(/binance\.vision/, ws => {
    if (opts.ws !== 'live'){ ws.close(); return; }
    const u = ws.url(), pair = ((u.match(/streams=([a-z]+)@/) || [])[1] || 'btcusdt').toUpperCase(), m = MK[pair] || [1, 1];
    let i = 0;
    const tick = setInterval(() => {
      i++; const p = m[0] * (1 + Math.sin(i / 2) * 0.0008), st = m[0] * 0.0001, now = Date.now();
      try {
        if (/@aggTrade/.test(u)) ws.send(JSON.stringify({ stream: pair.toLowerCase() + '@aggTrade', data: { e: 'aggTrade', s: pair, p: String(p), q: String(0.002 * (1 + i % 4)), T: now, m: i % 2 === 0 } }));
        if (/@depth/.test(u)) ws.send(JSON.stringify({ stream: pair.toLowerCase() + '@depth10@1000ms', data: { bids: Array.from({ length: 10 }, (_, k) => [String(p - st * (k + 1)), String(0.1 + ((k + i) % 4) * 0.2)]), asks: Array.from({ length: 10 }, (_, k) => [String(p + st * (k + 1)), String(0.12 + ((k + i) % 3) * 0.25)]) } }));
        if (/@kline/.test(u)) ws.send(JSON.stringify({ stream: pair.toLowerCase() + '@kline_1h', data: { e: 'kline', k: { t: Date.UTC(2026, 10, 20) + 63 * 3600e3, o: String(m[0]), h: String(p * 1.001), l: String(m[0] * 0.999), c: String(p), x: false } } }));
      } catch (e) { clearInterval(tick); }
    }, Math.max(4, Number(opts.wsRate) || 350));
    if (tick.unref) tick.unref();          /* never keeps the test process alive */
    ws.onClose(() => clearInterval(tick)); page.once('close', () => clearInterval(tick));
  }); } catch (e) {}
  await page.addInitScript((o) => { window.__FP_SPLASH_MIN = 50; try { if (o.lang) localStorage.setItem('fp_lang_test', o.lang); if (o.theme) localStorage.setItem('fp_theme', o.theme); } catch (e) {} }, opts);
  if (opts.net){ const c = await ctx.newCDPSession(page); await c.send('Network.enable'); await c.send('Network.emulateNetworkConditions', opts.net); }
  await page.goto(base, { waitUntil: 'load' });
  if (!opts.signedOut && opts.unlock !== false){
    await page.waitForSelector('.yl', { timeout: 15000 });
    for (const k of (opts.pin || '482913')) await page.keyboard.press(k);
    await page.waitForSelector('#home.active', { timeout: 15000 });
    await page.waitForTimeout(opts.settle || 1600);
  }
  return { ctx, page, logs };
}
export async function launch(){ return chromium.launch({ args: ['--no-sandbox'] }); }
