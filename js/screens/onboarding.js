/* Onboarding Screen */
(function() {
  let slide = 0;

  const slides = [
    {
      emoji: '🛡️',
      titleKey: 'onboarding.slide1.title',
      descKey:  'onboarding.slide1.desc',
      cls:      'slide-1',
      bg:       'radial-gradient(ellipse at 50% 30%, rgba(34,197,94,0.07) 0%, transparent 70%)',
    },
    {
      emoji: '🔥',
      titleKey: 'onboarding.slide2.title',
      descKey:  'onboarding.slide2.desc',
      cls:      'slide-2',
      bg:       'radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.07) 0%, transparent 70%)',
    },
    {
      emoji: '🔒',
      titleKey: 'onboarding.slide3.title',
      descKey:  'onboarding.slide3.desc',
      cls:      'slide-3',
      bg:       'radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.07) 0%, transparent 70%)',
    },
  ];

  function langGrid() {
    return I18n.getAvailableLangs().map(l => `
      <button class="lang-btn ${I18n.getLang() === l.code ? 'active' : ''}" onclick="App.setLang('${l.code}')" aria-label="${l.name}" role="option" aria-selected="${I18n.getLang() === l.code}">
        <div class="lang-btn-flag">${l.flag}</div>
        <div class="lang-btn-name">${l.nativeName}</div>
      </button>`).join('');
  }

  function render() {
    const t = I18n.t.bind(I18n);
    const isLast = slide === slides.length - 1;

    return `
      <div class="onboarding-screen" style="background:${slides[slide].bg}" role="main">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:calc(var(--safe-top)+20px) var(--sp-xl) 0">
          <div style="font-size:1rem;font-weight:800">SafeCook <span style="color:var(--primary)">Pro</span></div>
          <button class="btn btn-ghost btn-sm" onclick="App.finishOnboarding()" data-i18n="onboarding.skip">${t('onboarding.skip')}</button>
        </div>

        <div class="onboarding-slider">
          <div class="onboarding-slide ${slides[slide].cls}">
            ${slide === 0 ? `
              <div style="margin-bottom:var(--sp-sm)">
                <div style="font-size:0.8125rem;font-weight:600;color:var(--text-secondary);text-align:center;margin-bottom:var(--sp-md)" data-i18n="onboarding.selectLang">${t('onboarding.selectLang')}</div>
                <div class="language-grid" id="lang-grid">${langGrid()}</div>
              </div>` : ''}
            <div class="onboarding-illustration">
              <span style="font-size:5rem">${slides[slide].emoji}</span>
            </div>
            <div class="onboarding-title" data-i18n="${slides[slide].titleKey}">${t(slides[slide].titleKey)}</div>
            <div class="onboarding-desc"  data-i18n="${slides[slide].descKey}">${t(slides[slide].descKey)}</div>
          </div>
        </div>

        <div class="onboarding-footer">
          <div class="onboarding-dots" role="tablist" aria-label="Slide indicators">
            ${slides.map((_, i) => `<div class="ob-dot ${i === slide ? 'active' : ''}" role="tab" aria-selected="${i === slide}"></div>`).join('')}
          </div>

          <button class="btn btn-primary btn-full btn-lg" onclick="${isLast ? 'App.finishOnboarding()' : 'App.obNext()'}" id="ob-next-btn">
            ${isLast ? t('onboarding.getStarted') : t('onboarding.next')}
          </button>
        </div>
      </div>`;
  }

  // Direct re-render — does NOT trigger onEnter, so slide is preserved
  function rerender() {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = render();
      I18n.updateDOM();
      window.scrollTo(0, 0);
    }
  }

  Router.register('onboarding', render, {
    // onEnter only resets slide when navigating TO onboarding from outside (e.g. splash)
    onEnter() { slide = 0; }
  });

  // App.obNext calls this — increments slide and re-renders bypassing onEnter
  window._obNext = function() {
    if (slide < slides.length - 1) {
      slide++;
      rerender();
    }
  };

  // Called by App.setLang to refresh language without resetting slide
  window._obRerender = rerender;
})();
