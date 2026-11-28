/* DYT 14.4.0 — the redesigned screens keep every action wired to the existing function:
   - opening presentation: three screens, real buttons, « Skip » → sign-in, last button → sign-up, language switch
   - sign-in: forgotten password → reset, create account → sign-up
   - home: avatar → account, bell → notifications, four actions, three banners → deposit / send / markets
   - My assets: details → asset page, search → markets, actions → deposit / send / withdraw / exchange
   - settings: every category row opens its page or scrolls to its section; log out signs out
   - messages: the new capsule is used by every toast() call */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const cur = page => page.evaluate(() => R.current());

{
  console.log('\n[ouverture et connexion]');
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'ar', signedOut: true, settle: 700 });
  await wait(900);
  await ok('présentation : 3 écrans, chacun son message et son bouton, « تخطي » visible', async () => {
    assert.equal(await page.locator('.wp .wp-slide').count(), 3);
    assert.equal(await page.locator('.wp [data-ob-cta]').count(), 3);
    assert.equal((await page.locator('#ob-skip').innerText()).trim(), 'تخطي');
    const titles = await page.$$eval('.wp .wp-glass h1', h => h.map(x => x.textContent));
    assert.equal(new Set(titles).size, 3);
  });
  await ok('le bouton de chaque écran passe au suivant ; les points suivent', async () => {
    await page.click('[data-ob-cta="0"]'); await wait(900);
    assert.ok(await page.locator('.wp-slide[data-k="1"].on').count());
    await page.click('[data-ob-cta="1"]'); await wait(900);
    assert.ok(await page.locator('.wp-slide[data-k="2"].on').count());
  });
  await ok('changer de langue traduit la présentation (FR)', async () => {
    await page.click('[data-ob-lang="fr"]'); await wait(400);
    assert.equal((await page.locator('#ob-skip').textContent()).trim(), 'Passer');
  });
  await ok('« Passer » mène à la connexion', async () => {
    await page.evaluate(() => { const s = document.getElementById('ob-skip'); s.style.visibility = 'visible'; s.click(); }); await wait(1200);
    assert.equal(await page.locator('.wp').count(), 0);
    assert.equal(await cur(page), 'login');
  });
  await ok('connexion : icône, titre, carte, mot de passe oublié → réinitialisation, créer un compte → inscription', async () => {
    assert.equal(await page.locator('#login .w-auth-icon').count(), 1);
    assert.equal(await page.locator('#login .w-auth-card #au-email').count(), 1);
    await page.click('#au-to-reset'); await wait(700); assert.equal(await cur(page), 'reset');
    await page.evaluate(() => R.go('login', { force: true })); await wait(600);
    await page.click('#au-to-signup'); await wait(700); assert.equal(await cur(page), 'signup');
  });
  await ok('pas d’erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
{
  console.log('\n[accueil, actifs, paramètres]');
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'fr', settle: 900 });
  const back = async () => { await page.evaluate(() => R.go('home', { force: true })); await wait(500); };
  await ok('accueil : avatar → compte, cloche → notifications', async () => {
    await page.click('#home .w-hdr [data-nav="account"]'); await wait(700); assert.equal(await cur(page), 'account');
    await back(); await page.click('#home .w-hdr [data-action="notifications"]'); await wait(700); assert.equal(await cur(page), 'notifications');
  });
  await ok('accueil (14.7.0, image du propriétaire) : les quatre actions ouvrent dépôt, échange, retrait, envoi ; une ligne de la liste des cryptos ouvre l’actif', async () => {
    for (const [i, to] of [[0, 'deposit'], [1, 'exchange'], [2, 'withdraw'], [3, 'send-internal']]){
      await back();
      await page.evaluate(k => document.querySelectorAll('#home .lt-acts .omx-act')[k].click(), i); await wait(700);
      assert.equal(await cur(page), to);
    }
    await back(); await wait(600);
    const sym = await page.evaluate(() => { const c = document.querySelector('#home .lt-cryptos .omx-row'); c.click(); return c.getAttribute('data-omx-asset'); }); await wait(800);
    assert.equal(await cur(page), 'asset');
    assert.ok(sym);
  });
  await ok('Portefeuille (14.7.0) : une ligne de « Mes actifs » ouvre l’actif, le menu ouvre le compte', async () => {
    await page.evaluate(() => R.go('wallet', { force: true })); await wait(700);
    await page.click('#wallet .omx-row[data-omx-asset="BTC"]'); await wait(800);
    assert.equal(await cur(page), 'asset');
    assert.match(await page.locator('#asset .omx-ah b').innerText(), /Bitcoin/);
    await page.evaluate(() => R.go('wallet', { force: true })); await wait(700);
    await page.click('#wallet .w-title [data-nav="account"]'); await wait(700); assert.equal(await cur(page), 'account');
  });
  await ok('Portefeuille (14.7.0) : Envoyer et Recevoir ouvrent l’envoi et les adresses de dépôt ; « + » ouvre le dépôt', async () => {
    await page.evaluate(() => R.go('wallet', { force: true })); await wait(700);
    assert.deepEqual(await page.$$eval('#wallet .lt-two .btn', b => b.map(x => x.getAttribute('data-nav'))), ['send-internal', 'deposit']);
    assert.equal(await page.locator('#wallet .lt-plus[data-nav="deposit"]').count(), 1);
  });
  await ok('paramètres (17.2.0) : la fiche profil puis un groupe par catégorie, dans cet ordre ; chaque lien ouvre sa page ; une seule déconnexion, à la fin', async () => {
    await page.evaluate(() => R.go('settings', { force: true })); await wait(700);
    const order = await page.$$eval('#settings .set-v2 > .set-cat h2', h => h.map(x => x.textContent.trim()));
    const want = await page.evaluate(() => ['set.c.acc', 'set.c.sec', 'set.c.notif', 'set.c.fin', 'set.c.look', 'set.c.info'].map(k => t(k).trim()));
    assert.deepEqual(order, want);
    assert.equal(await page.locator('#settings .w-list').count(), 0, 'plus de liste de raccourcis en double');
    assert.equal(await page.locator('#settings [data-action="sign-out"]').count(), 1, 'une seule déconnexion');
    assert.equal(await page.evaluate(() => { const k = [...document.querySelector('#settings .set-v2').children].filter(e => e.offsetHeight > 30); return k[k.length - 1].matches('.set-out'); }), true, 'la déconnexion est le dernier élément');
    assert.equal(await page.locator('#settings .settings-row > .tile:visible').count(), 0, 'aucune icône décorative');
    for (const [sel, to] of [['#settings .set-me[data-nav="profile"]', 'profile'], ['#settings [data-nav="profile-edit"]', 'profile-edit'], ['#settings [data-nav="help"]', 'help'], ['#settings [data-nav="devices"]', 'devices']]){
      await page.evaluate(() => R.go('settings', { force: true })); await wait(600);
      await page.locator(sel).first().scrollIntoViewIfNeeded(); await page.click(sel); await wait(700);
      assert.equal(await cur(page), to, sel);
    }
  });
  await ok('messages : toast() affiche la nouvelle capsule (icône, barre de temps)', async () => {
    await page.evaluate(() => toast('Copié', 'success')); await wait(200);
    assert.equal(await page.locator('#toasts .w-toast.success .w-ti svg').count(), 1);
    assert.equal(await page.locator('#toasts .w-toast .w-tb').count(), 1);
  });
  await ok('reçu : ticket, lignes à icônes, montant mis en avant ; tuiles Télécharger / Partager / Accueil reliées à leurs actions', async () => {
    await page.evaluate(() => { Runtime.receipts.push({ id:'r9', transactionId:null, reference:'OMW-TX900001', status:'COMPLETED', createdAt: Date.now(), amount: 5, currency:'USDT', fee:0, vat:0, total:5, direction:'OUT', kind:'CRYPTO_TRANSFER', beneficiary:{ name:'Sara K.' } }); R.go('receipt', { force:true }); });
    await wait(800);
    assert.equal(await page.locator('#receipt .w-ticket .receipt-hero').count(), 1);
    assert.ok(await page.locator('#receipt .w-rc-ic').count() >= 4);
    assert.equal(await page.locator('#receipt .receipt-row.w-amt').count(), 1);
    assert.deepEqual(await page.$$eval('#receipt .w-rc-tiles [data-action]', b => b.map(x => x.getAttribute('data-action'))), ['download-pdf', 'share-receipt', 'done']);
    await page.click('#receipt .w-rc-tiles [data-action="done"]'); await wait(800);
    assert.equal(await cur(page), 'home');
  });
  await ok('paramètres : « Se déconnecter » déconnecte', async () => {
    await page.evaluate(() => R.go('settings', { force: true })); await wait(600);
    await page.click('#settings .w-out[data-action="sign-out"]'); await wait(3200);   /* sign-out waits up to 2 s for the phone alerts to be released */
    assert.equal(await cur(page), 'login');
  });
  await ok('pas d’erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);
