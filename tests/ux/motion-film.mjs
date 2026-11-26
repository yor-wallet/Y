/* Frame-by-frame filmstrips of the main motions (16.0.0) — to look at a transition the way a motion designer does.
   Each interaction is triggered, every animation it started is frozen, then seeked to fixed times and photographed: the frames are exact,
   whatever the speed of the machine. One contact sheet per motion (S0.png, S1.png…) is drawn by the browser itself.
   Note: a frame taken after an animation's end shows the elements without it (a leaving screen may reappear there): read only the frames
   inside the motion.
   Run: node tests/ux/motion-film.mjs <outdir> */
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openApp } from './harness.mjs';
const OUT = process.argv[2]; if (!OUT){ console.error('usage: node tests/ux/motion-film.mjs <outdir>'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const { srv, url } = await serve(); const browser = await launch();
const { page } = await openApp(browser, url, { lang: 'fr', theme: 'dark', scheme: 'dark', width: 390, height: 844, touch: true, scale: 1, settle: 1500 });
const wait = ms => new Promise(r => setTimeout(r, ms));
const TIMES = [0, 60, 140, 240, 360, 520];
async function strip(name, act, times = TIMES, clip){
  await page.evaluate(() => { window.__seen = new WeakSet(document.getAnimations()); });
  await act();
  const n = await page.evaluate(async () => {
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    window.__film = document.getAnimations().filter(a => !window.__seen.has(a)); window.__film.forEach(a => a.pause()); return window.__film.length;
  });
  const shots = [];
  for (const t of times){
    await page.evaluate(t => window.__film.forEach(a => { try { a.currentTime = t; } catch (e) {} }), t);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => r())));
    const f = path.join(OUT, name + '_' + t + '.png'); await page.screenshot({ path: f, clip }); shots.push([t, f]);
  }
  await page.evaluate(() => window.__film.forEach(a => { try { a.finish(); } catch (e) {} }));
  console.log(name, '— animations frozen:', n);
  return shots;
}
const sheets = [];
await page.evaluate(() => R.go('markets', { force: true })); await wait(1200);
sheets.push(['pousser marchés → actif', await strip('push', () => page.click('#markets [data-omx-asset]'))]);
await wait(700);
sheets.push(['revenir actif → marchés', await strip('pop', () => page.evaluate(() => R.back()))]);
await wait(700);
await page.evaluate(() => R.go('home', { force: true })); await wait(1200);
sheets.push(['onglet accueil → marchés (fondu enchaîné, pastille liquide)', await strip('tab', () => page.click('#bottom-nav [data-nav="markets"]'))]);
await wait(800);
sheets.push(['onglet marchés → spot', await strip('tabspot', () => page.click('#bottom-nav [data-nav="spot"]'))]);
await wait(800);
await page.evaluate(() => R.go('markets')); await wait(1000);
sheets.push(['pousser marchés → actif (barre du bas : la pastille apparaît sur place)', await strip('pushnav', () => page.click('#markets [data-omx-asset]'), [0, 60, 140, 200, 280, 400], { x: 0, y: 744, width: 390, height: 100 })]);
await wait(800);
await page.evaluate(() => R.go('markets')); await wait(1000);
sheets.push(['onglet marchés → portefeuille (barre du bas)', await strip('tabnav', () => page.click('#bottom-nav [data-nav="wallet"]'), [0, 60, 140, 200, 280, 400], { x: 0, y: 744, width: 390, height: 100 })]);
await wait(800);
await page.evaluate(() => R.go('exchange', { force: true })); await wait(1200);
sheets.push(['feuille : ouverture', await strip('sheet', () => page.evaluate(() => { window.__cs = R.overlay.open('<div class="omx-sheet"><h2>Choisir un réseau</h2><div class="omx-nets"><button class="omx-pick">Bitcoin</button><button class="omx-pick">Ethereum</button><button class="omx-pick">TRON</button></div></div>', { kind: 'sheet' }); }))]);
await page.evaluate(() => window.__cs()); await wait(700);
sheets.push(['modale : ouverture', await strip('modal', () => page.evaluate(() => { window.__cm = R.overlay.open('<div class="omx-sheet"><p>Confirmer l’envoi de 5 USDT ?</p><div class="omx-btns"><button class="btn btn-primary">Confirmer</button></div></div>', { kind: 'modal' }); }))]);
await page.evaluate(() => window.__cm()); await wait(700);
await page.evaluate(() => { Runtime.hideBalance = false; R.go('home', { force: true }); }); await wait(1400);
const ob = await page.evaluate(() => { const r = document.querySelector('#home [data-omx-total]').getBoundingClientRect(); return { x: Math.max(0, Math.floor(r.left) - 16), y: Math.max(0, Math.floor(r.top) - 12), width: Math.min(390, Math.ceil(r.width) + 32), height: Math.ceil(r.height) + 24 }; });
sheets.push(['solde : chiffre par chiffre', await strip('odo', () => page.evaluate(() => { const el = document.querySelector('#home [data-omx-total]'); const n = el.firstChild; n.textContent = n.textContent.replace(/[\d,]+/, m => (parseInt(m.replace(/,/g, ''), 10) + 137).toLocaleString('en-US')); }), [0, 40, 100, 180, 280, 420], ob)]);

/* contact sheets, drawn by the browser (no image library needed) */
const sheetPage = await browser.newPage();
for (const [i, [name, shots]] of sheets.entries()){
  const imgs = shots.map(([t, f]) => '<figure><figcaption>' + t + ' ms</figcaption><img src="data:image/png;base64,' + fs.readFileSync(f).toString('base64') + '"></figure>').join('');
  await sheetPage.setContent('<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#282828;font:13px system-ui,sans-serif;color:#ffd200}h1{font-size:13px;margin:6px 8px;color:#eee}div{display:flex;gap:6px;padding:0 6px 6px}figure{margin:0}figcaption{padding:2px 0 3px}img{display:block}</style><h1>' + name + '</h1><div>' + imgs + '</div>');
  const p = path.join(OUT, 'S' + i + '.png');
  const size = await sheetPage.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
  await sheetPage.setViewportSize({ width: Math.max(320, size.w), height: Math.max(80, size.h) });
  await sheetPage.screenshot({ path: p, fullPage: true });
  console.log('S' + i, name, '→', p);
}
await browser.close(); srv.close();
