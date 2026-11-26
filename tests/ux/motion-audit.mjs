/* Motion audit of the running app (16.0.0) — the measuring tool behind docs/mouvement/AUDIT.md.
   Real app through the test harness (fr, dark, 390 x 844, touch, live stream stand-in), CPU throttled 4x (mid-range phone).
   1) every screen: continuous animations running, visible backdrop-filters, effective transition vocabulary
   2) each interaction: new animations started (type, target, duration, easing, properties), frame intervals (rAF),
      style / layout work (CDP Performance), optional filmstrip from the compositor (Page.screencastFrame).
   Run: node tests/ux/motion-audit.mjs <outdir> [throttle]   →  <outdir>/runtime.txt (readable), runtime.json, film/ (compositor frames) */
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openApp } from './harness.mjs';
const OUT = process.argv[2]; const THROTTLE = Number(process.argv[3] || 4); fs.mkdirSync(OUT, { recursive: true });
const { srv, url } = await serve(); const browser = await launch();
const { ctx, page, logs } = await openApp(browser, url, { lang: 'fr', theme: 'dark', scheme: 'dark', width: 390, height: 844, touch: true, ws: 'live', settle: 1800 });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Performance.enable');
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const wait = ms => new Promise(r => setTimeout(r, ms));

await page.evaluate(() => {
  const R = window.__rec = { on: false, frames: [], anims: [], seen: new WeakSet() };
  const sel = n => !n ? '?' : (n.tagName ? n.tagName.toLowerCase() : '') + (n.id ? '#' + n.id : '') + (typeof n.className === 'string' && n.className.trim() ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const describe = a => {
    const e = a.effect, t = e ? e.getTiming() : {};
    let props = [], kfEase = '';
    try { const kf = e.getKeyframes(); props = [...new Set(kf.flatMap(k => Object.keys(k).filter(x => !['offset', 'computedOffset', 'easing', 'composite'].includes(x))))]; kfEase = (kf[0] && kf[0].easing) || ''; } catch (_) {}
    const ease = t.easing && t.easing !== 'linear' ? t.easing : (kfEase && kfEase !== 'linear' ? kfEase : (t.easing || ''));
    return { type: a.constructor.name, name: a.animationName || a.transitionProperty || '', sel: sel(e && e.target) + (e && e.pseudoElement ? e.pseudoElement : ''), dur: t.duration, delay: t.delay, easing: String(ease).slice(0, 70), iter: t.iterations, props };
  };
  const loop = ts => { if (!R.on) return; R.frames.push(ts); for (const a of document.getAnimations()) if (!R.seen.has(a)) { R.seen.add(a); R.anims.push(describe(a)); } requestAnimationFrame(loop); };
  window.__recStart = () => { R.on = true; R.frames = []; R.anims = []; R.seen = new WeakSet(); document.getAnimations().forEach(a => R.seen.add(a)); requestAnimationFrame(loop); };
  window.__recStop = () => { R.on = false; const f = R.frames, d = []; for (let i = 1; i < f.length; i++) d.push(+(f[i] - f[i - 1]).toFixed(1)); return { n: f.length, d, anims: R.anims }; };
  window.__screenScan = () => {
    const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden'; };
    const running = document.getAnimations().filter(a => a.playState === 'running');
    const inf = running.filter(a => a.effect && a.effect.getTiming().iterations === Infinity);
    const infVis = inf.filter(a => a.effect.target && a.effect.target.isConnected && vis(a.effect.target));
    let bf = 0, wc = 0; const vocab = new Map();
    document.querySelectorAll('body *').forEach(el => {
      if (!vis(el)) return;
      const cs = getComputedStyle(el);
      if (cs.backdropFilter && cs.backdropFilter !== 'none') bf++;
      if (cs.willChange && cs.willChange !== 'auto') wc++;
      const ds = cs.transitionDuration.split(',').map(s => parseFloat(s) * (s.includes('ms') ? 1 : 1000));
      if (ds.some(x => x > 0)){
        const tf = cs.transitionTimingFunction.split(/,(?![^(]*\))/).map(s => s.trim().startsWith('linear(') ? 'linear(ressort)' : s.trim());
        const props = cs.transitionProperty.split(',').map(s => s.trim());
        ds.forEach((d, i) => { if (d > 0){ const k = Math.round(d) + 'ms ' + (tf[i] || tf[0]); vocab.set(k, (vocab.get(k) || 0) + 1); } });
      }
    });
    return { running: running.length, infinite: inf.length, infiniteVisible: infVis.map(a => (a.animationName || a.transitionProperty || 'waapi') + ' @ ' + sel(a.effect.target)).slice(0, 12), infiniteVisibleN: infVis.length, backdrop: bf, willChange: wc, vocab: [...vocab.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14) };
  };
});

const report = { throttle: THROTTLE, screens: {}, interactions: [] };
async function film(label, act, ms){
  const shots = [];
  const h = f => { shots.push({ t: f.metadata.timestamp, data: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); };
  cdp.on('Page.screencastFrame', h);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 55, maxWidth: 390, maxHeight: 844, everyNthFrame: 1 });
  await wait(120);
  const t0 = Date.now() / 1000;
  await act(); await wait(ms);
  await cdp.send('Page.stopScreencast'); cdp.off('Page.screencastFrame', h);
  const dir = path.join(OUT, 'film', label.replace(/[^\w-]+/g, '_')); fs.mkdirSync(dir, { recursive: true });
  shots.filter(s => s.t >= t0 - 0.05).forEach((s, i) => fs.writeFileSync(path.join(dir, String(i).padStart(3, '0') + '_' + Math.round((s.t - t0) * 1000) + 'ms.jpg'), Buffer.from(s.data, 'base64')));
  return shots.length;
}
async function measure(label, act, ms = 900, withFilm = false){
  const m0 = await metrics();
  await page.evaluate(() => window.__recStart());
  let filmN = 0;
  try { if (withFilm) filmN = await film(label, act, ms); else { await act(); await wait(ms); } } catch (e) { report.interactions.push({ label, error: String(e.message).slice(0, 160) }); await page.evaluate(() => window.__recStop()); return; }
  const r = await page.evaluate(() => window.__recStop());
  const m1 = await metrics();
  const d = r.d.slice().sort((a, b) => a - b), q = p => d.length ? d[Math.min(d.length - 1, Math.floor(d.length * p))] : 0;
  const nonComp = r.anims.filter(a => a.props.some(p => !['transform', 'opacity', 'translate', 'scale', 'rotate', 'offset'].includes(p))).map(a => a.sel + ' [' + a.props.join(',') + ']');
  report.interactions.push({ label, frames: r.n, p50: q(.5), p95: q(.95), max: q(1), over25: r.d.filter(x => x > 25).length, over50: r.d.filter(x => x > 50).length,
    recalc: Math.round(m1.RecalcStyleCount - m0.RecalcStyleCount), layout: Math.round(m1.LayoutCount - m0.LayoutCount),
    styleMs: +((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000).toFixed(1), layoutMs: +((m1.LayoutDuration - m0.LayoutDuration) * 1000).toFixed(1), scriptMs: +((m1.ScriptDuration - m0.ScriptDuration) * 1000).toFixed(1),
    anims: r.anims.slice(0, 30), nonComposited: [...new Set(nonComp)].slice(0, 12), film: filmN });
}
const go = id => page.evaluate(id => R.go(id, { force: true }), id);
const has = s => page.evaluate(s => !!document.querySelector(s), s);
const clickOr = async (s, fallback) => { if (await has(s)) await page.click(s, { timeout: 3000 }); else await fallback(); };
const navSel = async id => (await has('#bottom-nav [data-nav="' + id + '"]')) ? '#bottom-nav [data-nav="' + id + '"]' : null;

/* ---------- 1. screens ---------- */
for (const id of ['home', 'wallet', 'markets', 'asset', 'spot', 'exchange', 'history', 'account', 'services', 'settings', 'profile', 'notifications', 'deposit', 'withdraw', 'send-internal']){
  await go(id); await wait(1400);
  report.screens[id] = await page.evaluate(() => window.__screenScan());
}
report.nav = await page.evaluate(() => [...document.querySelectorAll('#bottom-nav .nav-item')].map(a => a.getAttribute('data-nav')));

/* ---------- 2. interactions (CPU throttled) ---------- */
await go('home'); await wait(1200);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
const nm = await navSel('markets'), nw = await navSel('wallet'), nh = await navSel('home');
await measure('onglet accueil → marchés', () => clickOr(nm || '#none', () => go('markets')), 900, true);
await measure('onglet marchés → portefeuille', () => clickOr(nw || '#none', () => go('wallet')), 900);
await measure('onglet portefeuille → accueil', () => clickOr(nh || '#none', () => go('home')), 900);
await go('markets'); await wait(1200);
await measure('pousser : marchés → actif', () => clickOr('#markets [data-omx-asset]', () => go('asset')), 1000, true);
await wait(600);
await measure('revenir : actif → marchés', () => clickOr('#asset .topbar-back, #asset [data-action="back"]', () => page.evaluate(() => R.back())), 1000, true);
await wait(500);
await measure('segment Tous → Favoris', async () => { const c = await page.$$('#markets .chips .chip'); if (c[1]) await c[1].click(); }, 700);
await go('exchange'); await wait(1200);
await measure('feuille : ouverture', () => page.evaluate(() => { window.__closeSheet = R.overlay.open('<div class="omx-sheet"><h2>Choisir un réseau</h2><div class="omx-nets"><button class="omx-pick">Bitcoin</button><button class="omx-pick">Ethereum</button><button class="omx-pick">TRON</button></div></div>', { kind: 'sheet' }); }), 900, true);
await measure('feuille : fermeture', () => page.evaluate(() => window.__closeSheet && window.__closeSheet()), 700, true);
await wait(400);
await measure('modale : ouverture', () => page.evaluate(() => { window.__closeModal = R.overlay.open('<div class="omx-sheet"><p>Confirmer l’envoi ?</p><div class="omx-btns"><button class="btn btn-primary">Confirmer</button></div></div>', { kind: 'modal' }); }), 800, true);
await measure('modale : fermeture', () => page.evaluate(() => window.__closeModal && window.__closeModal()), 600);
await wait(400);
await measure('appui : bouton principal', async () => {
  const b = await page.$('#exchange .btn.btn-primary'); if (!b) throw new Error('no primary button');
  const box = await b.boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await wait(160); await page.mouse.up();
}, 600, true);
await go('home'); await wait(1300);
await measure('chiffre : solde qui change', () => page.evaluate(() => { const el = document.querySelector('#home [data-omx-total]'); if (!el) throw new Error('no total'); const n = el.firstChild; if (n && n.nodeType === 3) n.textContent = n.textContent.replace(/[\d,]+/, m => (parseInt(m.replace(/,/g, ''), 10) + 437).toLocaleString('en-US')); }), 900, true);
await go('settings'); await wait(1200);
await measure('interrupteur (réglages)', async () => { const s = await page.$('#settings [role="switch"], #settings .switch'); if (!s) throw new Error('no switch'); await s.click(); }, 700, true);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });

report.logs = logs.slice(0, 10);
fs.writeFileSync(path.join(OUT, 'runtime.json'), JSON.stringify(report, null, 1));
/* readable summary */
const L = [];
L.push('THROTTLE x' + THROTTLE + ' | nav: ' + report.nav.join(', '));
L.push('\n== ÉCRANS (au repos) : animations en cours / infinies / infinies visibles / backdrop-filter visibles / will-change');
for (const [id, s] of Object.entries(report.screens)) L.push(`  ${id.padEnd(14)} run ${String(s.running).padStart(3)}  inf ${String(s.infinite).padStart(3)}  infVis ${String(s.infiniteVisibleN).padStart(2)}  bf ${String(s.backdrop).padStart(2)}  wc ${String(s.willChange).padStart(2)}  ${s.infiniteVisible.slice(0, 4).join(' | ')}`);
const vocab = new Map(); Object.values(report.screens).forEach(s => s.vocab.forEach(([k, n]) => vocab.set(k, (vocab.get(k) || 0) + n)));
L.push('\n== VOCABULAIRE EFFECTIF des transitions visibles (durée + courbe : nombre d’éléments) — ' + vocab.size + ' couples distincts');
[...vocab.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).forEach(([k, n]) => L.push('   ' + String(n).padStart(4) + '  ' + k));
L.push('\n== INTERACTIONS (rAF : p50 / p95 / max ms, images > 25 ms et > 50 ms ; recalculs de style, mises en page, ms de style / mise en page / script)');
for (const x of report.interactions){
  if (x.error){ L.push('  ' + x.label + ' : ERREUR ' + x.error); continue; }
  L.push(`  ${x.label.padEnd(30)} p50 ${x.p50} p95 ${x.p95} max ${x.max}  >25:${x.over25} >50:${x.over50}  style ${x.recalc}×/${x.styleMs}ms  layout ${x.layout}×/${x.layoutMs}ms  script ${x.scriptMs}ms  film ${x.film}`);
  const seen = new Set();
  x.anims.forEach(a => { const k = a.type + ' ' + a.sel + ' ' + a.dur + 'ms ' + a.easing + ' [' + a.props.join(',') + ']'; if (seen.has(k)) return; seen.add(k); L.push('       · ' + k.slice(0, 190)); });
  if (x.nonComposited.length) L.push('       ✗ non composité (fil principal) : ' + x.nonComposited.join(' ; ').slice(0, 300));
}
if (report.logs.length) L.push('\nerreurs page : ' + report.logs.join(' | '));
fs.writeFileSync(path.join(OUT, 'runtime.txt'), L.join('\n'));
console.log(L.join('\n'));
await browser.close(); srv.close();
