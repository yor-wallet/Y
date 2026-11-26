/* OM Wallet 14.5.0 — Spot / Swap / main menu / « Verre » glass look
   - main menu: Home · Markets · Spot · Swap · Assets; Activity and Account stay one tap away (home header)
   - Spot: live market (stand-in of the Binance stream): status « En direct », price, order book, market trades that arrive
   - Spot market order: % of the available balance, server quote, review, PIN, « En cours » (nothing credited), swap_execute called once
   - Swap: Max, flip, honest errors (amount, balance), server not activated → clear message and NO fake success
   - quote expiry: no « Confirm » on an expired price, a « new price » button instead
   - reduce motion: no flash / slide animation · glass look: light text on blue, no white surfaces · Arabic RTL */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const cur = page => page.evaluate(() => R.current());
const pin = async page => { await wait(700); for (const k of '482913') await page.keyboard.press(k); };

{
  console.log('\n[menu principal, Spot en direct, ordre au marché]');
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'fr', settle: 900, ws: 'live' });
  await ok('menu principal (14.7.0, image du propriétaire) : Accueil · Marchés · Swap (bouton rond au milieu) · Portefeuille · Spot', async () => {
    assert.deepEqual(await page.$$eval('#bottom-nav .nav-item', a => a.map(x => x.getAttribute('data-nav'))), ['home', 'markets', 'exchange', 'wallet', 'spot']);
    assert.deepEqual(await page.$$eval('#bottom-nav .nav-item', a => a.map(x => x.textContent.trim())), ['Accueil', 'Marchés', 'Swap', 'Portefeuille', 'Spot']);
    assert.equal(await page.locator('#bottom-nav .nav-cta[data-nav="exchange"] .nav-cta-tile').count(), 1);
  });
  await ok('Activité et Compte restent à un geste depuis l’accueil', async () => {
    await page.click('#home .w-hdr [data-nav="history"]'); await wait(700); assert.equal(await cur(page), 'history');
    await page.evaluate(() => R.go('home', { force: true })); await wait(500);
    await page.click('#home .w-hdr [data-nav="account"]'); await wait(700); assert.equal(await cur(page), 'account');
  });
  await ok('Spot : logo, paire, état « En direct », carnet d’ordres et transactions qui arrivent', async () => {
    await page.click('#bottom-nav [data-nav="spot"]'); await wait(2200);
    assert.equal(await cur(page), 'spot');
    assert.equal(await page.locator('#spot .w-reftop-logo img').count() > 0, true);
    assert.match(await page.locator('#spot .tr-pairbtn').innerText(), /BTC\/USDT/);
    assert.match(await page.locator('#tr-status').innerText(), /En direct/);
    assert.equal(await page.locator('#tr-book .tb-row.ask').count(), 7);
    assert.equal(await page.locator('#tr-book .tb-row.bid').count(), 7);
    const p1 = await page.locator('#tr-px').innerText(); await wait(1200); const p2 = await page.locator('#tr-px').innerText();
    assert.notEqual(p1, p2, 'the last price follows the stream');
    assert.ok(await page.locator('#tr-trades .tt-row').count() >= 10);
    assert.ok(await page.evaluate(() => { const c = document.getElementById('tr-cv'); return c && c.width > 100; }));
  });
  await ok('Spot : changer de paire (ETH/USDT) et d’intervalle (4H)', async () => {
    await page.click('#spot [data-tr="pair"]'); await wait(500);
    await page.click('.tr-sheet [data-sym="ETH"]'); await wait(1500);
    assert.match(await page.locator('#spot .tr-pairbtn').innerText(), /ETH\/USDT/);
    await page.click('#spot [data-tr-tf="4H"]'); await wait(800);
    assert.equal(await page.locator('#spot [data-tr-tf="4H"]').getAttribute('aria-pressed'), 'true');
    await page.click('#spot [data-tr="pair"]'); await wait(500); await page.click('.tr-sheet [data-sym="BTC"]'); await wait(1200);
  });
  await ok('ordre au marché : 50 % du solde, prix du serveur, vérification, sans code sous 500 USD, « En cours » (rien n’est crédité)', async () => {
    await page.click('#spot [data-tr-pct="50"]'); await wait(200);
    assert.equal(await page.inputValue('#tr-amt'), '125');
    assert.match(await page.locator('#tr-est').innerText(), /BTC/);
    await page.click('#tr-go'); await wait(900);
    assert.equal(await cur(page), 'trade-review');
    assert.match(await page.locator('.tr-rv').innerText(), /125 USDT/);
    assert.match(await page.locator('.tr-rv').innerText(), /1 BTC = 97,000/);
    assert.match(await page.locator('#tr-ttl').innerText(), /valable/);
    await page.click('#tr-confirm'); await pin(page); await wait(1600);
    assert.equal(await cur(page), 'trade-done');
    assert.match(await page.locator('.wd-hero').innerText(), /En cours/);
    const calls = await page.evaluate(() => (window.__rpcLog || []).filter(x => x.name === 'swap_execute'));
    assert.equal(calls.length, 1); assert.equal(calls[0].args.p_pin_grant, null, '16.4.0 : 125 USDT ≤ 500 USD → aucun code'); assert.ok(calls[0].args.p_idempotency_key);
    const w = await page.evaluate(() => (Runtime.wallets || []).find(x => x.asset === 'USDT'));
    assert.equal(Number(w.availableBalance), 125, 'the amount paid is set aside');
    assert.equal(await page.evaluate(() => (Runtime.wallets || []).filter(x => x.asset === 'BTC').reduce((a, x) => a + Number(x.balance), 0)), 0.01, 'nothing is credited before the administrator');
  });
  await ok('écran caché : le flux s’arrête (plus de données reçues) ; de retour : nouveau relevé puis « En direct »', async () => {
    await page.evaluate(() => R.go('spot', { force: true })); await wait(2000);
    const vis = v => page.evaluate(s => { Object.defineProperty(document, 'visibilityState', { value: s, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }, v);
    await vis('hidden'); await wait(500);
    const a = await page.locator('#tr-px').innerText(); await wait(1500); const b = await page.locator('#tr-px').innerText();
    assert.equal(a, b, 'no stream while hidden');
    await vis('visible'); await wait(2500);
    assert.match(await page.locator('#tr-status').innerText(), /En direct/);
    const c = await page.locator('#tr-px').innerText(); await wait(1200); const d = await page.locator('#tr-px').innerText();
    assert.notEqual(c, d, 'the stream is back');
  });
  await ok('pas d’erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
{
  console.log('\n[Swap]');
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'fr', settle: 900 });
  await page.click('#bottom-nav [data-nav="exchange"]'); await wait(900);
  await ok('Swap : De USDT, Vers BTC, Max = solde disponible, estimation en direct', async () => {
    assert.match(await page.locator('#exchange [data-tr="pick-from"]').innerText(), /USDT/);
    assert.match(await page.locator('#exchange [data-tr="pick-to"]').innerText(), /BTC/);
    await page.click('#exchange [data-tr="max"]'); await wait(200);
    assert.equal(await page.inputValue('#sw-amt'), '250');
    assert.match(await page.locator('#sw-out').innerText(), /0\.00257/);
    assert.match(await page.locator('#sw-rate').innerText(), /1 BTC ≈ 97,000/);
  });
  await ok('Swap : messages honnêtes (montant vide, solde insuffisant)', async () => {
    await page.fill('#sw-amt', ''); await page.click('#sw-go'); await wait(300);
    assert.match(await page.locator('#toasts').innerText(), /montant valide/);
    await wait(1300);                                    /* the app ignores a second tap on the same button within ~1 s (anti double-tap) */
    await page.fill('#sw-amt', '9999'); await page.click('#sw-go');
    await page.waitForFunction(() => /insuffisant/.test(document.getElementById('toasts').innerText), null, { timeout: 6000 });   /* messages are shown one after the other */
    assert.equal(await cur(page), 'exchange');
  });
  await ok('Swap : inverser met BTC en « De » et USDT en « Vers »', async () => {
    await page.click('#exchange [data-tr="flip"]'); await wait(800);
    assert.match(await page.locator('#exchange [data-tr="pick-from"]').innerText(), /BTC/);
    assert.match(await page.locator('#exchange [data-tr="pick-to"]').innerText(), /USDT/);
  });
  await ok('Swap : choisir la crypto reçue (ETH)', async () => {
    await page.click('#exchange [data-tr="pick-to"]'); await wait(400); await page.click('.tr-sheet [data-sym="ETH"]'); await wait(700);
    assert.match(await page.locator('#exchange [data-tr="pick-to"]').innerText(), /ETH/);
  });
  await ok('pas d’erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
{
  console.log('\n[serveur pas encore activé · prix expiré]');
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'fr', settle: 900, swapOff: true });
  await ok('échange non activé côté serveur : message clair, aucun faux succès', async () => {
    await page.evaluate(() => R.go('exchange', { force: true })); await wait(800);
    await page.fill('#sw-amt', '20'); await page.click('#sw-go'); await wait(800);
    assert.match(await page.locator('#toasts').innerText(), /pas encore activé/);
    assert.equal(await cur(page), 'exchange');
    assert.equal(await page.evaluate(() => (window.__rpcLog || []).filter(x => x.name === 'swap_execute').length), 0);
  });
  await ctx.close();
  const b = await openApp(browser, url, { lang: 'fr', settle: 900, quoteTtl: 2 });
  await ok('prix expiré : plus de bouton Confirmer, un bouton « nouveau prix » qui en redemande un', async () => {
    await b.page.evaluate(() => R.go('exchange', { force: true })); await wait(800);
    await b.page.fill('#sw-amt', '20'); await b.page.click('#sw-go'); await wait(3200);
    assert.equal(await cur(b.page), 'trade-review');
    assert.match(await b.page.locator('#tr-ttl').innerText(), /expiré/);
    assert.equal(await b.page.locator('#tr-confirm').count(), 0);
    const n = await b.page.evaluate(() => (window.__quotes || []).length);
    await b.page.click('#tr-requote'); await wait(900);
    assert.equal(await b.page.evaluate(() => (window.__quotes || []).length), n + 1);
  });
  await ok('pas d’erreur de page', async () => { assert.deepEqual(logs, []); assert.deepEqual(b.logs, []); });
  await b.ctx.close();
}
{
  console.log('\n[verre, réduction des animations, arabe]');
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'ar', settle: 900, ws: 'live', reduced: true, theme: 'dark' });
  await ok('apparence Noir & Jaune (14.8.0) : fond noir, texte clair, jaune pour l’action principale (texte foncé dessus), bouton central rond jaune', async () => {
    await page.evaluate(() => R.go('home', { force: true })); await wait(700);
    const r = await page.evaluate(() => {
      const tile = document.querySelector('#bottom-nav .nav-cta .nav-cta-tile'), act = document.querySelector('#home .lt-acts .omx-act i');
      const px = el => el ? getComputedStyle(el) : null;
      return { theme: document.documentElement.getAttribute('data-theme'), bg: px(document.body).backgroundColor, col: px(document.body).color,
        tileBg: px(tile).backgroundImage, tileRadius: px(tile).borderTopLeftRadius, tileInk: px(tile).color, actBg: px(act).backgroundColor, meta: document.querySelector('meta[name="theme-color"]').getAttribute('content') };
    });
    assert.equal(r.theme, 'dark');
    assert.equal(r.bg, 'rgb(11, 10, 7)');
    assert.equal(r.col, 'rgb(245, 243, 238)');
    assert.match(r.tileBg, /rgb\(255, 2\d\d, \d+\)|rgb\(245, 184, 0\)/);   /* the yellow gradient */
    assert.equal(r.tileRadius, '50%');
    assert.equal(r.tileInk, 'rgb(20, 17, 10)');                                  /* dark glyph ON the yellow */
    assert.equal(r.actBg, 'rgb(37, 35, 30)');                                    /* round dark action buttons */
    assert.equal(r.meta, '#0B0A07');
  });
  await ok('mode clair (réglage de la personne) : page crème, texte noir, même jaune', async () => {
    await page.evaluate(() => { Runtime.settings = Object.assign({}, Runtime.settings, { theme: 'light' }); applyTheme('light'); }); await wait(400);
    const r = await page.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), bg: getComputedStyle(document.body).backgroundColor, col: getComputedStyle(document.body).color,
      tile: getComputedStyle(document.querySelector('#bottom-nav .nav-cta .nav-cta-tile')).backgroundImage }));
    assert.equal(r.theme, 'light'); assert.equal(r.bg, 'rgb(255, 251, 240)'); assert.equal(r.col, 'rgb(20, 17, 10)');
    assert.match(r.tile, /rgb\(255, 2\d\d, \d+\)|rgb\(245, 184, 0\)/);
    await page.evaluate(() => { Runtime.settings = Object.assign({}, Runtime.settings, { theme: 'dark' }); applyTheme('dark'); }); await wait(300);
  });
  await ok('sans réglage enregistré, l’application s’ouvre en noir et jaune (sombre par défaut)', async () => {
    const o = await openApp(browser, url, { lang: 'fr', settle: 700, theme: 'none' });
    const th = await o.page.evaluate(() => ({ t: document.documentElement.getAttribute('data-theme'), bg: getComputedStyle(document.body).backgroundColor }));
    assert.equal(th.t, 'dark'); assert.equal(th.bg, 'rgb(11, 10, 7)');
    await o.ctx.close();
  });
  await ok('le solde garde son texte exact, décimales plus légères', async () => {
    await page.evaluate(() => R.go('home', { force: true })); await wait(700);
    const r = await page.evaluate(() => { const b = document.querySelector('#home [data-omx-total]'); const d = b.querySelector('.lt-dec'); return { txt: b.innerText, dec: d ? d.innerText : null, w: d ? getComputedStyle(d).fontWeight : null }; });
    assert.match(r.txt, /^\$[\d,]+\.\d{2}$|^[•\s]+$/);
  });
  await ok('arabe : Spot s’affiche de droite à gauche, chiffres de gauche à droite', async () => {
    await page.click('#bottom-nav [data-nav="spot"]'); await wait(2000);
    assert.equal(await page.evaluate(() => document.documentElement.dir), 'rtl');
    assert.equal(await page.locator('#tr-px').evaluate(e => getComputedStyle(e).direction), 'ltr');
    assert.match(await page.locator('#bottom-nav').innerText(), /سبوت/);
  });
  await ok('réduction des animations : aucun éclair ni glissement sur les prix', async () => {
    await wait(1200);
    const a = await page.evaluate(() => [document.getElementById('tr-px'), document.querySelector('#tr-trades .tt-row')].map(e => e ? getComputedStyle(e).animationName : 'none'));
    assert.deepEqual(a, ['none', 'none']);
  });
  await ok('pas d’erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);
