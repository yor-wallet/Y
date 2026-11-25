/* 15.3.0 — « comme les Réglages de l'iPhone » (css/ios.css, js/ui/ios.js): the font, the settings rows, the switch, the buttons, the large title
   and its compact bar — measured on the rendered page, in English and Arabic. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const go = async (page, id) => { await page.evaluate(i => R.go(i, { force: true }), id); await page.waitForTimeout(800); };

for (const lang of ['en', 'ar']) {
  console.log('\n[iOS — ' + lang + ']');
  const { ctx, page, logs } = await openApp(browser, url, { lang, theme: 'dark', scheme: 'dark', width: 390, height: 844, touch: true, admin: true });
  await ok('police : celle de l’iPhone d’abord (SF), Inter / IBM Plex Sans Arabic sinon ; chiffres tabulaires', async () => {
    const r = await page.evaluate(() => ({ f: getComputedStyle(document.body).fontFamily, n: getComputedStyle(document.body).fontVariantNumeric, cls: document.documentElement.className }));
    assert.match(r.f, /^-apple-system/);
    assert.match(r.f, lang === 'ar' ? /IBM Plex Sans Arabic/ : /Inter/);
    assert.match(r.n, /tabular-nums/);
    assert.match(r.cls, /\bf-inter\b/, 'off Apple devices the Inter tracking is used');
  });
  await ok('réglages : lignes de 52 px, texte 17 px normal, tuiles carrées arrondies de 30 px, trait de séparation en retrait', async () => {
    await go(page, 'settings');
    const r = await page.evaluate((lang) => {
      const row = document.querySelector('#settings .w-row'), b = row.querySelector('b'), tile = row.querySelector('.w-tile');
      const second = document.querySelectorAll('#settings .w-row')[1], sep = getComputedStyle(second, '::after');
      const rb = row.getBoundingClientRect(), tb = tile.getBoundingClientRect(), cs = getComputedStyle(b);
      return { h: Math.round(rb.height), fs: cs.fontSize, fw: cs.fontWeight, ls: cs.letterSpacing, tw: Math.round(tb.width), th: Math.round(tb.height), tr: getComputedStyle(tile).borderRadius,
        sepStart: lang === 'ar' ? sep.right : sep.left, sepH: sep.height };
    }, lang);
    assert.ok(r.h >= 52 && r.h <= 56, 'hauteur ' + r.h);
    assert.equal(r.fs, '17px'); assert.equal(r.fw, '400');
    if (lang === 'ar') assert.ok(r.ls === 'normal' || r.ls === '0px', 'pas d’approche en arabe : ' + r.ls);
    assert.equal(r.tw, 30); assert.equal(r.th, 30); assert.equal(r.tr, '8px');
    assert.equal(r.sepStart, '58px');
  });
  await ok('interrupteur iOS : 51 x 31, bouton de 27 px, jaune quand il est actif, bouton à droite (à gauche en arabe)', async () => {
    const r = await page.evaluate(() => {
      const row = document.querySelector('#settings .settings-row[role="switch"][aria-checked="true"]'), sw = row.querySelector('.switch');
      const b = sw.getBoundingClientRect(), k = getComputedStyle(sw, '::after');
      return { w: Math.round(b.width), h: Math.round(b.height), kw: k.width, bg: getComputedStyle(sw).backgroundColor, tf: k.transform };
    });
    assert.equal(r.w, 51); assert.equal(r.h, 31); assert.equal(r.kw, '27px');
    assert.equal(r.bg, 'rgb(255, 200, 0)');
    assert.match(r.tf, lang === 'ar' ? /matrix\(1, 0, 0, 1, -20, 0\)/ : /matrix\(1, 0, 0, 1, 20, 0\)/);
  });
  await ok('grand titre : 34 px gras, aligné au début ; au défilement une barre compacte montre le titre et un bouton retour nommé', async () => {
    const r0 = await page.evaluate(() => { const h = document.querySelector('#settings .w-title h1'), cs = getComputedStyle(h); return { fs: cs.fontSize, fw: cs.fontWeight, ta: cs.textAlign }; });
    assert.equal(r0.fs, '34px'); assert.equal(r0.fw, '700'); assert.ok(['start', 'left', 'right'].includes(r0.ta), 'alignement ' + r0.ta);
    await page.evaluate(() => { document.querySelector('#settings').scrollTop = 300; }); await page.waitForTimeout(700);
    const r = await page.evaluate(() => { const b = document.querySelector('#settings > .ios-cbar'); return { cls: document.querySelector('#settings').className, op: getComputedStyle(b.querySelector('.ios-cbar-in')).opacity, t: b.querySelector('.ios-cbar-t').textContent, back: (b.querySelector('.ios-cbar-back') || {}).getAttribute && b.querySelector('.ios-cbar-back').getAttribute('aria-label') }; });
    assert.match(r.cls, /ios-collapsed/); assert.equal(r.op, '1');
    assert.equal(r.t, await page.evaluate(() => document.querySelector('#settings .w-title h1').textContent.trim()));
    assert.ok(r.back && r.back.length > 1, 'nom du bouton retour : ' + r.back);
  });
  await ok('boutons : capsule pleine de 50 px, texte 17 px demi-gras', async () => {
    await go(page, 'exchange');
    const r = await page.evaluate(() => { const b = document.querySelector('#exchange .btn.btn-primary'); const cs = getComputedStyle(b), rc = b.getBoundingClientRect(); return { h: Math.round(rc.height), r: cs.borderRadius, fw: cs.fontWeight, fs: cs.fontSize, bg: cs.backgroundColor, img: cs.backgroundImage }; });
    assert.ok(r.h >= 50 && r.h <= 54, 'hauteur ' + r.h); assert.equal(r.r, '999px'); assert.equal(r.fw, '600'); assert.equal(r.fs, '17px');
    assert.equal(r.bg, 'rgb(255, 200, 0)'); assert.equal(r.img, 'none');
  });
  await ok('aucune erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);
