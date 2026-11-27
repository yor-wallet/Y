#!/usr/bin/env python3
"""DYT mascot (the owner's « Next Level » board, brand/originals/next-level-planche.png, 27/11/2026).
   Owner's rule printed on the board: « ne pas modifier la mascotte ni ses lunettes ». So the mascot is only CUT OUT of the board
   (its lime card, as drawn), scaled and given rounded transparent corners — never redrawn, recoloured or retouched.
   Outputs: assets/brand/dyt-wave.webp (the lime light waves at the foot of the board, transparent), assets/splash/ios-*.jpg (start-up images),
            assets/brand/dyt-mascot.webp (the card, portrait), assets/brand/dyt-mascot-head.webp (square, head and glasses),
            welcome/img/app-icon.webp (copy of the current app icon for the showcase).
   Usage (repo root): python3 -I brand/make_mascot.py    Needs Pillow."""
import os
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); os.chdir(ROOT)
board = Image.open('brand/originals/next-level-planche.png').convert('RGB')
def rounded(im, r):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=r, fill=255)
    out = im.convert('RGBA'); out.putalpha(m); return out
card = board.crop((26, 14, 424, 716))                                   # the lime card with the mascot; the ears rise above the card as drawn
card = card.resize((card.width * 2, card.height * 2), Image.LANCZOS)    # 2x for sharp phones (the board is the only source)
rounded(card, 64).save('assets/brand/dyt-mascot.webp', quality=88, method=6)
head = board.crop((44, 40, 424, 420)).resize((760, 760), Image.LANCZOS)
rounded(head, 150).save('assets/brand/dyt-mascot-head.webp', quality=88, method=6)
Image.open('assets/icons/icon-512.png').convert('RGBA').resize((192, 192), Image.LANCZOS).save('welcome/img/app-icon.webp', quality=90, method=6)
# the lime light waves at the foot of the board: keyed out of the black (alpha = brightest channel), top edge faded
import numpy as np
w = np.asarray(board.crop((0, 1418, 1024, 1536))).astype(float)
al = np.clip((w.max(axis=2) - 8) / 200, 0, 1); col = np.clip(w / np.maximum(al[..., None], 1e-3), 0, 255)
al *= np.clip(np.linspace(0, 1.6, w.shape[0]), 0, 1)[:, None]                 # soft top edge
wave = Image.fromarray(np.dstack([col, al * 255]).astype('uint8'), 'RGBA').resize((2048, 236), Image.LANCZOS)
wave.save('assets/brand/dyt-wave.webp', quality=86, method=6)
# iOS start-up images (home-screen app): same sizes as before, black (dark) / ivory (light) page, the DYT icon at 30 % of the short side, waves at the foot
icon = Image.open('assets/icons/icon-512.png').convert('RGBA')
for f in sorted(os.listdir('assets/splash')):
    if not (f.startswith('ios-') and f.endswith('.jpg')): continue
    W, H = Image.open('assets/splash/' + f).size; dark = f.endswith('-dark.jpg')
    c = Image.new('RGBA', (W, H), (9, 9, 9, 255) if dark else (245, 245, 240, 255))
    s_ = int(min(W, H) * .30); ic = icon.resize((s_, s_), Image.LANCZOS); c.alpha_composite(ic, ((W - s_) // 2, (H - s_) // 2 - int(H * .03)))
    if dark:
        wv = wave.resize((W, int(W * 236 / 2048)), Image.LANCZOS); c.alpha_composite(wv, (0, H - wv.height))
    c.convert('RGB').save('assets/splash/' + f, quality=86, optimize=True, progressive=True)
print('mascot files written')
