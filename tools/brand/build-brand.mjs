/* Friendly Pay 12.16.0 — brand assets, generated (Chromium + Playwright).
   usage: node tools/brand/build-brand.mjs [dossier-app]   (par défaut : la racine du dépôt)
   Écrit : assets/icons/*, assets/icons/ar/*, assets/brand/*.svg + png/, assets/share/og-*.png, assets/splash/*.jpg, favicon.ico
   Le glyphe est dessiné avec des traits (même structure que l'animation d'ouverture : js/ui/opening-art.js) : un « F » massif + une pièce ambrée ;
   la version arabe est un « ف » dessiné de la même façon. Aucune police n'est nécessaire pour les icônes. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '../..'));
const A = p => path.join(ROOT, 'assets', p);
for (const d of ['icons/ar', 'brand/png', 'share', 'splash']) fs.mkdirSync(A(d), { recursive: true });

/* ---------- the mark ---------- */
const DEFS = '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6372FF"/><stop offset="1" stop-color="#2A33C9"/></linearGradient>' +
  '<radialGradient id="hl" cx=".3" cy="0" r=".95"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
  '<linearGradient id="coin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE59A"/><stop offset="1" stop-color="#FFAE2B"/></linearGradient>' +
  '<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="11" flood-color="#10186B" flood-opacity=".4"/></filter></defs>';
/* one mark for every language: a smile (Friendly) and a coin (Pay) */
const GLYPH = { en: '<path d="M150 300Q256 410 362 300" fill="none" stroke="#fff" stroke-width="62" stroke-linecap="round"/><circle cx="256" cy="176" r="58" fill="url(#coin)"/>' };
GLYPH.ar = GLYPH.en;
/* rx: 114 = the rounded tile (browsers, in-app logo); 0 = full bleed (iOS masks it itself); scale < 1 = maskable safe zone */
function markSvg(lang, rx = 114, scale = 1, size = 512){
  const g = scale === 1 ? '<g filter="url(#sh)">' + GLYPH[lang] + '</g>' : '<g transform="translate(256 256) scale(' + scale + ') translate(-256 -256)"><g filter="url(#sh)">' + GLYPH[lang] + '</g></g>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"' + (size !== 512 ? ' width="' + size + '" height="' + size + '"' : '') + '>' + DEFS + '<rect width="512" height="512" rx="' + rx + '" fill="url(#bg)"/><rect width="512" height="512" rx="' + rx + '" fill="url(#hl)"/>' + g + '</svg>';
}
function wordmarkSvg(lang, scheme){
  const dark = scheme === 'dark';                        /* "dark" = dark text for light backgrounds, as before */
  const ink = dark ? '#0B1F1D' : '#FFFFFF', sub = dark ? '#3B49E8' : '#B9C0FF';
  const inner = DEFS + '<rect width="512" height="512" rx="114" fill="url(#bg)"/><rect width="512" height="512" rx="114" fill="url(#hl)"/><g filter="url(#sh)">' + GLYPH[lang] + '</g>';
  if (lang === 'ar'){
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120" direction="rtl"><g transform="translate(400 0) scale(.2)">' + inner + '</g>' +
      '<text x="380" y="82" text-anchor="end" font-family="\'SF Arabic\',\'IBM Plex Sans Arabic\',\'Geeza Pro\',\'Noto Sans Arabic\',\'DejaVu Sans\',Tahoma,Arial,sans-serif" font-weight="800" font-size="62" fill="' + ink + '">فرندي<tspan font-weight="600" fill="' + sub + '" dx="-14"> باي</tspan></text></svg>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120"><g transform="scale(.2)">' + inner + '</g>' +
    '<text x="132" y="78" font-family="-apple-system,\'SF Pro Display\',Inter,Helvetica,Arial,sans-serif" font-weight="800" font-size="56" textLength="372" lengthAdjust="spacingAndGlyphs" fill="' + ink + '">Friendly<tspan font-weight="500" fill="' + sub + '" dx="12">Pay</tspan></text></svg>';
}
const write = (p, s) => fs.writeFileSync(p, s);
write(A('icons/icon.svg'), markSvg('en'));
write(A('brand/logo-mark.svg'), markSvg('en'));
write(A('brand/logo-mark-ar.svg'), markSvg('ar'));
write(A('brand/logo-wordmark-dark.svg'), wordmarkSvg('en', 'dark'));
write(A('brand/logo-wordmark-white.svg'), wordmarkSvg('en', 'white'));
write(A('brand/logo-wordmark-ar-dark.svg'), wordmarkSvg('ar', 'dark'));
write(A('brand/logo-wordmark-ar-white.svg'), wordmarkSvg('ar', 'white'));
write(A('brand/friendly-letters-white.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 64"><text x="0" y="46" font-family="-apple-system,\'SF Pro Display\',Inter,Helvetica,Arial,sans-serif" font-weight="800" font-size="46" textLength="270" lengthAdjust="spacingAndGlyphs" fill="#fff">Friendly<tspan font-weight="500" dx="8" fill-opacity=".85">Pay</tspan></text></svg>');

/* ---------- rendering ---------- */
const FONTS = 'file://' + path.join(ROOT, 'assets/fonts/');
const FONTCSS = '@font-face{font-family:"Inter";font-weight:100 900;src:url(' + FONTS + 'inter-latin-var.woff2) format("woff2")}' +
  '@font-face{font-family:"IBM Plex Sans Arabic";font-weight:700;src:url(' + FONTS + 'plex-arabic-700.woff2) format("woff2")}' +
  '@font-face{font-family:"IBM Plex Sans Arabic";font-weight:500;src:url(' + FONTS + 'plex-arabic-500.woff2) format("woff2")}';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
async function shot(html, w, h, out, opts = {}){
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent('<!doctype html><meta charset="utf-8"><style>' + FONTCSS + 'html,body{margin:0;padding:0;background:' + (opts.bg || 'transparent') + '}svg{display:block}</style>' + html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, omitBackground: !!opts.alpha, type: opts.jpeg ? 'jpeg' : 'png', quality: opts.jpeg ? 92 : undefined });
  await ctx.close();
}
const sized = (svg, n) => svg.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="' + n + '" height="' + n + '"');
for (const n of [16, 32, 48]) await shot(sized(markSvg('en'), n), n, n, A('icons/favicon-' + n + '.png'), { alpha: true });
await shot(sized(markSvg('en', 0), 180), 180, 180, A('icons/apple-touch-icon.png'));
await shot(sized(markSvg('en', 0), 192), 192, 192, A('icons/icon-192.png'));
await shot(sized(markSvg('en'), 512), 512, 512, A('icons/icon-512.png'), { alpha: true });
await shot(sized(markSvg('en', 0, .74), 512), 512, 512, A('icons/icon-maskable-512.png'));
await shot(sized(markSvg('ar', 0), 180), 180, 180, A('icons/ar/apple-touch-icon.png'));
await shot(sized(markSvg('ar', 0), 192), 192, 192, A('icons/ar/icon-192.png'));
await shot(sized(markSvg('ar'), 512), 512, 512, A('icons/ar/icon-512.png'));
await shot(sized(markSvg('en'), 512), 512, 512, A('brand/png/logo-mark-512.png'), { alpha: true });
await shot(sized(markSvg('ar'), 512), 512, 512, A('brand/png/logo-mark-ar-512.png'), { alpha: true });
const wm = (svg) => svg.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120"', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120" width="1560" height="360" style="font-family:Inter,\'IBM Plex Sans Arabic\'"');
await shot(wm(wordmarkSvg('en', 'dark')), 1560, 360, A('brand/png/logo-wordmark-en-dark.png'), { alpha: true });
await shot(wm(wordmarkSvg('en', 'white')), 1560, 360, A('brand/png/logo-wordmark-en-white.png'), { alpha: true });
await shot(wm(wordmarkSvg('ar', 'dark')), 1560, 360, A('brand/png/logo-wordmark-ar-dark.png'), { alpha: true });
await shot(wm(wordmarkSvg('ar', 'white')), 1560, 360, A('brand/png/logo-wordmark-ar-white.png'), { alpha: true });

/* favicon.ico (16 / 32 / 48) from the PNGs */
{
  const png = n => fs.readFileSync(A('icons/favicon-' + n + '.png'));
  const imgs = [16, 32, 48].map(n => ({ n, d: png(n) }));
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
  let off = 6 + 16 * imgs.length; const dir = [], data = [];
  for (const im of imgs){ const e = Buffer.alloc(16); e[0] = im.n; e[1] = im.n; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(im.d.length, 8); e.writeUInt32LE(off, 12); dir.push(e); data.push(im.d); off += im.d.length; }
  fs.writeFileSync(path.join(ROOT, 'favicon.ico'), Buffer.concat([head, ...dir, ...data]));
}

/* iOS launch images: the system background, the mark, the name — like a UIKit launch screen */
const SPLASH = [[1320, 2868], [1206, 2622], [1290, 2796], [1179, 2556], [1284, 2778], [1170, 2532], [1125, 2436], [1242, 2688], [828, 1792], [1242, 2208], [750, 1334], [640, 1136]];
for (const [w, h] of SPLASH) for (const th of ['light', 'dark']){
  const m = Math.round(Math.min(w, h) * .26), dark = th === 'dark';
  const html = '<div style="width:' + w + 'px;height:' + h + 'px;background:' + (dark ? '#000' : '#FFFFFF') + ';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:' + Math.round(m * .2) + 'px">' +
    sized(markSvg('en'), m) + '<div style="font:700 ' + Math.round(m * .24) + 'px/1.1 Inter,sans-serif;letter-spacing:-.02em;color:' + (dark ? '#fff' : '#000') + '">Friendly <span style="font-weight:500;color:' + (dark ? '#9AA4FF' : '#3B49E8') + '">Pay</span></div></div>';
  await shot(html, w, h, A('splash/ios-' + w + 'x' + h + '-' + th + '.jpg'), { jpeg: true });
}

/* share images 1200 x 630 */
const OG = { en: ['Send money simply and securely.', 'Mobile money to Oman and Mali · Cards · English, Français, العربية'], fr: ['Envoyez de l’argent simplement et en toute sécurité.', 'Vers Oman et le Mali · Cartes · English, Français, العربية'], ar: ['أرسل الأموال ببساطة وأمان.', 'إلى عُمان ومالي · البطاقات · English · Français · العربية'] };
for (const lang of ['en', 'fr', 'ar']){
  const [t1, t2] = OG[lang], ar = lang === 'ar';
  const html = '<div style="width:1200px;height:630px;background:linear-gradient(135deg,#1A2294 0%,#3B49E8 55%,#6372FF 100%);display:flex;align-items:center;justify-content:' + (ar ? 'flex-end' : 'flex-start') + ';padding:0 96px;box-sizing:border-box;gap:56px;flex-direction:' + (ar ? 'row-reverse' : 'row') + ';direction:' + (ar ? 'rtl' : 'ltr') + '">' +
    sized(markSvg(ar ? 'ar' : 'en'), 240) +
    '<div style="color:#fff;font-family:' + (ar ? '\'IBM Plex Sans Arabic\'' : 'Inter') + ',sans-serif;max-width:640px"><div style="font-weight:800;font-size:' + (ar ? 76 : 68) + 'px;line-height:1.08;letter-spacing:' + (ar ? 0 : '-.03em') + '">' + (ar ? 'فرندي باي' : 'Friendly Pay') + '</div>' +
    '<div style="margin-top:20px;font-weight:700;font-size:40px;line-height:1.25;opacity:.96">' + t1 + '</div><div style="margin-top:18px;font-weight:500;font-size:26px;line-height:1.4;opacity:.78">' + t2 + '</div></div></div>';
  await shot(html, 1200, 630, A('share/og-' + lang + '.png'));
}
await browser.close();
console.log('brand assets written to', ROOT);
