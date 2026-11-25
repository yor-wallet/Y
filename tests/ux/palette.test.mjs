/* Palette « Noir & Jaune » : chaque couple texte / fond des jetons de css/noirjaune.css respecte WCAG AA (4,5 : 1) ; texte sur jaune ≥ 7 : 1.
   Calcul pur (pas de navigateur) : lit les blocs de jetons clair et sombre du fichier. Échec = un jeton a été modifié sans vérifier le contraste. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const css = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../css/noirjaune.css'), 'utf8');
const block = (start, end) => { const a = css.indexOf(start); const b = css.indexOf('}', a); assert.ok(a > 0 && b > a, 'bloc introuvable : ' + start); return css.slice(a, b); };
const tokens = txt => Object.fromEntries([...txt.matchAll(/--lt-([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2]]));
const light = tokens(block('html:root:root:root{', '}')), dark = { ...light, ...tokens(block('html:root:root:root[data-theme="dark"]{', '}')) };   /* le sombre ne redéfinit que ce qui change */
const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
let failed = 0;
const check = (name, fg, bgs, min, T) => { for (const bg of bgs) { const r = ratio(T[fg], T[bg]); const ok = r >= min; if (!ok) failed++; console.log(ok ? '  ok  ' : '  FAIL', name, fg + ' (' + T[fg] + ') sur ' + bg + ' (' + T[bg] + ') = ' + r.toFixed(2) + ' (min ' + min + ')'); } };
for (const [name, T, surfaces] of [['sombre', dark, ['bg', 'card', 'card2', 'soft', 'nav']], ['clair', light, ['bg', 'card', 'card2', 'soft']]]) {
  console.log('\n[' + name + ']');
  for (const k of ['ink', 'ink2', 'ink3', 'link']) check(name + ' texte', k, surfaces, 4.5, T);
  check(name + ' gain', 'pos', [...surfaces, 'chip-up'], 4.5, T);
  check(name + ' perte', 'neg', [...surfaces, 'chip-dn'], 4.5, T);
  check(name + ' texte sur jaune', 'on-yellow', ['yellow', 'yellow-hi', 'yellow-lo'], 7, T);
}
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);
