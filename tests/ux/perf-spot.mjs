/* Coût du marché en direct (écran Spot) sur un marché très actif : le flux local envoie ~190 messages par seconde (transactions,
   carnet, bougie), comme BTC/USDT aux heures chargées. Mesures Chrome (CDP Performance) sur 6 s, médiane de N passages :
   temps de script, temps des tâches, nombre de mises en page et de recalculs de style, images peintes.
   usage: node tests/ux/perf-spot.mjs [N]        (sert la version livrée : index.html -> js/app.js, css/app.css) */
import { serve, launch, openApp } from './harness.mjs';
const N = Number(process.argv[2] || 3);
const med = a => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const { srv, url } = await serve(); const browser = await launch();
const runs = [];
for (let i = 0; i < N; i++){
  const { ctx, page } = await openApp(browser, url, { lang: 'fr', settle: 900, ws: 'live', wsRate: 16 });
  await page.click('#bottom-nav [data-nav="spot"]'); await page.waitForTimeout(2500);
  const c = await ctx.newCDPSession(page); await c.send('Performance.enable');
  const get = async () => Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  await page.evaluate(() => { window.__frames = 0; const f = () => { window.__frames++; window.__raf = requestAnimationFrame(f); }; f(); });
  const a = await get(); await page.waitForTimeout(6000); const b = await get();
  const frames = await page.evaluate(() => { cancelAnimationFrame(window.__raf); return window.__frames; });
  const px = await page.locator('#tr-px').innerText();
  runs.push({ scriptMs: (b.ScriptDuration - a.ScriptDuration) * 1000, taskMs: (b.TaskDuration - a.TaskDuration) * 1000,
    layouts: b.LayoutCount - a.LayoutCount, styles: b.RecalcStyleCount - a.RecalcStyleCount, frames, px });
  await ctx.close();
}
await browser.close(); srv.close();
const pick = k => Math.round(med(runs.map(r => r[k])));
console.log(JSON.stringify({ runs: N, window_s: 6, scriptMs: pick('scriptMs'), taskMs: pick('taskMs'), layouts: pick('layouts'), styleRecalcs: pick('styles'), frames: pick('frames'), lastPrice: runs[0].px }));
