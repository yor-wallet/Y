#!/usr/bin/env python3
"""DYT mascot (the owner's « Next Level » board, brand/originals/next-level-planche.png, 27/11/2026).
   Owner's rule printed on the board: « ne pas modifier la mascotte ni ses lunettes ». So the mascot is only CUT OUT of the board
   (its lime card, as drawn), scaled and given rounded transparent corners — never redrawn, recoloured or retouched.
   Outputs: assets/brand/dyt-mascot.webp (the card, portrait), assets/brand/dyt-mascot-head.webp (square, head and glasses),
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
print('mascot files written')
