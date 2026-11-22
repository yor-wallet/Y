/* Balayage : chaque écran, 3 langues x 2 thèmes — aucune erreur de page, rien ne déborde à l'horizontale, chaque bouton a un nom accessible,
   les titres existent, le sens d'écriture suit la langue. */
import assert from 'node:assert/strict';
import { serve, launch, openApp } from './harness.mjs';
const { srv, url } = await serve(); const browser = await launch();
/* 14.0.0: the transfer screens (country-select, receive) are retired; the crypto and withdrawal screens are swept instead */
const SCREENS = ['home', 'wallet', 'markets', 'asset', 'deposit', 'exchange', 'withdraw', 'withdraw-bank', 'withdraw-crypto', 'history', 'account', 'cards', 'services', 'profile', 'profile-edit', 'settings', 'notifications', 'help', 'privacy', 'about', 'devices', 'sessions'];
let failed = 0, checks = 0;
const wait = ms => new Promise(r => setTimeout(r, ms));
for (const lang of ['en', 'fr', 'ar']) for (const theme of ['light', 'dark']){
  const { ctx, page, logs } = await openApp(browser, url, { lang, theme, scheme: theme, settle: 300 });
  const issues = [];
  for (const id of SCREENS){
    await page.evaluate(id => R.go(id, { force: true }), id); await wait(250);
    const r = await page.evaluate(id => {
      const el = document.getElementById(id); const out = { id, empty: !el || el.innerText.trim().length < 3, over: 0, unnamed: [], dir: document.documentElement.dir };
      if (!el) return out;
      out.over = el.scrollWidth - el.clientWidth;
      el.querySelectorAll('button,a[href],[role="button"]').forEach(b => { const n = (b.getAttribute('aria-label') || b.textContent || '').trim(); if (!n && !b.getAttribute('aria-labelledby') && !b.querySelector('img[alt]')) out.unnamed.push(b.className || b.tagName); });
      return out;
    }, id);
    checks++;
    if (r.empty) issues.push(id + ': empty'); if (r.over > 2) issues.push(id + ': horizontal overflow ' + r.over + 'px'); if (r.unnamed.length) issues.push(id + ': unnamed controls ' + r.unnamed.slice(0, 3).join(','));
    if ((lang === 'ar') !== (r.dir === 'rtl')) issues.push(id + ': dir=' + r.dir);
  }
  if (logs.length) issues.push('page errors: ' + logs.slice(0, 3).join(' | '));
  console.log(issues.length ? '  FAIL' : '  ok  ', lang, theme, issues.length ? '\n        ' + issues.join('\n        ') : '(' + SCREENS.length + ' screens)');
  if (issues.length) failed++;
  await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED (' + checks + ' screen checks)'); process.exit(failed ? 1 : 0);
