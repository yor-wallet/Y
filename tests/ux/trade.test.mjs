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
  await ok('menu principal : Accueil · Marchés · Spot · Swap · Actifs', async () => {
    assert.deepEqual(await page.$$eval('#bottom-nav .nav-item', a => a.map(x => x.getAttribute('data-nav'))), ['home', 'markets', 'spot', 'exchange', 'wallet']);
    assert.deepEqual(await page.$$eval('#bottom-nav .nav-item', a => a.map(x => x.textContent.trim())), ['Accueil', 'Marchés', 'Spot', 'Swap', 'Actifs']);
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
  await ok('ordre au marché : 50 % du solde, prix du serveur, vérification, code, « En cours » (rien n’est crédité)', async () => {
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
    assert.equal(calls.length, 1); assert.ok(calls[0].args.p_pin_grant); assert.ok(calls[0].args.p_idempotency_key);
    const w = await page.evaluate(() => (Runtime.wallets || []).find(x => x.asset === 'USDT'));
    assert.equal(Number(w.availableBalance), 125, 'the amount paid is set aside');
    assert.equal(await page.evaluate(() => (Runtime.wallets || []).filter(x => x.asset === 'BTC').reduce((a, x) => a + Number(x.balance), 0)), 0.01, 'nothing is credited before the administrator');
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
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'ar', settle: 900, ws: 'live', reduced: true });
  await ok('apparence verre : texte clair sur fond bleu, cartes transparentes (pas de blanc)', async () => {
    const r = await page.evaluate(() => {
      const bg = getComputedStyle(document.body).backgroundImage, c = document.querySelector('#home .omx-card, #home .w-glass, #home .omx-total');
      const cb = c ? getComputedStyle(c).backgroundImage : '', col = getComputedStyle(document.body).color;
      return { theme: document.documentElement.getAttribute('data-theme'), tone: document.documentElement.getAttribute('data-tone'), bg, cb, col };
    });
    assert.equal(r.theme, 'dark'); assert.equal(r.tone, 'day');
    assert.match(r.bg, /gradient/);
    assert.ok(!/rgba\(255, 255, 255, 0\.(9|8|7)/.test(r.cb), 'card is not a white panel: ' + r.cb.slice(0, 120));
    assert.equal(r.col, 'rgb(255, 255, 255)');
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
