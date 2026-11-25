#!/usr/bin/env python3
"""Regenerates every logo / icon derivative from the owner's app icon: brand/originals/logo-om-noir-jaune.png
   (black rounded square, yellow rim, yellow « OM » wallet mark; supplied by the owner on 25/11/2026 — it replaces the blue glass logo).
   Nothing is redrawn: the icon is only cut (transparent corners), scaled, padded and combined with a typographic wordmark
   (Sora Bold, the app's own font). Old blue originals are kept in brand/archive-bleu/ for reference only.
   - brand/om-*.png        transparent logo files (mark, stacked, horizontal; white silhouette)
   - web: assets/icons, public/branding, assets/brand (PNG icons, favicon.ico, SVG wrappers that embed the PNG), assets/splash (iOS startup images)
   - Android: android/app/src/main/res/drawable-nodpi (adaptive icon layers, themed icon, splash mark, lockups), core-design (header mark, lockup)
   Usage (repo root): python3 brand/make_assets.py        Needs: Pillow, numpy."""
import base64, glob, io, os, re
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); os.chdir(ROOT)
B, O = 'brand/', 'brand/originals/'
FONT = 'android/core-design/src/main/res/font/sora_bold.ttf'
INK_ON_DARK, INK_ON_LIGHT = (245, 243, 238), (20, 17, 10)
PAGE_DARK, PAGE_LIGHT = (11, 10, 7), (255, 251, 240)
LANCZOS = Image.LANCZOS

master = Image.open(O + 'logo-om-noir-jaune.png').convert('RGB')

# ---------- 1. the icon with transparent corners (the file has pure-black corners) ----------
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

# ---------- 2. the « OM » wallet mark alone (yellow, transparent), found by connected components ----------
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
    al = np.clip((a[..., 0] - 8) / 240.0, 0, 1) * sel                    # over black: the red channel is the coverage
    rgb = np.clip(a / np.maximum(al, 1e-3)[..., None], 0, 255)
    img = Image.fromarray(np.dstack([rgb, al * 255]).astype('uint8'), 'RGBA')
    return img.crop(img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
mark = extract_mark(master)                                              # tight crop, yellow

# ---------- 3. helpers ----------
def scale_w(im, w): return im.resize((w, max(1, int(im.height * w / im.width))), LANCZOS)
def place(canvas, im, ratio):
    w = int(canvas.width * ratio); mm = scale_w(im, w); canvas.alpha_composite(mm, ((canvas.width - mm.width) // 2, (canvas.height - mm.height) // 2)); return canvas
def silhouette(color):
    s = Image.new('RGBA', mark.size, color + (0,)); s.putalpha(mark.getchannel('A')); return s
def tile(size): return icon.resize((size, size), LANCZOS)                                  # transparent corners
def fullbleed(size, ratio, bg=None):                                                       # square, no transparency (iOS / maskable / stores)
    c = Image.new('RGBA', (size, size), (bg or BODY) + (255,)); w = int(size * ratio); c.alpha_composite(tile(w), ((size - w) // 2, (size - w) // 2)); return c
def wordmark(color, size):
    f = ImageFont.truetype(FONT, size); t = 'OM Wallet'; bb = f.getbbox(t)
    im = Image.new('RGBA', (bb[2] - bb[0] + 8, bb[3] - bb[1] + 8), color + (0,)); ImageDraw.Draw(im).text((4 - bb[0], 4 - bb[1]), t, font=f, fill=color + (255,))
    return im.crop(im.getchannel('A').getbbox())
def lockup_h(color, h=360):                                                                 # icon + wordmark on one line
    ic = tile(h); wm = wordmark(color, int(h * 0.52)); gap = int(h * 0.26)
    out = Image.new('RGBA', (h + gap + wm.width, h), (0, 0, 0, 0)); out.alpha_composite(ic, (0, 0)); out.alpha_composite(wm, (h + gap, (h - wm.height) // 2)); return out
def lockup_v(color, s=420):                                                                 # icon above the wordmark
    ic = tile(s); wm = wordmark(color, int(s * 0.28)); gap = int(s * 0.12)
    out = Image.new('RGBA', (max(s, wm.width), s + gap + wm.height), (0, 0, 0, 0)); out.alpha_composite(ic, ((out.width - s) // 2, 0)); out.alpha_composite(wm, ((out.width - wm.width) // 2, s + gap)); return out
def save(im, path):
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True); im.save(path, optimize=True)
def b64(im): bf = io.BytesIO(); im.save(bf, 'PNG', optimize=True); return base64.b64encode(bf.getvalue()).decode()
def svg(path, w, h, im, extra=''):
    open(path, 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {w} {h}"{extra}><image width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,{b64(im)}"/></svg>')

h_dark, h_light = lockup_h(INK_ON_DARK), lockup_h(INK_ON_LIGHT)              # « _dark » = for dark pages (light text)
v_dark, v_light = lockup_v(INK_ON_DARK), lockup_v(INK_ON_LIGHT)

# ---------- 4. brand/ (transparent logo files) ----------
save(tile(1024), B + 'om-mark.png'); save(silhouette((255, 255, 255)).resize((1024, int(1024 * mark.height / mark.width)), LANCZOS), B + 'om-mark-white.png')
save(scale_w(mark, 1024), B + 'om-mark-tight.png')
save(scale_w(h_light, 1400), B + 'om-logo-horizontal.png'); save(scale_w(h_dark, 1400), B + 'om-logo-horizontal-white.png')
save(scale_w(v_light, 1024), B + 'om-logo-stacked.png'); save(scale_w(v_dark, 1024), B + 'om-logo-white.png')
if os.path.exists(B + 'om-logo-navy.png'): os.remove(B + 'om-logo-navy.png')              # blue / navy variant: retired
save(fullbleed(512, 1.0, (0, 0, 0)), B + 'play-store-icon-512.png')

# ---------- 5. web ----------
A, P = 'assets/icons/', 'public/branding/'
for d, pre in ((A, 'icon-'), (A + 'ar/', 'icon-'), (P, 'om-wallet-icon-')):
    save(tile(192), d + pre + '192.png'); save(tile(512), d + pre + '512.png')
save(tile(1024), P + 'om-wallet-icon-1024.png'); save(fullbleed(512, 0.80), A + 'icon-maskable-512.png')
for d in (A, A + 'ar/', P): save(fullbleed(180, 0.92), d + 'apple-touch-icon.png')
for s in (16, 32, 48): save(tile(s), A + f'favicon-{s}.png')
ico = [tile(s) for s in (16, 32, 48)]; ico[2].save('favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
save(tile(512), 'assets/brand/app-icon-glass-hd.png')            # sign-in hero + third opening screen (file name kept: the pages reference it)
save(tile(128), 'assets/brand/logo-mark-128.png')                # the small mark of page headers
for n in ('logo-mark-512.png', 'logo-mark-ar-512.png'): save(tile(512), 'assets/brand/png/' + n)
def card(im): return place(Image.new('RGBA', (1200, 900), (0, 0, 0, 0)), im, 0.82)
for lang in ('en', 'ar'):
    save(card(v_light), f'assets/brand/png/logo-wordmark-{lang}-dark.png'); save(card(v_dark), f'assets/brand/png/logo-wordmark-{lang}-white.png')
save(scale_w(v_light, 1200), P + 'om-wallet-logo.png')
save(scale_w(h_light, 720), 'assets/brand/om-logo-horizontal.png'); save(scale_w(h_dark, 720), 'assets/brand/om-logo-horizontal-white.png')   # light page / dark page lockups
for p in ('assets/icons/icon.svg', 'public/branding/om-wallet-favicon.svg', 'assets/brand/logo-mark.svg', 'assets/brand/logo-mark-ar.svg'): svg(p, 512, 512, tile(256))
svg('assets/brand/logo-mark-only.svg', 512, 512, place(Image.new('RGBA', (512, 512), (0, 0, 0, 0)), mark, 0.98), ' width="512" height="512"')
svg(P + 'om-wallet-logo.svg', 400, 300, scale_w(v_light, 400))
for name, im in (('logo-wordmark-dark', v_light), ('logo-wordmark-ar-dark', v_light), ('logo-wordmark-white', v_dark), ('logo-wordmark-ar-white', v_dark)): svg(f'assets/brand/{name}.svg', 400, 300, scale_w(im, 400))
mono_black = place(Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)), silhouette((0, 0, 0)), 0.80)
save(mono_black, P + 'om-wallet-monochrome.png'); svg(P + 'om-wallet-monochrome.svg', 1024, 1024, mono_black.resize((512, 512), LANCZOS))
save(place(Image.new('RGBA', (96, 96), (0, 0, 0, 0)), silhouette((255, 255, 255)), 0.86), P + 'om-wallet-notification.png')   # status-bar / push badge: white silhouette
for old in ('assets/brand/om-pay-logo.png', 'assets/brand/om-pay-logo-dark.png'):             # leftover blue « OM Pay » files, referenced nowhere
    if os.path.exists(old): os.remove(old)

# iOS startup images: black (dark) / cream (light) with the icon in the middle
for f in glob.glob('assets/splash/ios-*-*.jpg'):
    m = re.match(r'.*ios-(\d+)x(\d+)-(dark|light)\.jpg', f); w, h, scheme = int(m.group(1)), int(m.group(2)), m.group(3)
    c = Image.new('RGBA', (w, h), (PAGE_DARK if scheme == 'dark' else PAGE_LIGHT) + (255,)); s = int(min(w, h) * 0.30)
    c.alpha_composite(tile(s), ((w - s) // 2, (h - s) // 2 - int(h * 0.02))); c.convert('RGB').save(f, quality=90, optimize=True)

# ---------- 6. Android ----------
R, CD = 'android/app/src/main/res/drawable-nodpi/', 'android/core-design/src/main/res/drawable-nodpi/'
def layer(ratio, size=432, silh=None):
    c = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    if silh is None: w = int(size * ratio); c.alpha_composite(tile(w), ((size - w) // 2, (size - w) // 2)); return c
    w = int(size * ratio); mm = scale_w(silh, w); c.alpha_composite(mm, ((size - mm.width) // 2, (size - mm.height) // 2)); return c
save(layer(0.62), R + 'ic_launcher_foreground.png')                         # adaptive icon (108 dp @4x): the mark stays inside the 66 dp safe zone
save(layer(0.46, silh=silhouette((0, 0, 0))), R + 'ic_launcher_monochrome.png')   # themed icon (Android 13): the yellow mark as a silhouette
save(layer(0.60), R + 'ic_splash.png')
save(tile(512), R + 'app_icon_glass.png'); save(tile(256), CD + 'om_glass_icon.png')
save(scale_w(h_light, 560), R + 'om_logo_horizontal.png'); save(scale_w(h_dark, 560), R + 'om_logo_horizontal_white.png')
save(scale_w(h_dark, 520), CD + 'om_logo_lockup.png')                          # BrandLockup is drawn on the dark pages: light text
open('android/app/src/main/res/drawable/ic_launcher_background.xml', 'w').write(
    '<?xml version="1.0" encoding="utf-8"?>\n<!-- black tile behind the yellow OM icon -->\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">\n'
    f'    <path android:pathData="M0,0 H108 V108 H0 Z" android:fillColor="#FF{BODY[0]:02X}{BODY[1]:02X}{BODY[2]:02X}"/>\n</vector>\n')
if os.path.exists(CD + 'om_wallet_glass.webp'): os.remove(CD + 'om_wallet_glass.webp')   # blue glass wallet art (unused since 14.7)
print('brand assets regenerated — body colour', BODY, '· mark', mark.size)
