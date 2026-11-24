/* OM Wallet 14.6.0 — showcase site (/welcome), separate from the app but linked to it
   - loads with the production security policy, no page error, no horizontal scroll on a phone
   - three languages (fr / en / ar right to left), real screenshots per language, remembered choice
   - live prices: real Binance public data only; network down -> an honest « unavailable », never a made-up number
   - links lead into the app: /#/signup opens « Create an account » directly, /#/login the sign-in */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const MK = [['BTCUSDT', '61012.14', '-1.84'], ['ETHUSDT', '2234.51', '0.92'], ['BNBUSDT', '598.2', '1.3'], ['SOLUSDT', '131.07', '-2.4'], ['XRPUSDT', '1.042', '0.55'], ['LTCUSDT', '71.3', '-0.31']];
async function site(opts = {}){
  const ctx = await browser.newContext({ viewport: { width: opts.width || 390, height: 844 }, locale: opts.locale || 'fr-FR', serviceWorkers: 'block' });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
  await page.route(/binance\.vision/, r => opts.offline ? r.abort() : r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(MK.map(([s, p, c]) => ({ symbol: s, lastPrice: p, priceChangePercent: c }))) }));
  await page.goto(url + 'welcome/index.html'); await page.waitForTimeout(1200);
  return { ctx, page, errs };
}
{
  console.log('\n[site vitrine]');
  const { ctx, page, errs } = await site();
  await ok('chargé sans erreur, sans défilement horizontal sur téléphone', async () => {
    assert.deepEqual(errs, []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
    assert.match(await page.locator('h1').innerText(), /portefeuille crypto/i);
  });
  await ok('cours réels : six actifs, prix et variation, état « En direct »', async () => {
    assert.equal(await page.locator('#ticker .tk').count(), 6);
    assert.match(await page.locator('#ticker').innerText(), /\$61,012\.14/);
    assert.match(await page.locator('#ticker').innerText(), /-1\.84%/);
    assert.match(await page.locator('#mk-status').innerText(), /En direct/);
  });
  await ok('liens vers l’application : créer un compte et se connecter', async () => {
    assert.ok(await page.locator('a[href="/#/signup"]').count() >= 2);
    assert.equal(await page.locator('a[href="/#/login"]').count(), 1);
    assert.ok(await page.locator('a[href="/"]').count() >= 2);
  });
  await ok('arabe : de droite à gauche, textes et captures en arabe ; choix retenu', async () => {
    await page.click('[data-lang="ar"]'); await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.documentElement.dir), 'rtl');
    assert.match(await page.locator('h1').innerText(), /محفظتك/);
    assert.match(await page.locator('img[data-shot="home"]').getAttribute('src'), /home-ar\.webp/);
    await page.reload(); await page.waitForTimeout(800);
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'ar');
    await page.click('[data-lang="en"]'); await page.waitForTimeout(200);
    assert.match(await page.locator('h1').innerText(), /Your crypto wallet/);
  });
  await ok('onglets de captures : Spot', async () => {
    await page.click('[data-tab="spot"]'); await page.waitForTimeout(500);
    assert.match(await page.locator('#show-img').getAttribute('src'), /spot-en\.webp/);
  });
  await ctx.close();
  const off = await site({ offline: true, locale: 'en-US' });
  await ok('réseau coupé : « cours indisponibles », aucun prix inventé', async () => {
    assert.match(await off.page.locator('#mk-status').innerText(), /unavailable/i);
    assert.equal(await off.page.locator('#ticker .tk').count(), 0);
    assert.doesNotMatch(await off.page.locator('#ticker').innerText(), /\$/);
  });
  await off.ctx.close();
  const wide = await site({ width: 1366 });
  await ok('ordinateur : menu visible, pas de défilement horizontal', async () => {
    assert.equal(await wide.page.locator('.nav a').first().isVisible(), true);
    assert.equal(await wide.page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
  });
  await wide.ctx.close();
}
{
  console.log('\n[lien du site vers l’application]');
  const a = await openApp(browser, url, { signedOut: true, lang: 'fr', settle: 400 });
  await ok('/#/signup ouvre directement « Créer un compte » (pas la présentation)', async () => {
    await a.page.goto('about:blank'); await a.page.goto(url + '#/signup'); await a.page.waitForTimeout(2600);
    assert.equal(await a.page.evaluate(() => R.current()), 'signup');
  });
  await ok('/#/login ouvre directement la connexion', async () => {
    await a.page.goto('about:blank'); await a.page.goto(url + '#/login'); await a.page.waitForTimeout(2600);
    assert.equal(await a.page.evaluate(() => R.current()), 'login');
  });
  await a.ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);
