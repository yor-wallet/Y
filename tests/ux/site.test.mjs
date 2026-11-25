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
  await ok('identité Noir & Jaune : aucune couleur bleue dessinée par la feuille de style, thème sombre, marque « Arche », icône actuelle', async () => {
    const blues = await page.evaluate(() => {
      const hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d) return [0, 0, l]; const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return [h, s, l]; };
      const bad = new Set();
      for (const el of document.querySelectorAll('body, body *')) {
        const cs = getComputedStyle(el);
        for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'outlineColor']) {
          const m = String(cs[prop]).match(/rgba?\(([^)]+)\)/); if (!m) continue;
          const [r, g, b, a = 1] = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); if (a < 0.2) continue;
          const [h, s, l] = hsl(r, g, b); if (h >= 185 && h <= 265 && s > 0.28 && l > 0.08 && l < 0.92) bad.add(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' ' + prop + ' ' + cs[prop]);
        }
        for (const prop of ['backgroundImage', 'boxShadow']) { if (/rgba?\((?:[0-9]{1,2}|1[0-3][0-9]),\s*(?:1[3-9][0-9]|2[0-4][0-9]),\s*2[0-5][0-9]/.test(cs[prop])) bad.add(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' ' + prop); }
      }
      return [...bad].slice(0, 8);
    });
    assert.deepEqual(blues, [], 'bleu restant : ' + blues.join(' | '));
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(11, 10, 7)');
    assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'), '#0B0A07');
    assert.match(await page.locator('.top .brand img').getAttribute('src'), /om-logo-horizontal-white\.png/);
    assert.match(await page.locator('.final-in img').getAttribute('src'), /app-icon\.webp/);
    assert.equal(await page.locator('.hero-art .aura .arches').count(), 1);
  });
  await ok('partage : balises Open Graph absolues sur le site en ligne, image 1200 x 630, aucun ancien domaine', async () => {
    const html = await page.content();
    assert.doesNotMatch(html, /netlify/);
    assert.match(await page.locator('meta[property="og:image"]').getAttribute('content'), /^https:\/\/yor-wallet\.vercel\.app\/assets\/share\/og-fr\.png$/);
    assert.equal(await page.locator('meta[property="og:image:width"]').getAttribute('content'), '1200');
    assert.equal(await page.locator('meta[name="twitter:card"]').getAttribute('content'), 'summary_large_image');
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://yor-wallet.vercel.app/welcome');
    assert.equal(await page.locator('link[rel="alternate"][hreflang]').count(), 3);
  });
  await ok('un prix qui bouge : la carte reste (mise à jour sur place) et le chiffre clignote vert / rouge', async () => {
    await page.evaluate(() => { document.querySelector('#ticker .tk[data-sym="BTC"]').__same = true; });
    await page.route(/binance\.vision/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(MK.map(([s, p, c]) => ({ symbol: s, lastPrice: s === 'BTCUSDT' ? '62500.00' : s === 'ETHUSDT' ? '2100.00' : p, priceChangePercent: c }))) }));
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => !!document.querySelector('#ticker .tk[data-sym="BTC"]').__same), true, 'la carte BTC a été reconstruite');
    assert.match(await page.locator('#ticker .tk[data-sym="BTC"] .tk-p').innerText(), /\$62,500\.00/);
    assert.equal(await page.locator('#ticker .tk[data-sym="BTC"] .tk-p').evaluate(e => e.classList.contains('flash-up')), true);
    assert.equal(await page.locator('#ticker .tk[data-sym="ETH"] .tk-p').evaluate(e => e.classList.contains('flash-down')), true);
  });
  await ok('?lang=ar ouvre le site en arabe (lien partageable) et le choix est retenu', async () => {
    const c2 = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR', serviceWorkers: 'block' });
    const p2 = await c2.newPage(); await p2.route(/binance\.vision/, r => r.abort());
    await p2.goto(url + 'welcome/index.html?lang=ar'); await p2.waitForTimeout(500);
    assert.equal(await p2.evaluate(() => document.documentElement.dir), 'rtl');
    await p2.goto(url + 'welcome/index.html'); await p2.waitForTimeout(400);
    assert.equal(await p2.evaluate(() => document.documentElement.lang), 'ar');
    await c2.close();
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
