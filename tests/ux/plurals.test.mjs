/* 15.2.0 — a message that carries a number agrees with it, in each language: « 1 attempt left » / « 3 attempts left », « محاولة واحدة » / « محاولتان » / « 3 محاولات » / « 11 محاولة »
   (before: « {n} attempt(s) left » and, in Arabic, « 3 محاولة »). Helper: tp() in js/i18n/translations.js, categories from Intl.PluralRules. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const { ctx, page } = await openApp(browser, url, { signedOut: true, lang: 'en', settle: 200 });
const say = (lang, n) => page.evaluate(([l, k]) => { const keep = LANG; LANG = l; try { return tp('pin.wrong', k); } finally { LANG = keep; } }, [lang, n]);
console.log('\n[pluriels du code PIN]');
await ok('anglais : 1 attempt / 3 attempts', async () => {
  assert.equal(await say('en', 1), 'Wrong PIN. 1 attempt left.');
  assert.equal(await say('en', 3), 'Wrong PIN. 3 attempts left.');
});
await ok('français : 1 essai restant / 2 essais restants', async () => {
  assert.equal(await say('fr', 1), 'PIN incorrect. 1 essai restant.');
  assert.equal(await say('fr', 2), 'PIN incorrect. 2 essais restants.');
});
await ok('arabe : une, deux, trois à dix, onze et plus', async () => {
  assert.equal(await say('ar', 1), 'رمز PIN خاطئ. بقيت محاولة واحدة.');
  assert.equal(await say('ar', 2), 'رمز PIN خاطئ. بقيت محاولتان.');
  assert.equal(await say('ar', 3), 'رمز PIN خاطئ. بقيت 3 محاولات.');
  assert.equal(await say('ar', 10), 'رمز PIN خاطئ. بقيت 10 محاولات.');
  assert.equal(await say('ar', 11), 'رمز PIN خاطئ. بقيت 11 محاولة.');
  assert.equal(await say('ar', 0), 'رمز PIN خاطئ. لم تبقَ أي محاولة.');
});
await ok('aucune clé « (s) » restante dans les textes', async () => {
  const left = await page.evaluate(() => Object.entries(TR).flatMap(([l, o]) => Object.entries(o).filter(([k, v]) => typeof v === 'string' && /\((s|es)\)|\(e?s\)/.test(v)).map(([k]) => l + ':' + k)));
  assert.deepEqual(left, [], 'pluriels « (s) » restants : ' + left.join(', '));
});
await ctx.close(); await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);
