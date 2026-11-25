/* 15.2.0 — small phones (320 / 360 px; 360 is the most common Android width): nothing is cut, nothing is squeezed.
   Measured before the fixes: names cut to 4 letters, « Terminée » broken letter by letter, the status of an operation « in progress » / « failed » clipped out of sight
   (it was appended to the one-line sub text), the profile card breaking names and phone numbers, the second small card of the account hub leaving the screen,
   and the four quick actions of an administrator wider than the screen. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const go = async (page, id) => { await page.evaluate(i => R.go(i, { force: true }), id); await page.waitForTimeout(800); };

for (const [lang, w] of [['fr', 360], ['ar', 360], ['fr', 320]]) {
  console.log('\n[petit téléphone ' + w + ' px, ' + lang + ']');
  const { ctx, page, logs } = await openApp(browser, url, { lang, theme: 'dark', scheme: 'dark', width: w, height: 700, touch: true, admin: true });
  await ok('Accueil : les 4 actions (Crédit pour l’administrateur) tiennent entre les bords', async () => {
    await go(page, 'home');
    const r = await page.evaluate(() => [...document.querySelectorAll('#home .lt-acts .omx-act')].map(b => { const x = b.getBoundingClientRect(); return [Math.round(x.left), Math.round(x.right)]; }));
    assert.equal(r.length, 4, 'quatre actions : ' + r.length);
    assert.ok(r.every(([a, b]) => a >= 0 && b <= w), 'actions hors écran : ' + JSON.stringify(r));
  });
  await ok('Historique : le nom a de la place, le statut « Terminée » tient sur une ligne, « en cours » / « échouée » sont visibles', async () => {
    await go(page, 'history');
    const r = await page.evaluate(() => [...document.querySelectorAll('#history .tx-row')].map(row => {
      const q = s => row.querySelector(s), box = row.getBoundingClientRect(), t = q('.item-title').getBoundingClientRect(), ok = q('.tx-okl'), st = q('.tx-stl .st');
      const sr = st ? st.getBoundingClientRect() : null;
      return { cls: row.className, nameW: Math.round(t.width), okH: ok ? Math.round(ok.getBoundingClientRect().height) : null, okLH: ok ? parseFloat(getComputedStyle(ok).lineHeight) : null,
        stVisible: sr ? (sr.width > 20 && sr.left >= box.left && sr.right <= box.right && sr.right <= innerWidth) : null };
    }));
    assert.ok(r.length >= 5, 'des lignes : ' + r.length);
    for (const x of r) {
      assert.ok(x.nameW >= (w === 320 ? 66 : 100), 'nom trop étroit (' + x.nameW + ' px)');
      if (x.okH != null) assert.ok(x.okH <= x.okLH * 1.2, '« Terminée » sur plusieurs lignes (' + x.okH + ' px)');
    }
    const flagged = r.filter(x => /st-(pending|failed)/.test(x.cls));
    assert.ok(flagged.length >= 2, 'lignes en cours / échouées : ' + flagged.length);
    assert.ok(flagged.every(x => x.stVisible === true), 'statut caché : ' + JSON.stringify(flagged));
  });
  await ok('Compte : fiche du profil lisible, petites cartes dans l’écran, pas de défilement horizontal', async () => {
    await go(page, 'account');
    const r = await page.evaluate(() => {
      const q = s => document.querySelector(s), b = s => q(s).getBoundingClientRect();
      return { name: Math.round(b('#account .hub-who b').width), phone: Math.round(b('#account .hub-who > span').width), phoneH: Math.round(b('#account .hub-who > span').height),
        phoneLH: parseFloat(getComputedStyle(q('#account .hub-who > span')).lineHeight), cards: [...document.querySelectorAll('#account .hub-two .hub-card')].map(c => { const x = c.getBoundingClientRect(); return [Math.round(x.left), Math.round(x.right), Math.round(x.top)]; }),
        over: document.querySelector('#account').scrollWidth - document.querySelector('#account').clientWidth };
    });
    assert.ok(r.name >= (w === 320 ? 95 : 120), 'nom du profil trop étroit : ' + r.name);
    assert.ok(r.phoneH <= r.phoneLH * 1.3, 'numéro de téléphone sur plusieurs lignes');
    assert.equal(r.cards.length, 2);
    assert.ok(r.cards.every(([a, c]) => a >= 0 && c <= w), 'cartes hors écran : ' + JSON.stringify(r.cards));
    if (w <= 340) assert.ok(r.cards[1][2] > r.cards[0][2], 'à 320 px les deux cartes sont l’une sous l’autre');
    assert.ok(r.over <= 1, 'défilement horizontal : ' + r.over);
  });
  await ok('aucune erreur de page', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);
