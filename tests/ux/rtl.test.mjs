/* 15.2.0 — right-to-left details that are not about text: a number pad is never mirrored (1 2 3 stay left to right in Arabic, as on the PIN lock and on phones). */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
console.log('\n[droite à gauche : claviers numériques]');
for (const lang of ['en', 'ar']) {
  const { ctx, page, logs } = await openApp(browser, url, { lang, theme: 'dark', scheme: 'dark', width: 390, height: 844, touch: true });
  await ok(lang + ' : clavier du Swap — 1 2 3 de gauche à droite, 7 8 9 aussi', async () => {
    await page.evaluate(() => R.go('exchange', { force: true })); await page.waitForTimeout(900);
    const x = k => page.locator('#exchange .lt-key[data-k="' + k + '"]').evaluate(e => e.getBoundingClientRect().x);
    const [a, b, c, g, h, i] = [await x('1'), await x('2'), await x('3'), await x('7'), await x('8'), await x('9')];
    assert.ok(a < b && b < c, '1 2 3 : ' + [a, b, c].join(' < '));
    assert.ok(g < h && h < i, '7 8 9 : ' + [g, h, i].join(' < '));
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#exchange .lt-keys')).direction), 'ltr');
  });
  await ok(lang + ' : la page est bien dans le sens de la langue, sans erreur', async () => {
    assert.equal(await page.evaluate(() => document.documentElement.dir), lang === 'ar' ? 'rtl' : 'ltr');
    assert.deepEqual(logs, []);
  });
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);
