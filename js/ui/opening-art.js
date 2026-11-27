'use strict';

/* ============================================================
   OPENING ART (13.0.0) — splash + the four illustrations of the introduction.
   DYT (13.2.0): the OM monogram on a translucent glass tile, sky-blue gradients on white.
   No external image. Animations live in css/ui.css (section 13); with "reduce motion" every drawing is already in its final state.
   API (unchanged): OpeningArt.splash(lang), OpeningArt.hero(i), OpeningArt.DEFS, OpeningArt.count.
   ============================================================ */
const OpeningArt = (() => {
  const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s));
  const SPLASH_TXT = { en: 'Your money, simple and secure.', fr: 'Votre argent, simple et sécurisé.', ar: 'أموالك، بسيطة وآمنة.' };
  /* gradients are inlined in each drawing; the prefix keeps ids unique (the hidden splash must never shadow the ones of the introduction) */
  const defs = p => '<defs><linearGradient id="' + p + '-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCF0FF"/></linearGradient>' +
    '<radialGradient id="' + p + '-glow" cx=".26" cy=".1" r=".95"><stop offset="0" stop-color="#BFE8FF" stop-opacity=".95"/><stop offset=".72" stop-color="#BFE8FF" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="' + p + '-ink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#78C9F4"/><stop offset=".5" stop-color="#369EDB"/><stop offset="1" stop-color="#1E5F9C"/></linearGradient>' +
    '<linearGradient id="' + p + '-coin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE8FF"/><stop offset="1" stop-color="#78C9F4"/></linearGradient></defs>';
  /* the OM mark on its translucent glass tile (512 grid): used by the splash and the first illustration */
  const mark = (cls, p) => '<g class="' + (cls || '') + '"><rect width="512" height="512" rx="114" fill="url(#' + p + '-bg)"/><rect width="512" height="512" rx="114" fill="url(#' + p + '-glow)"/>' +
    '<circle class="oa-ring" pathLength="1" cx="170" cy="264" r="68" fill="none" stroke="url(#' + p + '-ink)" stroke-width="46" transform="rotate(-90 170 264)"/>' +
    '<path class="oa-m" pathLength="1" d="M292 332V198l66 82 66-82v134" fill="none" stroke="url(#' + p + '-ink)" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<rect x="3" y="3" width="506" height="506" rx="111" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="6"/></g>';

  function splash(lang){
    lang = lang || (typeof LANG === 'string' ? LANG : 'en');
    const ar = lang === 'ar';
    return '<div class="sp2" role="img" aria-label="' + (ar ? 'DYT' : 'DYT') + '">' +
      '<img class="sp2-mark sp2-dyt" src="assets/icons/icon-512.png" alt="" width="148" height="148" decoding="async">' +   /* 16.8.0: the DYT icon (owner's logo) */
      '<div class="sp2-word" aria-hidden="true">DYT <span>Dream You Trade</span></div>' +
      '<p class="sp2-tag">' + esc(SPLASH_TXT[lang] || SPLASH_TXT.en) + '</p>' +
      '<span class="sp2-bar" aria-hidden="true"><i></i></span></div>';
  }

  /* ---------- the four illustrations (viewBox 320 x 260) ---------- */
  const INNER_DEFS = defs('oa');
  const wrap = (inner, cls) => '<svg class="oa2 ' + cls + '" viewBox="0 0 320 260" role="presentation" focusable="false" aria-hidden="true">' + INNER_DEFS + inner + '</svg>';
  function heroWelcome(){
    return wrap(
      '<circle class="oa2-ring" cx="160" cy="130" r="104" fill="none" stroke="var(--ink-4)" stroke-width="1.5" stroke-dasharray="2 8" stroke-linecap="round"/>' +
      '<g class="oa2-orbit"><circle cx="160" cy="26" r="7" fill="var(--tint)"/><circle cx="264" cy="130" r="5" fill="var(--ink)"/><circle cx="56" cy="130" r="5" fill="#78C9F4"/></g>' +
      '<g transform="translate(88 58) scale(.28)" class="oa2-float">' + mark('', 'oa') + '</g>', 'oa2-welcome');
  }
  function heroSend(){
    const phone = x => '<rect x="' + x + '" y="92" width="56" height="104" rx="12" fill="var(--cell)" stroke="var(--ink)" stroke-width="3"/><rect x="' + (x + 20) + '" y="102" width="16" height="4" rx="2" fill="var(--ink)"/>';
    return wrap(
      '<path d="M84 80Q160 4 236 80" fill="none" stroke="var(--ink-4)" stroke-width="3" stroke-dasharray="1 9" stroke-linecap="round"/>' +
      '<path class="oa2-trail" pathLength="1" d="M84 80Q160 4 236 80" fill="none" stroke="var(--tint)" stroke-width="4" stroke-linecap="round"/>' +
      phone(36) + phone(228) +
      '<circle class="oa2-coin" r="14" fill="url(#oa-coin)"/>' +
      '<g class="oa2-ok"><circle cx="256" cy="144" r="13" fill="var(--pos)"/><path d="M249 144l5 5 9-10" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      '<rect x="48" y="150" width="32" height="6" rx="3" fill="var(--tint)"/><rect x="48" y="164" width="20" height="6" rx="3" fill="var(--ink-4)"/>', 'oa2-send');
  }
  function heroCards(){
    const chip = '<rect x="22" y="34" width="30" height="22" rx="5" fill="rgba(255,255,255,.85)"/>';
    return wrap(
      '<g class="oa2-c2" transform="translate(70 46) rotate(-8 90 56)"><rect width="180" height="112" rx="16" fill="var(--tint)"/>' + chip + '<rect x="22" y="84" width="60" height="7" rx="3.5" fill="rgba(255,255,255,.55)"/></g>' +
      '<g class="oa2-c1" transform="translate(70 92) rotate(5 90 56)"><rect width="180" height="112" rx="16" fill="var(--ink)"/>' + chip + '<circle cx="146" cy="84" r="11" fill="#78C9F4"/><circle cx="132" cy="84" r="11" fill="rgba(255,255,255,.4)"/><rect x="22" y="84" width="60" height="7" rx="3.5" fill="rgba(255,255,255,.45)"/></g>', 'oa2-cards');
  }
  function heroSecure(){
    const dot = (x, i) => '<circle class="oa2-pin" style="--i:' + i + '" cx="' + x + '" cy="218" r="7"/>';
    return wrap(
      '<path class="oa2-shield" d="M160 34 232 62v52c0 46-30 76-72 90-42-14-72-44-72-90V62z" fill="var(--tint)"/>' +
      '<path class="oa2-check" pathLength="1" d="M128 120l22 22 44-46" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>' +
      dot(118, 0) + dot(139, 1) + dot(160, 2) + dot(181, 3) + dot(202, 4), 'oa2-secure');
  }
  const HEROES = [heroWelcome, heroSend, heroCards, heroSecure];
  const hero = i => (HEROES[i] || HEROES[0])();
  return { splash, hero, DEFS: '', count: HEROES.length };   /* gradients are inlined in each drawing (a shared <defs> in a hidden svg would not resolve) */
})();
