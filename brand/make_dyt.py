#!/usr/bin/env python3
"""DYT (Dream You Trade) — logo files from the owner's artwork brand/originals/logo-dyt-source.png (supplied 27/11/2026).
   Nothing is redrawn: the logo is cut out of its banner (the decorative corner shapes are left out), its black background is
   keyed to transparency (the artwork is light on pure black), then scaled. The only change of colour: in the LIGHT-background
   variants the white letters become #090909 (white on ivory would be invisible); lime stays lime.
   Outputs:
   - brand/originals/logo-dyt-icon-master.png (1024 square: black rounded tile, thin lime rim, logo) → input of make_assets.py
   - assets/brand/om-logo-horizontal-white.png / om-logo-horizontal.png (720 x 168, dark / light backgrounds; file names kept: referenced everywhere)
   - assets/brand/om-wordmark-white.png (485 x 80), assets/brand/logo-mark.svg / logo-mark-light.svg (in-app header mark)
   - assets/brand/dyt-logo-full.png (with the « DREAM YOU TRADE » line, on black)
   Usage (repo root): python3 -I brand/make_dyt.py   then   python3 -I brand/make_assets.py   (icons). Needs Pillow, numpy."""
import base64, io, os
import numpy as np
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); os.chdir(ROOT)
src = Image.open('brand/originals/logo-dyt-source.png').convert('RGB')
full = src.crop((100, 140, 1470, 800)); a = np.asarray(full).copy()
a[:120, :400] = 0; a[:70, :] = np.where(np.arange(a.shape[1])[None, :, None] < 400, 0, a[:70, :]); a[600:, 1320:] = 0   # corner decorations out
full = Image.fromarray(a)
full_rgba = None
def key(im, dark_letters=False):
    """black → transparent: alpha = brightest channel; colour un-premultiplied. dark_letters: white/grey letters → #090909."""
    x = np.asarray(im).astype(float); al = x.max(axis=2); al = np.clip((al - 10) / 235, 0, 1)
    col = np.where(al[..., None] > 0, np.clip(x / np.maximum(al[..., None], 1e-3), 0, 255), 0)
    if dark_letters:
        sat = col.max(axis=2) - col.min(axis=2); white = sat < 60
        col[white] = (9, 9, 9)
    out = np.dstack([col, al * 255]).astype('uint8'); im = Image.fromarray(out, 'RGBA'); return im.crop(im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox())
mark_area = full.crop((0, 0, full.width, 555))                     # crown + DYT + swoosh, without the tagline line
logo_d, logo_l = key(mark_area), key(mark_area, True)
def fit(im, W, H, align='left'):
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); s = min(W / im.width, H / im.height); r = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    x = 0 if align == 'left' else (W - r.width) // 2; c.alpha_composite(r, (x, (H - r.height) // 2)); return c
fit(logo_d, 720, 168).save('assets/brand/om-logo-horizontal-white.png', optimize=True)
fit(logo_l, 720, 168).save('assets/brand/om-logo-horizontal.png', optimize=True)
fit(logo_d, 485, 80).save('assets/brand/om-wordmark-white.png', optimize=True)
full.save('assets/brand/dyt-logo-full.png', optimize=True)
def svg(path, im):
    bf = io.BytesIO(); fit(im, 400, 160, 'center').save(bf, 'PNG', optimize=True)      # wide mark (5:2): the logo is a word, not a square glyph
    open(path, 'w').write('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 400 160" width="400" height="160"><image width="400" height="160" xlink:href="data:image/png;base64,' + base64.b64encode(bf.getvalue()).decode() + '"/></svg>')
svg('assets/brand/logo-mark.svg', logo_d); svg('assets/brand/logo-mark-light.svg', logo_l)
# icon master: pure-black corners, lime rim, black body, logo inside (make_assets.py floods the corners up to the rim)
S = 1024; m = Image.new('RGB', (S, S), (0, 0, 0)); d = ImageDraw.Draw(m)
d.rounded_rectangle((14, 14, S - 15, S - 15), radius=230, fill=(215, 230, 0)); d.rounded_rectangle((26, 26, S - 27, S - 27), radius=220, fill=(9, 9, 9))
body = Image.new('RGBA', (S, S), (9, 9, 9, 255)); lg = fit(logo_d, 880, 660, "center"); body.alpha_composite(lg, ((S - 880) // 2, (S - 660) // 2 + 10))
mask = Image.new('L', (S, S), 0); ImageDraw.Draw(mask).rounded_rectangle((26, 26, S - 27, S - 27), radius=220, fill=255)
m.paste(body.convert('RGB'), (0, 0), mask); m.save('brand/originals/logo-dyt-icon-master.png', optimize=True)
print('DYT logo files written')
