#!/usr/bin/env python3
"""Regenerates the APP ICON files — and only those — from the owner's logo: brand/originals/logo-om-noir-jaune.png
   (black rounded square, yellow rim, yellow « OM » wallet mark; supplied by the owner on 25/11/2026).
   Owner's rule (25/11): « le logo est uniquement pour l'icône, le reste : une création inédite ». Everything that is not the icon
   (in-app mark, wordmark, lockups, sign-in / welcome artwork, splash, share images) comes from brand/make_brand.py (« Arche »).
   Nothing is redrawn here: the logo is only cut (transparent corners), scaled and padded. Old blue originals: brand/archive-bleu/.
   Outputs:
   - web: assets/icons (PWA 192 / 512 / maskable, apple-touch, favicons, favicon.ico, SVG wrapper), public/branding (same + 1024, favicon SVG)
   - Android: drawable-nodpi ic_launcher_foreground.png (adaptive layer), ic_launcher_monochrome.png (themed icon), ic_launcher_background.xml
   - brand/om-icon.png (the icon with transparent corners), brand/play-store-icon-512.png
   Usage (repo root):  python3 -I brand/make_assets.py [--out FOLDER]   (--out writes the same tree elsewhere: dry run)
   Needs: Pillow, numpy."""
import argparse, base64, io, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ap = argparse.ArgumentParser(); ap.add_argument('--out', default=ROOT); OUT = os.path.abspath(ap.parse_args().out)
os.chdir(ROOT)
LANCZOS = Image.LANCZOS
master = Image.open('brand/originals/logo-om-noir-jaune.png').convert('RGB')


# ---------- 1. the icon with transparent corners (the file has pure-black corners outside the yellow rim) ----------
def cut_corners(m):
    rgb = m.copy()
    for c in ((0, 0), (m.width - 1, 0), (0, m.height - 1), (m.width - 1, m.height - 1)):
        ImageDraw.floodfill(rgb, c, (255, 0, 255), thresh=14)        # only the black OUTSIDE the yellow rim is reached
    b = np.asarray(rgb).astype(int); ext = (b[..., 0] == 255) & (b[..., 1] == 0) & (b[..., 2] == 255)
    alpha = Image.fromarray(((~ext) * 255).astype('uint8'), 'L').filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.0))
    out = m.convert('RGBA'); out.putalpha(alpha)
    body = np.asarray(m).astype(int)[~ext]; body = body[body.max(1) < 30]
    return out, tuple(int(v) for v in np.median(body, axis=0))
icon, BODY = cut_corners(master)


# ---------- 2. the « OM » wallet mark alone (only for the Android themed icon: a single-colour silhouette) ----------
def extract_mark(m):
    a = np.asarray(m).astype(int)
    yel = (a[..., 0] > 150) & (a[..., 1] > 90) & (a[..., 2] < 140)
    small = np.asarray(Image.fromarray((yel * 255).astype('uint8'), 'L').resize((m.width // 2, m.height // 2), Image.NEAREST)) > 0
    H, W = small.shape; lab = np.zeros((H, W), int); keep = np.zeros((H, W), bool); n = 0
    for sy in range(H):
        for sx in range(W):
            if small[sy, sx] and not lab[sy, sx]:
                n += 1; st = [(sy, sx)]; lab[sy, sx] = n; pts = []
                while st:
                    cy, cx = st.pop(); pts.append((cy, cx))
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < H and 0 <= nx < W and small[ny, nx] and not lab[ny, nx]: lab[ny, nx] = n; st.append((ny, nx))
                xs = [p[1] for p in pts]; w = max(xs) - min(xs)
                if len(pts) > 5000 and w < 0.9 * W:                     # the mark's pieces; the rim + swooshes touch the whole border
                    for (cy, cx) in pts: keep[cy, cx] = True
    big = Image.fromarray((keep * 255).astype('uint8'), 'L').resize((m.width, m.height), Image.NEAREST).filter(ImageFilter.MaxFilter(9))
    sel = np.asarray(big) > 0
    cov = np.clip((a[..., 0] - 8) / 240.0, 0, 1) * sel                    # over black: the red channel is the coverage
    al = np.clip((cov - 0.22) / 0.30, 0, 1)                               # hardened: a themed icon is ONE colour, shaded parts of the flap must stay solid
    return Image.fromarray(np.dstack([np.zeros_like(al), np.zeros_like(al), np.zeros_like(al), al * 255]).astype('uint8'), 'RGBA')
mark = extract_mark(master)
mark = mark.crop(mark.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())      # black silhouette, tight crop


# ---------- 3. helpers ----------
def tile(size): return icon.resize((size, size), LANCZOS)                                  # transparent corners
def fullbleed(size, ratio, bg=None):                                                       # square, no transparency (iOS / maskable / stores)
    c = Image.new('RGBA', (size, size), (bg or BODY) + (255,)); w = int(size * ratio); c.alpha_composite(tile(w), ((size - w) // 2, (size - w) // 2)); return c
def scale_w(im, w): return im.resize((w, max(1, int(im.height * w / im.width))), LANCZOS)
def dest(rel):
    p = os.path.join(OUT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); return p
def save(im, rel): im.save(dest(rel), optimize=True)
def b64(im): bf = io.BytesIO(); im.save(bf, 'PNG', optimize=True); return base64.b64encode(bf.getvalue()).decode()
def svg(rel, im, w=512, h=512):
    open(dest(rel), 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {w} {h}"><image width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,{b64(im)}"/></svg>')


# ---------- 4. the icon files ----------
save(tile(1024), 'brand/om-icon.png'); save(fullbleed(512, 1.0, (0, 0, 0)), 'brand/play-store-icon-512.png')
A, P = 'assets/icons/', 'public/branding/'
for d, pre in ((A, 'icon-'), (A + 'ar/', 'icon-'), (P, 'om-wallet-icon-')):
    save(tile(192), d + pre + '192.png'); save(tile(512), d + pre + '512.png')
save(tile(1024), P + 'om-wallet-icon-1024.png')
save(fullbleed(512, 0.66), A + 'icon-maskable-512.png')               # PWA maskable: the rim stays inside the 40 %-radius safe circle
for d in (A, A + 'ar/', P): save(fullbleed(180, 0.92), d + 'apple-touch-icon.png')
for s in (16, 32, 48): save(tile(s), A + f'favicon-{s}.png')
ico = [tile(s) for s in (16, 32, 48)]; ico[2].save(dest('favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
svg(A + 'icon.svg', tile(256)); svg(P + 'om-wallet-favicon.svg', tile(128))

# ---------- 5. Android launcher: adaptive layers + themed icon ----------
R = 'android/app/src/main/res/drawable-nodpi/'
def layer(ratio, size=432, silh=None):
    c = Image.new('RGBA', (size, size), (0, 0, 0, 0)); w = int(size * ratio)
    if silh is None: c.alpha_composite(tile(w), ((size - w) // 2, (size - w) // 2)); return c
    mm = scale_w(silh, w); c.alpha_composite(mm, ((size - mm.width) // 2, (size - mm.height) // 2)); return c
save(layer(0.58), R + 'ic_launcher_foreground.png')                         # 108 dp @4x: the whole tile, rim included, almost entirely inside the 72 dp mask
save(layer(0.46, silh=mark), R + 'ic_launcher_monochrome.png')              # Android 13 themed icon: the OM mark as one solid silhouette
open(dest('android/app/src/main/res/drawable/ic_launcher_background.xml'), 'w').write(
    '<?xml version="1.0" encoding="utf-8"?>\n<!-- black tile behind the yellow OM icon -->\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">\n'
    f'    <path android:pathData="M0,0 H108 V108 H0 Z" android:fillColor="#FF{BODY[0]:02X}{BODY[1]:02X}{BODY[2]:02X}"/>\n</vector>\n')
print('app icon files written to', OUT, '· body colour', BODY, '· mark', mark.size)
