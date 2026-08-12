/* Auth Screens — Login, Register, Forgot Password, OTP */

function authLogo() {
  return `
    <div class="auth-logo-row">
      <div class="auth-logo-icon" role="img" aria-label="SafeCook Pro">🛡️</div>
      <div>
        <div class="auth-brand">SafeCook <span style="color:var(--primary)">Pro</span></div>
        <div class="auth-brand-sub">Exclusive Device Access</div>
      </div>
    </div>`;
}

/* ── LOGIN ── */
Router.register('login', () => {
  const t = I18n.t.bind(I18n);
  return `
    <div class="auth-screen" role="main">
      <div class="auth-bg-decor"></div>
      <div class="auth-content">
        ${authLogo()}

        <div>
          <h1 class="t-h2">${t('auth.login')}</h1>
          <p class="t-body" style="color:var(--text-secondary);margin-top:4px">Welcome back to SafeCook Pro</p>
        </div>

        <div class="auth-form" id="login-form">
          <div class="input-group">
            <label class="input-label" for="login-email">${t('auth.email')}</label>
            <div class="input-wrapper">
              <span class="input-icon-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
              <input class="input-field" id="login-email" type="email" placeholder="you@example.com" autocomplete="email" aria-label="${t('auth.email')}">
            </div>
          </div>

          <div class="input-group">
            <label class="input-label" for="login-pwd">${t('auth.password')}</label>
            <div class="input-wrapper">
              <span class="input-icon-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input class="input-field" id="login-pwd" type="password" placeholder="••••••••" autocomplete="current-password" aria-label="${t('auth.password')}">
              <button class="input-icon-right" onclick="App.togglePassword('login-pwd')" aria-label="Toggle password visibility" style="background:none;border:none;cursor:pointer;color:var(--text-muted)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <div style="text-align:right">
            <span style="color:var(--primary);font-size:0.875rem;font-weight:600;cursor:pointer" onclick="Router.navigate('forgot')">${t('auth.forgotPassword')}</span>
          </div>

          <button class="btn btn-primary btn-full btn-lg" onclick="App.login()" id="login-btn">${t('auth.loginBtn')}</button>

          <div class="divider-text"><span>${t('auth.orContinueWith')}</span></div>

          <button class="btn btn-ghost btn-full" onclick="App.googleLogin()" id="google-btn" style="gap:var(--sp-sm)">
            <span style="font-size:1.2rem">🌐</span> ${t('auth.google')}
          </button>

          <button class="btn btn-ghost btn-full" onclick="App.biometricLogin()" id="biometric-btn" style="gap:var(--sp-sm)">
            <span style="font-size:1.2rem">👆</span> ${t('auth.biometric')}
          </button>
        </div>

        <!-- Tester profiles — click to sign in instantly -->
        <div class="card" style="margin-top:var(--sp-md);border-color:var(--info);background:rgba(59,130,246,0.04)" role="group" aria-label="Quick Tester Sign-ins">
          <div style="font-size:0.8125rem;font-weight:700;color:var(--info);margin-bottom:var(--sp-sm)">🛡️ Tester Profiles — Click to Sign In Instantly</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button type="button" onclick="App.loginAs('kazuha@safecook.pro')" style="padding:10px 12px;background:var(--bg-elevated);border:1px solid var(--info);border-radius:var(--r-sm);cursor:pointer;font-size:0.75rem;text-align:left;color:inherit;width:100%">
              👑 <strong>kazuha</strong> (Sarvesh) · Owner — kazuha@safecook.pro
            </button>
            <button type="button" onclick="App.loginAs('iffy@safecook.pro')" style="padding:10px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-sm);cursor:pointer;font-size:0.75rem;text-align:left;color:inherit;width:100%">
              🎬 <strong>iffy</strong> (Irfan) · Director — iffy@safecook.pro
            </button>
            <button type="button" onclick="App.loginAs('curse@safecook.pro')" style="padding:10px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-sm);cursor:pointer;font-size:0.75rem;text-align:left;color:inherit;width:100%">
              ⚙️ <strong>cursemecrazy</strong> (Sri Ram) · Executive — curse@safecook.pro
            </button>
            <button type="button" onclick="App.loginAs('professor@safecook.pro')" style="padding:10px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-sm);cursor:pointer;font-size:0.75rem;text-align:left;color:inherit;width:100%">
              🎓 <strong>professor</strong> (Sathish) · Executive — professor@safecook.pro
            </button>
            <button type="button" onclick="App.loginAs('shammer@safecook.pro')" style="padding:10px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-sm);cursor:pointer;font-size:0.75rem;text-align:left;color:inherit;width:100%">
              🔧 <strong>shammer</strong> · Executive — shammer@safecook.pro
            </button>
          </div>
        </div>

        <div class="auth-link-row">${t('auth.noAccount')} <span onclick="Router.navigate('register')">${t('auth.signUp')}</span></div>
        <div style="text-align:center;margin-top:8px">
          <span onclick="localStorage.clear();location.reload()" style="font-size:0.7rem;color:var(--text-muted);cursor:pointer;text-decoration:underline">Clear session &amp; restart</span>
        </div>
      </div>
    </div>`;
});

/* ── REGISTER ── */
Router.register('register', () => {
  const t = I18n.t.bind(I18n);
  return `
    <div class="auth-screen" role="main">
      <div class="auth-bg-decor"></div>
      <div class="auth-content">
        ${authLogo()}

        <div>
          <h1 class="t-h2">${t('auth.register')}</h1>
          <p class="t-body" style="color:var(--text-secondary);margin-top:4px">Create your SafeCook Pro account</p>
        </div>

        <div class="invite-badge" role="note" style="flex-direction:column;align-items:flex-start;gap:4px">
          <div style="display:flex;align-items:center;gap:var(--sp-sm)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            <span>${t('auth.inviteHint')}</span>
          </div>
          <div style="font-size:0.75rem;opacity:0.8;margin-left:24px">
            💡 For testing, use <strong>TEST-OWNER-001</strong> through <strong>TEST-LEAKY-005</strong> to load preset configurations.
          </div>
        </div>

        <div class="auth-form">
          <div class="input-group">
            <label class="input-label" for="reg-name">${t('auth.name')}</label>
            <div class="input-wrapper">
              <span class="input-icon-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input class="input-field" id="reg-name" type="text" placeholder="Your full name" autocomplete="name" aria-label="${t('auth.name')}">
            </div>
          </div>

          <div class="input-group">
            <label class="input-label" for="reg-email">${t('auth.email')}</label>
            <div class="input-wrapper">
              <span class="input-icon-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
              <input class="input-field" id="reg-email" type="email" placeholder="you@example.com" autocomplete="email" aria-label="${t('auth.email')}">
            </div>
          </div>

          <div class="input-group">
            <label class="input-label" for="reg-phone">${t('auth.phone')}</label>
            <div class="input-wrapper">
              <span class="input-icon-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8 8.09a16 16 0 0 0 6 6l.87-.87a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </span>
              <input class="input-field" id="reg-phone" type="tel" placeholder="+91 98765 43210" autocomplete="tel" aria-label="${t('auth.phone')}">
            </div>
          </div>

          <div class="input-group">
            <label class="input-label" for="reg-invite">${t('auth.inviteCode')}</label>
            <div class="input-wrapper">
              <span class="input-icon-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </span>
              <input class="input-field" id="reg-invite" type="text" placeholder="SCP-XXXX-XXXX" style="text-transform:uppercase" aria-label="${t('auth.inviteCode')}">
            </div>
          </div>

          <div class="input-group">
            <label class="input-label" for="reg-pwd">${t('auth.password')}</label>
            <div class="input-wrapper">
              <span class="input-icon-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input class="input-field" id="reg-pwd" type="password" placeholder="Min. 8 characters" autocomplete="new-password" aria-label="${t('auth.password')}">
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">${t('auth.role')}</label>
            <div style="display:flex;gap:var(--sp-sm)">
              <label style="flex:1;display:flex;align-items:center;gap:var(--sp-sm);padding:12px;border-radius:var(--r-md);border:1.5px solid var(--primary);background:var(--primary-subtle);cursor:pointer">
                <input type="radio" name="reg-role" value="owner" checked style="accent-color:var(--primary)"> <span style="font-size:0.875rem;font-weight:600">${t('auth.roleOwner')}</span>
              </label>
              <label style="flex:1;display:flex;align-items:center;gap:var(--sp-sm);padding:12px;border-radius:var(--r-md);border:1.5px solid var(--border);cursor:pointer">
                <input type="radio" name="reg-role" value="member" style="accent-color:var(--primary)"> <span style="font-size:0.875rem;font-weight:600">${t('auth.roleFamily')}</span>
              </label>
            </div>
          </div>

          <button class="btn btn-primary btn-full btn-lg" onclick="App.register()" id="register-btn">${t('auth.registerBtn')}</button>
        </div>

        <div class="auth-link-row">${t('auth.hasAccount')} <span onclick="Router.navigate('login')">${t('auth.signIn')}</span></div>
      </div>
    </div>`;
});

/* ── FORGOT PASSWORD ── */
Router.register('forgot', () => {
  const t = I18n.t.bind(I18n);
  return `
    <div class="auth-screen" role="main">
      <div class="screen-header" style="background:transparent">
        <button class="header-back" onclick="Router.navigate('login')" aria-label="${t('common.back')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="t-h4">Forgot Password</span>
      </div>
      <div class="auth-content" style="padding-top:0">
        <div style="text-align:center;padding:var(--sp-xl) 0">
          <div style="font-size:4rem;margin-bottom:var(--sp-md)">🔐</div>
          <h1 class="t-h3">Reset your password</h1>
          <p class="t-body" style="color:var(--text-secondary);margin-top:8px">Enter your email and we'll send you a reset link.</p>
        </div>
        <div class="auth-form">
          <div class="input-group">
            <label class="input-label" for="forgot-email">${t('auth.email')}</label>
            <div class="input-wrapper">
              <span class="input-icon-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
              <input class="input-field" id="forgot-email" type="email" placeholder="you@example.com" aria-label="${t('auth.email')}">
            </div>
          </div>
          <button class="btn btn-primary btn-full btn-lg" onclick="App.sendOtp()" id="send-otp-btn">${t('auth.sendOtp')}</button>
          <button class="btn btn-ghost btn-full" onclick="Router.navigate('login')">${t('common.back')}</button>
        </div>
      </div>
    </div>`;
});

/* ── OTP VERIFICATION ── */
Router.register('otp', () => {
  const t = I18n.t.bind(I18n);
  return `
    <div class="auth-screen" role="main">
      <div class="screen-header" style="background:transparent">
        <button class="header-back" onclick="Router.navigate('forgot')" aria-label="${t('common.back')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="t-h4">${t('auth.verifyOtp')}</span>
      </div>
      <div class="auth-content" style="padding-top:0">
        <div style="text-align:center;padding:var(--sp-xl) 0">
          <div style="font-size:4rem;margin-bottom:var(--sp-md)">📧</div>
          <h1 class="t-h3">${t('auth.verifyOtp')}</h1>
          <p class="t-body" style="color:var(--text-secondary);margin-top:8px">${t('auth.otpSent')}</p>
        </div>

        <div class="auth-form">
          <div class="otp-row" role="group" aria-label="OTP input">
            ${[1,2,3,4,5,6].map(i => `<input class="otp-box" id="otp-${i}" type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" aria-label="Digit ${i}" onkeyup="App.otpKeyup(event,${i})">`).join('')}
          </div>

          <button class="btn btn-primary btn-full btn-lg" onclick="App.verifyOtp()" id="verify-otp-btn">${t('auth.verifyOtp')}</button>

          <div style="text-align:center;font-size:0.875rem;color:var(--text-secondary)">
            Didn't receive it? <span style="color:var(--primary);font-weight:600;cursor:pointer" onclick="App.resendOtp()" id="resend-btn">${t('auth.resend')}</span>
            <span id="resend-timer" style="color:var(--text-muted)"> in <span id="resend-count">30</span>s</span>
          </div>
        </div>
      </div>
    </div>`;
}, {
  onEnter() {
    // Focus first OTP box
    setTimeout(() => document.getElementById('otp-1')?.focus(), 100);
    // Resend countdown
    let count = 30;
    const timer = setInterval(() => {
      count--;
      const el = document.getElementById('resend-count');
      if (el) el.textContent = count;
      if (count <= 0) {
        clearInterval(timer);
        const t = document.getElementById('resend-timer');
        if (t) t.style.display = 'none';
      }
    }, 1000);
  }
});
