/* Motion system (16.0.0): one coherent motion per navigation, measured frame by frame in the browser.
   - sheets and dialogs really travel when they open (they used to appear at once) and glide away when they close
   - tabs: a fade-through (the old tab is gone before the new one shows: never both at once); Swap and Spot are tabs (no sideways slide)
   - push: a pure horizontal slide (no zoom, no blur)
   - the tab-bar pill: highlighted right after start-up, stretches like a drop between tabs, appears in place when the page itself slides
   - entrances: blocks rise the first time a screen is seen, never when it is only redrawn with fresh data, never inside a pushed screen
   - touch: the held control sinks and gets its own overflow back afterwards
   - at rest: no endless animation keeps running on a hidden screen
   - reduced motion: fades only */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
let failed = 0;
const ok = async (name, fn) => { try { await fn(); console.log('  ok  ', name); } catch (e) { failed++; console.log('  FAIL', name, '\n      ', e.message.split('\n').slice(0, 3).join(' | ')); } };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* samples fn() once per frame, starting in the frame after start() (as a real tap would see it) */
const frames = (page, start, sample, n = 30) => page.evaluate(([start, sample, n]) => new Promise(done => {
  const out = []; const s = new Function('return (' + start + ')')(), f = new Function('return (' + sample + ')')();
  const ctx = s() || {};
  requestAnimationFrame(function tick(){ out.push(f(ctx)); if (out.length < n) requestAnimationFrame(tick); else done(out); });
}), [String(start), String(sample), n]);
/* blocks of a screen that rise in (the entrance of js/ui/omw.js): opacity 0 + 10 px below → in place */
const entrances = (page, id) => page.evaluate(id => {
  const s = document.getElementById(id); if (!s) return -1;
  return document.getAnimations().filter(a => {
    const t = a.effect && a.effect.target; if (!t || t === s || !s.contains(t) || !a.effect.getKeyframes) return false;
    const k = a.effect.getKeyframes(); return k.length === 2 && String(k[0].opacity) === '0' && /10px/.test(String(k[0].transform || ''));
  }).length;
}, id);
const scaleX = tf => { const m = /^matrix\(([^,]+),/.exec(tf || ''); return m ? +m[1] : 1; };

{
  const { ctx, page, logs } = await openApp(browser, url, { touch: true, settle: 900 });
  console.log('\n[touch, motion on]');

  await ok('after start-up the current tab is highlighted at once (the bar used to be rebuilt after the router marked it: no pill until the first navigation)', async () => {
    const v = await page.evaluate(() => { const a = document.querySelector('#bottom-nav .nav-item[aria-current="page"]'); return { tab: a && a.getAttribute('data-nav'), op: getComputedStyle(document.querySelector('#bottom-nav .nav-ind')).opacity }; });
    assert.equal(v.tab, 'home'); assert.equal(v.op, '1');
  });

  await ok('a sheet travels up from the bottom when it opens (it used to appear at once) and glides down when it closes', async () => {
    const up = await frames(page,
      () => { window.__c = R.overlay.open('<div class="omx-sheet"><h2>T</h2><p>x</p><button class="btn btn-primary">OK</button></div>', { kind: 'sheet' }); },
      () => Math.round(document.querySelector('#ov-root .ov:last-child .ov-panel').getBoundingClientRect().top), 30);
    assert.ok(up[0] > up[up.length - 1] + 150, 'travel ' + up.join(','));
    assert.ok(new Set(up.slice(0, 12)).size >= 6, 'not in one jump: ' + up.slice(0, 12).join(','));
    const down = await frames(page, () => { const p = document.querySelector('#ov-root .ov:last-child .ov-panel'); window.__c(); return { p }; },
      c => Math.round(c.p.getBoundingClientRect().top), 14);
    assert.ok(down[down.length - 1] > down[0] + 100 && new Set(down).size >= 5, 'close glides: ' + down.join(','));
    await wait(400);
    assert.equal(await page.locator('#ov-root .ov').count(), 0);
  });

  await ok('a dialog fades in and grows slightly (no jump to its final state)', async () => {
    const v = await frames(page,
      () => { window.__c = R.overlay.open('<div class="omx-sheet"><p>?</p><button class="btn btn-primary">OK</button></div>', { kind: 'modal' }); },
      () => { const p = document.querySelector('#ov-root .ov:last-child .ov-panel'); return [+getComputedStyle(p).opacity, Math.round(p.getBoundingClientRect().width)]; }, 24);
    assert.ok(v[0][0] < .5 && v[v.length - 1][0] === 1, 'opacity ' + v.map(x => x[0]).join(','));
    assert.ok(v[0][1] < v[v.length - 1][1], 'grows ' + v[0][1] + ' → ' + v[v.length - 1][1]);
    await page.evaluate(() => window.__c()); await wait(450);
  });

  await ok('tab switch is a fade-through: the old tab leaves before the new one shows — never both visible at once', async () => {
    const v = await frames(page,
      () => { const a = document.getElementById('home'); document.querySelector('#bottom-nav [data-nav="markets"]').click(); return { a, b: document.getElementById('markets') }; },
      c => [+getComputedStyle(c.a).opacity, +getComputedStyle(c.b).opacity, c.a.classList.contains('ios-leaving')], 30);
    assert.ok(v.some(x => x[2] && x[0] === 0), 'the old tab really fades while still shown: ' + v.map(x => x[0]).join(','));
    assert.ok(!v.some(x => x[0] > .35 && x[1] > .35), 'double exposure: ' + v.map(x => x[0] + '/' + x[1]).join(' '));
    assert.equal(v[v.length - 1][1], 1);
  });

  await ok('the pill stretches like a drop between two tabs and settles on the new one', async () => {
    await wait(500);
    const v = await frames(page, () => { document.querySelector('#bottom-nav [data-nav="wallet"]').click(); },
      () => getComputedStyle(document.querySelector('#bottom-nav .nav-ind')).transform, 30);
    const sx = v.map(scaleX);
    assert.ok(Math.max(...sx) > 1.3, 'stretch ' + sx.map(x => x.toFixed(2)).join(','));
    assert.ok(Math.abs(sx[sx.length - 1] - 1) < .01, 'settles at 1');
  });

  await ok('Spot and Swap are tabs: no sideways slide when they open', async () => {
    await wait(500);
    const v = await frames(page, () => { document.querySelector('#bottom-nav [data-nav="spot"]').click(); },
      () => { const e = document.getElementById('spot'); return [getComputedStyle(e).transform, e.classList.contains('ios-entering')]; }, 10);
    assert.ok(v.some(x => x[1]), 'transition ran'); assert.ok(v.every(x => x[0] === 'none'), 'transforms ' + v.map(x => x[0]).join(' | '));
  });

  await ok('blocks rise the first time a tab is seen, not on the second visit, never when the screen is only redrawn with fresh data', async () => {
    await wait(600);
    await page.evaluate(() => document.querySelector('#bottom-nav [data-nav="home"]').click()); await wait(700);
    await page.evaluate(() => document.querySelector('#bottom-nav [data-nav="wallet"]').click());
    assert.equal(await entrances(page, 'wallet'), 0, 'second visit of the wallet tab');
    await wait(600);
    await page.evaluate(() => R.go('wallet', { force: true }));
    assert.equal(await entrances(page, 'wallet'), 0, 'in-place redraw');
    await wait(300);
    await page.evaluate(() => R.go('home', { reset: true }));
    assert.ok(await entrances(page, 'home') > 0, 'sign-in / reset brings the entrance back');
    await wait(900);
  });

  await ok('push = a pure horizontal slide (no zoom, no blur), and the pill appears in place instead of racing the page', async () => {
    await page.evaluate(() => R.go('markets')); await wait(900);
    const v = await frames(page, () => { document.querySelector('#markets [data-omx-asset]').click(); },
      () => { const e = document.getElementById('asset'), i = document.querySelector('#bottom-nav .nav-ind'); return [getComputedStyle(e).transform, getComputedStyle(e).filter, getComputedStyle(i).transform, +getComputedStyle(i).opacity]; }, 12);
    const mid = v.filter(x => x[0] !== 'none');
    assert.ok(mid.length >= 3, 'slides over several frames');
    assert.ok(mid.every(x => /^matrix\(1, 0, 0, 1, -?[\d.]+, 0\)$/.test(x[0])), 'translate only: ' + mid.map(x => x[0]).join(' | '));
    assert.ok(v.every(x => x[1] === 'none'), 'no blur');
    assert.ok(v.every(x => scaleX(x[2]) < 1.01), 'no stretch during a push: ' + v.map(x => scaleX(x[2]).toFixed(2)).join(','));
    assert.ok(v.some(x => x[3] < 1), 'the pill fades in at its new place');
    assert.equal(await entrances(page, 'asset'), 0, 'no inner cascade in a sliding screen');
    await wait(800); await page.evaluate(() => R.back()); await wait(900);
  });

  /* holds a finger on the first element matching sel (no click: the touch is cancelled), reads state while held and 900 ms after */
  const hold = async sel => {
    await page.locator(sel).first().scrollIntoViewIfNeeded(); await wait(300);   /* 17.0.0: the crypto list on the home screen pushes the cards below the fold */
    const box = await page.locator(sel).first().boundingBox();
    const c = await page.context().newCDPSession(page);
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 0 }] });
    await wait(220);
    const read = sel => { const e = document.querySelector(sel), i = e.querySelector(':scope > i'); return { cls: e.className, tf: getComputedStyle(e).transform, itf: i ? getComputedStyle(i).transform : null, ov: e.style.overflow, pos: e.style.position, light: e.querySelectorAll('.w-light').length }; };
    const held = await page.evaluate(read, sel);
    await c.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); await c.detach();
    await wait(900);
    return { held, after: await page.evaluate(read, sel) };
  };
  await ok('home quick actions: the round icon sinks (0.92), the label stays, no light square around it', async () => {
    await page.evaluate(() => R.go('home', { reset: true })); await wait(1200);
    const { held, after } = await hold('#home .lt-acts > .omx-act');
    assert.ok(/\bm-down\b/.test(held.cls), 'held class: ' + held.cls);
    assert.ok(Math.abs(scaleX(held.itf) - .92) < .02, 'circle ' + held.itf);
    assert.equal(held.tf, 'none', 'the button itself does not move');
    assert.equal(held.light, 0);
    assert.ok(!/\bm-down\b/.test(after.cls)); assert.ok(scaleX(after.itf) > .995, 'back: ' + after.itf);
  });
  /* 17.1.0: the home screen no longer has variation cards (the crypto list replaced them); the press / light clean-up is covered by the quick-action test above */
  await ok('at rest, no endless animation runs on a hidden screen', async () => {
    await wait(800);
    const n = await page.evaluate(() => document.getAnimations().filter(a => {
      const t = a.effect && a.effect.target; if (a.playState !== 'running' || !t || !t.closest) return false;
      return a.effect.getComputedTiming().iterations === Infinity && !!t.closest('.screen:not(.active)');
    }).length);
    assert.equal(n, 0);
  });

  await ok('no page errors', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}

{
  const { ctx, page, logs } = await openApp(browser, url, { touch: true, reduced: true, settle: 900 });
  console.log('\n[reduce motion]');
  await ok('tabs and sheets only fade: nothing moves', async () => {
    const t = await frames(page, () => { document.querySelector('#bottom-nav [data-nav="markets"]').click(); },
      () => { const e = document.getElementById('markets'); return [getComputedStyle(e).transform, +getComputedStyle(e).opacity]; }, 8);
    assert.ok(t.every(x => x[0] === 'none'), 'no transform');
    await wait(500);
    const s = await frames(page, () => { window.__c = R.overlay.open('<div class="omx-sheet"><p>x</p></div>', { kind: 'sheet' }); },
      () => { const p = document.querySelector('#ov-root .ov:last-child .ov-panel'); return [getComputedStyle(p).transform, +getComputedStyle(p).opacity]; }, 12);
    assert.ok(s.every(x => x[0] === 'none'), 'sheet does not travel: ' + s.map(x => x[0]).join(' | '));
    assert.ok(s[0][1] < 1 && s[s.length - 1][1] === 1, 'sheet fades: ' + s.map(x => x[1]).join(','));
    await page.evaluate(() => window.__c()); await wait(400);
  });
  await ok('no entrance cascade under reduce motion', async () => {
    await page.evaluate(() => document.querySelector('#bottom-nav [data-nav="wallet"]').click());
    assert.equal(await entrances(page, 'wallet'), 0);
  });
  await ok('no page errors', async () => { assert.deepEqual(logs, []); });
  await ctx.close();
}

await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED'); process.exit(failed ? 1 : 0);
