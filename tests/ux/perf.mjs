/* Mesure de chargement : trois versions servies depuis le même petit serveur statique, même faux client Supabase, même parcours
   (ouverture -> écran de code affiché). Médiane de N passages, sans limitation de débit puis avec « 4G lente » émulée.
   usage: node tests/ux/perf.mjs <dossier-version-12.15.0> [N]      (la version d'origine : git worktree add <dossier> 875e96a) */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { serve, launch, openApp } from './harness.mjs';
const BASE = process.argv[2], N = Number(process.argv[3] || 5);
const med = a => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const MODES = [
  { name: '12.15.0 (zip d\'origine, 68 fichiers)', root: BASE, index: 'index.html' },
  { name: '13.0.0 lisible (68 fichiers)', root: undefined, index: 'index.src.html' },
  { name: '13.0.0 livré (2 bundles minifiés)', root: undefined, index: 'index.html' }
];
const NET = { none: null, slow4g: { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 } };
const browser = await launch();
const rows = [];
for (const m of MODES){
  const { srv, url } = await serve(0, m.root, m.index);
  for (const [netName, net] of Object.entries(NET)){
    const t = [], cpu = [], reqs = []; let bytes = 0, rawBytes = 0;
    for (let i = 0; i < N; i++){
      const { ctx, page } = await openApp(browser, url, { unlock: false, net });   // openApp attend l'écran de code
      await page.waitForSelector('.yl', { timeout: 30000 });
      const r = await page.evaluate(() => performance.now());
      t.push(r); await ctx.close();
    }
    // octets : une passe dédiée (réponses réellement servies, compressées en brotli comme le fait l'hébergeur)
    { const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }); const page = await ctx.newPage();
      const seen = []; page.on('response', async res => { if (res.url().startsWith(url)) { try { const b = await res.body(); seen.push([res.url(), b.length, zlib.brotliCompressSync(b).length]); } catch (e) {} } });
      await page.route('**/*', route => { const u = route.request().url(); if (u.startsWith(url)) return route.continue(); if (/jsdelivr.*supabase/.test(u)) return route.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.supabase={createClient:()=>({auth:{onAuthStateChange(){return{data:{subscription:{}}}}},from(){},rpc(){return Promise.resolve({})}})};' }); return route.abort(); });
      await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(1500);
      const urls = new Set(); for (const [u, raw, br] of seen){ if (urls.has(u)) continue; urls.add(u); rawBytes += raw; bytes += br; } reqs.push(urls.size); await ctx.close(); }
    rows.push({ mode: m.name, net: netName, requests: reqs[0], rawKB: (rawBytes / 1024) | 0, brotliKB: (bytes / 1024) | 0, readyMs: Math.round(med(t)) });
  }
  srv.close();
}
await browser.close();
console.table(rows);
