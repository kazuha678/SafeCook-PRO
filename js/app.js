/* ============================================================
   SafeCook Pro — Main Application Controller
   ============================================================ */

const App = (() => {
  let isMuted = false;

  // Initial Boot
  async function init() {
    // 1. Load configuration from localStorage
    applyAccessibilitySettings();

    // 2. Initialize router to splash screen
    Router.navigate('splash');

    // 3. Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then(reg => console.log('ServiceWorker registered:', reg.scope))
          .catch(err => console.log('ServiceWorker registration failed:', err));
      });
    }

    // 4. Load persisted database from server BEFORE starting simulator
    //    This hydrates gas/temp history, alerts, and family members from db.json
    await MockData.loadFromServer();

    // 5. Set up sensor simulator and bind update handlers
    MockData.start();
    MockData.onTick(onSensorUpdate);

    // 6. Watch for critical alerts
    State.on('appStatus', onStatusChange);
  }

  function applyAccessibilitySettings() {
    const fs = State.get('fontsize');
    const hc = State.get('contrast');
    const th = State.get('theme');

    document.documentElement.setAttribute('data-theme', th);
    document.documentElement.setAttribute('data-fontsize', fs);
    document.documentElement.setAttribute('data-contrast', hc);
    
    if (hc === 'high') {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }

  // Live Updates Handler
  function onSensorUpdate() {
    const sensor = State.get('sensor');
    const status = State.get('appStatus');

    // Handle countdown logic if vessel is removed & valve is open
    if (!sensor.vesselPresent && sensor.valveOpen && status !== 'emergency') {
      if (status !== 'warning') {
        State.set('appStatus', 'warning');
        State.set('countdown', 30);
        triggerVoiceAnnounce(I18n.t('voice.vesselRemoved'));
      } else {
        const cd = State.get('countdown') - 2;
        if (cd <= 0) {
          // Shut valve
          State.set('countdown', 0);
          State.set('sensor', { ...sensor, valveOpen: false });
          State.set('appStatus', 'safe');
          triggerVoiceAnnounce(I18n.t('voice.valveClosed'));
          Components.toast('Valve automatically closed.', 'warning');
          
          // Log an alert
          addAlert('NO_VESSEL', 'warning', 'Valve Closed (Auto)', 'Gas valve was closed automatically because the vessel was missing for 30s.');
        } else {
          State.set('countdown', cd);
          if (cd === 10 || cd === 20) {
            triggerVoiceAnnounce(I18n.t('voice.valveClosing', { sec: cd }));
          }
        }
      }
    } else if (sensor.vesselPresent && status === 'warning') {
      // Vessel returned, reset back to safe
      State.set('appStatus', 'safe');
      State.set('countdown', 30);
      triggerVoiceAnnounce(I18n.t('voice.allClear'));
      Components.toast('Vessel detected. Timer reset.', 'success');
    }

    // Emergency trigger check (if PPM exceeds threshold)
    if (sensor.gasLevel >= 300 && status !== 'emergency') {
      State.set('appStatus', 'emergency');
      Router.navigate('emergency');
      addAlert('GAS_LEAK', 'critical', 'Gas Leak Detected!', `Critical levels of LPG gas detected: ${sensor.gasLevel} PPM. Solenoid valve closed.`);
    }
  }

  function onStatusChange(status) {
    // Modify styling/behavior globally based on system state
    if (status === 'emergency') {
      document.body.classList.add('emergency-flash');
    } else {
      document.body.classList.remove('emergency-flash');
    }
  }

  function triggerVoiceAnnounce(msg) {
    if (!State.get('voiceEnabled') || !('speechSynthesis' in window)) return;
    
    // Quick translation fallback
    let speakLang = 'en-IN';
    if (I18n.getLang() === 'ta') speakLang = 'ta-IN';
    if (I18n.getLang() === 'hi') speakLang = 'hi-IN';

    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.lang = speakLang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  // Alerts Management
  function addAlert(type, severity, title, desc) {
    const list = MockData.mockAlerts;
    const newAlert = {
      id: 'a_' + Date.now(),
      type,
      severity,
      title,
      desc,
      action: severity === 'critical' ? 'Ventilate kitchen and turn off mains.' : 'Ensure vessel is placed back.',
      timestamp: Date.now(),
      acknowledged: false,
      icon: severity === 'critical' ? '🔴' : '🟠',
    };
    list.unshift(newAlert);
    State.set('alertUnread', list.filter(a => !a.acknowledged).length);

    // Update badge in nav
    const badge = document.getElementById('alert-badge');
    if (badge) badge.textContent = State.get('alertUnread');

    // Persist alert to server database
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAlert)
    }).catch(() => { /* offline — alert saved locally only */ });
  }

  function acknowledgeAlert(id) {
    const list = MockData.mockAlerts;
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) {
      list[idx].acknowledged = true;
      State.set('alertUnread', list.filter(a => !a.acknowledged).length);
      Components.toast('Alert acknowledged', 'info');

      const badge = document.getElementById('alert-badge');
      if (badge) badge.textContent = State.get('alertUnread');

      // Refresh alert screen list
      const itemEl = document.getElementById(`alert-${id}`);
      if (itemEl) {
        itemEl.classList.add('alert-dismissed');
        setTimeout(() => Router.navigate('alerts'), 400);
      }

      // Persist acknowledgement to server database
      fetch('/api/alerts/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(() => { /* offline — ack saved locally only */ });
    }
  }

  // Navigation facade helper
  function navigate(screenName) {
    Router.navigate(screenName);
  }

  // i18n
  function setLang(code) {
    I18n.setLang(code);
    applyAccessibilitySettings();
    // If on onboarding, use direct rerender to preserve current slide
    if (Router.getCurrent() === 'onboarding' && typeof window._obRerender === 'function') {
      window._obRerender();
    } else {
      Router.navigate(Router.getCurrent());
    }
  }

  // User Actions
  function obNext() {
    window._obNext();
  }

  function finishOnboarding() {
    localStorage.setItem('scp_onboarded', 'true');
    State.set('onboardingDone', true);
    Router.navigate('login');
  }

  function checkRolePermission(actionName) {
    const user = State.get('user');
    if (user && user.role === 'guest') {
      Components.toast(`Access Denied: Guest accounts cannot perform "${actionName}".`, 'error');
      return false;
    }
    return true;
  }

  // Mock Login & Registry Flow
  function login() {
    try {
      const emailInput = (document.getElementById('login-email')?.value || '').trim();
      const pwdInput = document.getElementById('login-pwd')?.value || '';

      if (!emailInput || !pwdInput) {
        Components.toast('Please fill all credentials.', 'error');
        return;
      }

      // Check if it matches any tester profile by email or invite code
      const tester = MockData.testerIds.find(t =>
        t.email.toLowerCase() === emailInput.toLowerCase() ||
        t.inviteCode.toLowerCase() === emailInput.toLowerCase()
      );

      if (tester) {
        // Validate password against tester profile or allow demo access
        if (tester.password && pwdInput !== tester.password) {
          Components.toast('Incorrect password.', 'error');
          return;
        }

        State.set('user', {
          name: tester.name,
          email: tester.email,
          role: tester.role,
          avatar: tester.name.charAt(0).toUpperCase()
        });
        State.set('theme', tester.theme);
        State.set('fontsize', tester.fontsize);
        State.set('contrast', tester.contrast);
        State.set('voiceEnabled', tester.voiceEnabled);

        const currentSensor = State.get('sensor') || {};
        State.set('sensor', {
          ...currentSensor,
          ...tester.sensor,
          leakDetected: tester.sensor.gasLevel >= 300,
          updatedAt: Date.now()
        });

        State.set('appStatus', tester.sensor.gasLevel >= 300 ? 'emergency' : 'safe');
        applyAccessibilitySettings();
        State.set('isLoggedIn', true);
        Components.toast('Welcome, ' + tester.name + '!', 'success');

        setTimeout(() => {
          if (tester.sensor.gasLevel >= 300) {
            Router.navigate('emergency');
          } else {
            Router.navigate('dashboard');
          }
        }, 300);
        return;
      }

      // No tester match — reject unknown credentials
      Components.toast('No account found with these credentials.', 'error');
    } catch (err) {
      Components.toast('Login error: ' + err.message, 'error');
      console.error('Login failed:', err);
    }
  }

  function googleLogin() {
    State.set('isLoggedIn', true);
    Router.navigate('dashboard');
  }

  function biometricLogin() {
    State.set('isLoggedIn', true);
    Router.navigate('dashboard');
  }

  function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.type = field.type === 'password' ? 'text' : 'password';
  }

  function autofill(email, pwd) {
    const emailEl = document.getElementById('login-email');
    const pwdEl   = document.getElementById('login-pwd');
    if (emailEl) emailEl.value = email;
    if (pwdEl)   pwdEl.value   = pwd;
    Components.toast('Credentials filled — tap Sign In', 'info');
  }

  // Direct one-click login — bypasses form fields entirely
  function loginAs(email) {
    try {
      const tester = MockData.testerIds.find(t => t.email.toLowerCase() === email.toLowerCase());
      if (!tester) {
        Components.toast('Tester profile not found: ' + email, 'error');
        return;
      }

      const currentSensor = State.get('sensor') || {};
      State.set('user', {
        name: tester.name,
        email: tester.email,
        role: tester.role,
        avatar: tester.name.charAt(0).toUpperCase()
      });
      State.set('theme', tester.theme);
      State.set('fontsize', tester.fontsize);
      State.set('contrast', tester.contrast);
      State.set('voiceEnabled', tester.voiceEnabled);
      State.set('sensor', {
        ...currentSensor,
        ...tester.sensor,
        leakDetected: tester.sensor.gasLevel >= 300,
        updatedAt: Date.now()
      });
      State.set('appStatus', tester.sensor.gasLevel >= 300 ? 'emergency' : 'safe');
      applyAccessibilitySettings();
      State.set('isLoggedIn', true);
      Components.toast('Welcome, ' + tester.name + '!', 'success');

      setTimeout(() => {
        if (tester.sensor.gasLevel >= 300) {
          Router.navigate('emergency');
        } else {
          Router.navigate('dashboard');
        }
      }, 400);
    } catch (err) {
      Components.toast('Login error: ' + err.message, 'error');
      console.error('loginAs failed:', err);
    }
  }

  function register() {
    const name = document.getElementById('reg-name')?.value || '';
    const email = document.getElementById('reg-email')?.value || '';
    const phone = document.getElementById('reg-phone')?.value || '';
    const invite = (document.getElementById('reg-invite')?.value || '').trim();
    const pwd = document.getElementById('reg-pwd')?.value || '';
    const role = document.querySelector('input[name="reg-role"]:checked')?.value || 'owner';

    if (!name || !email || !phone || !invite || !pwd) {
      Components.toast('Please fill all details.', 'error');
      return;
    }

    const tester = MockData.testerIds.find(t => t.inviteCode.toLowerCase() === invite.toLowerCase());
    if (tester) {
      State.set('user', {
        name: tester.name,
        email: tester.email,
        role: tester.role,
        avatar: tester.name.charAt(0).toUpperCase()
      });
      State.set('theme', tester.theme);
      State.set('fontsize', tester.fontsize);
      State.set('contrast', tester.contrast);
      State.set('voiceEnabled', tester.voiceEnabled);
      State.set('sensor', {
        ...State.get('sensor'),
        ...tester.sensor,
        updatedAt: Date.now()
      });
      State.set('appStatus', tester.sensor.gasLevel >= 300 ? 'emergency' : 'safe');
      applyAccessibilitySettings();
      
      State.set('isLoggedIn', true);
      Components.toast(`Linked SVR Device: ${tester.name}`, 'success');
      
      if (tester.sensor.gasLevel >= 300) {
        Router.navigate('emergency');
      } else {
        Router.navigate('dashboard');
      }
      return;
    }

    // Exclusive access validation check
    if (!invite.startsWith('SCP-') && !invite.startsWith('TEST-')) {
      Components.toast('Invalid invite code / serial. Must start with SCP- or use a tester ID.', 'error');
      return;
    }

    State.set('user', { name, email, phone, role, avatar: name.charAt(0).toUpperCase() });
    State.set('isLoggedIn', true);
    Components.toast('Account Registered successfully', 'success');
    Router.navigate('dashboard');
  }

  function sendOtp() {
    const email = document.getElementById('forgot-email')?.value || '';
    if (!email) {
      Components.toast('Please input a valid email.', 'error');
      return;
    }
    Components.toast(I18n.t('auth.otpSent'), 'info');
    Router.navigate('otp');
  }

  function verifyOtp() {
    // Simulate check
    Components.toast('OTP Verified.', 'success');
    State.set('isLoggedIn', true);
    Router.navigate('dashboard');
  }

  function otpKeyup(e, index) {
    if (e.target.value.length === 1 && index < 6) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  function resendOtp() {
    Components.toast('New OTP sent.', 'info');
  }

  // Dashboard Controls
  function shutValveConfirm() {
    if (!checkRolePermission('Shut Valve')) return;
    const s = State.get('sensor');
    if (!s.valveOpen) {
      Components.toast('Valve is already closed.', 'info');
      return;
    }
    Components.confirm({
      title: I18n.t('dashboard.shutValveConfirm'),
      message: I18n.t('dashboard.shutValveConfirmSub'),
      confirmText: I18n.t('dashboard.confirmYes'),
      danger: true,
      onConfirm() {
        State.set('sensor', { ...s, valveOpen: false });
        Components.toast('Gas Valve Closed', 'warning');
        triggerVoiceAnnounce(I18n.t('voice.valveClosed'));
        addAlert('VALVE_SHUT', 'info', 'Valve manually closed', 'Valve was shut down manually by user.');
        Router.navigate('dashboard');
      }
    });
  }

  function testAlarm() {
    if (!checkRolePermission('Test Alarm')) return;
    Components.toast('Alarm test started. Buzzer active on SVR unit.', 'warning');
    triggerVoiceAnnounce('Alarm buzzer check active.');
    setTimeout(() => {
      Components.toast('Alarm test completed.', 'success');
    }, 4000);
  }


  function resetDevice() {
    if (!checkRolePermission('Reset Device')) return;
    Components.confirm({
      title: 'Reset Device?',
      message: 'This will restart the SVR unit and reload sensor calibration.',
      danger: true,
      onConfirm() {
        Components.toast('SVR Device reset initiated…', 'warning');
        setTimeout(() => Components.toast('Device back online.', 'success'), 3000);
      }
    });
  }

  function refreshSensor() {
    const s = State.get('sensor');
    State.set('sensor', { ...s, updatedAt: Date.now() });
    Components.toast('Sensor data refreshed.', 'success');
    Router.navigate(Router.getCurrent());
  }


  // Emergency Controls
  function callEmergency() {
    const contact = MockData.emergencyContacts[0];
    Components.toast(`Calling emergency contact: ${contact.name} (${contact.phone})`, 'info');
    window.open(`tel:${contact.phone}`);
  }

  function silenceAlarm() {
    Components.confirm({
      title: I18n.t('emergency.silenceConfirm'),
      message: I18n.t('emergency.silenceConfirmSub'),
      onConfirm() {
        State.set('alarmSilenced', true);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        Components.toast('Alarm silenced', 'info');
      }
    });
  }

  function showSafetyGuide() {
    const html = `
      <div style="display:flex;flex-direction:column;gap:12px;text-align:left;font-size:0.9375rem;line-height:1.6">
        <div style="background:var(--danger-subtle);color:var(--danger);padding:12px;border-radius:var(--r-md);font-weight:600;text-align:center">
          DO NOT TURN ON/OFF LIGHT SWITCHES
        </div>
        <p>${I18n.t('emergency.guide.step1')}</p>
        <p>${I18n.t('emergency.guide.step2')}</p>
        <p>${I18n.t('emergency.guide.step3')}</p>
        <p>${I18n.t('emergency.guide.step4')}</p>
        <p>${I18n.t('emergency.guide.step5')}</p>
        <p>${I18n.t('emergency.guide.step6')}</p>
      </div>`;
    Components.modal({ title: I18n.t('emergency.viewGuide'), content: html });
  }

  function resetEmergency() {
    Components.confirm({
      title: I18n.t('emergency.resetConfirm'),
      message: I18n.t('emergency.resetConfirmSub'),
      onConfirm() {
        const s = State.get('sensor');
        State.set('sensor', { ...s, gasLevel: 35, valveOpen: true, leakDetected: false });
        State.set('appStatus', 'safe');
        State.set('alarmSilenced', false);
        Components.toast('System reset to Normal.', 'success');
        Router.navigate('dashboard');
      }
    });
  }

  // Monitoring
  function setMonRange(range) {
    document.querySelectorAll('.range-pill').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`range-${range}`)?.classList.add('active');
    Components.toast(`Loaded history range: ${range}`, 'info');
  }

  // Alerts Filter
  function filterAlerts(f) {
    document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`fp-${f}`)?.classList.add('active');
    
    // Simulate reload
    const alertsList = document.getElementById('alerts-list');
    if (alertsList) {
      const list = MockData.mockAlerts;
      let filtered = list;
      if (f === 'unread')   filtered = list.filter(a => !a.acknowledged);
      if (f === 'critical') filtered = list.filter(a => a.severity === 'critical');
      if (f === 'resolved') filtered = list.filter(a => a.acknowledged);

      if (filtered.length === 0) {
        alertsList.innerHTML = Components.emptyState({
          icon: '✅',
          title: I18n.t('alerts.noAlerts'),
          sub: I18n.t('alerts.noAlertsSub'),
        });
      } else {
        alertsList.innerHTML = filtered.map(a => Components.alertItem(a)).join('');
      }
    }
  }

  // Analytics
  function exportData(type) {
    Components.toast(`Exporting Analytics report in ${type.toUpperCase()} format…`, 'info');
    setTimeout(() => {
      Components.toast(`Report successfully downloaded.`, 'success');
    }, 1500);
  }

  // Settings Toggles
  function toggleTheme(cb) {
    const current = State.get('theme');
    const target = current === 'dark' ? 'light' : 'dark';
    State.set('theme', target);
    localStorage.setItem('scp_theme', target);
    applyAccessibilitySettings();
    Components.toast(`Switched to ${target} mode.`, 'info');
  }

  function toggleContrast(cb) {
    const current = State.get('contrast');
    const target = current === 'high' ? 'normal' : 'high';
    State.set('contrast', target);
    localStorage.setItem('scp_contrast', target);
    applyAccessibilitySettings();
    Components.toast(`High contrast mode ${target === 'high' ? 'enabled' : 'disabled'}.`, 'info');
  }

  function toggleVoice(cb) {
    const now = !State.get('voiceEnabled');
    State.set('voiceEnabled', now);
    localStorage.setItem('scp_voice', now);
    Components.toast(`Voice announcements ${now ? 'enabled' : 'disabled'}.`, 'info');
  }

  function toggleHaptic(cb) {
    const now = !State.get('hapticEnabled');
    State.set('hapticEnabled', now);
    localStorage.setItem('scp_haptic', now);
    if (now && 'vibrate' in navigator) navigator.vibrate(80);
    Components.toast(`Haptic feedback ${now ? 'enabled' : 'disabled'}.`, 'info');
  }

  function setFontSize(size) {
    State.set('fontsize', size);
    localStorage.setItem('scp_fontsize', size);
    applyAccessibilitySettings();
    Components.toast(`Font size set to ${I18n.t(`settings.font${size.charAt(0).toUpperCase()+size.slice(1)}`)}.`, 'info');
    Router.navigate('settings'); // redraw to update button states
  }

  // Modals inside Settings
  function showLanguagePicker() {
    const html = `
      <div class="language-grid" style="margin-top:var(--sp-md)">
        ${I18n.getAvailableLangs().map(l => `
          <button class="lang-btn ${I18n.getLang() === l.code ? 'active' : ''}" onclick="App.setLang('${l.code}')">
            <div class="lang-btn-flag">${l.flag}</div>
            <div class="lang-btn-name">${l.nativeName}</div>
          </button>`).join('')}
      </div>`;
    Components.modal({ title: I18n.t('settings.language'), content: html });
  }

  function showEmergencyContacts() {
    const contacts = MockData.emergencyContacts;
    const html = `
      <div style="display:flex;flex-direction:column;gap:var(--sp-sm);margin-top:var(--sp-md)">
        ${contacts.map(c => `
          <div class="member-card">
            <div class="member-avatar" style="background:var(--danger-subtle);color:var(--danger)">👤</div>
            <div style="flex:1;text-align:left">
              <div style="font-size:0.9375rem;font-weight:600">${c.name} (${c.relation})</div>
              <div style="font-size:0.8125rem;color:var(--text-secondary)">${c.phone}</div>
            </div>
            <label class="toggle" aria-label="Notify ${c.name} on leak">
              <input type="checkbox" ${c.notify ? 'checked' : ''} onclick="Components.toast('Contact alert preferences saved','success')">
              <div class="toggle-track"></div>
            </label>
          </div>`).join('')}
        <button class="btn btn-ghost btn-full">+ Add Contact</button>
      </div>`;
    Components.modal({ title: I18n.t('settings.emergencyContacts'), content: html });
  }

  function showNotifSettings() {
    const html = `
      <div style="display:flex;flex-direction:column;gap:2px;margin-top:var(--sp-md)">
        ${Components.settingsRow({ icon: '🔥', label: 'Gas Leak Alerts', toggle: true, chevron: false })}
        ${Components.settingsRow({ icon: '🫕', label: 'Vessel Timer Alerts', toggle: true, chevron: false })}
        ${Components.settingsRow({ icon: '🔌', label: 'Power Cut Alerts', toggle: true, chevron: false })}
        ${Components.settingsRow({ icon: '📶', label: 'Device Offline Alerts', toggle: true, chevron: false })}
      </div>`;
    Components.modal({ title: 'Notification Settings', content: html });
  }

  function showPrivacy() {
    const html = `
      <div style="text-align:left;font-size:0.875rem;line-height:1.6;color:var(--text-secondary);display:flex;flex-direction:column;gap:12px">
        <p><strong>Device Pairing Verification</strong><br>All communication with SVR device units is secured via client certificate exchange.</p>
        <p><strong>Data Encryption</strong><br>Sensor history stored on Firestore is encrypted in transit and at rest.</p>
        <p><strong>Family Link Control</strong><br>Only the primary owner can authorize or revoke guest access tokens.</p>
      </div>`;
    Components.modal({ title: 'Privacy & Security', content: html });
  }

  function showAbout() {
    const html = `
      <div style="text-align:center;padding:var(--sp-md) 0">
        <div style="font-size:3rem;margin-bottom:var(--sp-sm)">🛡️</div>
        <h3>SafeCook Pro</h3>
        <p style="color:var(--text-muted);font-size:0.8125rem">Smart-Valve Retrofit (SVR) Management Suite</p>
        <div class="divider"></div>
        <div style="text-align:left;font-size:0.8125rem;color:var(--text-secondary);display:flex;flex-direction:column;gap:8px">
          <div><strong>Model:</strong> ESP32-S3 SVR Core</div>
          <div><strong>Server:</strong> AWS IoT Broker / Firebase Sync</div>
          <div><strong>License:</strong> Commercial Exclusive License</div>
        </div>
      </div>`;
    Components.modal({ title: 'About SafeCook Pro', content: html });
  }

  function editProfile() {
    const u = State.get('user');
    const html = `
      <div class="auth-form" style="margin-top:var(--sp-md)">
        <div class="input-group">
          <label class="input-label" for="edit-name">Name</label>
          <input class="input-field" id="edit-name" value="${u.name}">
        </div>
        <div class="input-group">
          <label class="input-label" for="edit-email">Email</label>
          <input class="input-field" id="edit-email" value="${u.email}">
        </div>
        <button class="btn btn-primary btn-full" onclick="App.saveProfile()">Save Changes</button>
      </div>`;
    Components.modal({ title: 'Edit Profile', content: html });
  }

  function saveProfile() {
    const name = document.getElementById('edit-name')?.value || '';
    const email = document.getElementById('edit-email')?.value || '';
    if (name && email) {
      State.set('user', { ...State.get('user'), name, email, avatar: name.charAt(0).toUpperCase() });
      Components.toast('Profile updated', 'success');
      Router.navigate('settings');
      // Remove open modal overlay
      document.querySelector('.overlay')?.remove();
    }
  }

  function logout() {
    Components.confirm({
      title: 'Sign Out?',
      message: 'Are you sure you want to log out of SafeCook Pro?',
      onConfirm() {
        State.set('isLoggedIn', false);
        Router.navigate('login');
      }
    });
  }

  // Device Management Actions
  function renameDevice() {
    const d = State.get('device');
    const html = `
      <div class="auth-form" style="margin-top:var(--sp-md)">
        <div class="input-group">
          <label class="input-label" for="new-dev-name">Device Name</label>
          <input class="input-field" id="new-dev-name" value="${d.name}">
        </div>
        <button class="btn btn-primary btn-full" onclick="App.saveDeviceName()">Rename</button>
      </div>`;
    Components.modal({ title: 'Rename Device', content: html });
  }

  function saveDeviceName() {
    const name = document.getElementById('new-dev-name')?.value || '';
    if (name) {
      State.set('device', { ...State.get('device'), name });
      Components.toast('Device renamed', 'success');
      Router.navigate('devices');
      document.querySelector('.overlay')?.remove();
    }
  }

  function pairDevice() {
    const html = `
      <div style="text-align:center;padding:var(--sp-md) 0;display:flex;flex-direction:column;gap:16px">
        <p style="font-size:0.875rem;color:var(--text-secondary)">Align the QR code on the back of the SVR unit within the scanner frame.</p>
        <div style="width:200px;height:200px;border:2px dashed var(--primary);border-radius:12px;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:3rem;background:var(--bg-elevated);position:relative">
          📷
          <div style="position:absolute;width:24px;height:24px;border-left:3px solid var(--primary);border-top:3px solid var(--primary);top:-2px;left:-2px"></div>
          <div style="position:absolute;width:24px;height:24px;border-right:3px solid var(--primary);border-top:3px solid var(--primary);top:-2px;right:-2px"></div>
          <div style="position:absolute;width:24px;height:24px;border-left:3px solid var(--primary);border-bottom:3px solid var(--primary);bottom:-2px;left:-2px"></div>
          <div style="position:absolute;width:24px;height:24px;border-right:3px solid var(--primary);border-bottom:3px solid var(--primary);bottom:-2px;right:-2px"></div>
        </div>
        <button class="btn btn-primary btn-full" onclick="App.simPairSuccess()">Simulate QR Scan Success</button>
      </div>`;
    Components.modal({ title: 'Pair SVR Device', content: html });
  }

  function simPairSuccess() {
    document.querySelector('.overlay')?.remove();
    Components.toast('SVR Device successfully paired!', 'success');
  }

  function checkFirmware() {
    Components.toast('Checking for firmware updates…', 'info');
    setTimeout(() => {
      Components.toast('SVR unit is running latest firmware (v2.1.4)', 'success');
    }, 1500);
  }

  function wifiSetup() {
    const html = `
      <div class="auth-form" style="margin-top:var(--sp-md)">
        <p style="font-size:0.8125rem;color:var(--text-secondary)">Broadcasting WiFi setup network over Bluetooth. Select local home router SSID:</p>
        <div class="input-group">
          <label class="input-label" for="wifi-ssid">Home WiFi SSID</label>
          <input class="input-field" id="wifi-ssid" placeholder="e.g. Home_Network_5G">
        </div>
        <div class="input-group">
          <label class="input-label" for="wifi-pass">SSID Password</label>
          <input class="input-field" id="wifi-pass" type="password" placeholder="••••••••">
        </div>
        <button class="btn btn-primary btn-full" onclick="App.saveWifiSetup()">Configure WiFi</button>
      </div>`;
    Components.modal({ title: 'SVR WiFi Provisioning', content: html });
  }

  function saveWifiSetup() {
    const ssid = document.getElementById('wifi-ssid')?.value;
    if (ssid) {
      document.querySelector('.overlay')?.remove();
      Components.toast('Credentials synced to SVR unit. Connecting…', 'info');
      setTimeout(() => {
        Components.toast('SVR unit successfully connected to WiFi network.', 'success');
      }, 2000);
    }
  }

  function runDiagnostics() {
    const resEl = document.getElementById('diag-result');
    const itemsEl = document.getElementById('diag-items');
    if (!resEl || !itemsEl) return;

    resEl.classList.remove('hidden');
    itemsEl.innerHTML = `<div>🔍 Loading diagnostics stats…</div>`;

    const checks = [
      { name: 'MQTT Broker Handshake', delay: 400, res: '✅ Connected (Latency: 45ms)' },
      { name: 'Solenoid Valve Relay Voltage', delay: 900, res: '✅ Good (12.1V)' },
      { name: 'MQ-6 Leak Sensor Calib', delay: 1400, res: '✅ Steady (R0: 10.4k)' },
      { name: 'Ultrasonic Vessel Distance', delay: 1900, res: '✅ Working (Range: 12cm)' },
      { name: 'Power Line vs Battery Backup', delay: 2400, res: '✅ Safe (Main Power active, Battery backup online)' }
    ];

    checks.forEach(chk => {
      setTimeout(() => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.fontSize = '0.8125rem';
        row.style.borderBottom = '1px solid var(--border)';
        row.style.padding = '6px 0';
        row.innerHTML = `<span>${chk.name}</span><span style="font-weight:600">${chk.res}</span>`;
        if (itemsEl.innerHTML.includes('Loading')) itemsEl.innerHTML = '';
        itemsEl.appendChild(row);
      }, chk.delay);
    });
  }

  function restartDevice() {
    if (!checkRolePermission('Restart Device')) return;
    Components.confirm({
      title: 'Restart Smart Valve?',
      message: 'This will reboot the ESP32 controller and perform calibration checks.',
      onConfirm() {
        Components.toast('Reboot command sent over MQTT…', 'info');
        setTimeout(() => {
          Components.toast('Smart Valve controller reconnected.', 'success');
        }, 3000);
      }
    });
  }

  function factoryReset() {
    if (!checkRolePermission('Factory Reset SVR')) return;
    Components.confirm({
      title: 'Factory Reset SVR?',
      message: 'WARNING: This will wipe WiFi credentials and unpair this unit from your family dashboard.',
      confirmText: 'Reset SVR',
      danger: true,
      onConfirm() {
        Components.toast('Resetting unit to factory defaults…', 'warning');
        setTimeout(() => {
          State.set('isLoggedIn', false);
          localStorage.removeItem('scp_onboarded');
          Router.navigate('onboarding');
        }, 2000);
      }
    });
  }

  // Family linkages
  function inviteMember() {
    if (!checkRolePermission('Invite Member')) return;
    const html = `
      <div class="auth-form" style="margin-top:var(--sp-md)">
        <div class="input-group">
          <label class="input-label" for="invite-phone">Member Mobile Number</label>
          <input class="input-field" id="invite-phone" placeholder="+91 98765 43210">
        </div>
        <div class="input-group">
          <label class="input-label">Role Privilege</label>
          <select class="input-field" id="invite-role">
            <option value="member">Family Member (Full control)</option>
            <option value="guest">Guest Member (Read-only status dashboard)</option>
          </select>
        </div>
        <button class="btn btn-primary btn-full" onclick="App.sendInvite()">Send Invite Link</button>
      </div>`;
    Components.modal({ title: 'Invite Family Member', content: html });
  }

  function sendInvite() {
    const phone = document.getElementById('invite-phone')?.value;
    const role = document.getElementById('invite-role')?.value;
    if (phone) {
      document.querySelector('.overlay')?.remove();
      Components.toast(`Invite invitation sent to ${phone}!`, 'success');

      const newMember = {
        id: 'u_' + Date.now(),
        name: 'Pending invite',
        role,
        avatar: '?',
        status: 'offline',
        invitedPhone: phone,
        invitedAt: Date.now()
      };

      // Update in-memory list
      MockData.familyMembers.push(newMember);

      // Persist new family member to server database
      fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      }).catch(() => { /* offline — member saved locally only */ });

      Router.navigate('family');
    }
  }

  function shareInviteLink() {
    navigator.clipboard.writeText('https://safecookpro.com/invite/SCP-001-A8F2');
    Components.toast('Invite link copied to clipboard.', 'success');
  }

  function showInviteQr() {
    const html = `
      <div style="text-align:center;padding:var(--sp-md) 0">
        <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:var(--sp-md)">Have your family member scan this QR code inside their SafeCook Pro app.</p>
        <div style="width:160px;height:160px;background:#fff;padding:12px;margin:0 auto;border-radius:12px">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=136x136&data=https://safecookpro.com/invite/SCP-001-A8F2" alt="Invite QR">
        </div>
      </div>`;
    Components.modal({ title: 'Invite QR Code', content: html });
  }

  // Triggered helper on load
  window.addEventListener('DOMContentLoaded', init);

  return {
    init,
    toggleTheme, toggleContrast, toggleVoice, toggleHaptic, setFontSize,
    showLanguagePicker, showEmergencyContacts, showNotifSettings, showPrivacy, showAbout,
    editProfile, saveProfile, logout,
    setLang, obNext, finishOnboarding,
    login, register, sendOtp, verifyOtp, otpKeyup, resendOtp, googleLogin, biometricLogin, togglePassword, autofill, loginAs,
    shutValveConfirm, testAlarm, resetDevice, refreshSensor,
    callEmergency, silenceAlarm, showSafetyGuide, resetEmergency,
    setMonRange, filterAlerts, exportData,
    renameDevice, saveDeviceName, pairDevice, simPairSuccess, checkFirmware, wifiSetup, saveWifiSetup, runDiagnostics, restartDevice, factoryReset,
    inviteMember, sendInvite, shareInviteLink, showInviteQr,
    acknowledgeAlert, navigate
  };
})();

window.App = App;
