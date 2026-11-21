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
  await ok('cartes : la face arrière est superposée à la face avant (pas empilée dessous)', async () => {
    await page.evaluate(() => R.go('cards', { force: true })); await page.waitForSelector('.rv-card .rv-front'); await wait(900);
    const g = await page.evaluate(() => { const f = document.querySelector('.rv-card .rv-front').getBoundingClientRect(), b = document.querySelector('.rv-card .rv-back').getBoundingClientRect(); return { ft: Math.round(f.top), bt: Math.round(b.top), fh: Math.round(f.height), bh: Math.round(b.height) }; });
    assert.ok(Math.abs(g.ft - g.bt) <= 2, 'faces are stacked: ' + JSON.stringify(g));
  });
  await ok('le symbole du rial remplace le code (le texte OMR reste) : accueil, historique', async () => {
    await page.evaluate(() => R.go('home', { force: true })); await wait(700);
    assert.ok(await page.locator('#home .ds-bal-amt .rv-cur[data-cur="OMR"]').count() >= 1);
    assert.match(await page.locator('#home .ds-bal-amt').textContent(), /OMR/);
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
  console.log('\n[confirmation et reçu]');
  await ok('le symbole du rial sur l’écran de confirmation', async () => {
    await page.evaluate(() => { txReset(); R.go('country-select'); }); await page.waitForSelector('#country-select.active #sp-num');
    await page.fill('#sp-num', '99887766'); await page.dispatchEvent('#sp-num', 'input'); await page.waitForFunction(() => !document.getElementById('sp-next').disabled); await wait(500); await page.click('#sp-next');
    await page.waitForSelector('#tx-amount.active #amt-input'); await page.fill('#amt-input', '5'); await page.dispatchEvent('#amt-input', 'input'); await wait(500); await page.click('#amt-next');
    await page.waitForSelector('#tx-review.active'); assert.ok(await page.locator('#tx-review .summary-v .rv-cur[data-cur="OMR"]').count() >= 1);
  });
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
{
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'ar', width: 360, height: 780, settle: 500 });
  console.log('\n[solde sur un téléphone étroit (360 px)]');
  for (const bal of [48.067, 1284.5, 12345678.9]){
    await ok('le solde ' + bal + ' tient dans sa carte (jamais coupé), sans débordement horizontal', async () => {
      await page.evaluate(b => { const a = Runtime.accounts.find(x => x.type === 'MAIN'); a.balance = b; a.availableBalance = b; R.go('home', { force: true }); }, bal);
      await wait(1500);
      const m = await page.evaluate(() => { const e = document.getElementById('px-bal-amt'), r = document.createRange(); r.selectNodeContents(e); return { w: r.getBoundingClientRect().width, cw: e.clientWidth, ov: document.documentElement.scrollWidth > window.innerWidth + 1 }; });
      assert.ok(m.w <= m.cw, JSON.stringify(m)); assert.equal(m.ov, false);
    });
  }
  await ok('no page errors', async () => assert.deepEqual(logs, []));
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
