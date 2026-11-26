/* QR codes of the showcase site (15.4.0): on a computer, the visitor scans one to continue on the phone, in the same language.
   Written once as small static SVG files (welcome/img/qr-{fr,en,ar}.svg), with the app's own QR encoder (js/crypto/qr-encoder.js,
   MIT, Kazuhiko Arase): dark modules on white, quiet zone of 4 modules — as every QR of OM Wallet. Nothing is fetched.
   Run from the repository root:  node tools/qr-welcome.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const qrcode = require(path.resolve('js/crypto/qr-encoder.js'));
for (const lang of ['fr', 'en', 'ar']) {
  const url = 'https://yor-wallet.vercel.app/welcome?lang=' + lang;
  const qr = qrcode(0, 'M'); qr.addData(url); qr.make();
  const n = qr.getModuleCount(), q = 4, size = n + 2 * q;
  let d = '';
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!qr.isDark(r, c)) { c++; continue; }
      let e = c; while (e < n && qr.isDark(r, e)) e++;
      d += 'M' + (c + q) + ' ' + (r + q) + 'h' + (e - c) + 'v1h-' + (e - c) + 'z';
      c = e;
    }
  }
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges" role="img" aria-label="' + url + '">'
    + '<rect width="' + size + '" height="' + size + '" fill="#fff"/><path fill="#14110A" d="' + d + '"/></svg>\n';
  fs.writeFileSync('welcome/img/qr-' + lang + '.svg', svg);
  console.log('written welcome/img/qr-' + lang + '.svg', n + 'x' + n, svg.length + ' bytes', url);
}
