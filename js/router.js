/* ============================================================
   SafeCook Pro — Router
   ============================================================ */

const Router = (() => {
  const screens = {};
  let current = null;

  function register(name, renderFn, { onEnter, onLeave } = {}) {
    screens[name] = { render: renderFn, onEnter, onLeave };
  }

  function navigate(name, params = {}) {
    const screen = screens[name];
    if (!screen) return console.warn(`Screen not found: ${name}`);

    if (current && screens[current] && screens[current].onLeave) {
      screens[current].onLeave();
    }

    current = name;
    const app = document.getElementById('app');
    app.innerHTML = screen.render(params);

    // Show/hide nav and FAB
    const noNavScreens = ['splash', 'onboarding', 'login', 'register', 'forgot', 'otp', 'emergency'];
    const nav = document.getElementById('bottom-nav');
    const fab = document.getElementById('emergency-fab');

    if (noNavScreens.includes(name)) {
      nav.classList.add('hidden');
      fab.classList.add('hidden');
    } else {
      nav.classList.remove('hidden');
      if (name !== 'emergency') fab.classList.remove('hidden');
    }

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === name);
    });

    // Re-bind i18n
    I18n.updateDOM();

    if (screen.onEnter) screen.onEnter(params);

    // Scroll to top
    window.scrollTo(0, 0);
  }

  function getCurrent() { return current; }

  return { register, navigate, getCurrent };
})();

window.Router = Router;

// Wire bottom nav
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      if (State.get('isLoggedIn')) Router.navigate(btn.dataset.screen);
    });
  });
});
