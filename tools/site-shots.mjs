/* Régénère les captures de la vitrine (welcome/img/{home,markets,spot,swap}-{fr,en,ar}.webp) à partir de l'APPLICATION RÉELLE, telle qu'elle est dessinée
   aujourd'hui (Noir & Jaune), servie par le banc d'essai (faux serveur de test : prénom, montants et cours sont des DONNÉES D'EXEMPLE, ce que la page dit).
   Aucun réseau externe n'est contacté. Lancer depuis la racine du dépôt (Playwright et Pillow requis) :
     NODE_PATH=$(npm root -g) node tools/site-shots.mjs
   Les images sont à 2x (téléphone de 360 × 780 px), réduites à 600 px de large, en WebP. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { serve, launch, openApp } from '../tests/ux/harness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'welcome/img');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'site-shots-'));
const { srv, url } = await serve(); const browser = await launch();
const wait = ms => new Promise(r => setTimeout(r, ms));

const SCREENS = {
  home: async page => { await page.evaluate(() => { try { Runtime.hideBalance = false; } catch (e) {} R.go('home', { force: true }); }); await wait(1500); },
  markets: async page => { await page.evaluate(() => R.go('markets', { force: true })); await wait(1500); },
  spot: async page => { await page.evaluate(() => R.go('spot', { force: true })); await wait(2200); },
  swap: async page => { await page.evaluate(() => R.go('exchange', { force: true })); await wait(1300); await page.click('#exchange .lt-key[data-k="5"]').catch(() => {}); await wait(500); await page.evaluate(() => { document.querySelector('#exchange').scrollTop = 0; }); await wait(400); },
};

for (const lang of ['fr', 'en', 'ar']) {
  const { ctx, page, logs } = await openApp(browser, url, { lang, theme: 'dark', scheme: 'dark', width: 360, height: 780, scale: 2, touch: true, ws: 'live' });
  for (const [name, go] of Object.entries(SCREENS)) {
    await go(page);
    await page.screenshot({ path: path.join(TMP, `${name}-${lang}.png`) });
    console.log('capturé', name, lang);
  }
  if (logs.length) console.log('  avertissements de la page :', logs.slice(0, 3).join(' | '));
  await ctx.close();
}
await browser.close(); srv.close();

/* PNG -> WebP 600 px de large (Pillow) */
execFileSync('python3', ['-I', '-c', `
import sys, glob, os
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
for f in sorted(glob.glob(os.path.join(src, '*.png'))):
    im = Image.open(f).convert('RGB'); w = 600; h = round(im.height * w / im.width)
    im.resize((w, h), Image.LANCZOS).save(os.path.join(out, os.path.basename(f)[:-4] + '.webp'), 'WEBP', quality=78, method=6)
    print('écrit', os.path.basename(f)[:-4] + '.webp', w, 'x', h)
`, TMP, OUT], { stdio: 'inherit' });
fs.rmSync(TMP, { recursive: true, force: true });
