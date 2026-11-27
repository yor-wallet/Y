'use strict';

/* ============================================================
   OPENING PRESENTATION (14.4.0; 16.9.0: art cut out of the owner's « Next Level » board, no photos) — shown once at first launch.
   - three screens, each with its own message and its own button; « تخطي / Passer / Skip » on every screen but the last;
   - the photos are the owner's visuals with their printed text removed, so every word and every button on screen is real,
     translated and usable (nothing printed in an image pretends to be a button);
   - depth: the photo moves slower than the glass card while the finger drags (parallax), the active photo settles from a slight zoom,
     the card's lines rise one after the other; all of it is skipped under « reduce motion »;
   - language choice (EN / FR / عربي) stays available from the first screen;
   - accessible: modal dialog, slides announced, focus kept inside, arrow keys.
   `show(done)` calls `done('signup' | 'login')`.
   ============================================================ */
const Onboarding = (() => {
  const KEY = 'yor_onboarded';
  const S = {
    en:{ skip:'Skip', have:'I already have an account', lang:'Language', page:(a, b) => 'Screen ' + a + ' of ' + b, slides:[
      { title:'Your digital wallet, always with you', text:'Follow all your assets from one place.', cta:'Discover the wallet' },
      { title:'An easier experience', text:'Deposit, send and withdraw in a few simple steps.', cta:'Continue' },
      { title:'Protected by your PIN', text:'Your 6-digit code locks the app each time you come back; two-step verification protects your sign-in.', cta:'Create my account' } ] },
    fr:{ skip:'Passer', have:'J’ai déjà un compte', lang:'Langue', page:(a, b) => 'Écran ' + a + ' sur ' + b, slides:[
      { title:'Votre portefeuille numérique, toujours avec vous', text:'Suivez tous vos actifs depuis un seul endroit.', cta:'Découvrir le portefeuille' },
      { title:'Une expérience plus simple', text:'Déposez, envoyez et retirez en quelques gestes.', cta:'Continuer' },
      { title:'Protégé par votre code', text:'Votre code à 6 chiffres verrouille l’application à chaque retour ; la vérification en deux étapes protège votre connexion.', cta:'Créer mon compte' } ] },
    ar:{ skip:'تخطي', have:'لدي حساب بالفعل', lang:'اللغة', page:(a, b) => 'الشاشة ' + a + ' من ' + b, slides:[
      { title:'محفظتك الرقمية معك', text:'تابع أصولك من مكان واحد', cta:'اكتشف المحفظة' },
      { title:'تجربة أسهل', text:'أودِع وأرسِل واسحب بخطوات بسيطة.', cta:'متابعة' },
      { title:'محمية برمزك السري', text:'رمزك المكوّن من 6 أرقام يقفل التطبيق في كل مرة تعود فيها، والتحقق بخطوتين يحمي تسجيل دخولك.', cta:'إنشاء حسابي' } ] }
  };
  /* art of each screen (16.9.0): pieces cut out of the owner's « Next Level » board — the mascot (as drawn), its lime light waves —
     placed in the page, plus real controls of the app drawn in CSS (no photo, no number, nothing printed that pretends to be data) */
  const ART = [{ art:'card' }, { art:'acts' }, { art:'card', chip:'2fa' }];
  const X = { en:{ acts:['Deposit', 'Send', 'Withdraw'], chip:'Two-step verification' }, fr:{ acts:['Dépôt', 'Envoyer', 'Retrait'], chip:'Vérification en deux étapes' },
              ar:{ acts:['إيداع', 'إرسال', 'سحب'], chip:'التحقق بخطوتين' } };
  const ic = (n, sz) => (typeof icon === 'function' ? icon(n, sz || 22) : '');
  function artHtml(a, lang){
    const x = X[lang] || X.en, wave = '<img class="wp-wavelight" src="assets/brand/dyt-wave.webp" alt="" width="2048" height="236" decoding="async">';
    if (a.art === 'acts') return '<div class="wp-art wp-art-acts" aria-hidden="true"><span class="wp-halo"></span>' +
      '<img class="wp-head" src="assets/brand/dyt-mascot-head.webp" alt="" width="760" height="760" decoding="async">' +
      '<div class="wp-acts">' + [['receive', 0], ['send', 1], ['withdraw', 2]].map(([n, k]) => '<span class="wp-act"><i>' + ic(n, 22) + '</i><b>' + escapeHtml(x.acts[k]) + '</b></span>').join('') + '</div>' + wave + '</div>';
    return '<div class="wp-art wp-art-card' + (a.chip ? ' wp-art-2fa' : '') + '" aria-hidden="true"><span class="wp-halo"></span>' +
      '<img class="wp-card" src="assets/brand/dyt-mascot.webp" alt="" width="796" height="1404" decoding="async">' +
      (a.chip ? '<span class="wp-chip"><i>' + ic('check', 14) + '</i>' + escapeHtml(x.chip) + '</span>' : '') + wave + '</div>';
  }
  const LANGS = [['en', 'EN'], ['fr', 'FR'], ['ar', 'عربي']];
  const NAMES = { en:'English', fr:'Français', ar:'العربية' };

  function seen(){ try { return localStorage.getItem(KEY) === '1'; } catch(e){ return false; } }
  function mark(){ try { localStorage.setItem(KEY, '1'); } catch(e){ /* rien */ } }
  const reduced = () => { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch(e){ return false; } };

  function show(done){
    const n = ART.length;
    let i = 0, lang = (S[LANG] ? LANG : 'en'), drag = null, closing = false;
    const prevFocus = document.activeElement;
    const el = document.createElement('div');
    let glassRO = null, fitQueued = false;   // watches the text cards (see fitArt)
    el.className = 'wp';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-roledescription', 'carousel');
    document.body.appendChild(el);
    const $ = sel => el.querySelector(sel);

    function build(){
      const T = S[lang], rtl = lang === 'ar';
      el.setAttribute('dir', rtl ? 'rtl' : 'ltr'); el.setAttribute('lang', lang); el.setAttribute('aria-label', 'DYT');
      el.innerHTML =
        '<div class="wp-top"><div class="wp-langs" role="group" aria-label="' + escapeHtml(T.lang) + '">' +
          LANGS.map(([c, l]) => '<button type="button" data-ob-lang="' + c + '" lang="' + c + '" aria-label="' + escapeHtml(l + ' ' + NAMES[c]) + '" aria-pressed="' + (c === lang) + '">' + l + '</button>').join('') + '</div>' +
          '<button type="button" class="wp-skip ob-skip" id="ob-skip">' + escapeHtml(T.skip) + '</button></div>' +
        '<div class="wp-track" id="ob-track">' +
          T.slides.map((s, k) => {
            const a = ART[k];
            return '<section class="wp-slide" data-k="' + k + '" role="group" aria-roledescription="slide" aria-label="' + escapeHtml(T.page(k + 1, n)) + '">' +
              artHtml(a, lang) +
              '<span class="wp-wave" aria-hidden="true"></span>' +
              '<div class="wp-glass">' +
                '<img class="wp-logo" src="assets/brand/om-logo-horizontal-white.png" alt="DYT" width="150" height="54" style="height:38px;margin-bottom:12px">' +
                '<h1 class="ob-h">' + escapeHtml(s.title) + '</h1><p class="ob-p">' + escapeHtml(s.text) + '</p>' +
                '<div><button type="button" class="btn btn-primary ob-next" data-ob-cta="' + k + '">' + escapeHtml(s.cta) + '</button>' +
                  '<div class="wp-dots" role="group" aria-label="' + escapeHtml(T.page(k + 1, n)) + '">' + T.slides.map((_, j) => '<button type="button" data-dot="' + j + '" aria-label="' + escapeHtml(T.page(j + 1, n)) + '"' + (j === k ? ' aria-current="true"' : '') + '></button>').join('') + '</div>' +
                  (k === n - 1 ? '<button type="button" class="wp-alt" id="ob-have">' + escapeHtml(T.have) + '</button>' : '') + '</div>' +
              '</div></section>';
          }).join('') +
        '</div><div class="ob-live" id="ob-live" role="status" aria-live="polite" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"></div>';
      bind();
      paint(true);
      fitArt();
      /* the text card changes height when a web font arrives (Arabic) or the phone turns: fit again then — once per change, not per frame */
      try { if (glassRO) glassRO.disconnect(); glassRO = new ResizeObserver(() => { if (fitQueued) return; fitQueued = true; requestAnimationFrame(() => { fitQueued = false; if (!closing) fitArt(); }); });
        el.querySelectorAll('.wp-glass').forEach(g => glassRO.observe(g)); } catch(e){ /* old browser: the first fit stays */ }
    }

    const W = () => el.getBoundingClientRect().width || window.innerWidth || 1;
    /* the track follows the finger; each photo moves at 35 % of the card speed — the depth effect */
    function place(dx, animate){
      const tr = $('#ob-track'); if (!tr) return;
      const rtl = lang === 'ar', w = W(), dir = rtl ? 1 : -1;
      tr.classList.toggle('drag', !animate);
      tr.style.setProperty('--wp-x', (dir * i * w + (dx || 0)) + 'px');
      el.querySelectorAll('.wp-slide').forEach((s, k) => {
        const p = s.querySelector('.wp-art'); if (!p) return;
        const rel = (k - i) * w * -dir + (dx || 0);          /* where this slide sits relative to the screen */
        p.style.setProperty('--wp-par', (reduced() ? 0 : -rel * 0.35) + 'px');
        p.style.transition = animate ? '' : 'none';
      });
    }
    function paint(first){
      const T = S[lang], last = i === n - 1;
      el.querySelectorAll('.wp-slide').forEach((s, k) => { const on = k === i; s.classList.toggle('on', on); if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true'); s.querySelectorAll('button').forEach(b => { b.tabIndex = on ? 0 : -1; }); });
      const skip = $('#ob-skip'); if (skip){ skip.style.visibility = last ? 'hidden' : 'visible'; skip.tabIndex = last ? -1 : 0; }
      const live = $('#ob-live'); if (live && !first) live.textContent = T.slides[i].title;
      place(0, !first && !reduced());
    }
    function go(d){ const j = i + d; if (j < 0 || j >= n){ place(0, !reduced()); return; } i = j; paint(false); try { UIKit.haptic('tap'); } catch(e){ /* rien */ } }
    function goTo(k){ if (k >= 0 && k < n && k !== i){ i = k; paint(false); } }
    function teardown(){ try { if (glassRO) glassRO.disconnect(); } catch(e){ /* rien */ } document.removeEventListener('keydown', onKey, true); window.removeEventListener('resize', onResize); }
    function finish(target){
      if (closing) return; closing = true;
      mark(); el.classList.add('is-leaving');
      const end = () => { teardown(); try { el.remove(); } catch(e){ /* rien */ } try { if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll:true }); } catch(e){ /* rien */ } if (typeof done === 'function') done(target); };
      if (reduced()) end(); else setTimeout(end, 420);
    }
    function setLang(c){
      if (!S[c] || c === lang) return;
      lang = c; DeviceLang.set(c); LANG = c; applyI18n(); build();
      const b = el.querySelector('[data-ob-lang="' + c + '"]'); if (b){ try { b.focus({ preventScroll:true }); } catch(e){ /* rien */ } }
    }
    function bind(){
      el.querySelectorAll('[data-ob-cta]').forEach(b => { b.onclick = () => (+b.getAttribute('data-ob-cta') === n - 1 ? finish('signup') : go(1)); });
      $('#ob-skip').onclick = () => finish('login');
      const have = $('#ob-have'); if (have) have.onclick = () => finish('login');
      el.querySelectorAll('[data-ob-lang]').forEach(b => { b.onclick = () => setLang(b.getAttribute('data-ob-lang')); });
      el.querySelectorAll('[data-dot]').forEach(b => { b.onclick = () => goTo(parseInt(b.getAttribute('data-dot'), 10)); });
      const st = $('#ob-track');
      st.onpointerdown = e => { if (e.pointerType === 'mouse' && e.button !== 0) return; if (e.target.closest('button')) return; drag = { x: e.clientX, y: e.clientY, dx: 0, locked: null, id: e.pointerId }; };
      st.onpointermove = e => {
        if (!drag || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (drag.locked == null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) drag.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (drag.locked !== 'x') return;
        try { st.setPointerCapture(e.pointerId); } catch(err){ /* rien */ }
        const fwd = lang === 'ar' ? dx > 0 : dx < 0, edge = (fwd && i === n - 1) || (!fwd && i === 0);
        drag.dx = edge ? dx * 0.22 : dx; place(drag.dx, false);
      };
      const end = e => {
        if (!drag || (e && e.pointerId !== drag.id)) return;
        const d = drag; drag = null; if (d.locked !== 'x') return;
        const fwd = lang === 'ar' ? d.dx > 0 : d.dx < 0;
        if (Math.abs(d.dx) > Math.min(70, W() * 0.18)) go(fwd ? 1 : -1); else place(0, !reduced());
      };
      st.onpointerup = end; st.onpointercancel = end;
    }
    function onKey(e){
      if (closing) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ if (e.target && e.target.closest && e.target.closest('.wp-langs')) return; const next = (e.key === 'ArrowRight') !== (lang === 'ar'); e.preventDefault(); go(next ? 1 : -1); return; }
      if (e.key !== 'Tab') return;
      const f = [...el.querySelectorAll('button')].filter(b => b.tabIndex !== -1 && b.offsetParent !== null && getComputedStyle(b).visibility !== 'hidden');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1], ae = document.activeElement;
      if (e.shiftKey && (ae === first || !el.contains(ae))){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (ae === last || !el.contains(ae))){ e.preventDefault(); first.focus(); }
    }
    /* each picture takes exactly the room left above its text card (the card is taller in Arabic or on a small phone): read once per layout, never per frame */
    function fitArt(){
      el.querySelectorAll('.wp-slide').forEach(sl => { const a = sl.querySelector('.wp-art'), g = sl.querySelector('.wp-glass'); if (!a || !g) return;
        const top = g.offsetTop; if (top > 0){ const h = Math.max(180, top + (a.classList.contains('wp-art-2fa') ? -22 : 14)); a.style.height = h + 'px'; a.style.setProperty('--art-h', h + 'px'); } });
    }

    function onResize(){ if (!closing){ fitArt(); place(0, false); } }
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);
    build();
    el.tabIndex = -1;
    requestAnimationFrame(() => { el.classList.add('is-in'); try { el.focus({ preventScroll:true }); } catch(e){ /* rien */ } });
    return el;
  }
  return { seen, show };
})();
