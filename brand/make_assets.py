#!/usr/bin/env python3
"""Regenerates every logo / icon derivative from the three images supplied by the owner (brand/originals/):
   app-icon-glass.png (the glass app icon), logo-sheet.png (six logo variants), onboarding-ar.png (an onboarding slide, kept as a reference).
   - brand/om-*.png        transparent logo files (mark, stacked, horizontal, navy, white silhouettes)
   - web: assets/icons, public/branding, assets/brand (PNG icons, favicon.ico, SVG wrappers that embed the PNG)
   - Android: android/app/src/main/res/drawable-nodpi (adaptive icon layers, themed icon, splash mark, login logo)
   Usage (repo root): python3 brand/make_assets.py        Needs: Pillow, numpy."""
import base64, io, os, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); os.chdir(ROOT)
B, O = 'brand/', 'brand/originals/'

# ---------- 1. transparent logo files ----------
def pad_square(img, ratio=1.0):
    s = int(max(img.size) / ratio); sq = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sq.paste(img, ((s - img.width) // 2, (s - img.height) // 2)); return sq
def scale_w(im, w): return im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
def pad(im, p=0.06):
    w, h = im.size; px = int(w * p); out = Image.new('RGBA', (w + 2 * px, h + 2 * px), (0, 0, 0, 0)); out.paste(im, (px, px)); return out
def to_white(im): w = Image.new('RGBA', im.size, (255, 255, 255, 0)); w.putalpha(im.getchannel('A')); return w
def key_white(cell):
    c = np.array(cell).astype(float); mn = c.min(2)
    al = np.clip((250 - mn) / 100, 0, 1); a3 = np.maximum(al, 1e-3)[..., None]
    f = np.clip((c - (1 - a3) * 255) / a3, 0, 255)
    img = Image.fromarray(np.dstack([f, al * 255]).astype(np.uint8), 'RGBA')
    return img.crop(img.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox())

a = np.array(Image.open(O + 'app-icon-glass.png').convert('RGB')).astype(float)
mx, mn = a.max(2), a.min(2); sat = (mx - mn) / np.maximum(mx, 1)                 # the mark is saturated, the glass tile is pale
alpha = np.clip((sat - 0.22) / (0.40 - 0.22), 0, 1); m = np.zeros_like(alpha); m[270:1000, 180:1070] = 1; alpha *= m
bg = np.array([221, 239, 252], float); al = np.maximum(alpha, 1e-3)[..., None]
mark_t = Image.fromarray(np.dstack([np.clip((a - (1 - al) * bg) / al, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA')
mark_t = mark_t.crop(mark_t.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()); mark_t.save(B + 'om-mark-tight.png')
mark = pad_square(mark_t, 0.86).resize((1024, 1024), Image.LANCZOS); mark.save(B + 'om-mark.png'); to_white(mark).save(B + 'om-mark-white.png')
S = Image.open(O + 'logo-sheet.png').convert('RGB'); inset = 10
cell = lambda c, r: S.crop((c * 512 + inset, r * 512 + inset, c * 512 + 512 - inset, r * 512 + 512 - inset))
stacked, horiz, navy = key_white(cell(2, 0)), key_white(cell(1, 0)), key_white(cell(0, 1))
scale_w(pad(stacked), 1024).save(B + 'om-logo-stacked.png'); scale_w(pad(horiz), 1400).save(B + 'om-logo-horizontal.png'); scale_w(pad(navy), 1024).save(B + 'om-logo-navy.png')
scale_w(pad(to_white(stacked)), 1024).save(B + 'om-logo-white.png'); scale_w(pad(to_white(horiz)), 1400).save(B + 'om-logo-horizontal-white.png')
stacked_l = Image.open(B + 'om-logo-stacked.png'); stacked_w = Image.open(B + 'om-logo-white.png')

# ---------- 2. tiles ----------
def gradient(size, c0=(246, 251, 255), c1=(206, 230, 255)):
    yy, xx = np.mgrid[0:size, 0:size]; t = ((xx + yy) / (2 * (size - 1)))[..., None]
    return Image.fromarray((np.array(c0) + (np.array(c1) - np.array(c0)) * t).astype(np.uint8)).convert('RGBA')
def place(canvas, m, ratio):
    w = int(canvas.width * ratio); mm = m.resize((w, int(m.height * w / m.width)), Image.LANCZOS)
    canvas.alpha_composite(mm, ((canvas.width - mm.width) // 2, (canvas.height - mm.height) // 2)); return canvas
def tile(size, ratio=0.62, rounded=True, ss=2):
    S2 = size * ss; bgi = gradient(min(S2, 512)).resize((S2, S2), Image.BICUBIC); place(bgi, mark_t, ratio)
    if rounded:
        mask = Image.new('L', (S2, S2), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, S2 - 1, S2 - 1), radius=int(S2 * 0.2237), fill=255); bgi.putalpha(mask)
        ImageDraw.Draw(bgi).rounded_rectangle((S2 * 0.006, S2 * 0.006, S2 * 0.994, S2 * 0.994), radius=int(S2 * 0.22), outline=(255, 255, 255, 200), width=max(2, S2 // 170))
    return bgi.resize((size, size), Image.LANCZOS)
def mark_only(size, ratio=0.9): return place(Image.new('RGBA', (size, size), (0, 0, 0, 0)), mark_t, ratio)
def save(im, path): os.makedirs(os.path.dirname(path) or '.', exist_ok=True); im.save(path, optimize=True)

# ---------- 3. web ----------
A, P = 'assets/icons/', 'public/branding/'
for d, pre in ((A, 'icon-'), (A + 'ar/', 'icon-'), (P, 'om-wallet-icon-')):
    save(tile(192), d + pre + '192.png'); save(tile(512), d + pre + '512.png')
save(tile(1024), P + 'om-wallet-icon-1024.png'); save(tile(512, 0.56, rounded=False), A + 'icon-maskable-512.png')
for d in (A, A + 'ar/', P): save(tile(180, 0.6, rounded=False), d + 'apple-touch-icon.png')
for s in (16, 32, 48): save(mark_only(s, 0.96), A + f'favicon-{s}.png')
ico = [mark_only(s, 0.96) for s in (16, 32, 48)]; ico[2].save('favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
for n in ('logo-mark-512.png', 'logo-mark-ar-512.png'): save(tile(512), 'assets/brand/png/' + n)
def card(im): return place(Image.new('RGBA', (1200, 900), (0, 0, 0, 0)), im, 0.82)
for lang in ('en', 'ar'):
    save(card(stacked_l), f'assets/brand/png/logo-wordmark-{lang}-dark.png'); save(card(stacked_w), f'assets/brand/png/logo-wordmark-{lang}-white.png')
save(scale_w(stacked_l, 1200), P + 'om-wallet-logo.png')
def b64(im): bf = io.BytesIO(); im.save(bf, 'PNG', optimize=True); return base64.b64encode(bf.getvalue()).decode()
def svg(path, w, h, im, extra=''):
    open(path, 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {w} {h}"{extra}><image width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,{b64(im)}"/></svg>')
for p in ('assets/icons/icon.svg', 'public/branding/om-wallet-favicon.svg', 'assets/brand/logo-mark.svg', 'assets/brand/logo-mark-ar.svg'): svg(p, 512, 512, tile(256))
svg('assets/brand/logo-mark-only.svg', 512, 512, mark_only(256, 0.98), ' width="512" height="512"')
st, stw = scale_w(stacked_l, 400), scale_w(stacked_w, 400)
for name, im in (('logo-wordmark-dark', st), ('logo-wordmark-ar-dark', st), ('logo-wordmark-white', stw), ('logo-wordmark-ar-white', stw)): svg(f'assets/brand/{name}.svg', 400, 300, im)

# ---------- 4. Android ----------
R = 'android/app/src/main/res/drawable-nodpi/'
def layer(ratio, black=False, size=432):
    c = Image.new('RGBA', (size, size), (0, 0, 0, 0)); w = int(size * ratio); mm = mark_t.resize((w, int(mark_t.height * w / mark_t.width)), Image.LANCZOS)
    if black: b = Image.new('RGBA', mm.size, (0, 0, 0, 0)); b.putalpha(mm.getchannel('A')); mm = b
    c.alpha_composite(mm, ((size - mm.width) // 2, (size - mm.height) // 2)); return c
save(layer(0.54), R + 'ic_launcher_foreground.png')           # adaptive icon layer (108 dp @4x): the mark stays inside the 66 dp safe zone
save(layer(0.54, black=True), R + 'ic_launcher_monochrome.png')  # themed icon (Android 13)
save(layer(0.64), R + 'ic_splash.png'); save(scale_w(stacked_l, 640), R + 'om_logo_stacked.png')
save(tile(512), B + 'play-store-icon-512.png')
print('brand assets regenerated')
