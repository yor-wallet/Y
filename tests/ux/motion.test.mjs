/* Mouvement et retour en temps réel (14.10.0) : pastille glissante des contrôles segmentés, chiffres en direct (flash, défilement du solde),
   listes de marché mises à jour sur place, état « en direct » stable, cloche et pastille, retour sur « copier » — et tout cela réduit sous « réduire les animations ». */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = (name, fn) => fn().then(() => console.log('  ok  ', name), e => { failed++; console.log('  FAIL', name, '\n      ', String(e.message).split('\n').slice(0, 4).join(' | ')); });
const wait = ms => new Promise(r => setTimeout(r, ms));

{
  console.log('\n[mouvement normal]');
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'en', settle: 500 });
  await ok('pastille : un contrôle segmenté reçoit sa pastille, qui se place sous l’option choisie', async () => {
    await page.evaluate(() => R.go('markets', { force: true })); await wait(900);
    const g = await page.evaluate(() => { const c = document.querySelector('#markets .chips'); const p = c.querySelector('.chip-pill'), on = c.querySelector('.chip[aria-pressed="true"]'); return { pill: !!p, flag: c.hasAttribute('data-pill'), w: Math.round(parseFloat(p.style.width)), cw: on.offsetWidth, x: p.style.transform, l: on.offsetLeft }; });
    assert.ok(g.pill && g.flag, 'the pill is there');
    assert.equal(g.w, g.cw); assert.equal(g.x, 'translateX(' + g.l + 'px)');
  });
  await ok('pastille : choisir une autre option déplace la pastille (elle glisse, avec une transition)', async () => {
    const before = await page.evaluate(() => document.querySelector('#markets .chips .chip-pill').style.transform);
    await page.click('#markets [data-omx-tab="fav"]'); await wait(200);
    const r = await page.evaluate(() => { const p = document.querySelector('#markets .chips .chip-pill'), on = document.querySelector('#markets .chips .chip[aria-pressed="true"]'); return { x: p.style.transform, l: on.offsetLeft, tr: getComputedStyle(p).transitionDuration, label: on.textContent.trim() }; });
    assert.notEqual(r.x, before, 'the pill moved'); assert.equal(r.x, 'translateX(' + r.l + 'px)');
    assert.notEqual(r.tr, '0s'); assert.match(r.label, /Favourites/);
    await page.click('#markets [data-omx-tab="all"]'); await wait(200);
  });
  await ok('pastille : la période du graphique (1H … 1Y) a aussi sa pastille et suit le choix', async () => {
    await page.evaluate(() => { R.go('asset', { force: true }); }); await wait(900);
    await page.click('#asset [data-omx-per="1W"]'); await wait(250);
    const r = await page.evaluate(() => { const p = document.querySelector('#asset .omx-per .chip-pill'), on = document.querySelector('#asset .omx-per .chip[aria-pressed="true"]'); return { x: p.style.transform, l: on.offsetLeft, t: on.textContent.trim() }; });
    assert.equal(r.t, '1W'); assert.equal(r.x, 'translateX(' + r.l + 'px)');
  });
  await ok('chiffres en direct : un prix qui monte clignote en vert, qui baisse en rouge, puis revient à sa couleur', async () => {
    await page.evaluate(() => R.go('asset', { force: true })); await wait(3200);        /* the app's own first live tick has happened */
    const first = await page.evaluate(() => document.querySelector('#asset [data-omx-v]').textContent);
    await page.evaluate(() => { const el = document.querySelector('#asset .omx-ap'); el.textContent = '$99,500.00'; }); await wait(120);
    assert.ok(await page.locator('#asset .omx-ap.lv-up').count() || await page.locator('#asset .omx-ap.lv-dn').count(), 'a flash class is set (was ' + first + ')');
    await wait(1300);
    assert.equal(await page.locator('#asset .omx-ap.lv-up, #asset .omx-ap.lv-dn').count(), 0, 'the flash ends');
    await page.evaluate(() => { document.querySelector('#asset .omx-ap').textContent = '$80,000.00'; }); await wait(150);
    assert.equal(await page.locator('#asset .omx-ap.lv-dn').count(), 1, 'a drop flashes red');
  });
  await ok('chiffres en direct : le prix principal « défile » vers sa nouvelle valeur au lieu de sauter (et se pose exactement dessus)', async () => {
    /* the app keeps writing real prices too: try a few times so one of its ticks cannot hide the roll */
    let seenAll = [], landed = false; const trace = [];
    for (let n = 0; n < 4 && !landed; n++){
      await page.evaluate(v => { document.querySelector('#asset .omx-ap').textContent = v; }, '$' + (88000 + n * 1000) + '.00'); await wait(1000);
      await page.evaluate(v => { document.querySelector('#asset .omx-ap').textContent = v; }, '$' + (89000 + n * 1000 + 1000) + '.00');
      const target = '$' + (89000 + n * 1000 + 1000) + '.00', start = '$' + (88000 + n * 1000) + '.00', seen = new Set();
      for (let i = 0; i < 12; i++){ await wait(40); seen.add(await page.evaluate(() => document.querySelector('#asset .omx-ap').textContent)); }
      seenAll = [...seen]; await wait(700);
      const end = await page.evaluate(() => document.querySelector('#asset .omx-ap').textContent); trace.push(start + '>' + target + ' seen=' + seenAll.slice(0, 4).join(',') + ' end=' + end);
      if (seenAll.some(s => s !== start && s !== target) && end === target) landed = true;
    }
    assert.ok(landed, 'intermediate values were shown and the last one is exact: ' + trace.join(' || '));
  });
  /* 16.0.0: the balance changes digit by digit (Revolut / Stocks): the digits that changed slide out and in, over the text of the app,
     which is right at once (screen readers never hear a count) and stays underneath */
  const odo = () => page.evaluate(() => { const el = document.querySelector('#home [data-omx-total]'), ov = el.querySelector('.m-odo');
    return { cells: ov ? ov.querySelectorAll('.m-od').length : 0, olds: ov ? ov.querySelectorAll('.m-od-o').length : 0, aria: ov ? ov.getAttribute('aria-hidden') : null,
      own: [...el.childNodes].filter(n => !(n.classList && n.classList.contains('m-odo'))).map(n => n.textContent).join(''), color: getComputedStyle(el).color }; });
  await ok('solde : il change chiffre par chiffre (les chiffres modifiés glissent), le texte est juste tout de suite, puis tout se pose', async () => {
    await page.evaluate(() => { Runtime.hideBalance = false; R.go('home', { force: true }); }); await wait(1300);
    const html0 = await page.evaluate(() => document.querySelector('#home [data-omx-total]').innerHTML);
    assert.match(html0, /lt-dec/, 'decimals are in their own span');
    await page.evaluate(() => { const el = document.querySelector('#home [data-omx-total]'); el.innerHTML = '$3,000<span class="lt-dec">.50</span>'; });
    await wait(80);
    const mid = await odo();
    assert.ok(mid.cells >= 3, 'digits moving: ' + mid.cells); assert.ok(mid.olds >= 1, 'old digits leaving: ' + mid.olds);
    assert.equal(mid.own, '$3,000.50', 'the value under the motion is already the new one'); assert.equal(mid.aria, 'true');
    assert.equal(mid.color, 'rgba(0, 0, 0, 0)', 'the text of the app is drawn by the overlay during the motion');
    await wait(900);
    const end = await odo();
    assert.equal(end.cells, 0, 'the overlay is gone'); assert.notEqual(end.color, 'rgba(0, 0, 0, 0)');
    assert.equal(await page.evaluate(() => document.querySelector('#home [data-omx-total]').textContent), '$3,000.50');
    assert.match(await page.evaluate(() => document.querySelector('#home [data-omx-total]').innerHTML), /<span class="lt-dec">\.50<\/span>/, 'the light decimals are back');
  });
  await ok('liste de marché : une nouvelle série de prix est appliquée sur place (mêmes éléments, pas de réaffichage)', async () => {
    await page.evaluate(() => R.go('markets', { force: true })); await wait(1000);
    const r = await page.evaluate(() => {
      const host = document.getElementById('omx-mk'), row = host.querySelector('[data-omx-asset]'), nodeBefore = row, v = row.querySelector('[data-omx-v]');
      const html = host.innerHTML.replace(/(data-omx-v="[A-Z]+"[^>]*>)[^<]*/, '$1$1.23').replace('$1.23', '$777,777.00');
      const html2 = host.innerHTML.replace(v.textContent, '$777,777.00');
      const same = MOTION.patchList(host, html2);
      return { same, kept: host.querySelector('[data-omx-asset]') === nodeBefore, text: host.querySelector('[data-omx-v]').textContent };
    });
    assert.equal(r.same, true, 'patched, not replaced'); assert.equal(r.kept, true, 'the row element is the same node'); assert.equal(r.text, '$777,777.00');
    await wait(150);
    assert.ok(await page.locator('#omx-mk [data-omx-v].lv-up').count(), 'the changed price flashed');
  });
  await ok('liste de marché : un autre jeu de lignes (recherche) remplace la liste normalement', async () => {
    const r = await page.evaluate(() => { const host = document.getElementById('omx-mk'); const rows = [...host.querySelectorAll('[data-omx-asset]')]; const html = rows.slice(0, 2).map(x => x.outerHTML).join(''); return { same: MOTION.patchList(host, html), n: host.querySelectorAll('[data-omx-asset]').length }; });
    assert.equal(r.same, false); assert.equal(r.n, 2);
  });
  await ok('état « en direct » : la pastille d’état reste le même élément quand le texte change (l’animation ne redémarre pas)', async () => {
    const r = await page.evaluate(() => { const el = document.querySelector('#markets .omx-status') || document.querySelector('.omx-status'); if (!el) return { skip: true }; const dot = el.querySelector('i'); const html = el.outerHTML.replace(/<small[^>]*>[^<]*<\/small>/, '<small class="ltr">Last sync 12:00:00</small>'); return { skip: false, patched: MOTION.patchStatus(el, html), same: el.querySelector('i') === dot }; });
    if (!r.skip){ assert.equal(r.patched, true); assert.equal(r.same, true); }
  });
  await ok('cloche : une notification de plus fait sonner la cloche et sauter la pastille', async () => {
    await page.evaluate(() => R.go('home', { force: true })); await wait(1200);
    assert.ok(await page.locator('#home .lt-badge').count(), 'there is an unread badge');
    await page.evaluate(() => { const b = document.querySelector('#home .lt-badge'); b.textContent = String((parseInt(b.textContent, 10) || 0) + 1); }); await wait(200);
    assert.equal(await page.locator('#home .lt-badge.lv-pop').count(), 1, 'the badge pops');
    assert.equal(await page.locator('#home [data-action="notifications"].lv-ring').count(), 1, 'the bell rings');
  });
  await ok('copier : le bouton « copier l’identifiant » confirme par un petit rebond', async () => {
    await page.evaluate(() => R.go('profile', { force: true })); await wait(900);
    await page.evaluate(() => { const b = document.querySelector('#profile .px-chip.id'); if (b) b.click(); }); await wait(120);
    assert.equal(await page.locator('#profile .px-chip.id.lv-copied').count(), 1);
  });
  await ok('solde : quand on découvre le solde (œil), ses chiffres montent en place un à un au lieu d’apparaître d’un coup', async () => {
    await page.evaluate(() => { Runtime.hideBalance = true; R.go('home', { force: true }); }); await wait(1500);
    assert.match(await page.locator('#home [data-omx-total]').textContent(), /^[•\s]+$/);
    await page.click('#home [data-action="toggle-balance"]');
    await wait(80);
    const mid = await odo();
    assert.ok(mid.cells >= 4, 'every digit rises: ' + mid.cells); assert.match(mid.own, /^\$[\d,]+\.\d{2}$/);
    await wait(900);
    assert.equal((await odo()).cells, 0);
    assert.match(await page.locator('#home [data-omx-total]').textContent(), /^\$[\d,]+\.\d{2}$/);
  });
  /* 16.5.1 (owner, 27/11): no animation on the keypad — the digit is typed on contact (pointerdown), once, and nothing pulses */
  await ok('pavé numérique : chiffre saisi dès le contact, une seule fois, sans animation du montant ni de la touche', async () => {
    await page.evaluate(() => R.go('exchange', { force: true })); await wait(1200);
    const k = await page.$('#exchange .lt-key[data-k="5"]'); await k.evaluate(e => e.scrollIntoView({ block: 'center' })); await wait(300); const box = await k.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await wait(80);
    assert.equal(await page.inputValue('#sw-amt'), '5', 'typed on contact, before the finger is lifted');
    assert.equal(await k.evaluate(e => getComputedStyle(e).transform), 'none', 'the key does not scale');
    await page.mouse.up(); await wait(200);
    assert.equal(await page.inputValue('#sw-amt'), '5', 'not typed a second time on release');
    assert.equal(await page.locator('#exchange .lv-type').count(), 0, 'the amount does not pulse');
    assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.lt-keys')).length), 0);
  });
  /* 17.1.0: the raised centre button is gone (five equal entries); the press feedback of the bar and of the Swap tile is covered by motion-system.test.mjs */
  await ok('aucune erreur de page', async () => assert.deepEqual(logs, []));
  await ctx.close();
}

{
  console.log('\n[« réduire les animations »]');
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'en', settle: 500, reduced: true });
  await ok('réduit : la pastille se place sans transition et le prix ne défile pas (valeur immédiate)', async () => {
    await page.evaluate(() => R.go('markets', { force: true })); await wait(900);
    const tr = await page.evaluate(() => getComputedStyle(document.querySelector('#markets .chips .chip-pill')).transitionDuration);
    assert.ok(parseFloat(tr) < 0.01, 'no transition under reduced motion (' + tr + ')');
    await page.evaluate(() => R.go('asset', { force: true })); await wait(1300);
    await page.evaluate(() => { document.querySelector('#asset .omx-ap').textContent = '$95,000.00'; }); await wait(1300);
    await page.evaluate(() => { document.querySelector('#asset .omx-ap').textContent = '$96,000.00'; });
    const seen = new Set(); for (let i = 0; i < 8; i++){ await wait(40); seen.add(await page.evaluate(() => document.querySelector('#asset .omx-ap').textContent)); }
    assert.deepEqual([...seen], ['$96,000.00'], 'no rolling under reduced motion: ' + [...seen].join(' '));
  });
  await ok('réduit : le clignotement devient un simple changement de couleur (pas de mouvement ni d’ombre lumineuse)', async () => {
    await page.evaluate(() => { document.querySelector('#asset .omx-ap').textContent = '$97,000.00'; }); await wait(150);
    const an = await page.evaluate(() => getComputedStyle(document.querySelector('#asset .omx-ap')).animationName);
    assert.match(an, /lvFade(Up|Dn)/);
  });
  await ok('réduit : la cloche ne sonne pas', async () => {
    await page.evaluate(() => R.go('home', { force: true })); await wait(1200);
    await page.evaluate(() => { const b = document.querySelector('#home .lt-badge'); if (b) b.textContent = String((parseInt(b.textContent, 10) || 0) + 1); }); await wait(200);
    assert.equal(await page.locator('#home [data-action="notifications"].lv-ring').count(), 0);
  });
  await ok('aucune erreur de page', async () => assert.deepEqual(logs, []));
  await ctx.close();
}


{
  console.log('\n[tirer pour rafraîchir]');
  const { ctx, page, logs } = await openApp(browser, url, { lang: 'en', settle: 500, touch: true });
  const drag = (page2, y0, y1) => page2.evaluate(([a, b]) => {
    const mk = y => new Touch({ identifier: 1, target: document.body, clientX: 195, clientY: y });
    const fire = (type, y) => document.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [mk(y)], changedTouches: [mk(y)], bubbles: true, cancelable: true }));
    fire('touchstart', a); fire('touchmove', a + 20); fire('touchmove', (a + b) / 2); fire('touchmove', b);
    return { off: getComputedStyle(document.querySelector('#ios-ptr .pt-arch')).strokeDashoffset, op: document.getElementById('ios-ptr').style.opacity };
  }, [y0, y1]);
  await ok('tirer : sur Marchés, l’arche se remplit pendant le geste, puis la pièce tourne et les prix se rechargent', async () => {
    await page.evaluate(() => { R.go('markets', { force: true }); window.__refreshed = 0; const f = OMXMarket.refresh; OMXMarket.refresh = async function(){ window.__refreshed++; return f.apply(this, arguments); }; }); await wait(1100);
    const mid = await drag(page, 160, 420);
    assert.ok(Number(mid.op) > 0.5, 'the indicator shows while pulling (' + mid.op + ')');
    assert.ok(parseFloat(mid.off) < 0.6, 'the arch is filling (dashoffset ' + mid.off + ')');
    await page.evaluate(() => document.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [], bubbles: true })));
    await wait(150);
    assert.equal(await page.locator('#ios-ptr.spin').count(), 1, 'the coin spins while loading');
    await wait(1100);
    assert.equal(await page.evaluate(() => window.__refreshed), 1, 'the live prices were reloaded');
    assert.equal(await page.locator('#ios-ptr.spin').count(), 0, 'it stops when done');
  });
  await ok('tirer : un geste trop court ne recharge rien', async () => {
    await page.evaluate(() => { window.__refreshed = 0; });
    await drag(page, 160, 200);
    await page.evaluate(() => document.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [], bubbles: true }))); await wait(500);
    assert.equal(await page.evaluate(() => window.__refreshed), 0);
  });
  await ok('aucune erreur de page', async () => assert.deepEqual(logs, []));
  await ctx.close();
}

await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
