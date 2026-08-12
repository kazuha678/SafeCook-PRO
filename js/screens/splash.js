/* Splash Screen */
Router.register('splash', () => `
  <div class="splash-screen" role="main" aria-label="SafeCook Pro Loading">
    <div class="splash-rings"></div>
    <div class="splash-rings"></div>
    <div class="splash-rings"></div>

    <div style="display:flex;flex-direction:column;align-items:center;gap:20px;z-index:1">
      <div class="splash-logo-wrap logo-float" role="img" aria-label="SafeCook Pro Logo">
        🛡️
      </div>
      <div style="text-align:center">
        <div style="font-size:1.625rem;font-weight:900;letter-spacing:-0.5px">SafeCook <span style="color:var(--primary)">Pro</span></div>
        <div class="splash-tagline" data-i18n="app.tagline">Cooking. Safe. Always.</div>
      </div>
      <div class="splash-bar" role="progressbar" aria-label="Loading">
        <div class="splash-bar-fill" id="splash-progress"></div>
      </div>
    </div>

    <div style="position:absolute;bottom:40px;font-size:0.75rem;color:var(--text-muted)">© 2025 SafeCook Pro. All rights reserved.</div>
  </div>
`, {
  onEnter() {
    let pct = 0;
    const fill = document.getElementById('splash-progress');
    const timer = setInterval(() => {
      pct += Math.random() * 15 + 5;
      if (fill) fill.style.width = Math.min(pct, 100) + '%';
      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          if (State.get('onboardingDone')) {
            Router.navigate(State.get('isLoggedIn') ? 'dashboard' : 'login');
          } else {
            Router.navigate('onboarding');
          }
        }, 400);
      }
    }, 120);
  }
});
