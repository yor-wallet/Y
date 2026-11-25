"""« Arche » — the original artwork of OM Wallet, drawn in code (nothing is traced from another brand or from the owner's icon).
   The owner's logo (brand/originals/logo-om-noir-jaune.png) is used ONLY for the application icon (launcher, favicon, PWA, store);
   every other brand surface — in-app mark, wordmark, sign-in / welcome artwork, splash, share images — uses this artwork.
   Idea: a gateway (an arch, a doorway to your money) with a coin resting inside. Black warm background, one yellow.
   All functions return SVG strings; `v` is the variant: 'dark' (for dark pages), 'light' (for cream pages) or 'mono' (white silhouette)."""
import math

YEL_HI, YEL, YEL_LO = '#FFE98A', '#FFC800', '#E39B00'
INK, INK_ON_DARK, BLACK, CREAM = '#14110A', '#F5F3EE', '#0B0A07', '#FFFBF0'


def _svg(w, h, body, extra=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"{extra}>{body}</svg>'


# ---------------------------------------------------------------- the mark (512 × 512) ----------------------------------------------------
ARCH = 'M106 452V232A150 150 0 0 1 406 232V452'            # centre line of the arch (stroke 46): 83..429 wide, 59..452 high
COIN = (256, 350, 84)                                      # cx, cy, r


def _coin(p, cx, cy, r, v, shine=True):
    """A coin: radial gradient face, engraved inner ring, a soft arc of light on the upper left rim."""
    if v == 'mono':
        return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff"/>'
    ring_r = r * 0.74
    a1, a2 = math.radians(200), math.radians(252)
    hr = r * 0.87
    x1, y1, x2, y2 = cx + hr * math.cos(a1), cy + hr * math.sin(a1), cx + hr * math.cos(a2), cy + hr * math.sin(a2)
    out = (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#{p}c)"/>'
           f'<circle cx="{cx}" cy="{cy}" r="{ring_r:.1f}" fill="none" stroke="{INK}" stroke-opacity=".26" stroke-width="{r * 0.06:.1f}"/>'
           f'<circle cx="{cx + r * 0.012:.1f}" cy="{cy + r * 0.02:.1f}" r="{ring_r - r * 0.075:.1f}" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="{r * 0.02:.1f}"/>')
    if shine:
        out += (f'<path d="M{x1:.1f} {y1:.1f}A{hr:.1f} {hr:.1f} 0 0 1 {x2:.1f} {y2:.1f}" fill="none" stroke="#fff" stroke-opacity=".6" '
                f'stroke-width="{r * 0.09:.1f}" stroke-linecap="round"/>')
    return out


def _defs_mark(p, v):
    if v == 'mono':
        return ''
    arch = (f'<linearGradient id="{p}a" gradientUnits="userSpaceOnUse" x1="0" y1="59" x2="0" y2="452">'
            + (f'<stop offset="0" stop-color="{YEL_HI}"/><stop offset=".5" stop-color="{YEL}"/><stop offset="1" stop-color="{YEL_LO}"/>' if v == 'dark'
               else '<stop offset="0" stop-color="#2E2819"/><stop offset="1" stop-color="#14110A"/>') + '</linearGradient>')
    coin = (f'<radialGradient id="{p}c" cx=".34" cy=".28" r=".85"><stop offset="0" stop-color="#FFF3B8"/><stop offset=".38" stop-color="#FFD23A"/>'
            f'<stop offset="1" stop-color="{YEL_LO}"/></radialGradient>')
    return f'<defs>{arch}{coin}</defs>'


def mark_body(v='dark', p='m'):
    stroke = '#fff' if v == 'mono' else f'url(#{p}a)'
    cx, cy, r = COIN
    return (_defs_mark(p, v) + f'<path d="{ARCH}" fill="none" stroke="{stroke}" stroke-width="46" stroke-linejoin="round"/>' + _coin(p, cx, cy, r, v))


def mark_svg(v='dark', p='m'):
    return _svg(512, 512, mark_body(v, p))


def coin_svg(v='dark', p='k'):
    """The coin alone (floating emblem, balance card)."""
    return _svg(256, 256, _defs_mark(p, v) + _coin(p, 128, 128, 112, v))


# ---------------------------------------------------------------- the hero (1200 × 1200) --------------------------------------------------
def hero_svg(v='dark', p='h'):
    """Receding arches around a glowing coin, on a transparent background (the page colour shows through)."""
    dark = v == 'dark'
    base_y, cxm = 1010, 600
    glow_a, glow_b = (YEL, '#FFD84A') if dark else ('#FFC800', '#FFD84A')
    stroke_hi, stroke_lo = (YEL_HI, YEL_LO) if dark else ('#B67C00', '#8A6500')
    main_a, main_b = ((YEL_HI, YEL_LO) if dark else ('#2E2819', '#14110A'))
    spark = '#FFF3B8' if dark else '#B67C00'
    d = []
    d.append('<defs>')
    d.append(f'<radialGradient id="{p}g1" cx="600" cy="660" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{glow_a}" stop-opacity="{.34 if dark else .45}"/>'
             f'<stop offset=".55" stop-color="{glow_a}" stop-opacity="{.10 if dark else .16}"/><stop offset="1" stop-color="{glow_a}" stop-opacity="0"/></radialGradient>')
    d.append(f'<radialGradient id="{p}g2" cx="600" cy="800" r="270" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{glow_b}" stop-opacity="{.5 if dark else .6}"/>'
             f'<stop offset="1" stop-color="{glow_b}" stop-opacity="0"/></radialGradient>')
    # arches fade out toward the floor so they dissolve instead of standing on a line
    d.append(f'<linearGradient id="{p}fa" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="{base_y}"><stop offset="0" stop-color="{stroke_hi}"/><stop offset=".62" stop-color="{stroke_lo}" stop-opacity=".85"/><stop offset="1" stop-color="{stroke_lo}" stop-opacity="0"/></linearGradient>')
    d.append(f'<linearGradient id="{p}ma" gradientUnits="userSpaceOnUse" x1="0" y1="600" x2="0" y2="{base_y}"><stop offset="0" stop-color="{main_a}"/><stop offset=".6" stop-color="{main_b}"/><stop offset=".9" stop-color="{main_b}"/><stop offset="1" stop-color="{main_b}" stop-opacity=".0"/></linearGradient>')
    d.append(f'<radialGradient id="{p}c" cx=".34" cy=".28" r=".85"><stop offset="0" stop-color="#FFF3B8"/><stop offset=".38" stop-color="#FFD23A"/><stop offset="1" stop-color="{YEL_LO}"/></radialGradient>')
    d.append(f'<linearGradient id="{p}fl" gradientUnits="userSpaceOnUse" x1="200" y1="0" x2="1000" y2="0"><stop offset="0" stop-color="{YEL}" stop-opacity="0"/><stop offset=".5" stop-color="{YEL}" stop-opacity="{.55 if dark else .5}"/><stop offset="1" stop-color="{YEL}" stop-opacity="0"/></linearGradient>')
    d.append(f'<filter id="{p}b1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>')
    d.append(f'<filter id="{p}b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="38"/></filter>')
    d.append('</defs>')
    # ambient light
    d.append(f'<circle cx="600" cy="660" r="560" fill="url(#{p}g1)"/>')
    # echo arches: half-width, leg height, stroke, opacity
    for a, leg, sw, op in ((255, 330, 6, .70), (340, 420, 4.5, .45), (425, 510, 3.5, .26)):
        cy = base_y - leg
        d.append(f'<path d="M{cxm - a} {base_y}V{cy}A{a} {a} 0 0 1 {cxm + a} {cy}V{base_y}" fill="none" stroke="url(#{p}fa)" stroke-opacity="{op}" stroke-width="{sw}" stroke-linejoin="round"/>')
    # main arch: soft halo + glossy stroke
    main_a_hw, main_leg = 172, 250
    mcy = base_y - main_leg
    arch = f'M{cxm - main_a_hw} {base_y}V{mcy}A{main_a_hw} {main_a_hw} 0 0 1 {cxm + main_a_hw} {mcy}V{base_y}'
    if dark:                                                  # a halo behind a yellow arch; behind a black arch on cream it only looks muddy
        d.append(f'<path d="{arch}" fill="none" stroke="{YEL}" stroke-opacity=".55" stroke-width="64" filter="url(#{p}b2)"/>')
    d.append(f'<path d="{arch}" fill="none" stroke="url(#{p}ma)" stroke-width="58" stroke-linejoin="round"/>')
    # inner hairline of the arch
    ih = main_a_hw - 46
    d.append(f'<path d="M{cxm - ih} {base_y - 70}V{mcy}A{ih} {ih} 0 0 1 {cxm + ih} {mcy}V{base_y - 70}" fill="none" stroke="{"#FFF3B8" if dark else "#B67C00"}" stroke-opacity=".35" stroke-width="3"/>')
    # coin: glow, shadow, face
    cxc, cyc, rc = 600, 770, 118
    d.append(f'<circle cx="{cxc}" cy="{cyc}" r="270" fill="url(#{p}g2)"/>')                 # same radius as the gradient: no visible edge
    d.append(f'<ellipse cx="{cxc}" cy="{base_y - 12}" rx="130" ry="15" fill="{"#000" if dark else INK}" fill-opacity="{.55 if dark else .22}" filter="url(#{p}b1)"/>')
    d.append(_coin(p, cxc, cyc, rc, 'dark'))
    # floor light
    d.append(f'<rect x="200" y="{base_y - 2}" width="800" height="3" rx="1.5" fill="url(#{p}fl)"/>')
    # sparkles
    def star(x, y, s, o):
        k = s * .22
        return (f'<path d="M{x} {y - s}C{x + k} {y - k} {x + k} {y - k} {x + s} {y}C{x + k} {y + k} {x + k} {y + k} {x} {y + s}C{x - k} {y + k} {x - k} {y + k} {x - s} {y}C{x - k} {y - k} {x - k} {y - k} {x} {y - s}Z" '
                f'fill="{spark}" fill-opacity="{o}"/>')
    for x, y, s, o in ((860, 330, 15, .85), (330, 470, 11, .6), (930, 640, 9, .55), (260, 760, 13, .7), (690, 170, 8, .5), (470, 300, 7, .45), (1000, 450, 7, .4)):
        d.append(star(x, y, s, o))
    return _svg(1200, 1200, ''.join(d))

# ---------------------------------------------------------------- empty state (136 × 112) -------------------------------------------------
def empty_svg(v='dark', p='e'):
    """« Nothing here yet »: the arch fading toward the floor and the coin drawn as a dashed outline, waiting to be filled."""
    dark = v == 'dark'
    hi, mid = (YEL_HI, YEL) if dark else ('#B67C00', '#8A6500')
    body = (f'<defs><linearGradient id="{p}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{hi}"/><stop offset=".55" stop-color="{mid}" stop-opacity=".7"/>'
            f'<stop offset="1" stop-color="{mid}" stop-opacity="0"/></linearGradient></defs>'
            f'<path d="M30 108V56A38 38 0 0 1 106 56V108" fill="none" stroke="url(#{p}a)" stroke-width="7" stroke-linejoin="round"/>'
            f'<path d="M45 108V58A23 23 0 0 1 91 58V108" fill="none" stroke="{mid}" stroke-opacity=".28" stroke-width="2"/>'
            f'<circle cx="68" cy="82" r="17" fill="none" stroke="{mid}" stroke-opacity=".8" stroke-width="2.5" stroke-dasharray="3 5.4" stroke-linecap="round"/>'
            f'<path d="M112 20C113.4 26 114 26.6 120 28C114 29.4 113.4 30 112 36C110.6 30 110 29.4 104 28C110 26.6 110.6 26 112 20Z" fill="{hi}" fill-opacity=".85"/>')
    return _svg(136, 112, body)
