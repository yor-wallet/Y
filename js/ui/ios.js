'use strict';

/* ============================================================
   15.3.0 — iOS layer, script part (the styles are in css/ios.css).
   The font: on an Apple device the system font IS the iPhone's (SF Pro, SF Arabic); elsewhere the app draws Inter and IBM Plex Sans Arabic.
   The two families need different letter-spacing to look right (SF's own tracking table vs Inter's "dynamic metrics"):
   html.f-sf / html.f-inter tells the style sheet which one is really drawn. Presentation only.
   ============================================================ */
const IosLayer = (() => {
  function apple(){
    try {
      const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
      if (/mac|iphone|ipad|ipod|ios/i.test(p)) return true;
      return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent || '');
    } catch (e) { return false; }
  }
  function init(){
    const r = document.documentElement;
    r.classList.toggle('f-sf', apple());
    r.classList.toggle('f-inter', !apple());
  }
  init();

  /* ---------- the compact bar of a large-title screen (Settings, Profile & settings) ----------
     iOS: the large title scrolls away with the content; once it has gone under the bar, a small centred title fades in on a translucent bar with a
     hairline, and the back button stays reachable. ios-motion.js already marks the scrolled screen (.ios-collapsed past 38 px); this adds the bar.
     The bar is decorative for assistive technologies (the real heading and the real back button stay in the page). */
  const CHEV = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  function compactBar(screen){
    if (!screen || screen.__iosBar) return;
    const head = screen.querySelector('.w-title > h1, .hub-head > h1');
    if (!head) return;
    screen.__iosBar = true;
    const bar = document.createElement('div');
    bar.className = 'ios-cbar'; bar.setAttribute('aria-hidden', 'true');
    const realBack = screen.querySelector('.w-title [data-action="back"], .hub-top [data-action="back"]');
    bar.innerHTML = '<div class="ios-cbar-in">' + (realBack ? '<button type="button" class="ios-cbar-back dir-flip" tabindex="-1">' + CHEV + '</button>' : '<span></span>') + '<span class="ios-cbar-t"></span><span></span></div>';
    const cb = bar.querySelector('.ios-cbar-back');
    if (cb) cb.setAttribute('aria-label', realBack.getAttribute('aria-label') || 'Back');      /* the same name as the real back button */
    bar.querySelector('.ios-cbar-t').textContent = (head.textContent || '').trim();
    const b = bar.querySelector('.ios-cbar-back');
    if (b) b.addEventListener('click', () => { try { R.back(); } catch (e) { /* rien */ } });
    screen.insertBefore(bar, screen.firstChild);
  }
  function onScreen(info){
    try { const el = info && (info.el || document.getElementById(info.id)); if (el) compactBar(el); } catch (e) { /* rien */ }
  }
  try { R.on(onScreen); } catch (e) { /* rien */ }
  return { init, apple, compactBar };
})();
