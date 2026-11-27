/* Régressions corrigées pendant la passe de contrôle (13.2.0) :
   - cartes : les deux faces d'une carte ne doivent pas s'empiler (la face arrière ne doit pas apparaître sous la carte) ;
   - arabe : les notifications de transfert s'affichent en arabe, construites avec les vraies valeurs (montant, devise, nom) ;
   - arabe : un nom latin trop long est coupé à la FIN (la direction du titre suit son texte) ;
   - le symbole du rial est dessiné à la place du code sur l'accueil, l'historique, la confirmation et le reçu, le texte « OMR » restant dans la page. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const wait = ms => new Promise(r => setTimeout(r, ms));
for (const lang of ['en', 'ar']){
  const { ctx, page, logs } = await openApp(browser, url, { lang, settle: 500 });
  console.log('\n[' + lang + ']');
  await ok('cartes virtuelles retirées : aucune entrée (accueil, services, compte, tiroir, recherche), le lien #/cards ne mène nulle part, plus de raccourci', async () => {
    for (const id of ['home', 'services', 'account', 'wallet', 'profile']){ await page.evaluate(i => R.go(i, { force: true }), id); await wait(450); assert.equal(await page.locator('#' + id + ' [data-nav="cards"], #' + id + ' [data-nav="cards-add"]').count(), 0, 'a card entry is still on ' + id); }
    await page.evaluate(() => R.go('cards', { force: true })); await wait(500);
    assert.equal(await page.locator('.rv-card').count(), 0, 'card faces must be gone');
    assert.notEqual(await page.evaluate(() => R.current()), 'cards');
    const manifest = await (await fetch(url + 'manifest.webmanifest')).json();
    assert.ok(!(manifest.shortcuts || []).some(s => /cards/i.test(s.url + s.name)), 'the Cards shortcut must be gone');
  });
  await ok('solde masqué au démarrage ; le symbole du rial remplace le code (le texte OMR reste) : compte, historique', async () => {
    await page.evaluate(() => R.go('home', { force: true })); await wait(700);
    assert.equal(await page.evaluate(() => Runtime.hideBalance), true, 'a session starts with the balance hidden');
    assert.match(await page.locator('#home [data-omx-total]').textContent(), /^[•\s]+$/);
    await page.click('#home [data-action="toggle-balance"]'); await wait(900);                 /* the eye shows it */
    assert.match(await page.locator('#home [data-omx-total]').textContent(), /^\$[\d,]+\.\d{2}$/);
    assert.match(await page.locator('#home .omx-ts').textContent(), /OMR/);
    await page.evaluate(() => R.go('account', { force: true })); await wait(600);
    assert.ok(await page.locator('#account .hub-amt .rv-cur[data-cur="OMR"]').count() >= 1, 'account wallet card');
    await page.evaluate(() => R.go('history', { force: true })); await wait(800);
    assert.ok(await page.locator('#history .item-amount .rv-cur[data-cur="OMR"]').count() >= 3, 'history rows');
    const w = await page.evaluate(() => { const e = document.querySelector('#history .item-amount .rv-cur'); const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, mask: getComputedStyle(e).webkitMaskImage || getComputedStyle(e).maskImage }; });
    assert.ok(w.w > 8 && w.h > 4 && /omr-symbol\.svg/.test(w.mask), JSON.stringify(w));
  });
  await ok('notifications de transfert dans la langue de l’application, avec les vraies valeurs', async () => {
    await page.evaluate(() => R.go('notifications', { force: true })); await wait(800);
    const txt = await page.locator('#notifications').innerText();
    if (lang === 'ar'){ assert.match(txt, /استلمت 120\.000 OMR من Khalid Al Rawahi/); assert.match(txt, /تم إرسال 25\.500 OMR إلى Salim Al Harthy/); assert.doesNotMatch(txt, /Money received|Transfer sent/); }
    else { assert.match(txt, /You received OMR 120\.000 from Khalid Al Rawahi/); assert.match(txt, /OMR 25\.500 sent to Salim Al Harthy/); }
  });
  if (lang === 'ar'){
    await ok('un nom latin dans une ligne arabe : titre en « plaintext » (coupé à la fin, aligné à droite)', async () => {
      await page.evaluate(() => R.go('history', { force: true })); await wait(800);
      const c = await page.evaluate(() => { const e = document.querySelector('#history .item-title'); const s = getComputedStyle(e); return { ub: s.unicodeBidi, ta: s.textAlign }; });
      assert.equal(c.ub, 'plaintext'); assert.equal(c.ta, 'right');
    });
  }
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
{
  const { ctx, page, logs } = await openApp(browser, url, { settle: 500 });
  console.log('\n[14.0.0 — transferts retirés de l’interface]');
  await ok('aucun bouton de transfert : barre, accueil, services, recherche', async () => {
    for (const id of ['home', 'services', 'account', 'wallet']){ await page.evaluate(i => R.go(i, { force: true }), id); await wait(400);
      assert.equal(await page.locator('[data-nav="country-select"],[data-nav="receive"],[data-nav="tx-amount"]').count(), 0, id); }
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('#bottom-nav .nav-item')].map(a => a.getAttribute('data-nav'))), ['home', 'spot', 'markets', 'networks', 'wallet']);   /* 14.7.0 (owner's reference image): Swap is the raised round button in the middle */   /* 14.5.0 main menu; Activity and Account are on the home header */
  });
  await ok('un ancien lien vers un écran de transfert ramène à l’accueil (rien n’est envoyé)', async () => {
    for (const id of ['country-select', 'tx-amount', 'tx-review', 'receive', 'tx-result']){
      await page.evaluate(i => R.go(i, { force: true }), id); await wait(300);
      assert.equal(await page.evaluate(() => R.current()), 'home', id);
    }
    assert.equal(await page.evaluate(() => (window.__rpcLog || []).filter(x => /send|transfer/.test(x.name)).length), 0);
  });
  await ok('un ancien lien d’achat / vente / échange ouvre le vrai Swap (aucune ancienne fonction appelée)', async () => {
    for (const id of ['crypto-buy', 'crypto-buy-amount', 'crypto-sell', 'crypto-sell-amount', 'crypto-swap', 'crypto-swap-to', 'crypto-swap-amount']){
      await page.evaluate(i => R.go(i, { force: true }), id); await wait(300);
      assert.equal(await page.evaluate(() => R.current()), 'exchange', id);
    }
    assert.equal(await page.evaluate(() => (window.__rpcLog || []).filter(x => /^crypto_(buy|sell|swap)$/.test(x.name)).length), 0);
    await page.evaluate(() => R.go('home', { force: true })); await wait(300);
  });
  await ok('les anciens transferts restent dans l’historique', async () => {
    await page.evaluate(() => R.go('history', { force: true })); await wait(700);
    assert.match(await page.locator('#history').innerText(), /Salim Al Harthy/);
  });
  await ok('le portefeuille CFA (XOF) n’apparaît nulle part, mais il est conservé', async () => {
    const r = await page.evaluate(() => ({ shown: Runtime.accounts.map(a => a.currency), kept: (Runtime.accountsArchived || []).map(a => a.currency) }));
    assert.deepEqual(r.shown, ['OMR']); assert.deepEqual(r.kept, ['XOF']);
    for (const id of ['home', 'account', 'wallet']){ await page.evaluate(i => R.go(i, { force: true }), id); await wait(400); assert.doesNotMatch(await page.locator('#' + id).innerText(), /XOF|CFA|850[ ,.]?000/, id); }
  });
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
{
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'ar', width: 360, height: 780, settle: 500 });
  console.log('\n[solde sur un téléphone étroit (360 px)]');
  for (const bal of [48.067, 1284.5, 12345678.9]){
    await ok('le solde ' + bal + ' tient dans sa carte (jamais coupé), sans débordement horizontal', async () => {
      await page.evaluate(b => { Runtime.hideBalance = false; const a = Runtime.accounts.find(x => x.type === 'MAIN'); a.balance = b; a.availableBalance = b; R.go('home', { force: true }); }, bal);
      await wait(1500);
      const m = await page.evaluate(() => { const e = document.querySelector('#home [data-omx-total]'), r = document.createRange(); r.selectNodeContents(e); return { w: r.getBoundingClientRect().width, cw: e.clientWidth, ov: document.documentElement.scrollWidth > window.innerWidth + 1 }; });
      assert.ok(m.w <= m.cw, JSON.stringify(m)); assert.equal(m.ov, false);
    });
  }
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
