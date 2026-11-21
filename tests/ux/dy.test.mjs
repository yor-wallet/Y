/* DY (13.2.0) : l'interrupteur « transferts suspendus ». Vérifie, contre le faux client qui se comporte comme les fonctions de la base :
   - DY coupé : le parcours normal (aucune fenêtre) ;
   - DY actif : nom affiché seulement s'il est connu, fenêtre bilingue exacte, Continue bloqué, AUCUN envoi, AUCUN code PIN demandé ;
   - DY activé entre l'écran de confirmation et l'envoi : refus du serveur, retour à l'accueil, aucun reçu, aucun échec inventé ;
   - écran administrateur : entrée dans Services, état, confirmation avant d'agir, appel exact, historique ; refus pour un utilisateur normal. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const calls = (page, n) => page.evaluate(n => window.__rpcLog.filter(c => c.name === n), n);
async function startSend(page){ await page.evaluate(() => { txReset(); R.go('country-select'); }); await page.waitForSelector('#country-select.active #sp-num'); }
async function typeNumber(page, n){ await page.fill('#sp-num', n); await page.dispatchEvent('#sp-num', 'input'); }
const AR_T = 'التحويل غير متاح مؤقتًا', AR_P = 'خدمة تحويل الأموال غير متاحة حاليًا', EN_T = 'Transfer Temporarily Unavailable', EN_P = 'The money transfer service is currently unavailable.';

{
  const { ctx, page, logs } = await openApp(browser, url, { settle: 400 });
  console.log('\n[DY coupé — utilisateur normal]');
  await ok('le parcours normal : aucune fenêtre, Continue actif, on arrive au montant', async () => {
    await startSend(page); await typeNumber(page, '98765432'); await wait(900);
    assert.equal(await page.locator('.dy-modal').count(), 0);
    assert.ok(!(await page.locator('#sp-next').isDisabled()));
    await page.click('#sp-next'); await page.waitForSelector('#tx-amount.active #amt-input');
    assert.ok((await calls(page, 'dy_status')).length >= 1, 'the server was asked');
  });
  await ok('un utilisateur normal ne voit pas l’entrée DY et l’écran admin renvoie à l’accueil sans appeler le serveur', async () => {
    await page.evaluate(() => R.go('services', { force: true })); await wait(500);
    assert.equal(await page.locator('[data-nav="dy-control"]').count(), 0);
    await page.evaluate(() => R.go('dy-control', { force: true })); await wait(800);
    assert.equal(await page.evaluate(() => R.current()), 'home');
    assert.equal((await calls(page, 'admin_dy_overview')).length, 0);
  });
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
{
  const { ctx, page, logs } = await openApp(browser, url, { settle: 400, dy: true, dyName: 'Salim Al Harthy' });
  console.log('\n[DY actif — utilisateur normal]');
  await page.evaluate(() => { window.__rpcLog = []; });
  await ok('numéro connu : le nom (annuaire du serveur) s’affiche, puis la fenêtre bilingue exacte ; Continue reste bloqué', async () => {
    await startSend(page); await typeNumber(page, '98765432');
    await page.waitForSelector('#sp-known .sp-known b', { timeout: 5000 });
    assert.equal(await page.locator('#sp-known .sp-known b').textContent(), 'Salim Al Harthy');
    await page.waitForSelector('.dy-modal', { timeout: 5000 });
    const m = await page.locator('.dy-modal').innerText();
    for (const s of [AR_T, AR_P, EN_T, EN_P, 'عزيزي العميل', 'Dear Customer', 'يرجى المحاولة مرة أخرى لاحقًا', 'Please try again later']) assert.ok(m.includes(s), 'missing: ' + s);
    assert.ok(await page.locator('#sp-next').isDisabled());
    assert.equal(await page.locator('.dy-modal').getAttribute('role'), 'alertdialog');
    const lookups = await calls(page, 'beneficiary_lookup'); assert.deepEqual(lookups[0].args, { p_phone: '+96898765432' });
  });
  await ok('le bouton « موافق / OK » ferme la fenêtre', async () => {
    assert.match(await page.locator('#dy-ok').innerText(), /موافق/); assert.match(await page.locator('#dy-ok').innerText(), /OK/);
    await wait(650); await page.click('#dy-ok'); await page.waitForFunction(() => !document.querySelector('.dy-modal'), null, { timeout: 4000 });
  });
  await ok('numéro inconnu : AUCUN nom inventé, la fenêtre s’affiche quand même', async () => {
    await startSend(page); await typeNumber(page, '97000111');
    await page.waitForSelector('.dy-modal', { timeout: 5000 });
    assert.equal(await page.locator('#sp-known .sp-known').count(), 0);
    await wait(650); await page.click('#dy-ok'); await page.waitForFunction(() => !document.querySelector('.dy-modal'));
  });
  await ok('rien n’est envoyé, aucun code PIN demandé, aucune transaction créée', async () => {
    assert.equal((await calls(page, 'fiat_send_external')).length, 0); assert.equal((await calls(page, 'intl_send')).length, 0);
    assert.equal((await calls(page, 'verify_pin')).length, 0); assert.equal(await page.locator('.ps').count(), 0);
  });
  await ok('Continue touché malgré tout : le serveur est ré-interrogé, la fenêtre revient, pas de passage au montant', async () => {
    await startSend(page); await typeNumber(page, '98765432'); await page.waitForSelector('.dy-modal'); await wait(650); await page.click('#dy-ok'); await page.waitForFunction(() => !document.querySelector('.dy-modal'));
    await page.evaluate(() => { const b = document.getElementById('sp-next'); b.disabled = false; b.click(); });
    await page.waitForSelector('.dy-modal', { timeout: 5000 });
    assert.equal(await page.evaluate(() => R.current()), 'country-select');
    await wait(650); await page.click('#dy-ok');
  });
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
{
  const { ctx, page, logs } = await openApp(browser, url, { settle: 400 });
  console.log('\n[DY activé après l’écran de confirmation]');
  await ok('le serveur refuse : retour à l’accueil, fenêtre bilingue, aucun reçu, aucun « échec » inventé', async () => {
    await startSend(page); await typeNumber(page, '99887766'); await page.click('#sp-next');
    await page.waitForSelector('#tx-amount.active #amt-input'); await page.fill('#amt-input', '5'); await page.dispatchEvent('#amt-input', 'input'); await page.click('#amt-next');
    await page.waitForSelector('#tx-review.active'); await page.evaluate(() => { window.__rpcLog = []; window.__dyFlipOnPin = true; });   /* the server switches DY on while the person types the code */
    await page.evaluate(() => document.getElementById('swipe-kb-confirm').click());
    await page.waitForSelector('.ps', { timeout: 8000 }); await wait(400); for (const k of '482913') await page.keyboard.press(k);
    await page.waitForSelector('.dy-modal', { timeout: 20000 });
    const sent = await calls(page, 'fiat_send_external'); assert.equal(sent.length, 1);
    assert.equal(await page.evaluate(() => R.current()), 'home');
    assert.equal(await page.locator('#receipt.active').count(), 0); assert.equal(await page.locator('#tx-result.active').count(), 0);
    assert.equal(await page.evaluate(() => (Runtime.transactions || []).some(x => x.id === 'tx-new')), false, 'no transaction may exist');
    assert.ok((await page.locator('.dy-modal').innerText()).includes(EN_T));
  });
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
for (const lang of ['en', 'fr', 'ar']){
  const { ctx, page, logs } = await openApp(browser, url, { admin: true, lang, settle: 400 });
  console.log('\n[administrateur · ' + lang + ']');
  await ok('l’entrée est dans Services (à côté des versements) et ouvre l’écran : DY coupé, aucun changement enregistré', async () => {
    await page.evaluate(() => R.go('services', { force: true })); await page.waitForSelector('[data-nav="dy-control"]');
    await page.click('[data-nav="dy-control"]'); await page.waitForSelector('#dy-control.active #dy-switch', { timeout: 8000 });
    assert.equal(await page.locator('#dy-switch').getAttribute('aria-checked'), 'false');
    assert.equal(await page.locator('#dy-control .dy-state.off').count(), 1);
    assert.ok((await calls(page, 'admin_dy_overview')).length >= 1);
    assert.ok((await page.locator('#dy-control .dy-preview').innerText()).includes(EN_T), 'the bilingual preview is shown');
  });
  await ok('pas de débordement horizontal', async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)));
  if (lang === 'en'){
    await ok('activer demande confirmation (rien n’est appelé avant), puis admin_dy_set(true) exact ; l’état et l’historique suivent', async () => {
      await page.click('#dy-switch'); await page.waitForSelector('#dy-go');
      assert.equal((await calls(page, 'admin_dy_set')).length, 0);
      await page.click('#dy-no'); await wait(500); assert.equal((await calls(page, 'admin_dy_set')).length, 0);
      await page.click('#dy-switch'); await page.waitForSelector('#dy-go'); await wait(650); await page.click('#dy-go');
      await page.waitForFunction(() => document.getElementById('dy-switch') && document.getElementById('dy-switch').getAttribute('aria-checked') === 'true', null, { timeout: 8000 });
      const c = await calls(page, 'admin_dy_set'); assert.equal(c.length, 1); assert.deepEqual(c[0].args, { p_enabled: true });
      assert.equal(await page.locator('#dy-control .dy-state.on').count(), 1);
      assert.equal(await page.locator('#dy-control .dy-hist li').count(), 1);
      assert.match(await page.locator('#dy-control .dy-meta').innerText(), /Amira Al Said/);
    });
    await ok('le serveur (faux) bloque ensuite un envoi sans rien débiter ; couper DY rétablit', async () => {
      const r = await page.evaluate(async () => (await sb.rpc('fiat_send_external', { p_amount: 1, p_dest_currency: 'OMR', p_provider: 'x', p_beneficiary: {}, p_idempotency_key: 'k-dy-test-1', p_pin_grant: 'grant-1' })).data);
      assert.deepEqual(r, { ok: false, error: 'TRANSFER_UNAVAILABLE', blocked_by: 'DY' });
      await page.click('#dy-switch'); await page.waitForSelector('#dy-go'); await wait(650); await page.click('#dy-go');
      await page.waitForFunction(() => document.getElementById('dy-switch').getAttribute('aria-checked') === 'false', null, { timeout: 8000 });
      assert.equal(await page.locator('#dy-control .dy-hist li').count(), 2);
      assert.deepEqual((await calls(page, 'admin_dy_set')).map(c => c.args), [{ p_enabled: true }, { p_enabled: false }]);
    });
  }
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
