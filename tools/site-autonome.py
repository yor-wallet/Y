"""Site autonome (25/11) : la vitrine welcome/ (français) en UNE page HTML statique, sans script, qui s'ouvre sans serveur
et se dépose chez n'importe quel hébergeur — c'est elle qui est en ligne sur https://om-wallet.weinc.app/ (Copy Any Design).
- le choix de langue, le défilé des cours et les onglets de captures (tous en JavaScript) deviennent des parties statiques
- images incluses dans la page (data: URI) ; avec --linked, liens vers yor-wallet.vercel.app (page légère, pour WeInc)
- chaque texte traduit de la vitrine (data-i) reçoit un id data-w, chaque image un id data-img : modifiables ensuite par id
- un formulaire de contact remplace le lien mailto (WeInc l'envoie sur l'e-mail du compte du propriétaire)
Lancer depuis la racine du dépôt :  python3 -I tools/site-autonome.py . sortie.html [--linked]
Page légère pour WeInc :           python3 -I tools/site-autonome-minify.py sortie.html sortie-min.html"""
import base64, re, sys, pathlib

repo = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2]); LINKED = len(sys.argv) > 3 and sys.argv[3] == '--linked'
html = (repo / 'welcome/index.html').read_text(encoding='utf-8')
css = (repo / 'welcome/site.css').read_text(encoding='utf-8')
APP = 'https://yor-wallet.vercel.app'

# ---- CSS: Google Fonts instead of self-hosted files; reveal-on-scroll needs JS -> always visible
css = re.sub(r'@font-face\{[^}]*\}\s*', '', css)
css = css.replace('.rv{opacity:0;transform:translateY(18px);', '.rv{opacity:1;transform:none;')
css += '''
html,body{overflow-x:clip}
/* ---- static edition (WeInc): screenshots gallery, contact form ---- */
.gallery{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:22px;margin-top:8px}
.gallery figure{margin:0}
.gallery .phone{position:relative;width:100%;max-width:none}
.gallery figcaption{margin-top:14px;text-align:center;font-weight:700;font-size:15px;color:var(--ink2)}
.show-static .sec-head{max-width:720px}
@media (max-width:860px){
  .gallery{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-inline:20px;padding:4px 20px 12px;margin:8px -20px 0;scrollbar-width:none}
  .gallery::-webkit-scrollbar{display:none}
  .gallery figure{flex:0 0 min(240px,68vw);scroll-snap-align:start}
}
.contact .wrap{max-width:760px}
.contact-form{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:8px;padding:26px;border-radius:var(--r-l);background:var(--card);border:1px solid var(--edge2)}
.contact-form label{display:grid;gap:8px;font-weight:700;font-size:14px;color:var(--ink2)}
.contact-form .full{grid-column:1/-1}
.contact-form input,.contact-form textarea{font:inherit;font-weight:500;font-size:16px;color:var(--ink);background:var(--bg);border:1px solid var(--edge);border-radius:var(--r-s);padding:14px 16px;min-height:52px;outline:none;transition:border-color .2s,box-shadow .2s}
.contact-form textarea{min-height:140px;resize:vertical}
.contact-form input:focus,.contact-form textarea:focus{border-color:var(--y);box-shadow:0 0 0 3px rgba(255,200,0,.18)}
.contact-form .btn{justify-self:start;border:0;cursor:pointer;font-family:inherit}
.contact-form .note{grid-column:1/-1;margin-top:0}
@media (max-width:560px){.contact-form{grid-template-columns:1fr;padding:20px}}
'''

def data_uri(rel):
    p = repo / rel.lstrip('/')
    ext = p.suffix.lower()
    mime = {'.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg'}[ext]
    return 'data:%s;base64,%s' % (mime, base64.b64encode(p.read_bytes()).decode())

# ---- head
head = '''<!doctype html>
<html lang="fr" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>OM Wallet — Portefeuille crypto simple et sûr</title>
<meta name="description" content="OM Wallet : votre portefeuille crypto en arabe, anglais et français. Adresse de dépôt personnelle avec QR code, échange à prix fixé, marchés en direct, retraits vers la banque ou en crypto.">
<meta name="theme-color" content="#0B0A07">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap">
<style>
''' + css + '''
</style>
</head>
'''
body = html[html.index('<body>'):html.index('</html>')]

# ---- remove JS-only parts
body = re.sub(r'<script[^>]*></script>\s*', '', body)
body = re.sub(r'\s*<div class="langs".*?</div>', '', body, flags=re.S)                      # language switch
body = re.sub(r'\s*<!-- LIVE MARKETS -->.*?</section>', '', body, flags=re.S)                # live ticker
body = body.replace('\n      <a href="#markets" data-i="nav.markets">Marchés</a>', '')
body = body.replace('<a href="#faq" data-i="nav.faq">Questions</a>', '<a href="#faq" data-i="nav.faq">Questions</a>\n      <a href="#contact" data-i="nav.contact">Contact</a>')

# showcase: tabs + one phone (JS) -> the four real screenshots side by side
show_static = '''<!-- SHOWCASE -->
  <section class="show show-static" aria-labelledby="sh-t">
    <div class="wrap">
      <div class="sec-head">
        <p class="eyebrow" data-i="sh.eyebrow">L’application</p>
        <h2 id="sh-t" data-i="sh.title">Pensée pour le téléphone</h2>
        <p class="lead" data-i="sh.lead">Une interface sombre et claire, rehaussée de jaune, des montants lisibles, et l’état de chaque opération toujours visible : soumise, en cours, confirmée.</p>
      </div>
      <div class="gallery">
        <figure><div class="phone"><img src="/welcome/img/home-fr.webp" alt="Écran d’accueil d’OM Wallet" width="300" height="650" loading="lazy"></div><figcaption data-i="tab.home">Accueil</figcaption></figure>
        <figure><div class="phone"><img src="/welcome/img/markets-fr.webp" alt="Écran Marchés d’OM Wallet" width="300" height="650" loading="lazy"></div><figcaption data-i="tab.markets">Marchés</figcaption></figure>
        <figure><div class="phone"><img src="/welcome/img/spot-fr.webp" alt="Écran Spot d’OM Wallet" width="300" height="650" loading="lazy"></div><figcaption data-i="tab.spot">Spot</figcaption></figure>
        <figure><div class="phone"><img src="/welcome/img/swap-fr.webp" alt="Écran Swap d’OM Wallet" width="300" height="650" loading="lazy"></div><figcaption data-i="tab.swap">Swap</figcaption></figure>
      </div>
      <p class="note" data-i="sh.note">Captures réelles de l’application (données d’exemple).</p>
    </div>
  </section>'''
body = re.sub(r'<!-- SHOWCASE -->.*?</section>', lambda m: show_static, body, count=1, flags=re.S)

# contact form before the footer; the footer link goes to it (no e-mail address handed to a third party)
contact = '''
  <!-- CONTACT -->
  <section class="contact" id="contact" aria-labelledby="ct-t">
    <div class="wrap">
      <div class="sec-head"><p class="eyebrow" data-i="ct.eyebrow">Contact</p><h2 id="ct-t" data-i="ct.title">Une question ? Écrivez-nous</h2>
        <p class="lead" data-i="ct.lead">Nous répondons par e-mail, dans votre langue.</p></div>
      <form class="contact-form" method="post">
        <label><span data-i="ct.name">Nom</span><input name="name" autocomplete="name" required></label>
        <label><span data-i="ct.email">E-mail</span><input name="email" type="email" autocomplete="email" required></label>
        <label class="full"><span data-i="ct.msg">Message</span><textarea name="message" required></textarea></label>
        <button class="btn btn-primary" type="submit" data-i="ct.send">Envoyer</button>
        <p class="note" data-i="ct.note">N’écrivez jamais votre mot de passe, votre code ni une clé privée dans ce formulaire.</p>
      </form>
    </div>
  </section>
</main>'''
body = body.replace('</main>', contact, 1)
body = re.sub(r'<a href="mailto:[^"]*" data-i="ftr.contact">', '<a href="#contact" data-i="ftr.contact">', body)
body = body.replace('<span id="yr">2026</span>', '2026')

# ---- absolute links to the real app
body = body.replace('href="/#/', 'href="%s/#/' % APP).replace('href="/welcome"', 'href="#top"').replace('href="/"', 'href="%s/"' % APP)

# ---- pictures: data URIs + data-img ids
n_img = [0]
def img_sub(m):
    tag = m.group(0)
    src = re.search(r'src="([^"]+)"', tag).group(1)
    if src.startswith('/'):
        tag = tag.replace('src="%s"' % src, 'src="%s"' % (APP + src if LINKED else data_uri(src)))
    n_img[0] += 1
    tag = tag.replace(' data-shot="home"', '').replace(' data-shot="spot"', '').replace(' id="show-img"', '')
    return tag.replace('<img ', '<img data-img="p%d" ' % n_img[0], 1)
body = re.sub(r'<img [^>]*>', img_sub, body)

# ---- every translated text (data-i) -> data-w id
n_w = [0]
def w_sub(m):
    n_w[0] += 1
    return 'data-w="w%d"' % n_w[0]
body = re.sub(r'data-i="[^"]*"', w_sub, body)

doc = head + body + '</html>\n'
if LINKED:
    doc = re.sub(r'/\*.*?\*/', '', doc, flags=re.S)            # CSS comments
    doc = re.sub(r'<!--.*?-->', '', doc, flags=re.S)             # HTML comments
    doc = re.sub(r'\n\s+', '\n', doc)                            # indentation
    doc = re.sub(r'\s*([{};,>])\s*(?=[^<]*?(</style>|$))', r'\1', doc) if False else doc
out.write_text(doc, encoding='utf-8')
size_no_data = len(re.sub(r'data:[^"]+', '', head + body))
print('written', out, 'texts', n_w[0], 'pictures', n_img[0], 'html without data URIs', size_no_data, 'bytes', 'total', out.stat().st_size, 'bytes')
assert '<script' not in body and 'mailto:' not in body and 'data-i=' not in body
