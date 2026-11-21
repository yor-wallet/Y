/* OM Wallet 13.2 — brand assets, generated (Chromium + Playwright). Replaces the previous mark entirely.
   usage: node tools/brand/build-brand.mjs [dossier-app]   (default: repository root)
   Writes: public/branding/*  (logo, icons 1024/512/192, favicon, apple-touch, notification + monochrome),
           assets/icons/*, assets/brand/*, assets/share/og-*.png, assets/splash/*.jpg, favicon.ico
   The mark is drawn with strokes (no font): a ring "O" and an "M" in one sky-blue gradient on a translucent white glass tile.
   Palette: --sky-light #BFE8FF, --sky-primary #78C9F4, --sky-accent #369EDB, --blue-deep #193B55, background #F4FAFF. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '../..'));
const A = p => path.join(ROOT, 'assets', p), B = p => path.join(ROOT, 'public/branding', p);
for (const d of ['icons/ar', 'brand/png', 'share', 'splash']) fs.mkdirSync(A(d), { recursive: true });
fs.mkdirSync(B(''), { recursive: true });

/* ---------- the mark ---------- */
const DEFS = '<defs>' +
  '<linearGradient id="om-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCF0FF"/></linearGradient>' +
  '<radialGradient id="om-glow" cx=".26" cy=".1" r=".95"><stop offset="0" stop-color="#BFE8FF" stop-opacity=".95"/><stop offset=".72" stop-color="#BFE8FF" stop-opacity="0"/></radialGradient>' +
  '<linearGradient id="om-ink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#78C9F4"/><stop offset=".5" stop-color="#369EDB"/><stop offset="1" stop-color="#1E5F9C"/></linearGradient>' +
  '<linearGradient id="om-shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
  '<filter id="om-sh" x="-40%" y="-45%" width="180%" height="220%"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#369EDB" flood-opacity=".38"/></filter></defs>';
const INK = '<circle cx="170" cy="264" r="68" fill="none" stroke="url(#om-ink)" stroke-width="46"/>' +
  '<path d="M292 332V198l66 82 66-82v134" fill="none" stroke="url(#om-ink)" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/>';
/* rx: 114 = rounded tile; 0 = full bleed (iOS masks it itself); scale < 1 = maskable safe zone */
function markSvg(rx = 114, scale = 1, size = 512){
  const g = '<g filter="url(#om-sh)">' + INK + '</g>';
  const body = scale === 1 ? g : '<g transform="translate(256 256) scale(' + scale + ') translate(-256 -256)">' + g + '</g>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"' + (size !== 512 ? ' width="' + size + '" height="' + size + '"' : '') + '>' + DEFS +
    '<rect width="512" height="512" rx="' + rx + '" fill="url(#om-bg)"/><rect width="512" height="512" rx="' + rx + '" fill="url(#om-glow)"/>' + body +
    '<path d="M70 30Q256 -6 442 30Q480 38 486 86Q256 40 26 86Q32 38 70 30Z" fill="url(#om-shine)" opacity=".75" transform="translate(0 6)"/>' +
    (rx ? '<rect x="3" y="3" width="506" height="506" rx="' + (rx - 3) + '" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="6"/>' : '') + '</svg>';
}
/* the mark alone (no tile), transparent background — used in the app header and the lock-up */
const markOnly = (size = 512) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 150 400 240" width="' + size + '" height="' + Math.round(size * .6) + '">' + DEFS + '<g filter="url(#om-sh)">' + INK + '</g></svg>';
const mono = (color = '#000') => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 150 400 240"><circle cx="170" cy="264" r="68" fill="none" stroke="' + color + '" stroke-width="46"/><path d="M292 332V198l66 82 66-82v134" fill="none" stroke="' + color + '" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function logoSvg(scheme = 'light'){
  const ink = scheme === 'dark' ? '#EAF4FF' : '#193B55';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' + DEFS + '<g transform="translate(60 8) scale(.69)"><g filter="url(#om-sh)">' + INK + '</g></g>' +
    '<text x="200" y="262" text-anchor="middle" font-family="-apple-system,\'SF Pro Display\',Inter,\'Helvetica Neue\',Arial,sans-serif" font-weight="800" font-size="64" letter-spacing="1" fill="' + ink + '">OM PAY</text></svg>';
}
const write = (p, s) => fs.writeFileSync(p, s);
write(A('icons/icon.svg'), markSvg()); write(B('om-wallet-favicon.svg'), markSvg());
write(A('brand/logo-mark.svg'), markSvg()); write(A('brand/logo-mark-ar.svg'), markSvg());
write(A('brand/logo-mark-only.svg'), markOnly());
write(B('om-wallet-logo.svg'), logoSvg('light')); write(A('brand/logo-wordmark-dark.svg'), logoSvg('light')); write(A('brand/logo-wordmark-white.svg'), logoSvg('dark'));
write(A('brand/logo-wordmark-ar-dark.svg'), logoSvg('light')); write(A('brand/logo-wordmark-ar-white.svg'), logoSvg('dark'));
write(B('om-wallet-monochrome.svg'), mono('#000'));
write(A('brand/friendly-letters-white.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 64"><text x="0" y="46" font-family="-apple-system,\'SF Pro Display\',Inter,Helvetica,Arial,sans-serif" font-weight="800" font-size="46" fill="#fff">OM PAY</text></svg>');

/* ---------- rendering ---------- */
const FONTS = 'file://' + path.join(ROOT, 'assets/fonts/');
const FONTCSS = '@font-face{font-family:"Inter";font-weight:100 900;src:url(' + FONTS + 'inter-latin-var.woff2) format("woff2")}' +
  '@font-face{font-family:"IBM Plex Sans Arabic";font-weight:700;src:url(' + FONTS + 'plex-arabic-700.woff2) format("woff2")}';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
async function shot(html, w, h, out, opts = {}){
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent('<!doctype html><meta charset="utf-8"><style>' + FONTCSS + 'html,body{margin:0;padding:0;background:' + (opts.bg || 'transparent') + '}svg{display:block}</style>' + html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, omitBackground: !!opts.alpha, type: opts.jpeg ? 'jpeg' : 'png', quality: opts.jpeg ? 92 : undefined });
  await ctx.close();
}
const tile = (n, rx = 114, sc = 1) => markSvg(rx, sc, n);
for (const n of [16, 32, 48]) await shot(tile(n), n, n, A('icons/favicon-' + n + '.png'), { alpha: true });
await shot(tile(180, 0), 180, 180, A('icons/apple-touch-icon.png')); await shot(tile(180, 0), 180, 180, B('apple-touch-icon.png'));
await shot(tile(192, 0), 192, 192, A('icons/icon-192.png')); await shot(tile(192, 0), 192, 192, B('om-wallet-icon-192.png'));
await shot(tile(512), 512, 512, A('icons/icon-512.png'), { alpha: true }); await shot(tile(512), 512, 512, B('om-wallet-icon-512.png'), { alpha: true });
await shot(tile(1024), 1024, 1024, B('om-wallet-icon-1024.png'), { alpha: true });
await shot(tile(512, 0, .74), 512, 512, A('icons/icon-maskable-512.png'));
await shot(tile(180, 0), 180, 180, A('icons/ar/apple-touch-icon.png')); await shot(tile(192, 0), 192, 192, A('icons/ar/icon-192.png')); await shot(tile(512), 512, 512, A('icons/ar/icon-512.png'));
await shot(tile(512), 512, 512, A('brand/png/logo-mark-512.png'), { alpha: true }); await shot(tile(512), 512, 512, A('brand/png/logo-mark-ar-512.png'), { alpha: true });
const lg = (svg, w, h) => svg.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="' + w + '" height="' + h + '" style="font-family:Inter,sans-serif"');
await shot(lg(logoSvg('light'), 1200, 900), 1200, 900, B('om-wallet-logo.png'), { alpha: true });
await shot(lg(logoSvg('light'), 1200, 900), 1200, 900, A('brand/png/logo-wordmark-en-dark.png'), { alpha: true }); await shot(lg(logoSvg('dark'), 1200, 900), 1200, 900, A('brand/png/logo-wordmark-en-white.png'), { alpha: true });
await shot(lg(logoSvg('light'), 1200, 900), 1200, 900, A('brand/png/logo-wordmark-ar-dark.png'), { alpha: true }); await shot(lg(logoSvg('dark'), 1200, 900), 1200, 900, A('brand/png/logo-wordmark-ar-white.png'), { alpha: true });
/* notification icon (Android status bar: white silhouette on transparent) and monochrome PNG */
await shot(mono('#fff').replace('<svg ', '<svg width="96" height="58" '), 96, 58, B('om-wallet-notification.png'), { alpha: true });
await shot(mono('#000').replace('<svg ', '<svg width="512" height="307" '), 512, 307, B('om-wallet-monochrome.png'), { alpha: true });

/* favicon.ico (16 / 32 / 48) from the PNGs */
{
  const png = n => fs.readFileSync(A('icons/favicon-' + n + '.png'));
  const imgs = [16, 32, 48].map(n => ({ n, d: png(n) }));
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
  let off = 6 + 16 * imgs.length; const dir = [], data = [];
  for (const im of imgs){ const e = Buffer.alloc(16); e[0] = im.n; e[1] = im.n; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(im.d.length, 8); e.writeUInt32LE(off, 12); dir.push(e); data.push(im.d); off += im.d.length; }
  fs.writeFileSync(path.join(ROOT, 'favicon.ico'), Buffer.concat([head, ...dir, ...data]));
}

/* iOS launch images: white / soft sky, the glass mark with a light halo, the name */
const SPLASH = [[1320, 2868], [1206, 2622], [1290, 2796], [1179, 2556], [1284, 2778], [1170, 2532], [1125, 2436], [1242, 2688], [828, 1792], [1242, 2208], [750, 1334], [640, 1136]];
for (const [w, h] of SPLASH) for (const th of ['light', 'dark']){
  const m = Math.round(Math.min(w, h) * .3), dark = th === 'dark';
  const bg = dark ? 'radial-gradient(ellipse at 50% 38%,#16405F 0%,#0A1B2B 62%)' : 'radial-gradient(ellipse at 50% 38%,#DDF1FF 0%,#FFFFFF 62%)';
  const html = '<div style="width:' + w + 'px;height:' + h + 'px;background:' + bg + ';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:' + Math.round(m * .22) + 'px">' +
    '<div style="filter:drop-shadow(0 ' + Math.round(m * .05) + 'px ' + Math.round(m * .18) + 'px rgba(54,158,219,.45))">' + tile(m) + '</div>' +
    '<div style="font:800 ' + Math.round(m * .2) + 'px/1.1 Inter,sans-serif;letter-spacing:-.01em;color:' + (dark ? '#EAF4FF' : '#193B55') + '">OM Wallet</div></div>';
  await shot(html, w, h, A('splash/ios-' + w + 'x' + h + '-' + th + '.jpg'), { jpeg: true });
}

/* share images 1200 x 630 */
const OG = { en: ['Send money simply and securely.', 'Mobile money to Oman and Mali · English, Français, العربية'], fr: ['Envoyez de l’argent simplement et en toute sécurité.', 'Vers Oman et le Mali · English, Français, العربية'], ar: ['أرسل الأموال ببساطة وأمان.', 'إلى عُمان ومالي · English · Français · العربية'] };
for (const lang of ['en', 'fr', 'ar']){
  const [t1, t2] = OG[lang], ar = lang === 'ar';
  const html = '<div style="width:1200px;height:630px;background:radial-gradient(ellipse at 20% 0%,#DDF1FF 0%,#F4FAFF 60%,#FFFFFF 100%);display:flex;align-items:center;justify-content:' + (ar ? 'flex-end' : 'flex-start') + ';padding:0 96px;box-sizing:border-box;gap:56px;flex-direction:' + (ar ? 'row-reverse' : 'row') + ';direction:' + (ar ? 'rtl' : 'ltr') + '">' +
    '<div style="filter:drop-shadow(0 18px 30px rgba(54,158,219,.35))">' + tile(240) + '</div>' +
    '<div style="color:#193B55;font-family:' + (ar ? '\'IBM Plex Sans Arabic\'' : 'Inter') + ',sans-serif;max-width:640px"><div style="font-weight:800;font-size:72px;line-height:1.08;letter-spacing:-.02em">OM Wallet</div>' +
    '<div style="margin-top:20px;font-weight:700;font-size:40px;line-height:1.25">' + t1 + '</div><div style="margin-top:18px;font-weight:500;font-size:26px;line-height:1.4;color:#74879A">' + t2 + '</div></div></div>';
  await shot(html, 1200, 630, A('share/og-' + lang + '.png'));
}
await browser.close();
console.log('brand assets written to', ROOT);
