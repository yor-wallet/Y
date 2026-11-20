/* Règle de livraison : tout fichier local chargé par index.html doit figurer dans SHELL de sw.js (sinon l'app hors ligne casse),
   et chaque entrée de SHELL doit exister. Vérifie aussi que le nom du cache suit la version. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const shell = [...sw.slice(sw.indexOf('const SHELL'), sw.indexOf('];', sw.indexOf('const SHELL'))).matchAll(/'([^']+)'/g)].map(m => m[1]);
const loaded = [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"#?]+)"/g)].map(m => m[1]).filter(u => !/^https?:/.test(u) && /\.(js|css)$/.test(u) && !u.startsWith('js/vendor/'));
let bad = 0;
for (const u of loaded) if (!shell.includes(u)){ console.log('  missing from SHELL:', u); bad++; }
for (const u of shell) if (u !== './' && !fs.existsSync(path.join(ROOT, u))){ console.log('  SHELL entry without a file:', u); bad++; }
const ver = fs.readFileSync(path.join(ROOT, 'js/data/reference-data.js'), 'utf8').match(/version:'([^']+)'/)[1];
assert.ok(sw.includes("'fp-shell-v" + ver + "'"), 'CACHE name must follow the version ' + ver);
assert.equal(bad, 0);
const srcPage = fs.readFileSync(path.join(ROOT, 'index.src.html'), 'utf8');
for (const m of srcPage.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"#?]+)"/g)) if (!/^https?:/.test(m[1]) && !fs.existsSync(path.join(ROOT, m[1]))){ console.log('  index.src.html lists a missing file:', m[1]); bad++; }
assert.equal(bad, 0);
console.log('  ok   SHELL covers all', loaded.length, 'local scripts / styles (version', ver + ')');
