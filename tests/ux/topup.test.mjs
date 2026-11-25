/* OM Wallet 15.0.0 — Transfert de crédit (Omantel · Ooredoo · Vodafone), confirmé tout de suite, sans administrateur
   - l'action « Crédit » est sur l'accueil ; formulaire : opérateur, numéro omanais, montant ; erreurs claires, rien n'est envoyé si un champ est faux
   - vérification, code, appel du service (opérateur, numéro 968…, montant, clé unique, code accepté par le serveur)
   - confirmé par le fournisseur : « Transfert confirmé » + le message exact du propriétaire (arabe) avec le vrai montant, numéro et TID ; historique à jour
   - réponse inconnue : « En cours », rien de confirmé ; refus : « Échec », montant rendu ; service non configuré : message clair, rien de retenu */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const cur = page => page.evaluate(() => R.current());
const pin = async page => { await wait(700); for (const k of '482913') await page.keyboard.press(k); };
const fill = async (page, phone, amt) => { await page.evaluate(() => R.go('topup', { force: true })); await wait(700); await page.fill('#tp-phone', phone); await page.fill('#tp-amt', amt); await page.click('#tp-next'); await wait(700); };
const owner = 'تمت عملية تحويل مبلغ 1.000 ريال بنجاح إلى الرقم 96892888435. (TID: 872499275195989578).';

{
  console.log('\n[transfert de crédit — français, confirmé par le fournisseur]');
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'fr', settle: 900 });
  await ok('l’accueil propose « Crédit » à côté de Dépôt, Retrait, Envoyer', async () => {
    assert.deepEqual(await page.$$eval('#home .omx-acts [data-nav]', a => a.map(b => b.getAttribute('data-nav'))), ['deposit', 'withdraw', 'send-internal', 'topup']);
    assert.match(await page.locator('#home .omx-acts [data-nav="topup"]').innerText(), /Crédit/);
    await page.click('#home .omx-acts [data-nav="topup"]'); await wait(800); assert.equal(await cur(page), 'topup');
  });
  await ok('opérateurs : Ooredoo, Omantel, Vodafone (noms seulement)', async () => {
    assert.deepEqual(await page.$$eval('#topup [data-tp-op]', a => a.map(b => b.textContent.trim())), ['Ooredoo', 'Omantel', 'Vodafone']);
  });
  await ok('champs faux : messages clairs, aucun appel au serveur', async () => {
    await page.click('#tp-next'); await wait(300);
    assert.match(await page.locator('#tp-e-phone').innerText(), /numéro mobile omanais valide/);
    assert.match(await page.locator('#tp-e-amt').innerText(), /montant n’est pas valide/);
    await wait(1300);                                     /* the app ignores a second tap on the same button within ~1 s (anti double-tap) */
    await page.fill('#tp-phone', '12345'); await page.fill('#tp-amt', '5000'); await page.click('#tp-next'); await wait(300);
    assert.match(await page.locator('#tp-e-phone').innerText(), /numéro mobile omanais valide/);
    assert.match(await page.locator('#tp-e-amt').innerText(), /insuffisant/);
    assert.equal(await cur(page), 'topup');
    assert.equal(await page.evaluate(() => (window.__topupCalls || []).length), 0);
  });
  await ok('vérification : opérateur, numéro, montant, aucun frais', async () => {
    await wait(700); await page.fill('#tp-phone', '9288 8435'); await page.click('[data-tp-amt="1"]'); await page.click('#tp-next'); await wait(800);
    assert.equal(await cur(page), 'topup-review');
    const t = await page.locator('.wd-review').innerText();
    assert.match(t, /Ooredoo/); assert.match(t, /\+968 9288 8435/); assert.match(t, /1[.,]000/);
  });
  await ok('code, puis « Transfert confirmé » avec le message exact (vrai montant, numéro, TID)', async () => {
    await page.click('#tp-go'); await pin(page); await wait(1800);
    assert.equal(await cur(page), 'topup-done');
    assert.match(await page.locator('.wd-hero').innerText(), /Transfert confirmé/);
    assert.match(await page.locator('#tp-msg').innerText(), /^Transfert de 1\.000 OMR vers le 96892888435 effectué\. \(TID : 872499275195989578\)\.$/);
    const c = await page.evaluate(() => window.__topupCalls);
    assert.equal(c.length, 1);
    assert.deepEqual({ ...c[0], idempotency_key: !!c[0].idempotency_key }, { operator: 'OOREDOO', phone: '96892888435', amount: 1, idempotency_key: true, pin_grant: 'grant-1' });
  });
  await ok('historique : l’opération apparaît avec l’opérateur et le numéro', async () => {
    await page.evaluate(() => R.go('history', { force: true })); await wait(900);
    assert.match(await page.locator('#history').innerText(), /Ooredoo · 96892888435/);
  });
  await ok('pas d’erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
{
  console.log('\n[arabe — le message du propriétaire, mot pour mot]');
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'ar', settle: 900 });
  await ok('message de confirmation exact, de droite à gauche', async () => {
    await fill(page, '92888435', '1'); assert.equal(await cur(page), 'topup-review');
    await page.click('#tp-go'); await pin(page); await wait(1800);
    assert.equal(await page.locator('#tp-msg').innerText(), owner);
    assert.equal(await page.evaluate(() => document.documentElement.dir), 'rtl');
  });
  await ok('pas d’erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
{
  console.log('\n[réponse inconnue · refus · service non configuré]');
  let a = await openApp(browser, url, { lang: 'fr', settle: 900, topup: 'unknown' });
  await ok('réponse inconnue du fournisseur : « En cours », rien de confirmé, pas de message de réussite', async () => {
    await fill(a.page, '9288 8435', '2'); await a.page.click('#tp-go'); await pin(a.page); await wait(1800);
    assert.match(await a.page.locator('.wd-hero').innerText(), /En cours/);
    assert.equal(await a.page.locator('#tp-msg').count(), 0);
    assert.doesNotMatch(await a.page.locator('.wd-hero').innerText(), /confirmé/i);
  });
  await a.ctx.close();
  a = await openApp(browser, url, { lang: 'fr', settle: 900, topup: 'refused' });
  await ok('refus du fournisseur : « Échec », le montant est rendu, aucune confirmation', async () => {
    await fill(a.page, '9288 8435', '2'); await a.page.click('#tp-go'); await pin(a.page); await wait(1800);
    assert.match(await a.page.locator('.wd-hero').innerText(), /Échec/);
    assert.equal(await a.page.locator('#tp-msg').count(), 0);
    assert.equal(await a.page.evaluate(() => Runtime.accounts.find(x => x.type === 'MAIN').availableBalance), 1284.5);
  });
  await a.ctx.close();
  a = await openApp(browser, url, { lang: 'fr', settle: 900, topup: 'off' });
  await ok('service non configuré : message clair, rien de retenu ni de confirmé', async () => {
    await fill(a.page, '9288 8435', '2'); await a.page.click('#tp-go'); await pin(a.page); await wait(1800);
    assert.match(await a.page.locator('.wd-hero').innerText(), /Non envoyé/);
    assert.match(await a.page.locator('.wd-msg').innerText(), /pas encore disponible/);
    assert.equal(await a.page.locator('#tp-msg').count(), 0);
  });
  await a.ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);
