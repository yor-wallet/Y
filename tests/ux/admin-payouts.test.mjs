/* Bouton admin « Marquer comme versé et envoyer le SMS » / « Renvoyer le SMS » : visible seulement pour un administrateur, appelle exactement
   admin_payout_confirm / admin_payout_resend_notice (faux client : aucun SMS réel, aucune donnée réelle), montre l'état du SMS. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = async (name, fn) => { try { await fn(); console.log('  ok  ', name); } catch (e) { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); } };
const wait = ms => new Promise(r => setTimeout(r, ms));
const calls = (page, n) => page.evaluate(n => window.__rpcLog.filter(c => c.name === n), n);

{
  const { ctx, page, logs } = await openApp(browser, url, { settle: 400 });
  console.log('\n[utilisateur normal]');
  await ok('Services n’a pas d’entrée administrateur et l’écran renvoie à l’accueil', async () => {
    await page.evaluate(() => R.go('services', { force: true })); await wait(500);
    assert.equal(await page.locator('[data-nav="payouts"]').count(), 0);
    await page.evaluate(() => R.go('payouts', { force: true })); await wait(800);
    assert.equal(await page.evaluate(() => R.current()), 'home');
    assert.equal((await calls(page, 'admin_payout_list')).length, 0, 'the list must not even be requested');
  });
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
for (const lang of ['en', 'fr', 'ar']){
  const { ctx, page, logs } = await openApp(browser, url, { admin: true, lang, settle: 400 });
  console.log('\n[administrateur · ' + lang + ']');
  await ok('l’entrée apparaît dans Services et ouvre la liste (à verser par défaut)', async () => {
    await page.evaluate(() => R.go('services', { force: true })); await page.waitForSelector('[data-nav="payouts"]');
    await page.click('[data-nav="payouts"]'); await page.waitForSelector('#payouts.active .po-card', { timeout: 8000 });
    assert.equal(await page.locator('#payouts .po-card').count(), 1);
    assert.equal(await page.locator('#payouts .po-card [data-po="pay"]').count(), 1);
    assert.equal(await page.locator('#payouts .po-card [data-po="resend"]').count(), 0);
  });
  if (lang === 'en'){
    await ok('versement en cours : le SMS « partira quand vous marquerez le versement »', async () => {
      assert.match(await page.locator('#payouts .po-card').innerText(), /will be sent when you mark it as paid/);
      assert.match(await page.locator('#payouts .po-card').innerText(), /XOF 37,300/);
    });
    await ok('confirmer sans référence valide est refusé sur place (aucun appel serveur)', async () => {
      await page.click('[data-po="pay"]'); await page.waitForSelector('#po-ref');
      await page.fill('#po-ref', 'ab'); await page.click('#po-go');
      assert.ok((await page.locator('#po-err').textContent()).length > 0);
      assert.equal((await calls(page, 'admin_payout_confirm')).length, 0);
    });
    await ok('une référence interne (BMCT…) est refusée sur place : aucun appel serveur', async () => {
      await wait(650);                                   /* the sheet from the previous step is still open */
      await page.fill('#po-ref', 'BMCT260000000247'); await page.click('#po-go');
      assert.match(await page.locator('#po-err').textContent(), /internal transfer reference/);
      assert.equal((await calls(page, 'admin_payout_confirm')).length, 0);
    });
    await ok('référence valide : admin_payout_confirm exact, puis le SMS passe de « en cours » à « envoyé »', async () => {
      await wait(650);                                   /* the app ignores a second tap on a button within 450 ms (double-tap guard) */
      await page.fill('#po-ref', 'MP221118.1205.C12345'); await page.click('#po-go');
      await page.waitForFunction(() => !document.getElementById('po-ref'), null, { timeout: 8000 });
      const c = await calls(page, 'admin_payout_confirm'); assert.equal(c.length, 1);
      assert.deepEqual(c[0].args, { p_tx: '11111111-1111-4111-8111-111111111111', p_paid_ref: 'MP221118.1205.C12345' });
      await page.click('[data-pf="done"]');
      await page.waitForFunction(() => /SMS: sending/.test(document.getElementById('po-list').innerText), null, { timeout: 5000 });
      await page.waitForFunction(() => /SMS: sent/.test(document.getElementById('po-list').innerText), null, { timeout: 15000 });
    });
    await ok('« Renvoyer le SMS » demande confirmation puis appelle admin_payout_resend_notice', async () => {
      await page.click('[data-pf="done"]');
      const failedCard = page.locator('#payouts .po-card', { hasText: 'PAYOUT2' });
      assert.match(await failedCard.innerText(), /SMS: failed — sms_credits_missing/);
      await failedCard.locator('[data-po="resend"]').click(); await page.waitForSelector('#po-go');
      assert.equal((await calls(page, 'admin_payout_resend_notice')).length, 0, 'nothing is sent before the confirmation');
      await page.click('#po-no'); await wait(500);
      assert.equal((await calls(page, 'admin_payout_resend_notice')).length, 0);
      await failedCard.locator('[data-po="resend"]').click(); await page.waitForSelector('#po-go'); await wait(650); await page.click('#po-go');
      await page.waitForFunction(() => !document.getElementById('po-go'), null, { timeout: 8000 });
      const c = await calls(page, 'admin_payout_resend_notice'); assert.equal(c.length, 1); assert.deepEqual(c[0].args, { p_tx: '22222222-2222-4222-8222-222222222222' });
    });
  }
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
