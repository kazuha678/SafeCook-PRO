/* Emergency Screen */

let _alarmInterval = null;
let _voiceUtter = null;

Router.register('emergency', () => {
  const t = I18n.t.bind(I18n);

  return `
    <div class="emergency-screen active" role="alertdialog" aria-modal="true" aria-label="${t('emergency.headline')}" aria-live="assertive" id="emergency-main">
      <!-- Pulsing rings -->
      <div class="emergency-bg-rings" aria-hidden="true">
        <div class="emergency-ring"></div>
        <div class="emergency-ring"></div>
        <div class="emergency-ring"></div>
      </div>

      <div class="emergency-top">
        <div class="emergency-icon" aria-hidden="true">⚠️</div>
        <h1 class="emergency-headline" data-i18n="emergency.headline">${t('emergency.headline')}</h1>
        <p class="emergency-sub" data-i18n="emergency.instruction">${t('emergency.instruction')}</p>

        <!-- Alarm animation -->
        <div style="display:flex;align-items:center;gap:var(--sp-sm);padding:8px 20px;background:rgba(239,68,68,0.2);border:1px solid var(--danger);border-radius:var(--r-full)">
          <div class="live-dot" style="background:var(--danger)"></div>
          <span style="font-size:0.8125rem;font-weight:700;color:var(--danger);letter-spacing:0.06em">ALARM ACTIVE</span>
        </div>
      </div>

      <div class="emergency-actions">
        <button class="emergency-btn eb-call" onclick="App.callEmergency()" id="em-call-btn" aria-label="${t('emergency.callEmergency')}">
          <span style="font-size:1.5rem">📞</span>
          <span data-i18n="emergency.callEmergency">${t('emergency.callEmergency')}</span>
        </button>

        <button class="emergency-btn eb-silence" onclick="App.silenceAlarm()" id="em-silence-btn" aria-label="${t('emergency.silenceAlarm')}">
          <span style="font-size:1.5rem">🔇</span>
          <span data-i18n="emergency.silenceAlarm">${t('emergency.silenceAlarm')}</span>
        </button>

        <button class="emergency-btn eb-guide" onclick="App.showSafetyGuide()" id="em-guide-btn" aria-label="${t('emergency.viewGuide')}">
          <span style="font-size:1.5rem">📖</span>
          <span data-i18n="emergency.viewGuide">${t('emergency.viewGuide')}</span>
        </button>

        <button class="emergency-btn eb-reset" onclick="App.resetEmergency()" id="em-reset-btn" aria-label="${t('emergency.resetAfter')}">
          <span data-i18n="emergency.resetAfter">${t('emergency.resetAfter')}</span>
        </button>
      </div>
    </div>`;
}, {
  onEnter() {
    // Voice announcement
    if (State.get('voiceEnabled') && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      _voiceUtter = new SpeechSynthesisUtterance(I18n.t('voice.gasLeak'));
      _voiceUtter.lang = I18n.getLang() === 'ta' ? 'ta-IN' : I18n.getLang() === 'hi' ? 'hi-IN' : 'en-IN';
      _voiceUtter.rate = 0.9;
      _voiceUtter.volume = 1;
      window.speechSynthesis.speak(_voiceUtter);

      // Repeat every 15s
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
