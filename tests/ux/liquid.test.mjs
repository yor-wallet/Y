/* Verre liquide (14.6.0): floating glass menu, slimmer while scrolling down, lens that stretches, tabs still navigate, reduced motion. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = async (name, fn) => { try { await fn(); console.log('  ok  ', name); } catch (e) { failed++; console.log('  FAIL', name, '\n      ', e.message.split('\n').slice(0, 3).join(' | ')); } };
const wait = ms => new Promise(r => setTimeout(r, ms));
const scrollActive = (page, y) => page.evaluate(y => { const s = document.querySelector('.screen.active'); s.scrollTop = y; s.dispatchEvent(new Event('scroll')); }, y);
const isMin = page => page.evaluate(() => document.getElementById('bottom-nav').classList.contains('lg-min'));

{
  const { ctx, page, logs } = await openApp(browser, url, { settle: 500 });
  console.log('\n[motion on]');
  await page.evaluate(() => document.documentElement.classList.remove('w-lite'));   /* a phone with a capable GPU */
  await ok('the menu floats: a glass capsule away from the screen edges, blurred, with a light rim', async () => {
    await page.evaluate(() => R.go('markets', { force: true })); await wait(900);
    const g = await page.evaluate(() => {
      const d = document.querySelector('#bottom-nav .nav-dock'), r = d.getBoundingClientRect(), cs = getComputedStyle(d);
      return { left: r.left, right: innerWidth - r.right, bottom: innerHeight - r.bottom, radius: parseFloat(cs.borderTopLeftRadius), bf: cs.backdropFilter || cs.webkitBackdropFilter, shadow: cs.boxShadow };
    });
    assert.ok(g.left >= 10 && g.right >= 10, 'side gaps ' + g.left + ' / ' + g.right);
    assert.ok(g.bottom >= 8, 'bottom gap ' + g.bottom);
    assert.ok(g.radius >= 30, 'capsule radius ' + g.radius);
    assert.match(g.bf, /blur\(/);
    assert.match(g.shadow, /inset/);
  });
  await ok('scrolling down slims the capsule, scrolling up brings it back, the top of the page shows it in full', async () => {
    await scrollActive(page, 60); await wait(80); await scrollActive(page, 400); await wait(120);
    assert.equal(await isMin(page), true, 'slim after scrolling down');
    const h = await page.evaluate(() => document.querySelector('#bottom-nav .nav-dock').getBoundingClientRect().height);
    await scrollActive(page, 300); await wait(120);
    assert.equal(await isMin(page), false, 'full after scrolling up');
    await scrollActive(page, 700); await wait(120); assert.equal(await isMin(page), true);
    await scrollActive(page, 10); await wait(120); assert.equal(await isMin(page), false, 'full near the top');
    await wait(600);
    const h2 = await page.evaluate(() => document.querySelector('#bottom-nav .nav-dock').getBoundingClientRect().height);
    assert.ok(h2 > h, 'height grows back ' + h + ' -> ' + h2);
  });
  await ok('opening another page always shows the full capsule', async () => {
    await scrollActive(page, 60); await wait(80); await scrollActive(page, 500); await wait(120);
    assert.equal(await isMin(page), true);
    await page.click('#bottom-nav [data-nav="wallet"]'); await wait(900);
    assert.equal(await isMin(page), false);
  });
  await ok('every tab still opens its page, and the lens follows (stretching while it moves)', async () => {
    for (const id of ['home', 'markets', 'spot', 'exchange', 'wallet']){
      await page.click('#bottom-nav [data-nav="' + id + '"]'); await wait(150);
      const st = await page.evaluate(() => document.querySelector('#bottom-nav .nav-ind').classList.contains('lg-stretch'));
      await wait(700);
      const cur = await page.evaluate(() => { const a = document.querySelector('#bottom-nav .nav-item[aria-current="page"]'); return a && a.getAttribute('data-nav'); });
      assert.equal(cur, id, 'active tab');
      const al = await page.evaluate(() => { const i = document.querySelector('#bottom-nav .nav-ind').getBoundingClientRect(), a = document.querySelector('#bottom-nav .nav-item[aria-current="page"]').getBoundingClientRect(); return Math.abs((i.left + i.width / 2) - (a.left + a.width / 2)); });
      assert.ok(al < 3, 'lens centred under the tab (' + al + ' px)');
      if (id !== 'home') assert.equal(st, true, 'lens stretched on the way to ' + id);
    }
  });
  await ok('page header: no bar at rest, a soft blur under the title once the page scrolls', async () => {
    await page.evaluate(() => R.go('markets', { force: true })); await wait(900);
    const a = await page.evaluate(() => getComputedStyle(document.querySelector('#markets > .topbar'), '::after').opacity);
    await scrollActive(page, 60); await wait(80); await scrollActive(page, 260); await wait(500);
    const b = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('#markets > .topbar'), '::after'); return { op: cs.opacity, bf: cs.backdropFilter || cs.webkitBackdropFilter }; });
    assert.equal(a, '0'); assert.equal(b.op, '1'); assert.match(b.bf, /blur\(/);
  });
  await ok('buttons are glass capsules; a touched glass control grows (gel) instead of shrinking', async () => {
    await page.evaluate(() => R.go('exchange', { force: true })); await wait(900);
    const r = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#exchange .btn-primary')).borderTopLeftRadius));
    assert.ok(r >= 26, 'capsule radius ' + r);
    const box = await page.locator('#bottom-nav [data-nav="spot"]').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await wait(600);
    const s = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('#bottom-nav [data-nav="spot"]')).transform).a);
    await page.mouse.up(); await wait(200);
    assert.ok(s > 1.02, 'scale while pressed ' + s);
  });
  await ok('no console errors', async () => { assert.deepEqual(logs.filter(l => !/favicon|net::|Failed to load resource/.test(l)), []); });
  await ctx.close();
}

{
  const { ctx, page } = await openApp(browser, url, { reduced: true, settle: 400 });
  console.log('\n[reduce motion]');
  await ok('nothing slims, stretches or grows', async () => {
    await page.evaluate(() => R.go('markets', { force: true })); await wait(700);
    await scrollActive(page, 60); await wait(80); await scrollActive(page, 500); await wait(150);
    assert.equal(await isMin(page), false);
    await page.click('#bottom-nav [data-nav="spot"]'); await wait(120);
    assert.equal(await page.evaluate(() => document.querySelector('#bottom-nav .nav-ind').classList.contains('lg-stretch')), false);
  });
  await ctx.close();
}

{
  const { ctx, page } = await openApp(browser, url, { settle: 400 });
  console.log('\n[low-power phone]');
  await ok('no blur on the menu, an opaque capsule instead (still readable)', async () => {
    await page.evaluate(() => { document.documentElement.classList.add('w-lite'); R.go('markets', { force: true }); }); await wait(700);
    const bf = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('#bottom-nav .nav-dock')); return cs.backdropFilter || cs.webkitBackdropFilter || 'none'; });
    assert.equal(bf, 'none');
  });
  await ctx.close();
}

await browser.close(); srv.close();
console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
process.exit(failed ? 1 : 0);
