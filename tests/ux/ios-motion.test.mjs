/* iOS motion: push / pop frames, edge swipe back, sheet drag, pull to refresh, large titles, reduced motion. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = async (name, fn) => { try { await fn(); console.log('  ok  ', name); } catch (e) { failed++; console.log('  FAIL', name, '\n      ', e.message.split('\n').slice(0, 3).join(' | ')); } };
const wait = ms => new Promise(r => setTimeout(r, ms));
async function touch(page, type, pts){ const c = await page.context().newCDPSession(page); await c.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: i })) }); await c.detach(); }
async function swipe(page, from, to, steps = 8, hold = false){
  const c = await page.context().newCDPSession(page);
  const send = (type, x, y) => c.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 0 }] });
  await send('touchStart', from[0], from[1]);
  for (let i = 1; i <= steps; i++){ await send('touchMove', from[0] + (to[0] - from[0]) * i / steps, from[1] + (to[1] - from[1]) * i / steps); await wait(16); }
  if (hold) return { c, end: async () => { await send('touchEnd', to[0], to[1]); await c.detach(); } };
  await send('touchEnd', to[0], to[1]); await c.detach();
}
const state = (page, id) => page.evaluate(id => { const e = document.getElementById(id); if (!e) return null; const cs = getComputedStyle(e); return { cls: e.className, tf: cs.transform, vis: cs.visibility, op: cs.opacity, active: e.classList.contains('active') }; }, id);

{
  const { ctx, page, logs } = await openApp(browser, url, { touch: true, settle: 500 });
  console.log('\n[touch, motion on]');
  await ok('springs are generated (linear() easing + durations)', async () => {
    const v = await page.evaluate(() => ({ s: getComputedStyle(document.documentElement).getPropertyValue('--ios-smooth'), d: getComputedStyle(document.documentElement).getPropertyValue('--ios-snappy-d') }));
    assert.match(v.s, /linear\(|cubic-bezier/); assert.match(v.d, /\d+ms/);
  });
  await ok('push home -> settings: both screens move, old one is parallaxed, then settles', async () => {
    await page.evaluate(() => R.go('settings'));
    await wait(110);
    const a = await state(page, 'settings'), b = await state(page, 'home');
    assert.ok(/ios-entering/.test(a.cls) && /ios-leaving/.test(b.cls), 'classes during push: ' + a.cls + ' / ' + b.cls);
    assert.notEqual(a.tf, 'none'); assert.notEqual(b.tf, 'none'); assert.equal(b.vis, 'visible');
    await wait(800);
    const a2 = await state(page, 'settings'), b2 = await state(page, 'home');
    assert.ok(!/ios-(entering|leaving)/.test(a2.cls + b2.cls)); assert.equal(b2.vis, 'hidden'); assert.equal(a2.vis, 'visible');
  });
  await ok('large title + back label', async () => {
    assert.equal(await page.locator('#settings > .ios-lt').count(), 1);
    assert.match(await page.locator('#settings .ios-back-t').innerText(), /Home/);
    assert.ok(/ios-large/.test((await state(page, 'settings')).cls));
    await page.evaluate(() => { document.getElementById('settings').scrollTop = 120; }); await wait(250);
    assert.ok(/ios-collapsed/.test((await state(page, 'settings')).cls));
    await page.evaluate(() => { document.getElementById('settings').scrollTop = 0; }); await wait(250);
  });
  await ok('pop (back button): settings slides out to the right while home returns', async () => {
    await page.click('#settings .topbar-back'); await wait(110);
    const a = await state(page, 'settings'), b = await state(page, 'home');
    assert.ok(/ios-leaving/.test(a.cls) && b.active, 'during pop: ' + a.cls); assert.equal(a.vis, 'visible');
    await wait(800); assert.equal((await state(page, 'settings')).vis, 'hidden'); assert.equal(await page.evaluate(() => R.current()), 'home');
  });
  await ok('interactive edge swipe: the finger drives the screen, release past 1/3 goes back', async () => {
    await page.evaluate(() => R.go('settings')); await wait(900);
    const s = await swipe(page, [4, 400], [210, 410], 8, true);
    const mid = await state(page, 'settings'), under = await state(page, 'home');
    assert.ok(/ios-entering/.test(mid.cls) && /ios-leaving/.test(under.cls), 'mid-gesture: ' + mid.cls + ' | ' + under.cls);
    assert.notEqual(mid.tf, 'none'); assert.equal(under.vis, 'visible');
    await s.end(); await wait(900);
    assert.equal(await page.evaluate(() => R.current()), 'home'); assert.equal((await state(page, 'settings')).vis, 'hidden');
  });
  await ok('short edge swipe springs back and stays', async () => {
    await page.evaluate(() => R.go('settings')); await wait(900);
    await swipe(page, [4, 400], [60, 405], 5); await wait(700);
    assert.equal(await page.evaluate(() => R.current()), 'settings'); assert.equal((await state(page, 'settings')).tf, 'none');
    await page.evaluate(() => R.go('home', { reset: true })); await wait(700);
  });
  await ok('sheet: opens, app scales back, drag down dismisses', async () => {
    /* the home header no longer carries a search button (reference layout): the same sheet is opened by its own entry point */
    await page.evaluate(() => PxSearch.open()); await wait(700);
    assert.ok(await page.evaluate(() => document.body.classList.contains('ios-sheet-open')));
    const box = await page.evaluate(() => { const r = document.querySelector('.ov.is-open .ov-panel').getBoundingClientRect(); return [r.left + r.width / 2, r.top + 7]; });
    await swipe(page, box, [box[0], box[1] + 260], 8); await wait(800);
    assert.equal(await page.evaluate(() => !!document.querySelector('.ov.is-open')), false);
    assert.equal(await page.evaluate(() => document.body.classList.contains('ios-sheet-open')), false);
  });
  await ok('pull to refresh reloads the data (my_transactions called again)', async () => {
    await page.evaluate(() => { window.__rpcLog = []; document.getElementById('home').scrollTop = 0; });
    const s = await swipe(page, [200, 160], [200, 420], 10, true);
    const op = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('ios-ptr')).opacity)); assert.ok(op > 0.2, 'indicator opacity ' + op);
    await s.end(); await wait(1600);
    const calls = await page.evaluate(() => window.__rpcLog.filter(c => c.name === 'my_transactions').length); assert.ok(calls >= 1, 'my_transactions calls: ' + calls);
    assert.equal(await page.evaluate(() => R.current()), 'home');
  });
  await ok('no page errors', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
{
  const { ctx, page, logs } = await openApp(browser, url, { reduced: true, settle: 400 });
  console.log('\n[reduced motion]');
  await ok('screens dissolve (no slide) and finish quickly', async () => {
    await page.evaluate(() => R.go('settings')); await wait(60);
    const a = await state(page, 'settings'); assert.ok(!/ios-entering/.test(a.cls) || a.tf === 'none', 'tf ' + a.tf);
    await wait(400); const b = await state(page, 'home'); assert.equal(b.vis, 'hidden');
  });
  await ok('no page errors', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
