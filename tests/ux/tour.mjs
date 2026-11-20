/* usage: node tests/ux/tour.mjs <dossier-sortie> <etiquette> [variante] — parcours de captures (écrans qui demandent une mise en place) */
import path from 'node:path';
import fs from 'node:fs';
import { serve, launch, openApp } from './harness.mjs';
const out = process.argv[2] || '/tmp/tour', tag = process.argv[3] || 't', variant = process.argv[4] || 'light-en';
fs.mkdirSync(out, { recursive: true });
const v = { n: variant, theme: variant.includes('dark') ? 'dark' : 'light', lang: variant.slice(-2), scheme: variant.includes('dark') ? 'dark' : 'light' };
const { srv, url } = await serve(); const browser = await launch();
const wait = ms => new Promise(r => setTimeout(r, ms));
const steps = [
  ['receive', p => p.evaluate(() => R.go('receive', { force: true }))],
  ['notifications', p => p.evaluate(() => R.go('notifications', { force: true }))],
  ['help', p => p.evaluate(() => R.go('help', { force: true }))],
  ['send1', p => p.evaluate(() => { txReset(); R.go('country-select', { force: true }); })],
  ['send1-ml', async p => { await p.evaluate(() => { txReset(); R.go('country-select', { force: true }); }); await wait(500); await p.click('.dst-opt[data-dst=ML]'); await p.fill('#sp-num', '76123456'); }],
  ['send2', async p => { await p.evaluate(() => { txReset(); R.go('country-select', { force: true }); }); await wait(500); await p.click('.dst-opt[data-dst=ML]'); await p.fill('#sp-num', '76123456'); await p.click('#sp-next'); await wait(700); await p.fill('#amt-input', '25'); }],
  ['send3', async p => { await p.click('#amt-next'); await wait(700); }],
  ['receipt', async p => { await p.evaluate(() => { Runtime.receipts.push({ id:'r1', transactionId:'tx-1', reference:'YOR-TX100001', status:'SUCCESS', createdAt: Date.now(), amount: 25.5, currency:'OMR', fee:0, vat:0, total:25.5, direction:'OUT', kind:'FIAT_EXTERNAL', destinationAmount: 38046, destinationCurrency:'XOF', exchangeRate:1492, beneficiary:{ name:'+22376123456', phone:'+22376123456', country:'ML', networkName:'Orange Money' } }); R.go('receipt', { force:true }); }); }],
  ['processing', p => p.evaluate(() => { TX_STATE.breakdown = { amount: 25.5, fee: 0, vat: 0, total: 25.5 }; TX_STATE.beneficiary = { phone: '+22376123456', country: 'ML' }; R.go('processing', { force: true }); window.__ph = ['secure','send','success']; let i = 0; setInterval(() => SendAnim.setPhase(window.__ph[i++ % 3]), 1200); })],
  ['search', async p => { await p.evaluate(() => R.go('home', { force: true })); await wait(600); await p.click('[data-px="search"]'); }],
  ['cards', p => p.evaluate(() => R.go('cards', { force: true }))],
  ['profile-edit', p => p.evaluate(() => R.go('profile-edit', { force: true }))],
  ['privacy', p => p.evaluate(() => R.go('privacy', { force: true }))],
  ['devices', p => p.evaluate(() => R.go('devices', { force: true }))],
];
const { ctx, page, logs } = await openApp(browser, url, Object.assign({ scale: 2 }, v));
for (const [name, fn] of steps){
  try { await fn(page); await wait(name === 'processing' ? 900 : 1300); await page.screenshot({ path: path.join(out, `${tag}-${name}.png`) }); }
  catch (e) { console.log('step', name, 'failed:', e.message.split('\n')[0]); }
}
// signed-out + onboarding + lock
await ctx.close();
{ const o = await openApp(browser, url, Object.assign({ scale: 2, signedOut: true }, v)); await wait(1800); await o.page.screenshot({ path: path.join(out, `${tag}-onboarding.png`) });
  await o.page.evaluate(() => { try { Onboarding.show = Onboarding.show; } catch(e){} R.go('login', { force: true, reset: true }); }); await wait(1200); await o.page.screenshot({ path: path.join(out, `${tag}-login.png`) });
  await o.page.evaluate(() => R.go('signup', { force: true, reset: true })); await wait(1200); await o.page.screenshot({ path: path.join(out, `${tag}-signup.png`) });
  console.log('signedout errors:', o.logs.slice(0, 4)); await o.ctx.close(); }
{ const o = await openApp(browser, url, Object.assign({ scale: 2, unlock: false }, v)); await o.page.waitForSelector('.yl', { timeout: 15000 }); await wait(1200); await o.page.keyboard.press('4'); await o.page.keyboard.press('8'); await wait(500); await o.page.screenshot({ path: path.join(out, `${tag}-lock.png`) }); await o.ctx.close(); }
console.log('errors:', logs.slice(0, 6));
await browser.close(); srv.close();
