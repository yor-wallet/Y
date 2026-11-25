"""Allège la page autonome produite avec --linked (tools/site-autonome.py) : retire les règles CSS dont aucune classe n'est
utilisée, les commentaires et les espaces, l'indentation du HTML (rendu identique, vérifié par capture).
Lancer : python3 -I tools/site-autonome-minify.py entree.html sortie.html"""
import re, sys
src = open(sys.argv[1], encoding='utf-8').read()
head, rest = src.split('<style>', 1)
css, after = rest.split('</style>', 1)
body = after
used = set(re.findall(r'class="([^"]+)"', body))
used = {c for group in used for c in group.split()}
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)

def parse(block):
    """yield (prelude, content) at this nesting level; content is a str for rules, list for @media"""
    out, i, n = [], 0, len(block)
    while i < n:
        j = block.find('{', i)
        if j < 0: break
        prelude = block[i:j].strip()
        depth, k = 1, j + 1
        while depth and k < n:
            if block[k] == '{': depth += 1
            elif block[k] == '}': depth -= 1
            k += 1
        inner = block[j + 1:k - 1]
        out.append((prelude, parse(inner) if prelude.startswith('@media') or prelude.startswith('@supports') else inner))
        i = k
    return out

def keep(sel):
    if sel.startswith('@'): return True
    for part in sel.split(','):
        classes = re.findall(r'\.([A-Za-z][\w-]*)', part)
        if not classes or all(c in used for c in classes):
            return True
    return False

def squeeze(s):
    s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'\s*([{};:,>])\s*', r'\1', s)
    return s.replace(';}', '}')

def emit(rules):
    o = []
    for pre, content in rules:
        if isinstance(content, list):
            inner = emit(content)
            if inner: o.append(squeeze(pre) + '{' + inner + '}')
        elif pre.startswith('@keyframes') or pre.startswith('@font-face') or keep(pre):
            o.append(squeeze(pre) + '{' + squeeze(content) + '}')
    return ''.join(o)

# fix: ':' squeezing must not touch selectors like 'a:hover' (fine) nor values like 'url(https://...)' (none left)
mini = emit(parse(css))
body = re.sub(r'\n\s+', '\n', body)
doc = head + '<style>' + mini + '</style>' + body
open(sys.argv[2], 'w', encoding='utf-8').write(doc)
print('css', len(css), '->', len(mini), 'doc', len(src), '->', len(doc))
