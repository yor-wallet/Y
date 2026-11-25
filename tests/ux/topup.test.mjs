/* OM Wallet 15.0.1 — Transfert de crédit, RÉSERVÉ À L'ADMINISTRATEUR : opérateur + numéro + montant + Envoyer = confirmé tout de suite
   (SMS envoyé par le serveur), message exact du propriétaire, rien d'autre d'obligatoire. Un utilisateur ordinaire ne voit pas le service. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const cur = page => page.evaluate(() => R.current());
const owner = 'تمت عملية تحويل مبلغ 1.000 ريال بنجاح إلى الرقم 96892888435. (TID: 872499275195989578).';
{
  console.log('\n[administrateur — français]');
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'fr', settle: 900, admin: true });
  await ok('l’accueil propose « Crédit » à l’administrateur', async () => {
    assert.deepEqual(await page.$$eval('#home .omx-acts [data-nav]', a => a.map(b => b.getAttribute('data-nav'))), ['deposit', 'withdraw', 'send-internal', 'topup']);
    await page.click('#home .omx-acts [data-nav="topup"]'); await wait(800); assert.equal(await cur(page), 'topup');
    assert.deepEqual(await page.$$eval('#topup [data-tp-op]', a => a.map(b => b.textContent.trim())), ['Ooredoo', 'Omantel', 'Vodafone']);
  });
  await ok('champs faux : messages clairs, rien n’est envoyé', async () => {
    await page.click('#tp-go'); await wait(300);
    assert.match(await page.locator('#tp-e-phone').innerText(), /numéro mobile omanais valide/);
    assert.match(await page.locator('#tp-e-amt').innerText(), /montant n’est pas valide/);
    assert.equal(await page.evaluate(() => (window.__topupCalls || []).length), 0);
  });
  await ok('Envoyer : confirmé tout de suite, message exact, TID de l’opérateur, sans code ni deuxième étape', async () => {
    await wait(1300); await page.fill('#tp-phone', '9288 8435'); await page.click('[data-tp-amt="1"]'); await page.fill('#tp-tid', '872499275195989578'); await page.click('#tp-go'); await wait(1500);
    assert.equal(await cur(page), 'topup-done');
    assert.match(await page.locator('.wd-hero').innerText(), /Transfert confirmé/);
    assert.match(await page.locator('#tp-msg').innerText(), /^Transfert de 1\.000 OMR vers le 96892888435 effectué\. \(TID : 872499275195989578\)\.$/);
    const c = await page.evaluate(() => window.__topupCalls);
    assert.equal(c.length, 1);
    assert.deepEqual({ ...c[0], p_idempotency_key: !!c[0].p_idempotency_key }, { p_operator: 'OOREDOO', p_phone: '96892888435', p_amount: 1, p_tid: '872499275195989578', p_idempotency_key: true });
  });
  await ok('historique : l’opération apparaît avec l’opérateur et le numéro', async () => {
    await page.evaluate(() => R.go('history', { force: true })); await wait(900);
    assert.match(await page.locator('#history').innerText(), /Ooredoo · 96892888435/);
  });
  await ok('sans TID saisi : l’opération a son propre numéro (envoyée avec p_tid vide)', async () => {
    await page.evaluate(() => R.go('topup', { force: true })); await wait(900);
    await page.fill('#tp-phone', '71234567'); await page.fill('#tp-amt', '2.5'); await page.click('[data-tp-op="VODAFONE"]'); await page.click('#tp-go'); await wait(1500);
    const c = await page.evaluate(() => window.__topupCalls);
    assert.equal(c.length, 2); assert.equal(c[1].p_tid, null); assert.equal(c[1].p_operator, 'VODAFONE'); assert.equal(c[1].p_phone, '96871234567');
    assert.match(await page.locator('.wd-hero').innerText(), /Transfert confirmé/);
  });
  await ok('pas d’erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
{
  console.log('\n[arabe — le message du propriétaire, mot pour mot]');
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'ar', settle: 900, admin: true });
  await ok('message exact, de droite à gauche', async () => {
    await page.evaluate(() => R.go('topup', { force: true })); await wait(900);
    await page.fill('#tp-phone', '92888435'); await page.fill('#tp-amt', '1'); await page.fill('#tp-tid', '872499275195989578'); await page.click('#tp-go'); await wait(1500);
    assert.equal(await page.locator('#tp-msg').innerText(), owner);
    assert.equal(await page.evaluate(() => document.documentElement.dir), 'rtl');
  });
  await ok('pas d’erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
{
  console.log('\n[utilisateur ordinaire · TID déjà utilisé]');
  let a = await openApp(browser, url, { lang: 'fr', settle: 900 });
  await ok('un utilisateur ordinaire ne voit pas « Crédit » et ne peut pas ouvrir l’écran', async () => {
    assert.deepEqual(await a.page.$$eval('#home .omx-acts [data-nav]', x => x.map(b => b.getAttribute('data-nav'))), ['deposit', 'withdraw', 'send-internal']);
    await a.page.evaluate(() => R.go('topup', { force: true })); await wait(900); assert.equal(await cur(a.page), 'home');
  });
  await a.ctx.close();
  a = await openApp(browser, url, { lang: 'fr', settle: 900, admin: true, topup: 'dup' });
  await ok('TID déjà utilisé : message clair, rien de confirmé', async () => {
    await a.page.evaluate(() => R.go('topup', { force: true })); await wait(900);
    await a.page.fill('#tp-phone', '92888435'); await a.page.fill('#tp-amt', '1'); await a.page.fill('#tp-tid', '872499275195989578'); await a.page.click('#tp-go'); await wait(1500);
    assert.match(await a.page.locator('.wd-hero').innerText(), /Non envoyé/);
    assert.match(await a.page.locator('.wd-msg').innerText(), /déjà utilisé/);
    assert.equal(await a.page.locator('#tp-msg').count(), 0);
  });
  await a.ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);
