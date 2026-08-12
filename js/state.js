/* ============================================================
   SafeCook Pro — App State Manager
   ============================================================ */

const State = (() => {
  const _state = {
    user: JSON.parse(localStorage.getItem('scp_user')) || {
      name: 'Govind Kumar',
      email: 'govind@example.com',
      role: 'owner',
      avatar: 'G',
    },
    device: JSON.parse(localStorage.getItem('scp_device')) || {
      id: 'SCP-001-A8F2',
      name: 'Kitchen - Home',
      mac: 'A8:F2:4C:11:22:33',
      firmware: 'v2.1.4',
      status: 'online',
      lastSeen: Date.now(),
    },
    sensor: JSON.parse(localStorage.getItem('scp_sensor')) || {
      gasLevel: 42,
      valveOpen: true,
      vesselPresent: true,
      leakDetected: false,
      temperature: 28.3,
      humidity: 61,
      batteryPercent: 87,
      wifiRSSI: -58,
      sensorHealth: 'good',
      deviceTemp: 31.5,
      updatedAt: Date.now(),
    },
    appStatus: localStorage.getItem('scp_app_status') || 'safe', // 'safe' | 'warning' | 'emergency'
    countdown: 30,
    countdownActive: false,
    countdownTimer: null,
    alarmSilenced: false,
    theme: localStorage.getItem('scp_theme') || 'dark',
    fontsize: localStorage.getItem('scp_fontsize') || 'normal',
    contrast: localStorage.getItem('scp_contrast') || 'normal',
    voiceEnabled: localStorage.getItem('scp_voice') !== 'false',
    hapticEnabled: localStorage.getItem('scp_haptic') !== 'false',
    alerts: [],
    alertUnread: 3,
    isLoggedIn: localStorage.getItem('scp_is_logged_in') === 'true',
    onboardingDone: localStorage.getItem('scp_onboarded') === 'true',
  };

  const listeners = {};

  function get(key) { return _state[key]; }
  function getAll() { return { ..._state }; }

  function set(key, value) {
    _state[key] = value;
    
    // Persist key variables to local storage
    if (key === 'user') {
      localStorage.setItem('scp_user', JSON.stringify(value));
    } else if (key === 'device') {
      localStorage.setItem('scp_device', JSON.stringify(value));
    } else if (key === 'sensor') {
      localStorage.setItem('scp_sensor', JSON.stringify(value));
    } else if (key === 'isLoggedIn') {
      localStorage.setItem('scp_is_logged_in', value ? 'true' : 'false');
    } else if (key === 'appStatus') {
      localStorage.setItem('scp_app_status', value);
    }

    if (listeners[key]) listeners[key].forEach(fn => fn(value));
    if (listeners['*'])  listeners['*'].forEach(fn => fn({ key, value }));
  }

  function on(key, fn) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(fn);
  }

  function off(key, fn) {
    if (!listeners[key]) return;
    listeners[key] = listeners[key].filter(f => f !== fn);
  }

  return { get, getAll, set, on, off };
})();

window.State = State;
