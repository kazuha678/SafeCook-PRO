/* ============================================================
   SafeCook Pro — Emergency Screen
   ============================================================
   PRESERVED HOOKS — DO NOT RENAME:
     id="emergency-main"             — root alertdialog
     id="em-call-btn"                — call emergency contact
     id="em-silence-btn"             — silence alarm
     id="em-guide-btn"               — safety guide
     id="em-reset-btn"               — reset after inspection
     class="emergency-screen"        — CSS root class
     class="emergency-screen active" — emergencyFlash animation trigger
     class="emergency-bg-rings"      — pulsing rings container
     class="emergency-ring"          — individual ring elements
     class="live-dot"                — alarm active indicator
     class="emergency-btn eb-call"   — JS-targeted button classes
     class="emergency-btn eb-silence"
     class="emergency-btn eb-guide"
     class="emergency-btn eb-reset"
     onclick="App.callEmergency()"
     onclick="App.silenceAlarm()"
     onclick="App.showSafetyGuide()"
     onclick="App.resetEmergency()"
     _alarmInterval / _voiceUtter    — voice alarm system
     onEnter() / onLeave()           — Router lifecycle
   ============================================================ */

let _alarmInterval = null;
let _voiceUtter    = null;

// ─── SVG icon system ────────────────────────────────────────
const EmIcons = {
  warning:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  shieldOk:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  phone:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.18 6.18l1.17-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  muted:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
  book:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  reset:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>`,
  gas:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.7-.28-1.33-.74-1.8L9 9l-1.5 2.5c-.31.51-.5 1.11-.5 1.5 0 .83.34 1.58.5 1.5z"/><path d="M12 2c0 2.2.8 4 2 5.5 1.2 1.5 2 3.3 2 5.5 0 3.87-3.13 7-7 7S2 16.87 2 13c0-2.2.8-4 2-5.5.6-.77 1-1.5 1.2-2.5.6 1 1.8 1.7 2.3 3C8.5 5.5 10 4 12 2z"/></svg>`,
  valve:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12M5.64 18.36l2.12-2.12m8.48-8.48 2.12-2.12"/></svg>`,
  device:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  check:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  bell:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  runaway:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="5" r="1"/><path d="M9 20l1.5-6.5L13 16l2-5.5 2 3.5H21"/><path d="m9 20 2-8 3 4 2-5 2 3"/><path d="M3 12l3-3 3 3"/></svg>`,
  noSwitch:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
};

// ─── Helpers ────────────────────────────────────────────────
function emStatusPill(cls, icon, text) {
  return `<span class="em-status-pill pill-${cls}">${icon}<span>${text}</span></span>`;
}

// ─── Screen render ─────────────────────────────────────────
Router.register('emergency', () => {
  const t = I18n.t.bind(I18n);

  // Read real application state — no invented values
  const sensor        = State.get('sensor')  || {};
  const appStatus     = State.get('appStatus') || 'safe';
  const alarmSilenced = State.get('alarmSilenced') || false;
  const device        = State.get('device')  || {};

  const isEmergency = appStatus === 'emergency' || sensor.leakDetected;
  const isWarning   = appStatus === 'warning' && !isEmergency;
  const isSafe      = !isEmergency && !isWarning;

  const stateClass = isEmergency ? 'state-emergency'
                   : isWarning   ? 'state-warning'
                   : 'state-safe';

  // Gas level — real value
  const gasLevel  = typeof sensor.gasLevel === 'number' ? sensor.gasLevel.toFixed(1) : '–';
  const valveOpen = sensor.valveOpen !== false; // default open if undefined
  const leakDet   = !!sensor.leakDetected;
  const isOnline  = device.status !== 'offline';

  // ── A. Status header ──────────────────────────────────────
  const statusIcon = isEmergency ? EmIcons.warning
                   : isWarning   ? EmIcons.warning
                   : EmIcons.shieldOk;

  const statusLabel = isEmergency ? 'EMERGENCY'
                    : isWarning   ? 'WARNING'
                    : 'SAFE';

  const headline = isEmergency ? t('emergency.headline')
                 : isWarning   ? t('dashboard.warning')
                 : 'Kitchen is Safe';

  const subText = isEmergency ? t('emergency.instruction')
                : isWarning   ? 'Vessel removed. Valve will close if vessel is not replaced.'
                : 'No active emergency.\nYour kitchen is being monitored.';

  // Alarm indicator (only in emergency/warning)
  let alarmIndicator = '';
  if (isEmergency || isWarning) {
    alarmIndicator = alarmSilenced
      ? `<div class="em-alarm-silenced" aria-label="Alarm silenced">
           ${EmIcons.muted}
           <span>Alarm Silenced</span>
         </div>`
      : `<div class="em-alarm-pill" aria-label="Alarm active">
           <div class="live-dot" aria-hidden="true" style="background:var(--danger)"></div>
           <span class="em-alarm-pill-label">ALARM ACTIVE</span>
         </div>`;
  }

  // ── B. Safety instructions (only emergency/warning) ───────
  let instructionBlock = '';
  if (isEmergency) {
    instructionBlock = `
      <div class="em-instruction-block" role="note" aria-label="Safety instructions">
        <div class="em-instruction-step">
          <div class="em-instruction-step-icon" aria-hidden="true">${EmIcons.runaway}</div>
          <div class="em-instruction-step-text">Leave the area immediately</div>
        </div>
        <div class="em-instruction-step">
          <div class="em-instruction-step-icon" aria-hidden="true">${EmIcons.noSwitch}</div>
          <div class="em-instruction-step-text">Do not use electrical switches</div>
        </div>
        <div class="em-instruction-step">
          <div class="em-instruction-step-icon" aria-hidden="true">${EmIcons.phone}</div>
          <div class="em-instruction-step-text">Call your emergency contact below</div>
        </div>
      </div>`;
  }

  // ── C. System response card ───────────────────────────────
  const gasSupplyPill = valveOpen
    ? emStatusPill('warning', EmIcons.check, 'GAS FLOWING')
    : emStatusPill('safe',    EmIcons.check, 'SHUT OFF');

  const alarmPill = alarmSilenced
    ? emStatusPill('muted',   EmIcons.muted, 'SILENCED')
    : emStatusPill('danger',  EmIcons.bell,  'ACTIVE');

  const devicePill = isOnline
    ? emStatusPill('safe',  EmIcons.check, 'ONLINE')
    : emStatusPill('muted', EmIcons.device, 'OFFLINE');

  const responseCard = `
    <div class="em-response-card" role="region" aria-label="SafeCook Pro system response">
      <div class="em-response-header">
        <span class="em-response-header-label">SafeCook Pro Response</span>
      </div>
      <div class="em-response-row">
        <div class="em-response-row-left">
          <div class="em-response-row-icon" aria-hidden="true">${EmIcons.valve}</div>
          <span class="em-response-row-label">Gas Supply</span>
        </div>
        ${gasSupplyPill}
      </div>
      <div class="em-response-row">
        <div class="em-response-row-left">
          <div class="em-response-row-icon" aria-hidden="true">${EmIcons.bell}</div>
          <span class="em-response-row-label">Alarm</span>
        </div>
        ${alarmPill}
      </div>
      <div class="em-response-row">
        <div class="em-response-row-left">
          <div class="em-response-row-icon" aria-hidden="true">${EmIcons.device}</div>
          <span class="em-response-row-label">Device</span>
        </div>
        ${devicePill}
      </div>
    </div>`;

  // ── D. Emergency contact card ─────────────────────────────
  const contact = (MockData.emergencyContacts || [])[0];
  const contactCard = contact ? `
    <div class="em-contact-card" role="region" aria-label="Emergency contact">
      <div class="em-contact-avatar" aria-hidden="true">${contact.name.charAt(0).toUpperCase()}</div>
      <div class="em-contact-content">
        <div class="em-contact-name">${contact.name}</div>
        <div class="em-contact-relation">${contact.relation}</div>
        <div class="em-contact-phone">${contact.phone}</div>
      </div>
    </div>` : '';

  // ── E. Sensor technical info ──────────────────────────────
  const gasPpmClass  = sensor.gasLevel >= 300 ? 'val-danger' : sensor.gasLevel >= 100 ? 'val-warning' : 'val-safe';
  const valveValClass= valveOpen ? 'val-warning' : 'val-safe';
  const leakClass    = leakDet ? 'val-danger' : 'val-safe';

  const sensorSection = `
    <div class="em-sensor-section" role="region" aria-label="Sensor readings">
      <div class="em-sensor-section-label">Sensor Readings</div>
      <div class="em-sensor-row">
        <div class="em-sensor-chip">
          ${EmIcons.gas}
          <div>
            <div class="em-sensor-chip-label">Gas Level</div>
            <div class="em-sensor-chip-value ${gasPpmClass}">${gasLevel} ppm</div>
          </div>
        </div>
        <div class="em-sensor-chip">
          ${EmIcons.valve}
          <div>
            <div class="em-sensor-chip-label">Valve</div>
            <div class="em-sensor-chip-value ${valveValClass}">${valveOpen ? 'Open' : 'Closed'}</div>
          </div>
        </div>
        <div class="em-sensor-chip">
          ${EmIcons.warning}
          <div>
            <div class="em-sensor-chip-label">Leak Detection</div>
            <div class="em-sensor-chip-value ${leakClass}">${leakDet ? 'Detected' : 'Normal'}</div>
          </div>
        </div>
      </div>
    </div>`;

  // ── Safe state note ───────────────────────────────────────
  const safeNote = isSafe ? `
    <div class="em-safe-info">
      <div class="em-safe-info-title">No active emergency</div>
      <div class="em-safe-info-sub">Your kitchen is being monitored by SafeCook Pro.</div>
    </div>` : '';

  // ─── Full screen render ──────────────────────────────────
  return `
    <div
      class="emergency-screen ${stateClass} ${isEmergency ? 'active' : ''}"
      role="alertdialog"
      aria-modal="true"
      aria-label="${t('emergency.headline')}"
      aria-live="${isEmergency ? 'assertive' : 'polite'}"
      id="emergency-main"
    >
      <!-- Pulsing background rings (aria-hidden, decorative only) -->
      <div class="emergency-bg-rings" aria-hidden="true">
        <div class="emergency-ring"></div>
        <div class="emergency-ring"></div>
        <div class="emergency-ring"></div>
      </div>

      <div class="em-scroll">

        <!-- A. Emergency Status Header -->
        <div class="em-status-header">
          <div class="em-status-icon-wrap" aria-hidden="true">
            ${statusIcon}
          </div>
          <span class="em-status-label">${statusLabel}</span>
          <h1 class="emergency-headline" data-i18n="${isEmergency ? 'emergency.headline' : ''}">${headline}</h1>
          <p class="emergency-sub">${subText}</p>
          ${alarmIndicator}
        </div>

        <!-- B. Safety Instructions (emergency/warning only) -->
        ${instructionBlock}

        <!-- C. SafeCook Pro System Response -->
        ${responseCard}

        <!-- D. Action Buttons -->
        <!-- All IDs, classes, and onclick handlers preserved exactly -->
        <div class="emergency-actions">

          <button
            class="emergency-btn eb-call"
            onclick="App.callEmergency()"
            id="em-call-btn"
            aria-label="${t('emergency.callEmergency')}"
          >
            ${EmIcons.phone}
            <span data-i18n="emergency.callEmergency">${t('emergency.callEmergency')}</span>
          </button>

          <button
            class="emergency-btn eb-silence"
            onclick="App.silenceAlarm()"
            id="em-silence-btn"
            aria-label="${t('emergency.silenceAlarm')}"
          >
            ${EmIcons.muted}
            <span data-i18n="emergency.silenceAlarm">${t('emergency.silenceAlarm')}</span>
          </button>

          <button
            class="emergency-btn eb-guide"
            onclick="App.showSafetyGuide()"
            id="em-guide-btn"
            aria-label="${t('emergency.viewGuide')}"
          >
            ${EmIcons.book}
            <span data-i18n="emergency.viewGuide">${t('emergency.viewGuide')}</span>
          </button>

          <button
            class="emergency-btn eb-reset"
            onclick="App.resetEmergency()"
            id="em-reset-btn"
            aria-label="${t('emergency.resetAfter')}"
          >
            ${EmIcons.reset}
            <span data-i18n="emergency.resetAfter">${t('emergency.resetAfter')}</span>
          </button>

        </div>

        <!-- E. Emergency Contact -->
        ${contactCard}

        <!-- F. Sensor Technical Information -->
        ${sensorSection}

        <!-- G. Safe state note -->
        ${safeNote}

      </div>
    </div>`;

}, {
  // Router lifecycle hooks — preserved exactly
  onEnter() {
    // Voice announcement
    if (State.get('voiceEnabled') && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      _voiceUtter = new SpeechSynthesisUtterance(I18n.t('voice.gasLeak'));
      _voiceUtter.lang = I18n.getLang() === 'ta' ? 'ta-IN'
                       : I18n.getLang() === 'hi' ? 'hi-IN'
                       : 'en-IN';
      _voiceUtter.rate   = 0.9;
      _voiceUtter.volume = 1;
      window.speechSynthesis.speak(_voiceUtter);

      // Repeat every 15 seconds while alarm is not silenced
      _alarmInterval = setInterval(() => {
        if (!State.get('alarmSilenced')) {
          const u = new SpeechSynthesisUtterance(I18n.t('voice.gasLeak'));
          u.lang = _voiceUtter.lang;
          u.rate = 0.9;
          window.speechSynthesis.speak(u);
        }
      }, 15000);
    }
    State.set('appStatus', 'emergency');
  },

  onLeave() {
    if (_alarmInterval) { clearInterval(_alarmInterval); _alarmInterval = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }
});
