/* Parcours d'envoi : Oman inchangé, Orange Money Mali (+223, 8 chiffres) et Côte d'Ivoire (+225, 10 chiffres).
   Vérifie ce qui part RÉELLEMENT vers le serveur (fiat_send_external) avec le faux client. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', e.message); });
async function startSend(page){ await page.evaluate(() => { txReset(); R.go('country-select'); }); await page.waitForSelector('#country-select.active #sp-num'); }
async function typePin(page){ await page.waitForSelector('.ps', { timeout: 8000 }); await page.waitForTimeout(400); for (const k of '482913') await page.keyboard.press(k); }

for (const lang of ['en', 'fr', 'ar']){
  const { ctx, page, logs } = await openApp(browser, url, { lang, settle: 400 });
  console.log('\n[' + lang + ']');
  await ok('picker shows 3 destinations, Oman selected', async () => {
    await startSend(page);
    assert.equal(await page.locator('.dst-opt').count(), 3);
    assert.equal(await page.locator('.dst-opt.on').getAttribute('data-dst'), 'OM');
    assert.equal(await page.locator('#sp-dial').textContent(), '+968');
  });
  await ok('Oman rules unchanged (prefix 7/9, 8 digits)', async () => {
    await page.fill('#sp-num', '81234567'); assert.ok((await page.locator('#sp-err').textContent()).length > 0); assert.ok(await page.locator('#sp-next').isDisabled());
    await page.fill('#sp-num', '99887766'); await page.dispatchEvent('#sp-num', 'input');
    assert.equal(await page.inputValue('#sp-num'), '9988 7766'); assert.ok(!(await page.locator('#sp-next').isDisabled()));
  });
  await ok('Mali: +223, 8 digits, grouped, note shown', async () => {
    await page.click('.dst-opt[data-dst=ML]');
    assert.equal(await page.locator('#sp-dial').textContent(), '+223'); assert.equal(await page.inputValue('#sp-num'), '');
    assert.equal(await page.locator('#sp-note').isVisible(), true);
    await page.fill('#sp-num', '+223 76123456'); await page.dispatchEvent('#sp-num', 'input');
    assert.equal(await page.inputValue('#sp-num'), '76 12 34 56'); assert.ok(!(await page.locator('#sp-next').isDisabled()));
    await page.fill('#sp-num', '7612'); await page.dispatchEvent('#sp-num', 'input'); await page.dispatchEvent('#sp-num', 'blur');
    assert.ok((await page.locator('#sp-err').textContent()).length > 0); assert.ok(await page.locator('#sp-next').isDisabled());
  });
  await ok('Côte d’Ivoire: +225, 10 digits starting with 0', async () => {
    await page.click('.dst-opt[data-dst=CI]');
    assert.equal(await page.locator('#sp-dial').textContent(), '+225');
    await page.fill('#sp-num', '7123456789'); await page.dispatchEvent('#sp-num', 'input');
    assert.ok((await page.locator('#sp-err').textContent()).length > 0); assert.ok(await page.locator('#sp-next').isDisabled());
    await page.fill('#sp-num', '0707070707'); await page.dispatchEvent('#sp-num', 'input');
    assert.equal(await page.inputValue('#sp-num'), '07 07 07 07 07'); assert.ok(!(await page.locator('#sp-next').isDisabled()));
  });
  if (lang === 'en'){
    await ok('full Mali transfer: estimate, review, request payload, receipt', async () => {
      await startSend(page); await page.click('.dst-opt[data-dst=ML]');
      await page.fill('#sp-num', '76123456'); await page.dispatchEvent('#sp-num', 'input'); await page.click('#sp-next');
      await page.waitForSelector('#tx-amount.active #amt-input');
      await page.fill('#amt-input', '25'); await page.dispatchEvent('#amt-input', 'input');
      const est = await page.locator('#amt-est').innerText(); assert.match(est.replace(/\s/g, ' '), /XOF 37,300/); assert.match(est, /1 OMR = 1,492 XOF/);
      await page.click('#amt-next'); await page.waitForSelector('#tx-review.active');
      const rv = await page.locator('#tx-review').innerText(); assert.match(rv, /Orange Money · Mali/); assert.match(rv, /\+223 76 12 34 56/); assert.match(rv, /XOF 37,300/);
      await page.evaluate(() => { window.__rpcLog = []; });
      await page.evaluate(() => document.getElementById('swipe-kb-confirm').click()); await typePin(page);
      await page.waitForSelector('#receipt.active', { timeout: 20000 });
      const call = await page.evaluate(() => window.__rpcLog.filter(c => c.name === 'fiat_send_external' && c.args.p_pin_grant).pop());
      assert.ok(call, 'fiat_send_external was not called');
      assert.equal(call.args.p_dest_currency, 'XOF'); assert.equal(call.args.p_provider, 'Orange Money'); assert.equal(call.args.p_amount, 25);
      assert.deepEqual(call.args.p_beneficiary, { firstName: '', lastName: '', phone: '+22376123456', country: 'ML', identifierType: 'MOBILE_MONEY' });
      const rc = await page.locator('#receipt').innerText(); assert.match(rc, /XOF 37,300/); assert.match(rc, /OMR 25\.000/);
    });
    await ok('full Côte d’Ivoire transfer payload', async () => {
      await startSend(page); await page.click('.dst-opt[data-dst=CI]');
      await page.fill('#sp-num', '0707070707'); await page.dispatchEvent('#sp-num', 'input'); await page.click('#sp-next');
      await page.waitForSelector('#tx-amount.active #amt-input'); await page.fill('#amt-input', '10'); await page.dispatchEvent('#amt-input', 'input'); await page.click('#amt-next');
      await page.waitForSelector('#tx-review.active'); await page.evaluate(() => { window.__rpcLog = []; });
      await page.evaluate(() => document.getElementById('swipe-kb-confirm').click()); await typePin(page); await page.waitForSelector('#receipt.active', { timeout: 20000 });
      const call = await page.evaluate(() => window.__rpcLog.filter(c => c.name === 'fiat_send_external' && c.args.p_pin_grant).pop());
      assert.equal(call.args.p_beneficiary.country, 'CI'); assert.equal(call.args.p_beneficiary.phone, '+2250707070707'); assert.equal(call.args.p_dest_currency, 'XOF');
    });
    await ok('Oman transfer still sends OMR / PHONE', async () => {
      await startSend(page); await page.fill('#sp-num', '99887766'); await page.dispatchEvent('#sp-num', 'input'); await page.click('#sp-next');
      await page.waitForSelector('#tx-amount.active #amt-input'); await page.fill('#amt-input', '5'); await page.dispatchEvent('#amt-input', 'input');
      assert.equal(await page.locator('#amt-est').isVisible(), false); await page.click('#amt-next');
      await page.waitForSelector('#tx-review.active'); await page.evaluate(() => { window.__rpcLog = []; });
      await page.evaluate(() => document.getElementById('swipe-kb-confirm').click()); await typePin(page); await page.waitForSelector('#receipt.active', { timeout: 20000 });
      const call = await page.evaluate(() => window.__rpcLog.filter(c => c.name === 'fiat_send_external' && c.args.p_pin_grant).pop());
      assert.deepEqual(call.args.p_beneficiary, { firstName: '', lastName: '', phone: '+96899887766', country: 'OM', identifierType: 'PHONE' }); assert.equal(call.args.p_dest_currency, 'OMR');
    });
  }
  await ok('no page errors', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
