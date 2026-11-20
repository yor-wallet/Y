/* usage: node tests/ux/shot.mjs <dossier-sortie> [etiquette] — captures de référence des écrans principaux */
import path from 'node:path';
import fs from 'node:fs';
import { serve, launch, openApp } from './harness.mjs';
const out = process.argv[2] || '/tmp/shots', tag = process.argv[3] || 'a';
fs.mkdirSync(out, { recursive: true });
const { srv, url } = await serve(); const browser = await launch();
const variants = [{ n: 'light-en', theme: 'light', lang: 'en' }, { n: 'dark-en', theme: 'dark', lang: 'en', scheme: 'dark' }, { n: 'light-ar', theme: 'light', lang: 'ar' }];
const screens = ['home', 'history', 'profile', 'settings', 'receive', 'cards', 'notifications', 'services', 'country-select'];
for (const v of variants){
  const { ctx, page, logs } = await openApp(browser, url, Object.assign({ scale: 2 }, v));
  for (const s of screens){
    await page.evaluate(id => R.go(id, { force: true }), s); await page.waitForTimeout(1300);
    await page.screenshot({ path: path.join(out, `${tag}-${v.n}-${s}.png`) });
  }
  console.log(v.n, 'errors:', logs.length ? logs.slice(0, 5) : 'none');
  await ctx.close();
}
await browser.close(); srv.close();
