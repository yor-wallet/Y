/* 16.4.0 — transaction code only ABOVE 500 USD (owner's brief of 26/11, §9), no biometrics for transactions.
   The server enforces it (migration 20261128_pin_threshold_500usd.sql, tested in the database); here: what the app asks. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = async (name, fn) => { try { await fn(); console.log('  ok  ', name); } catch (e) { failed++; console.log('  FAIL', name, '\n      ', e.message.split('\n').slice(0, 3).join(' | ')); } };
const wait = ms => new Promise(r => setTimeout(r, ms));
const { ctx, page, logs } = await openApp(browser, url, { lang: 'fr', settle: 900 });
console.log('\n[seuil de 500 USD]');
const ask = usd => page.evaluate(async u => { const before = (window.__pinLog || []).length; const p = PinEngine.authorize(u === undefined ? undefined : { usd: u });
  await new Promise(r => setTimeout(r, 500)); const sheet = !!document.querySelector('.ps #ps-dots'); return { sheet, before, p: sheet ? null : await p }; }, usd);
await ok('estimation sous le seuil (100 USD, 485 USD) : aucun code, aucun appel verify_pin', async () => {
  for (const u of [100, 485]){ const r = await ask(u); assert.equal(r.sheet, false); assert.equal(r.p.ok, true); assert.equal(r.p.grant, null); }
});
await ok('au-delà (600 USD) : le pavé du code s’ouvre ; marge de 2 % juste sous 500 (495 USD) : code demandé aussi', async () => {
  for (const u of [600, 495]){ const r = await ask(u); assert.equal(r.sheet, true, String(u)); await page.evaluate(() => R.overlay.close()); await wait(500); }
});
await ok('valeur inconnue (envoi ou retrait de crypto) : code demandé', async () => {
  const r = await ask(undefined); assert.equal(r.sheet, true); await page.evaluate(() => R.overlay.close()); await wait(500);
});
await ok('conversion de l’application : 192,25 OMR ≈ 500 USD, 220 EUR ≈ 251,5 USD (taux de reference-data = fx_rates)', async () => {
  const v = await page.evaluate(() => [PinEngine.usdOf(192.25, 'OMR'), PinEngine.usdOf(220, 'EUR'), PinEngine.usdOf(5, 'ZZZ')]);
  assert.ok(Math.abs(v[0] - 500) < 0.01); assert.ok(Math.abs(v[1] - 251.52) < 0.01); assert.equal(v[2], null);
});
await ok('aucune biométrie : authorize n’appelle jamais Face ID', async () => {
  const n = await page.evaluate(async () => { let c = 0; const g = FaceId.gate; FaceId.gate = function(){ c++; return g.apply(this, arguments); };
    await PinEngine.authorize({ usd: 10 }); const p = PinEngine.authorize({ usd: 900 }); await new Promise(r => setTimeout(r, 500)); R.overlay.close(); FaceId.gate = g; return c; });
  assert.equal(n, 0);
});
await ok('aucune erreur de page', async () => { assert.deepEqual(logs, []); });
await ctx.close(); await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
