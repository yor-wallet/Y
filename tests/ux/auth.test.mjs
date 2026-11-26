/* 16.2.0 — sign-up as asked by the owner (26/11): first name, last name, e-mail, password — no phone number;
   e-mail confirmation screen with a real « send the link again » (Supabase resend); fr / en / ar. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = async (name, fn) => { try { await fn(); console.log('  ok  ', name); } catch (e) { failed++; console.log('  FAIL', name, '\n      ', e.message.split('\n').slice(0, 3).join(' | ')); } };
const wait = ms => new Promise(r => setTimeout(r, ms));
for (const lang of ['fr', 'en', 'ar']){
  const { ctx, page, logs } = await openApp(browser, url, { lang, signedOut: true, settle: 900 });
  console.log('\n[inscription — ' + lang + ']');
  await page.evaluate(() => R.go('signup')); await wait(600);
  await ok('4 champs seulement : prénom, nom, e-mail, mot de passe — aucun téléphone', async () => {
    const ids = await page.evaluate(() => [...document.querySelectorAll('#signup input')].map(i => i.id));
    assert.deepEqual(ids, ['su-first', 'su-last', 'su-email', 'su-pass']);
    assert.equal(await page.locator('#signup input[type="tel"], #su-dial').count(), 0);
  });
  await ok('prénom manquant : message clair, aucun appel au serveur', async () => {
    await page.fill('#su-last', 'Test'); await page.fill('#su-email', 'a@example.com'); await page.fill('#su-pass', 'motdepasse1');
    await page.locator('#su-submit').evaluate(b => { b.scrollIntoView({ block: 'center' }); b.click(); }); await wait(300);
    assert.ok((await page.locator('#signup-err').innerText()).length > 10);
    assert.equal(await page.evaluate(() => (window.__authLog || []).length), 0);
  });
  await ok('inscription : Supabase reçoit prénom et nom, téléphone vide, langue, lien de retour ; écran « Vérifiez votre e-mail »', async () => {
    await page.fill('#su-first', 'Amira'); await wait(1300); await page.locator('#su-submit').evaluate(b => { b.scrollIntoView({ block: 'center' }); b.click(); }); await wait(800);
    const a = await page.evaluate(() => window.__authLog[0].args);
    assert.equal(a.email, 'a@example.com'); assert.equal(a.options.data.first_name, 'Amira'); assert.equal(a.options.data.last_name, 'Test');
    assert.equal(a.options.data.phone, ''); assert.equal(a.options.data.language, lang); assert.match(a.options.emailRedirectTo, /^http/);
    assert.equal(await page.locator('.ce-card').count(), 1);
    assert.match(await page.locator('.ce-card').innerText(), /a@example\.com/);
  });
  await ok('renvoyer le lien : vrai appel resend (type signup), confirmation affichée, bouton bloqué 60 s', async () => {
    await page.locator('#ce-resend').evaluate(b => { b.scrollIntoView({ block: 'center' }); b.click(); }); await wait(500);
    const r = await page.evaluate(() => window.__authLog.find(x => x.fn === 'resend').args);
    assert.equal(r.type, 'signup'); assert.equal(r.email, 'a@example.com');
    assert.ok(await page.locator('#ce-msg.ok').count() === 1);
    assert.equal(await page.locator('#ce-resend').isDisabled(), true);
  });
  await ok('aucune erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
