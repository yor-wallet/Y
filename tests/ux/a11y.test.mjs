/* 15.2.0 — accessibility and crawlability details found by Lighthouse / axe on the first page and the menus:
   · the language buttons of the welcome pager carry their visible letters in their accessible name (WCAG 2.5.3 « label in name »: « EN » is also said by voice control),
   · the pager dots are 24 x 24 px targets (WCAG 2.2 « target size »), only their 10 px centre is painted,
   · every menu entry is a real link (#/route) — crawlable, openable in a new tab — and a click still navigates once, without an extra history entry. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });

console.log('\n[première page : présentation]');
const { ctx, page } = await openApp(browser, url, { signedOut: true, lang: 'en', settle: 400 });
await page.goto('about:blank'); await page.goto(url); await page.waitForTimeout(2800);
await ok('boutons de langue : le nom accessible contient les lettres visibles', async () => {
  const r = await page.evaluate(() => [...document.querySelectorAll('[data-ob-lang]')].map(b => ({ vis: b.textContent.trim(), name: b.getAttribute('aria-label') })));
  assert.equal(r.length, 3, 'trois boutons de langue');
  for (const x of r) assert.ok(x.name.includes(x.vis), 'nom « ' + x.name + ' » sans « ' + x.vis + ' »');
});
await ok('points du pager : cibles d’au moins 24 x 24 px', async () => {
  const r = await page.evaluate(() => [...document.querySelectorAll('.wp-dots button')].map(b => { const x = b.getBoundingClientRect(); return [Math.round(x.width), Math.round(x.height)]; }));
  assert.ok(r.length >= 3, 'des points : ' + r.length);
  for (const [w, h] of r) assert.ok(w >= 24 && h >= 24, 'point de ' + w + ' x ' + h + ' px');
});
await ctx.close();

console.log('\n[menus : de vrais liens]');
const a = await openApp(browser, url, { lang: 'en', theme: 'dark', scheme: 'dark', width: 390, height: 844, touch: true });
await ok('menu du bas : chaque entrée est un lien #/route', async () => {
  const r = await a.page.evaluate(() => [...document.querySelectorAll('#bottom-nav a.nav-item')].map(x => [x.getAttribute('data-nav'), x.getAttribute('href')]));
  assert.ok(r.length >= 5, 'entrées : ' + r.length);
  for (const [n, h] of r) assert.equal(h, '#/' + n);
});
await ok('menu latéral : chaque entrée est un lien #/route', async () => {
  const r = await a.page.evaluate(() => [...document.querySelectorAll('#side-nav a.side-item')].map(x => [x.getAttribute('data-nav'), x.getAttribute('href')]));
  assert.ok(r.length >= 5, 'entrées : ' + r.length);
  for (const [n, h] of r) assert.equal(h, '#/' + n);
});
await ok('un clic sur le menu du bas navigue une fois, sans entrée d’historique en trop', async () => {
  const before = await a.page.evaluate(() => history.length);
  await a.page.click('#bottom-nav a.nav-item[data-nav="markets"]'); await a.page.waitForTimeout(700);
  assert.equal(await a.page.evaluate(() => R.current()), 'markets');
  const after = await a.page.evaluate(() => history.length);
  assert.ok(after - before <= 1, 'entrées d’historique ajoutées : ' + (after - before));
});
await a.ctx.close();
const d = await openApp(browser, url, { lang: 'en', theme: 'dark', scheme: 'dark', width: 1280, height: 800 });
await ok('un clic sur le menu latéral navigue aussi (largeur d’ordinateur)', async () => {
  await d.page.click('#side-nav a.side-item[data-nav="history"]'); await d.page.waitForTimeout(700);
  assert.equal(await d.page.evaluate(() => R.current()), 'history');
});
await d.ctx.close();
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);
