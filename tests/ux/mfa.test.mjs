/* 16.3.0 — two-step verification (TOTP, Supabase Auth MFA): turn on with QR code + verified code, abandoned set-up removed,
   sign-in asks the code before ANY data is loaded, sign out from the code screen. (Server enforcement: migration 20261128_mfa_totp.sql,
   tested in the database in a cancelled block.) */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = async (name, fn) => { try { await fn(); console.log('  ok  ', name); } catch (e) { failed++; console.log('  FAIL', name, '\n      ', e.message.split('\n').slice(0, 3).join(' | ')); } };
const wait = ms => new Promise(r => setTimeout(r, ms));
const tap = (page, sel) => page.locator(sel).first().evaluate(b => { b.scrollIntoView({ block: 'center' }); b.click(); });
const log = page => page.evaluate(() => (window.__authLog || []).map(x => x.fn));
{
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'fr', settle: 900 });
  console.log('\n[activation]');
  await page.evaluate(() => R.go('settings')); await wait(700);
  await ok('Réglages : ligne « Vérification en deux étapes », état Désactivée', async () => {
    assert.match(await page.locator('.mfa-row').innerText(), /Vérification en deux étapes[\s\S]*Désactivée/);
  });
  await ok('abandon avant le code : le facteur non vérifié est supprimé', async () => {
    await tap(page, '.mfa-row'); await wait(700);
    assert.equal(await page.locator('.mfa-qr img').count(), 1);
    await page.evaluate(() => R.overlay.close()); await wait(600);
    assert.deepEqual((await log(page)).filter(x => x.startsWith('mfa.')), ['mfa.enroll', 'mfa.unenroll']);
  });
  await ok('QR code + clé ; code faux refusé ; bon code → activée (vérifié avant activation)', async () => {
    await tap(page, '.mfa-row'); await wait(700);
    assert.match(await page.locator('.mfa-secret code').innerText(), /JBSWY3DPEHPK3PXP/);
    await page.fill('#mfa-in', '000000'); await tap(page, '#mfa-go'); await wait(500);
    assert.match(await page.locator('#mfa-err').innerText(), /incorrect/);
    await page.fill('#mfa-in', '123456'); await tap(page, '#mfa-go'); await wait(900);
    assert.equal(await page.locator('.mfa-sheet').count(), 0);
    assert.match(await page.locator('.mfa-row').innerText(), /Activée/);
  });
  await ok('aucune erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
{
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'fr', signedOut: true, settle: 900 });
  console.log('\n[connexion avec TOTP]');
  await page.evaluate(() => { sb.auth.mfa.__preset(); window.__hydrated = 0; const h = AuthEngine.hydrateRuntime; });
  await page.evaluate(() => AuthEngine.signIn('a@example.com', 'motdepasse1')); await wait(900);
  await ok('après le mot de passe : demande du code, rien n’est chargé, l’accueil n’est pas ouvert', async () => {
    assert.equal(await page.locator('.mfa-ov #mfa-gin').count(), 1);
    assert.notEqual(await page.evaluate(() => R.current()), 'home');
    assert.equal(await page.evaluate(() => !!(UserContext.get())), false);
  });
  await ok('code faux : refusé, toujours bloqué', async () => {
    await page.fill('#mfa-gin', '111111'); await wait(700);
    assert.match(await page.locator('#mfa-gerr').innerText(), /incorrect/);
    assert.equal(await page.evaluate(() => !!(UserContext.get())), false);
  });
  await ok('bon code : session aal2, les données du compte se chargent (puis le verrou habituel de l’application)', async () => {
    await page.fill('#mfa-gin', '123456'); await wait(1800);
    assert.equal(await page.locator('.mfa-ov').count(), 0);
    assert.equal(await page.evaluate(() => !!UserContext.get() && !!Runtime.profile), true);
  });
  await ok('aucune erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
{
  const { ctx, page } = await openApp(browser, url, { lang: 'ar', signedOut: true, settle: 900 });
  console.log('\n[connexion avec TOTP — se déconnecter depuis l’écran du code, arabe]');
  await page.evaluate(() => sb.auth.mfa.__preset());
  await page.evaluate(() => AuthEngine.signIn('a@example.com', 'motdepasse1')); await wait(900);
  await ok('texte en arabe, « تسجيل الخروج » ferme et déconnecte', async () => {
    assert.match(await page.locator('.mfa-ov').innerText(), /التحقق بخطوتين/);
    await tap(page, '#mfa-gout'); await wait(900);
    assert.equal(await page.locator('.mfa-ov').count(), 0);
    assert.equal(await page.evaluate(() => !!(UserContext.get())), false);
  });
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
