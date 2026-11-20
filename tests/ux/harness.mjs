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
const MOCK = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'mock-supabase.js'), 'utf8');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.txt': 'text/plain' };

/* The production Content-Security-Policy (vercel.json) is applied to every page the tests open: a script, style or request it would refuse shows up as a console error. */
const CSP = (() => { try { const h = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).headers[0].headers.find(x => x.key === 'Content-Security-Policy'); return h ? h.value : ''; } catch (e) { return ''; } })();
export function serve(port = 0){
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); res.end('nf'); return; }
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
    if (opts.features && /\/js\/data\/reference-data\.js$/.test(u)){
      let body = fs.readFileSync(path.join(ROOT, 'js/data/reference-data.js'), 'utf8');
      for (const k of Object.keys(opts.features)) body = body.replace(new RegExp(k + '\\s*:\\s*(true|false)'), k + ': ' + opts.features[k]);
      return route.fulfill({ status: 200, contentType: 'text/javascript', body });
    }
    if (u.startsWith(base)) return route.continue();
    if (/cdn\.jsdelivr\.net.*supabase/.test(u)){
      const fx = JSON.stringify({ theme: opts.theme, lang: opts.lang, emptyTx: !!opts.emptyTx, signedOut: !!opts.signedOut });
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.__FX=' + fx + ';' + MOCK });
    }
    return route.abort();
  });
  await page.addInitScript((o) => { window.__FP_SPLASH_MIN = 50; try { if (o.lang) localStorage.setItem('fp_lang_test', o.lang); if (o.theme) localStorage.setItem('fp_theme', o.theme); } catch (e) {} }, opts);
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
