/* 15.3.0 — typography: a word is never cut in the middle (« Pri / x », « Achete / r », « الرص / يد ») on any screen, in English, French and
   Arabic, on a 320 px and a 360 px phone — and fixing that does not push anything past the edge of the screen. Long tokens that cannot fit on
   one line may break (e-mail addresses, wallet addresses, hashes, references: one « word » longer than 18 characters), as on iOS; a hyphen is
   a normal place to break; labels kept only for screen readers (1 px boxes) are not drawn and not checked.
   Also: the snapping carousel of the home screen starts at the page margin (it was snapped flush against the edge). */
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
const GROUPS = [
  { name: 'user', opts: {}, screens: ['home', 'wallet', 'send-internal', 'markets', 'asset', 'spot', 'deposit', 'exchange', 'withdraw', 'withdraw-bank', 'withdraw-crypto', 'history', 'account', 'services', 'profile', 'profile-edit', 'settings', 'notifications', 'help', 'privacy', 'about', 'devices', 'sessions'] },
  { name: 'admin', opts: { admin: true }, screens: ['dy-control', 'payouts', 'services', 'topup'] },
  { name: 'signed out', opts: { signedOut: true }, screens: ['login', 'signup', 'reset'] },
];
const wait = ms => new Promise(r => setTimeout(r, ms));
let failed = 0, checks = 0;
for (const g of GROUPS) for (const lang of ['en', 'fr', 'ar']) for (const width of [320, 360]) {
  const { ctx, page, logs } = await openApp(browser, url, { lang, theme: 'dark', scheme: 'dark', width, height: 760, touch: true, settle: 300, ...g.opts });
  const issues = [];
  for (const id of g.screens) {
    await page.evaluate(id => R.go(id, { force: true }), id); await wait(id === 'spot' ? 900 : 350);
    const r = await page.evaluate(id => {
      const root = document.getElementById(id); const out = { cut: [], over: 0, missing: !root };
      if (!root) return out;
      out.over = root.scrollWidth - root.clientWidth;
      /* a snapping carousel shows its first card at the page margin, not flush against the edge of the screen */
      const mv = root.querySelector('.lt-movers > *');
      if (mv) { const b = mv.getBoundingClientRect(); const rtl = document.documentElement.dir === 'rtl'; out.flush = rtl ? innerWidth - b.right < 8 : b.left < 8; }
      const name = e => e ? e.tagName.toLowerCase() + (String(e.className).trim() ? '.' + String(e.className).trim().split(/\s+/).join('.') : '') : '';
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n; (n = w.nextNode());) {
        const text = n.textContent; if (!text.trim()) continue;
        const el = n.parentElement; if (!el || !el.getClientRects().length) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || /mono/i.test(cs.fontFamily)) continue;
        const box = el.getBoundingClientRect(); if (box.width <= 2 || box.height <= 2) continue; /* label kept for screen readers only */
        /* a word = letters and digits (with ’ . , %) — a hyphen is a normal place to break (« Connectez- / vous ») */
        const re = /[\p{L}\p{N}][\p{L}\p{N}\p{M}'’.,%]*/gu; let m;
        while ((m = re.exec(text))) {
          const word = m[0]; if (word.length < 2 || word.length > 18) continue;
          const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + word.length);
          const tops = new Set([...rg.getClientRects()].filter(x => x.width > 0.5).map(x => Math.round(x.top / 4))); /* same line = same top, to 4 px */
          if (tops.size > 1) out.cut.push(word + ' (' + name(el) + ' < ' + name(el.parentElement) + ')');
        }
      }
      return out;
    }, id);
    checks++;
    if (r.missing) issues.push(id + ': screen not shown');
    if (r.cut.length) issues.push(id + ': words cut in the middle → ' + [...new Set(r.cut)].slice(0, 5).join(' · '));
    if (r.over > 2) issues.push(id + ': horizontal overflow ' + r.over + 'px');
    if (r.flush) issues.push(id + ': the first card of the carousel touches the edge of the screen');
  }
  if (logs.length) issues.push('page errors: ' + logs.slice(0, 3).join(' | '));
  console.log(issues.length ? '  FAIL' : '  ok  ', g.name, lang, width + 'px', issues.length ? '\n        ' + issues.join('\n        ') : '(' + g.screens.length + ' screens)');
  if (issues.length) failed++;
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED (' + checks + ' screen checks)'); process.exit(failed ? 1 : 0);
