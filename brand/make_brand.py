#!/usr/bin/env python3
"""Builds every NON-icon brand file of OM Wallet from the original « Arche » artwork (brand/om_art.py): in-app mark, wordmark,
   horizontal lockups, sign-in / welcome artwork, iOS startup images, share images (fr / en / ar), Android drawables.
   The app icon (launcher, favicon, PWA, store) is the owner's logo and is produced by brand/make_assets.py — not here.
   Rendering uses the pre-installed Chromium through brand/render.cjs (gradients, blur, Sora and Tajawal fonts).
   Usage (repo root):
     python3 -I brand/make_brand.py               # writes into the repo
     python3 -I brand/make_brand.py --out /tmp/x  # same tree under another folder (dry run: the repo is not touched)
   Needs: Pillow, node + playwright (NODE_PATH=$(npm root -g) is set by this script)."""
import argparse, base64, glob, json, os, re, subprocess, sys, tempfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..'))
sys.path.insert(0, HERE)
import om_art as A

ap = argparse.ArgumentParser(); ap.add_argument('--out', default=ROOT); args = ap.parse_args()
OUT = os.path.abspath(args.out); TMP = tempfile.mkdtemp(prefix='om-brand-')


def b64(path): return base64.b64encode(open(os.path.join(ROOT, path), 'rb').read()).decode()


FONTS = (f"@font-face{{font-family:'S';src:url(data:font/woff2;base64,{b64('assets/fonts/sora-latin-var.woff2')}) format('woff2');font-weight:100 800}}"
         + ''.join(f"@font-face{{font-family:'T';src:url(data:font/woff2;base64,{b64(f'assets/fonts/tajawal-arabic-{w}.woff2')}) format('woff2');font-weight:{w}}}" for w in (400, 500, 700, 800)))
BASE_CSS = FONTS + "*{box-sizing:border-box}html,body{margin:0;background:transparent}svg{display:block}"

jobs = []


def page(name, css, body, w, h, scale=1, transparent=True):
    f = os.path.join(TMP, name + '.html')
    open(f, 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{BASE_CSS}{css}</style></head><body>{body}</body></html>')
    out = os.path.join(TMP, name + '.png')
    jobs.append({'html': f, 'out': out, 'width': w, 'height': h, 'scale': scale, 'transparent': transparent})
    return out


def run_jobs():
    jf = os.path.join(TMP, 'jobs.json'); json.dump(jobs, open(jf, 'w'))
    env = dict(os.environ, NODE_PATH=subprocess.check_output(['npm', 'root', '-g'], text=True).strip())
    subprocess.check_call(['node', os.path.join(HERE, 'render.cjs'), jf], env=env)


def dest(rel):
    p = os.path.join(OUT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); return p


def trim(im, pad=0):
    bb = im.getchannel('A').point(lambda v: 255 if v > 6 else 0).getbbox()
    im = im.crop(bb)
    if not pad: return im
    c = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0)); c.alpha_composite(im, (pad, pad)); return c


# ---------------------------------------------------------------- lockups ------------------------------------------------------------------
LOCKUP_CSS = """
.lk{display:inline-flex;align-items:center;gap:calc(var(--H)*.17)}
.lk svg{width:var(--H);height:var(--H);flex:none}
.wm{font-family:'S';font-size:calc(var(--H)*.46);line-height:1;letter-spacing:-.02em;display:flex;gap:.24em;align-items:baseline;white-space:nowrap}
.wm b{font-weight:800}.wm i{font-style:normal;font-weight:600}
.dark .wm b{background:linear-gradient(180deg,#FFE98A 0%,#FFC800 55%,#E39B00 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.dark .wm i{color:#F5F3EE}
.light .wm b,.light .wm i{color:#14110A}
.white .wm b,.white .wm i{color:#fff}
"""


def lockup(v, H=360, name=None):
    mark = A.mark_svg('dark' if v in ('dark', 'white') else 'light', f'l{v}')
    cls = v
    return page(name or f'lockup-{v}', LOCKUP_CSS, f'<div class="lk {cls}" style="--H:{H}px">{mark}<div class="wm"><b>OM</b><i>Wallet</i></div></div>', int(H * 3.6), int(H * 1.1))


def wordmark_only(v, H=360, name=None):
    return page(name or f'word-{v}', LOCKUP_CSS, f'<div class="lk {v}" style="--H:{H}px"><div class="wm"><b>OM</b><i>Wallet</i></div></div>', int(H * 2.4), int(H * .8))


# ---------------------------------------------------------------- hero / mark renders ------------------------------------------------------
def svg_sized(svg, w, h=None):
    return re.sub(r'width="\d+" height="\d+"', f'width="{w}" height="{h or w}"', svg, count=1)


def svg_page(name, svg, w, h, bg='transparent', transparent=True, scale=1):
    return page(name, f'html,body{{background:{bg}}}', svg_sized(svg, w, h), w, h, scale, transparent)


p_hero_d = svg_page('hero-dark', A.hero_svg('dark', 'hd'), 1024, 1024)
p_hero_l = svg_page('hero-light', A.hero_svg('light', 'hl'), 1024, 1024)
p_mark_d = svg_page('mark-dark', A.mark_svg('dark', 'md'), 512, 512)
p_mark_l = svg_page('mark-light', A.mark_svg('light', 'ml'), 512, 512)
p_lk_dark, p_lk_light = lockup('dark'), lockup('light')
p_wm_white = wordmark_only('white', 200)
p_empty = svg_page('empty-dark', A.empty_svg('dark', 'ed'), 272, 224)

# ---------------------------------------------------------------- iOS startup images -------------------------------------------------------
splash = []
for f in sorted(glob.glob(os.path.join(ROOT, 'assets/splash/ios-*-*.jpg'))):
    m = re.match(r'.*ios-(\d+)x(\d+)-(dark|light)\.jpg', f); w, h, scheme = int(m.group(1)), int(m.group(2)), m.group(3)
    s = int(min(w, h) * 0.30)
    bg = A.BLACK if scheme == 'dark' else A.CREAM
    alpha = .22 if scheme == 'dark' else .30
    glow = (f'<div style="position:absolute;left:50%;top:46%;width:{s * 3}px;height:{s * 3}px;transform:translate(-50%,-50%);border-radius:50%;'
            f'background:radial-gradient(circle,rgba(255,200,0,{alpha}),rgba(255,200,0,0) 68%)"></div>')
    body = (f'<div style="position:relative;width:{w}px;height:{h}px;background:{bg};overflow:hidden">{glow}'
            f'<div style="position:absolute;left:50%;top:46%;width:{s}px;height:{s}px;transform:translate(-50%,-50%)">'
            f'{svg_sized(A.mark_svg("dark" if scheme == "dark" else "light", f"s{len(splash)}"), s)}</div></div>')
    splash.append((page(f'splash-{w}x{h}-{scheme}', '', body, w, h, 1, False), f))

# ---------------------------------------------------------------- share images (1200 × 630) ------------------------------------------------
OG = {
    'en': dict(dir='ltr', font="'S'", h1='Your digital wallet, always with you', sub='Send, receive and convert crypto — simply and securely.', w1=700, w2=500),
    'fr': dict(dir='ltr', font="'S'", h1='Votre portefeuille numérique, toujours avec vous', sub='Envoyez, recevez et convertissez vos cryptos, simplement et en sécurité.', w1=700, w2=500),
    'ar': dict(dir='rtl', font="'T'", h1='محفظتك الرقمية معك', sub='أرسل واستقبل وحوّل عملاتك الرقمية ببساطة وأمان.', w1=800, w2=500),
}
og = []
for lang, o in OG.items():
    rtl = o['dir'] == 'rtl'
    art_side = 'left' if rtl else 'right'
    hero = svg_sized(A.hero_svg('dark', f'og{lang}'), 760)
    lk = svg_sized(A.mark_svg('dark', f'ogm{lang}'), 86)
    css = f"""
    .card{{position:relative;width:1200px;height:630px;background:#0B0A07;overflow:hidden;direction:{o['dir']}}}
    .glow{{position:absolute;{art_side}:-60px;top:-40px;width:900px;height:900px;background:radial-gradient(circle,rgba(255,200,0,.16),rgba(255,200,0,0) 62%)}}
    .art{{position:absolute;{art_side}:-120px;top:-40px;width:760px;height:760px}}
    .txt{{position:absolute;{'right' if rtl else 'left'}:84px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center;gap:26px;text-align:{'right' if rtl else 'left'}}}
    .brand{{display:flex;align-items:center;gap:18px;direction:ltr;justify-content:{'flex-end' if rtl else 'flex-start'}}}
    .brand span{{font-family:'S';font-size:40px;font-weight:800;letter-spacing:-.02em;color:#F5F3EE;direction:ltr}}
    .brand span b{{background:linear-gradient(180deg,#FFE98A,#FFC800 55%,#E39B00);-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:800}}
    h1{{margin:0;font-family:{o['font']};font-weight:{o['w1']};font-size:{58 if lang != 'ar' else 76}px;line-height:{1.08 if lang != 'ar' else 1.25};letter-spacing:{'-.025em' if lang != 'ar' else '0'};color:#F5F3EE}}
    p{{margin:0;font-family:{o['font']};font-weight:{o['w2']};font-size:{26 if lang != 'ar' else 30}px;line-height:1.4;color:#A7A397}}
    .bar{{position:absolute;left:0;right:0;bottom:0;height:6px;background:linear-gradient(90deg,#FFC800,#E39B00)}}
    """
    body = (f'<div class="card"><div class="glow"></div><div class="art">{hero}</div><div class="txt">'
            f'<div class="brand">{lk}<span><b>OM</b> Wallet</span></div><h1>{o["h1"]}</h1><p>{o["sub"]}</p></div><div class="bar"></div></div>')
    og.append((page(f'og-{lang}', css, body, 1200, 630, 1, False), f'assets/share/og-{lang}.png'))

run_jobs()

# ---------------------------------------------------------------- write outputs -------------------------------------------------------------
# web — in-app marks (true SVG), lockups, wordmark, hero
open(dest('assets/brand/logo-mark.svg'), 'w').write(A.mark_svg('dark', 'lm'))
open(dest('assets/brand/logo-mark-light.svg'), 'w').write(A.mark_svg('light', 'lm'))
open(dest('assets/brand/om-empty.svg'), 'w').write(A.empty_svg('dark', 'em'))
open(dest('assets/brand/om-empty-light.svg'), 'w').write(A.empty_svg('light', 'el'))
lk_dark = trim(Image.open(p_lk_dark).convert('RGBA'), 6); lk_light = trim(Image.open(p_lk_light).convert('RGBA'), 6)
for im, rel in ((lk_light, 'assets/brand/om-logo-horizontal.png'), (lk_dark, 'assets/brand/om-logo-horizontal-white.png')):
    w = 720; im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(dest(rel), optimize=True)
trim(Image.open(p_wm_white).convert('RGBA'), 4).save(dest('assets/brand/om-wordmark-white.png'), optimize=True)
for src, rel in ((p_hero_d, 'assets/brand/om-hero.webp'), (p_hero_l, 'assets/brand/om-hero-light.webp')):
    Image.open(src).convert('RGBA').save(dest(rel), 'WEBP', quality=90, alpha_quality=92, method=6)
# web — startup and share images
for src, f in splash: Image.open(src).convert('RGB').save(dest(os.path.relpath(f, ROOT)), quality=90, optimize=True)
for src, rel in og: Image.open(src).convert('RGB').save(dest(rel), optimize=True)
# Android
CD, R = 'android/core-design/src/main/res/drawable-nodpi/', 'android/app/src/main/res/drawable-nodpi/'
Image.open(p_mark_d).convert('RGBA').resize((256, 256), Image.LANCZOS).save(dest(CD + 'om_mark.png'), optimize=True)
lk_dark.resize((520, round(lk_dark.height * 520 / lk_dark.width)), Image.LANCZOS).save(dest(CD + 'om_logo_lockup.png'), optimize=True)
lk_dark.resize((560, round(lk_dark.height * 560 / lk_dark.width)), Image.LANCZOS).save(dest(R + 'om_logo_horizontal_white.png'), optimize=True)
hero900 = Image.open(p_hero_d).convert('RGBA').resize((900, 900), Image.LANCZOS)
hero900.save(dest(R + 'om_hero.webp'), 'WEBP', quality=90, alpha_quality=92, method=6)
Image.open(p_empty).convert('RGBA').save(dest(CD + 'om_empty.png'), optimize=True)                 # empty states (Android: dark pages only)
# Android 12 splash icon: the mark must stay inside the central circle (2/3 of the canvas)
canvas = Image.new('RGBA', (432, 432), (0, 0, 0, 0)); mk = Image.open(p_mark_d).convert('RGBA').resize((int(432 * .62),) * 2, Image.LANCZOS)
canvas.alpha_composite(mk, ((432 - mk.width) // 2, (432 - mk.height) // 2)); canvas.save(dest(R + 'ic_splash.png'), optimize=True)
print('brand kit written to', OUT, '·', len(jobs), 'renders')
