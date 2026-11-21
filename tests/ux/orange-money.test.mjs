/* Parcours d'envoi : Oman inchangé (fiat_send_external), Orange Money Mali (intl_send : nom + prénom, +223 / 8 chiffres, enregistré « en cours »),
   Côte d'Ivoire derrière l'interrupteur FEATURES.orangeMoneyCI (éteint par défaut). Vérifie ce qui part RÉELLEMENT vers le serveur (faux client). */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const wait = ms => new Promise(r => setTimeout(r, ms));
async function startSend(page){ await page.evaluate(() => { txReset(); R.go('country-select'); }); await page.waitForSelector('#country-select.active #sp-num'); }
async function typePin(page){ await page.waitForSelector('.ps', { timeout: 8000 }); await wait(400); for (const k of '482913') await page.keyboard.press(k); }
const confirm = page => page.evaluate(() => document.getElementById('swipe-kb-confirm').click());
const lastCall = (page, name) => page.evaluate(n => window.__rpcLog.filter(c => c.name === n && c.args.p_pin_grant).pop(), name);
async function fillMali(page, num, first, last){
  await page.click('.dst-opt[data-dst=ML]');
  await page.fill('#sp-num', num); await page.dispatchEvent('#sp-num', 'input');
  if (first !== undefined){ await page.fill('#sp-first', first); await page.fill('#sp-last', last); }
}

for (const lang of ['en', 'fr', 'ar']){
  const { ctx, page, logs } = await openApp(browser, url, { lang, settle: 400 });
  console.log('\n[' + lang + ']');
  await ok('picker: Oman + Mali (Côte d’Ivoire is off), Oman selected, no name fields', async () => {
    await startSend(page);
    assert.equal(await page.locator('.dst-opt').count(), 2);
    assert.equal(await page.locator('.dst-opt.on').getAttribute('data-dst'), 'OM');
    assert.equal(await page.locator('#sp-dial').textContent(), '+968'); assert.equal(await page.locator('#sp-names').isVisible(), false);
  });
  await ok('Oman rules unchanged (prefix 7/9, 8 digits)', async () => {
    await page.fill('#sp-num', '81234567'); assert.ok((await page.locator('#sp-err').textContent()).length > 0); assert.ok(await page.locator('#sp-next').isDisabled());
    await page.fill('#sp-num', '99887766'); await page.dispatchEvent('#sp-num', 'input');
    assert.equal(await page.inputValue('#sp-num'), '9988 7766'); assert.ok(!(await page.locator('#sp-next').isDisabled()));
  });
  await ok('Mali: +223, 8 digits, grouped, names required before Continue', async () => {
    await page.click('.dst-opt[data-dst=ML]');
    assert.equal(await page.locator('#sp-dial').textContent(), '+223'); assert.equal(await page.inputValue('#sp-num'), '');
    assert.equal(await page.locator('#sp-note').isVisible(), true); assert.equal(await page.locator('#sp-names').isVisible(), true);
    await page.fill('#sp-num', '+223 76123456'); await page.dispatchEvent('#sp-num', 'input');
    assert.equal(await page.inputValue('#sp-num'), '76 12 34 56'); assert.ok(await page.locator('#sp-next').isDisabled(), 'names missing: Continue must stay disabled');
    await page.fill('#sp-first', 'Aminata'); await page.fill('#sp-last', 'Traoré');
    await page.waitForFunction(() => !document.getElementById('sp-next').disabled, null, { timeout: 3000 }).catch(async () => { throw new Error('Continue stayed disabled: ' + JSON.stringify(await page.evaluate(() => ({ num: document.getElementById('sp-num').value, f: document.getElementById('sp-first').value, l: document.getElementById('sp-last').value, err: document.getElementById('sp-err').textContent, nerr: document.getElementById('sp-nerr').textContent, dst: Destinations.get().iso })))); });
    await page.fill('#sp-last', '12'); assert.ok(await page.locator('#sp-next').isDisabled());
    await page.fill('#sp-num', '7612'); await page.dispatchEvent('#sp-num', 'input'); await page.dispatchEvent('#sp-num', 'blur');
    assert.ok((await page.locator('#sp-err').textContent()).length > 0);
  });
  if (lang === 'en'){
    await ok('full Mali transfer: minimum, estimate (rounded down), review note, intl_send payload, receipt "in progress"', async () => {
      await startSend(page); await fillMali(page, '76123456', 'Aminata', 'Traoré'); await page.click('#sp-next');
      await page.waitForSelector('#tx-amount.active #amt-input');
      await page.fill('#amt-input', '0.3'); await page.dispatchEvent('#amt-input', 'input');
      assert.match(await page.locator('#amt-err').textContent(), /0\.500/); assert.ok(await page.locator('#amt-next').isDisabled());
      await page.fill('#amt-input', '10.1'); await page.dispatchEvent('#amt-input', 'input');
      const est = await page.locator('#amt-est').innerText(); assert.match(est.replace(/\s/g, ' '), /XOF 15,069/); assert.match(est, /1 OMR = 1,492 XOF/);
      await page.click('#amt-next'); await page.waitForSelector('#tx-review.active');
      const rv = await page.locator('#tx-review').innerText(); assert.match(rv, /Orange Money · Mali/); assert.match(rv, /Aminata Traoré/); assert.match(rv, /\+223 76 12 34 56/); assert.match(rv, /In progress/);
      await page.evaluate(() => { window.__rpcLog = []; });
      await confirm(page); await typePin(page);
      await page.waitForSelector('#receipt.active', { timeout: 20000 });
      assert.equal((await page.evaluate(() => window.__rpcLog.filter(c => c.name === 'fiat_send_external').length)), 0, 'Orange Money must NOT use fiat_send_external');
      const call = await lastCall(page, 'intl_send'); assert.ok(call, 'intl_send was not called');
      assert.deepEqual(call.args, Object.assign({}, call.args, { p_country: 'ML', p_method: 'MOBILE_MONEY', p_provider: 'Orange Money', p_amount: 10.1,
        p_beneficiary: { firstName: 'Aminata', lastName: 'Traoré', phone: '+22376123456' } }));
      const rc = await page.locator('#receipt').innerText(); assert.match(rc, /Transfer in progress/); assert.match(rc, /XOF 15,069/);
      assert.doesNotMatch(rc, /Transfer successful/);
    });
    await ok('Oman transfer still goes through fiat_send_external (OMR / PHONE), confirmed at once', async () => {
      await startSend(page); await page.fill('#sp-num', '99887766'); await page.dispatchEvent('#sp-num', 'input'); await page.click('#sp-next');
      await page.waitForSelector('#tx-amount.active #amt-input'); await page.fill('#amt-input', '5'); await page.dispatchEvent('#amt-input', 'input');
      assert.equal(await page.locator('#amt-est').isVisible(), false); await page.click('#amt-next');
      await page.waitForSelector('#tx-review.active'); await page.evaluate(() => { window.__rpcLog = []; });
      await confirm(page); await typePin(page); await page.waitForSelector('#receipt.active', { timeout: 20000 });
      assert.equal((await page.evaluate(() => window.__rpcLog.filter(c => c.name === 'intl_send').length)), 0);
      const call = await lastCall(page, 'fiat_send_external');
      assert.deepEqual(call.args.p_beneficiary, { firstName: '', lastName: '', phone: '+96899887766', country: 'OM', identifierType: 'PHONE' }); assert.equal(call.args.p_dest_currency, 'OMR');
      assert.match(await page.locator('#receipt').innerText(), /Transfer successful/);
    });
  }
  await ok('no page errors', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
{
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'en', settle: 400, features: { orangeMoneyCI: true } });
  console.log('\n[Côte d’Ivoire switched on]');
  await ok('three destinations; +225, 10 digits starting with 0; payload carries country CI', async () => {
    await startSend(page); assert.equal(await page.locator('.dst-opt').count(), 3);
    await page.click('.dst-opt[data-dst=CI]'); assert.equal(await page.locator('#sp-dial').textContent(), '+225');
    await page.fill('#sp-num', '7123456789'); await page.dispatchEvent('#sp-num', 'input'); assert.ok((await page.locator('#sp-err').textContent()).length > 0);
    await page.fill('#sp-num', '0707070707'); await page.dispatchEvent('#sp-num', 'input'); assert.equal(await page.inputValue('#sp-num'), '07 07 07 07 07');
    await page.fill('#sp-first', 'Kouassi'); await page.fill('#sp-last', 'Yao'); await page.waitForFunction(() => !document.getElementById('sp-next').disabled, null, { timeout: 3000 }); await wait(500); await page.click('#sp-next');
    await page.waitForSelector('#tx-amount.active #amt-input'); await page.fill('#amt-input', '10'); await page.dispatchEvent('#amt-input', 'input'); await page.click('#amt-next');
    await page.waitForSelector('#tx-review.active'); await page.evaluate(() => { window.__rpcLog = []; });
    await confirm(page); await typePin(page); await page.waitForSelector('#receipt.active', { timeout: 20000 });
    const call = await lastCall(page, 'intl_send');
    assert.equal(call.args.p_country, 'CI'); assert.equal(call.args.p_beneficiary.phone, '+2250707070707'); assert.equal(call.args.p_provider, 'Orange Money');
  });
  await ok('no page errors', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
