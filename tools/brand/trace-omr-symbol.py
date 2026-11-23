"""Trace the Omani-rial symbol of the reference design (supplied by the owner) into a single SVG path.
usage: python3 tools/brand/trace-omr-symbol.py <reference.png> <x0> <y0> <x1> <y1> <out.svg>
Method: crop, upscale 8x (Lanczos), marching squares with sub-pixel edge interpolation on the luminance, Douglas-Peucker simplification.
No glyph is drawn by hand and no font is used: the outline is the one in the reference. Dark ink on a light background is assumed."""
import sys
from PIL import Image, ImageFilter
src, x0, y0, x1, y1, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
S = 8
im = Image.open(src).convert('L').crop((x0, y0, x1, y1)); im = im.resize((im.width * S, im.height * S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(S * 0.55))
W, H = im.size; px = im.load()
ink = min(px[x, y] for y in range(H) for x in range(W)); bg = sorted(px[x, y] for y in range(0, H, 4) for x in range(0, W, 4))[int(0.9 * (W * H // 16))]
T = (ink + bg) / 2.0
v = [[(px[x, y] - T) for x in range(W)] for y in range(H)]
for x in range(W): v[0][x] = v[H - 1][x] = 255
for y in range(H): v[y][0] = v[y][W - 1] = 255          # background border: every contour is closed
segs = []
def lerp(a, b, pa, pb):
    t = pa / (pa - pb) if pa != pb else .5
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
for y in range(H - 1):
    for x in range(W - 1):
        tl, tr, br, bl = v[y][x], v[y][x + 1], v[y + 1][x + 1], v[y + 1][x]
        c = (tl < 0) | ((tr < 0) << 1) | ((br < 0) << 2) | ((bl < 0) << 3)
        if c in (0, 15): continue
        P = {'t': lerp((x, y), (x + 1, y), tl, tr), 'r': lerp((x + 1, y), (x + 1, y + 1), tr, br), 'b': lerp((x, y + 1), (x + 1, y + 1), bl, br), 'l': lerp((x, y), (x, y + 1), tl, bl)}
        tab = {1: [('l', 't')], 2: [('t', 'r')], 3: [('l', 'r')], 4: [('r', 'b')], 5: [('l', 't'), ('r', 'b')], 6: [('t', 'b')], 7: [('l', 'b')],
               8: [('b', 'l')], 9: [('t', 'b')], 10: [('t', 'r'), ('b', 'l')], 11: [('r', 'b')], 12: [('r', 'l')], 13: [('t', 'r')], 14: [('t', 'l')]}
        for a, b in tab[c]: segs.append((P[a], P[b]))
key = lambda p: (round(p[0], 3), round(p[1], 3))
adj = {}
for i, (a, b) in enumerate(segs):
    adj.setdefault(key(a), []).append(i); adj.setdefault(key(b), []).append(i)
used = [False] * len(segs); loops = []
for i0 in range(len(segs)):
    if used[i0]: continue
    used[i0] = True; a, b = segs[i0]; loop = [a, b]; end = key(b)
    while True:
        nxt = [j for j in adj.get(end, []) if not used[j]]
        if not nxt: break
        j = nxt[0]; used[j] = True; p, q = segs[j]
        if key(p) == end: loop.append(q); end = key(q)
        else: loop.append(p); end = key(p)
    if len(loop) > 40: loops.append(loop)
def rdp(pts, eps):
    if len(pts) < 3: return pts
    (ax, ay), (bx, by) = pts[0], pts[-1]; dx, dy = bx - ax, by - ay; n = (dx * dx + dy * dy) ** .5 or 1e-9
    di, dm = 0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / n
        if d > dm: dm, di = d, i
    if dm > eps: return rdp(pts[:di + 1], eps)[:-1] + rdp(pts[di:], eps)
    return [pts[0], pts[-1]]
def rdp_closed(l, eps):
    pts = l[:-1] if l[0] == l[-1] or key(l[0]) == key(l[-1]) else l
    m = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
    return rdp(pts[:m + 1], eps)[:-1] + rdp(pts[m:] + [pts[0]], eps)[:-1]
loops = [rdp_closed(l, 2.4) for l in loops]
loops = [l for l in loops if len(l) > 4]
loops.sort(key=lambda l: -len(l))
# drop the border loop / tiny specks: keep loops that enclose real ink (area > 0.4% of the crop)
def area(l): return abs(sum(l[i][0] * l[(i + 1) % len(l)][1] - l[(i + 1) % len(l)][0] * l[i][1] for i in range(len(l)))) / 2
loops = [l for l in loops if 0.004 * W * H < area(l) < 0.6 * W * H]
xs = [p[0] for l in loops for p in l]; ys = [p[1] for l in loops for p in l]
mnx, mxx, mny, mxy = min(xs), max(xs), min(ys), max(ys); sc = 1000.0 / max(mxx - mnx, mxy - mny)
d = ' '.join('M' + ' '.join('%d %d' % (round((p[0] - mnx) * sc), round((p[1] - mny) * sc)) for p in l) + 'Z' for l in loops)
w, h = round((mxx - mnx) * sc), round((mxy - mny) * sc)
open(out, 'w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d"><path fill="currentColor" fill-rule="evenodd" d="%s"/></svg>\n' % (w, h, d))
print('loops', len(loops), 'viewBox', w, h, 'path bytes', len(d))
