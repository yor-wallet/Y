/* Audit objectif de chaque écran (3 minutes) : contraste du texte (WCAG AA), zones tactiles, texte coupé, polices minuscules — clair et sombre, en et ar.
   Diagnostic, pas un test : il affiche un rapport et ne fait pas échouer. Lancer : NODE_PATH=$(npm root -g) node tests/ux/audit.mjs [rapport.json]
   Faux positifs connus : les textes posés sur un dégradé à arrêts transparents (faces des cartes virtuelles) sont jugés au pire cas ; `span.rv-cur`
   (symbole du rial dessiné par un masque, texte masqué exprès) ; les `input` plus petits que leur boîte cliquable. Vérifier à l'œil avant de corriger. */
import fs from 'node:fs';
import { serve, launch, openApp } from './harness.mjs';
const SCREENS = 'home wallet send-internal markets asset deposit exchange withdraw withdraw-bank withdraw-crypto history account services profile profile-edit settings notifications help privacy about devices sessions'.split(' ');
const out = process.argv[2] || '/tmp/audit.json';
const { srv, url } = await serve(); const browser = await launch();
const wait = ms => new Promise(r => setTimeout(r, ms));
const report = [];
const probe = () => {
  const parse = s => { const m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const stopsOf = img => [...img.matchAll(/rgba?\([^)]+\)/g)].map(x => parse(x[0])).filter(Boolean);
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const over = (c, u) => [c.r * c.a + u[0] * (1 - c.a), c.g * c.a + u[1] * (1 - c.a), c.b * c.a + u[2] * (1 - c.a)];
  let hasImage = false;
  function cands(el, depth = 0) {
    if (!el || depth > 40) return [[255, 255, 255]];
    const cs = getComputedStyle(el), col = parse(cs.backgroundColor), img = cs.backgroundImage;
    if (img && /url\(/.test(img)) hasImage = true;
    const stops = img && img.includes('gradient') ? stopsOf(img) : null;
    const opaque = (col && col.a >= .99) || (stops && stops.length && stops.every(s => s.a >= .99));
    const under = opaque ? null : cands(el.parentElement, depth + 1);
    const layer = stops && stops.length ? stops : (col && col.a > 0 ? [col] : null);
    if (!layer) return under || [[255, 255, 255]];
    if (!under) return layer.map(c => [c.r, c.g, c.b]);
    const res = []; for (const c of layer) for (const u of under) { res.push(over(c, u)); if (res.length > 12) break; } return res;
  }
  const visible = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05 && r.bottom > 0 && r.top < innerHeight * 3; };
  const sel = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.'); return s; };
  const res = { contrast: [], small: [], touch: [], clipped: [] };
  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim().length > 0).map(n => n.textContent.trim()).join(' ');
    if (own) {
      const cs = getComputedStyle(el), fg = parse(cs.color); if (!fg) continue;
      const fs = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700, large = fs >= 24 || (fs >= 18.66 && bold);
      hasImage = false; const bgs = cands(el); if (hasImage) continue;
      const fgs = bgs.map(b => over(fg, b)); // text alpha over its background
      const rs = fgs.map((f, i) => ratio(f, bgs[i])); const worst = Math.min(...rs), best = Math.max(...rs);
      const need = large ? 3 : 4.5;
      const key = sel(el) + '|' + own.slice(0, 20);
      if (worst < need && !seen.has(key)) { seen.add(key); res.contrast.push({ el: sel(el), text: own.slice(0, 40), fs, ratio: +worst.toFixed(2), best: +best.toFixed(2), need, color: cs.color }); }
      if (fs < 11 && !seen.has('s' + key)) { seen.add('s' + key); res.small.push({ el: sel(el), text: own.slice(0, 30), fs }); }
    }
    if (el.matches('button,a[href],[role="button"],[role="tab"],[role="switch"],input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),select,textarea,summary,[data-nav]')) {
      const r = el.getBoundingClientRect();
      if ((r.width < 44 || r.height < 44) && !(r.width >= 44 || r.height >= 44) === false) { /* both measured below */ }
      if (r.width < 40 || r.height < 40) { const k = 't' + sel(el); if (!seen.has(k)) { seen.add(k); res.touch.push({ el: sel(el), w: Math.round(r.width), h: Math.round(r.height), label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24) }); } }
    }
    const cs2 = getComputedStyle(el);
    if (cs2.overflow !== 'visible' && cs2.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && own) { const k = 'c' + sel(el); if (!seen.has(k)) { seen.add(k); res.clipped.push({ el: sel(el), sw: el.scrollWidth, cw: el.clientWidth, text: own.slice(0, 30) }); } }
  }
  return res;
};
for (const lang of ['en', 'ar']) for (const theme of ['dark', 'light']) {
  const { ctx, page } = await openApp(browser, url, { lang, theme, scheme: theme, settle: 300 });
  for (const id of SCREENS) {
    await page.evaluate(id => R.go(id, { force: true }), id); await wait(350);
    const r = await page.evaluate(probe);
    report.push({ lang, theme, id, ...r });
  }
  await ctx.close();
}
fs.writeFileSync(out, JSON.stringify(report));
// summary
const agg = (k, f) => { const m = new Map(); for (const r of report) for (const x of r[k]) { const key = f(x); const e = m.get(key) || { n: 0, screens: new Set(), ex: x }; e.n++; e.screens.add(r.theme + ':' + r.lang + ':' + r.id); m.set(key, e); } return [...m.entries()].sort((a, b) => b[1].n - a[1].n); };
console.log('=== CONTRASTE < AA (par élément) ===');
for (const [k, e] of agg('contrast', x => x.el + ' ' + x.color).slice(0, 40)) console.log(String(e.n).padStart(3), k, '| ex:', JSON.stringify(e.ex.text), 'ratio', e.ex.ratio, '/', e.ex.need, '| écrans:', [...e.screens].slice(0, 3).join(','));
console.log('\n=== CIBLES TACTILES < 40 px ===');
for (const [k, e] of agg('touch', x => x.el).slice(0, 25)) console.log(String(e.n).padStart(3), k, e.ex.w + '×' + e.ex.h, JSON.stringify(e.ex.label));
console.log('\n=== POLICES < 11 px ===');
for (const [k, e] of agg('small', x => x.el).slice(0, 12)) console.log(String(e.n).padStart(3), k, e.ex.fs + 'px', JSON.stringify(e.ex.text));
console.log('\n=== TEXTE COUPÉ (overflow sans ellipse) ===');
for (const [k, e] of agg('clipped', x => x.el).slice(0, 12)) console.log(String(e.n).padStart(3), k, e.ex.sw + '>' + e.ex.cw, JSON.stringify(e.ex.text));
await browser.close(); srv.close();
