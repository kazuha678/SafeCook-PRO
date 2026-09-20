/* ============================================================
   SafeCook Pro — Dashboard Screen
   ============================================================
   JavaScript hooks preserved:
   - id="dashboard-main"        (root role="main")
   - id="countdown-display"     (setInterval text update)
   - id="countdown-bar"         (setInterval width update)
   - id="last-updated"          (setInterval text update)
   - id="dash-chart"            (Charts.drawLineChart canvas)
   - onclick="Router.navigate('emergency')"
   - onclick="App.shutValveConfirm()"
   - onclick="App.testAlarm()"
   - onclick="App.resetDevice()"
   - onclick="App.refreshSensor()"
   - onclick="Router.navigate('family')"
   - onclick="Router.navigate('devices')"
   - onclick="Router.navigate('monitoring')"
   - onclick="Router.navigate('alerts')"
   - data-i18n attributes
   ============================================================ */

let _dashInterval = null;

// ─── SVG Icon helpers ─────────────────────────────────────
const DashIcons = {
  // Shield with checkmark — Safety
  shield: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>`,

  // Triangle warning
  warning: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,

  // Siren / Emergency
  emergency: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,

  // Flame — Gas
  flame: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.7-.28-1.33-.74-1.8L9 9l-1.5 2.5c-.31.51-.5 1.11-.5 1.5 0 .83.34 1.58.5 1.5z"/>
    <path d="M12 2c0 2.2.8 4 2 5.5 1.2 1.5 2 3.3 2 5.5 0 3.87-3.13 7-7 7S2 16.87 2 13c0-2.2.8-4 2-5.5.6-.77 1-1.5 1.2-2.5.6 1 1.8 1.7 2.3 3C8.5 5.5 10 4 12 2z"/>
  </svg>`,

  // Pot/vessel — Vessel
  vessel: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 12h20"/>
    <path d="M5 12v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>
    <path d="M9 12V8a3 3 0 0 1 6 0v4"/>
    <path d="M7 8h10"/>
  </svg>`,

  // Valve — flow control
  valve: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>`,

  // Wifi signal — Device
  device: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <circle cx="12" cy="20" r="1" fill="currentColor"/>
  </svg>`,

  // Lock — shut valve action
  lock: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>`,

  // Bell — test alarm
  bell: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>`,

  // Refresh circle
  refresh: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>`,

  // Reset / rotate-ccw
  reset: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-3.6"/>
  </svg>`,

  // Users — family
  users: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>`,

  // Smartphone — devices
  smartphone: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18" stroke-width="2.5"/>
  </svg>`,

  // Phone — emergency call
  phone: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.18 6.18l1.17-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>`,

  // Check circle
  check: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`,
};

Router.register('dashboard', () => {
  const t  = I18n.t.bind(I18n);
  const s  = State.get('sensor');
  const u  = State.get('user');
  const d  = State.get('device');
  const st = State.get('appStatus');

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ─── Clean user display name ──────────────────────────
  // Strip internal format like "kazuha(sarvesh)(owner)" → "Sarvesh"
  function getDisplayName(rawName) {
    if (!rawName) return '';
    // If name has parentheses e.g. "kazuha(Sarvesh)(owner)", extract first parens content
    const parenMatch = rawName.match(/\(([^)]+)\)/);
    if (parenMatch) {
      return parenMatch[1].charAt(0).toUpperCase() + parenMatch[1].slice(1);
    }
    // Otherwise take first word and capitalize it
    const firstWord = rawName.split(/[\s_(]/)[0];
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  }
  const displayName = getDisplayName(u.name);

  // ─── Safety state config ──────────────────────────────
  const stateClass = st === 'emergency' ? 'state-emergency'
    : st === 'warning' ? 'state-warning'
    : 'state-safe';

  const stateLabel = st === 'emergency' ? t('dashboard.emergency')
    : st === 'warning' ? t('dashboard.warning')
    : t('dashboard.safe');

  const stateSub = st === 'emergency' ? t('dashboard.emergencySub')
    : st === 'warning' ? t('dashboard.warningSub', { sec: State.get('countdown') })
    : t('dashboard.safeSub');

  const stateMsg = st === 'emergency'
    ? 'Gas leak detected. Take action immediately.'
    : st === 'warning'
    ? 'Vessel removed — valve will close automatically.'
    : 'All sensors normal. Your kitchen is safe.';

  const ringColor = st === 'emergency' ? 'var(--danger)'
    : st === 'warning' ? 'var(--warning)'
    : 'var(--safe)';

  // ─── Primary safety status block ──────────────────────
  function primarySafetyBlock() {
    const clickAttr = st === 'emergency' ? 'onclick="Router.navigate(\'emergency\')" style="cursor:pointer"' : '';
    const ariaLive  = st === 'emergency' ? 'assertive' : 'polite';
    const ariaRole  = st === 'emergency' ? 'alert' : 'status';

    let countdownSection = '';
    if (st === 'warning') {
      const cd = State.get('countdown');
      countdownSection = `
        <div class="dash-countdown-wrap">
          <div class="dash-countdown-label">
            <span>Valve closes in</span>
            <span class="dash-countdown-timer" id="countdown-display">${cd}s</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill warning" id="countdown-bar" style="width:${(cd / 30) * 100}%"></div>
          </div>
        </div>`;
    }

    let emergencyCta = '';
    if (st === 'emergency') {
      emergencyCta = `
        <button class="dash-emergency-cta" onclick="Router.navigate('emergency')" aria-label="View emergency details">
          ${DashIcons.emergency('dash-cta-icon')}
          View Emergency Details
        </button>`;
    }

    // Icon for the safety state
    const iconSvg = st === 'emergency'
      ? DashIcons.emergency('dash-state-svg')
      : st === 'warning'
      ? DashIcons.warning('dash-state-svg')
      : DashIcons.shield('dash-state-svg');

    // Device status row (subtle secondary info)
    const devOnline = d.status === 'online';
    const deviceStatus = `
      <div class="dash-safety-device-row" aria-label="Device status">
        <span class="dash-device-dot ${devOnline ? 'online' : 'offline'}"></span>
        <span class="dash-device-name">${d.name}</span>
      </div>`;

    return `
      <div class="dash-safety-block ${stateClass}" role="${ariaRole}" aria-live="${ariaLive}" ${clickAttr}>
        <div class="dash-safety-inner">
          <div class="dash-status-ring-wrap" aria-hidden="true">
            <svg class="dash-status-ring-svg" viewBox="0 0 100 100" fill="none">
              <circle class="ring-track" cx="50" cy="50" r="44" stroke-width="3"/>
              <circle class="ring-fill" cx="50" cy="50" r="44"
                stroke="${ringColor}" stroke-width="3"
                stroke-dasharray="276" stroke-dashoffset="${st === 'warning' ? 70 : 0}"
                stroke-linecap="round" transform="rotate(-90 50 50)"/>
            </svg>
            <div class="dash-state-icon-wrap">
              ${iconSvg}
            </div>
          </div>

          <div class="dash-safety-text">
            <div class="dash-status-label" data-i18n="${st === 'safe' ? 'dashboard.safe' : st === 'warning' ? 'dashboard.warning' : 'dashboard.emergency'}">${stateLabel}</div>
            <div class="dash-status-msg">${stateMsg}</div>
            <div class="dash-status-sub">${stateSub}</div>
          </div>
        </div>

        ${deviceStatus}
        ${countdownSection}
        ${emergencyCta}
      </div>`;
  }

  // ─── Gas reading for display ──────────────────────────
  const gasLevel = s.gasLevel || 0;
  const gasVariant  = gasLevel < 100 ? 'safe' : gasLevel < 300 ? 'warning' : 'danger';
  const gasLabel    = gasLevel < 100 ? 'Normal' : gasLevel < 300 ? 'Elevated' : 'Danger';
  const gasDisplay  = gasLevel < 100 ? 'Normal' : `${gasLevel} ppm`;
  const gasSub      = gasLevel < 100 ? `${gasLevel} ppm` : `${gasLevel} ppm`;

  const valveOpen   = s.valveOpen;
  const vesselHere  = s.vesselPresent;
  const devOnline   = d.status === 'online';

  // ─── Recent activity from alerts ─────────────────────
  function recentActivity() {
    const alerts = MockData.mockAlerts.slice(0, 4);
    if (!alerts.length) return `<div class="dash-activity-item"><div class="dash-activity-text"><div class="dash-activity-title" style="color:var(--text-muted)">No recent activity</div></div></div>`;
    return alerts.map(a => {
      const cls  = a.severity === 'critical' ? 'danger' : a.severity === 'warning' ? 'warning' : 'info';
      const iconSvg = a.severity === 'critical'
        ? DashIcons.warning('activity-icon-svg')
        : a.severity === 'warning'
        ? DashIcons.warning('activity-icon-svg')
        : DashIcons.check('activity-icon-svg');
      return `
        <div class="dash-activity-item" onclick="Router.navigate('alerts')" role="button" aria-label="${a.title}">
          <div class="dash-activity-indicator ${cls}" aria-hidden="true">${iconSvg}</div>
          <div class="dash-activity-text">
            <div class="dash-activity-title">${a.title}</div>
            <div class="dash-activity-time">${MockData.timeAgo(a.timestamp)}</div>
          </div>
        </div>`;
    }).join('');
  }

  return `
    <div class="dashboard-screen" role="main" id="dashboard-main">

      <!-- HEADER -->
      <div class="dashboard-header">
        <div class="dashboard-title-group">
          <div class="dashboard-brand">SafeCook Pro</div>
          <div class="dashboard-greeting">${greet}${displayName ? `, ${displayName}` : ''}</div>
          <div class="dashboard-location">${d.name}</div>
        </div>
        <div class="dash-header-actions">
          <!-- Connection status pill -->
          <div class="device-pill" onclick="Router.navigate('devices')" role="button" aria-label="Device: ${d.name}">
            <div class="status-dot ${devOnline ? 'online' : 'offline'}"></div>
            <span class="device-pill-name">${devOnline ? 'Connected' : 'Offline'}</span>
          </div>
          <!-- Notification bell -->
          <button class="notif-btn" onclick="Router.navigate('alerts')" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <div class="notif-dot"></div>
          </button>
        </div>
      </div>

      <!-- BODY -->
      <div class="dashboard-body">

        <!-- 1. PRIMARY SAFETY STATUS -->
        ${primarySafetyBlock()}

        <!-- 2. KITCHEN STATUS -->
        <div>
          <div class="section-title">
            <h2>Kitchen Status</h2>
            <a onclick="Router.navigate('monitoring')">Live →</a>
          </div>
          <div class="dash-conditions">
            <!-- GAS -->
            <div class="dash-condition-item" onclick="Router.navigate('monitoring')" role="button" aria-label="Gas: ${gasDisplay}">
              <div class="dash-condition-icon ${gasVariant}" aria-hidden="true">
                ${DashIcons.flame('condition-svg')}
              </div>
              <div class="dash-condition-text">
                <div class="dash-condition-label" data-i18n="dashboard.gasLevel">${t('dashboard.gasLevel')}</div>
                <div class="dash-condition-value">${gasDisplay}</div>
                <div class="dash-condition-status ${gasVariant}">${gasSub}</div>
              </div>
            </div>
            <!-- VESSEL -->
            <div class="dash-condition-item" onclick="Router.navigate('monitoring')" role="button" aria-label="Vessel: ${vesselHere ? 'Present' : 'Absent'}">
              <div class="dash-condition-icon ${vesselHere ? 'safe' : 'warning'}" aria-hidden="true">
                ${DashIcons.vessel('condition-svg')}
              </div>
              <div class="dash-condition-text">
                <div class="dash-condition-label" data-i18n="dashboard.vessel">${t('dashboard.vessel')}</div>
                <div class="dash-condition-value">${vesselHere ? t('dashboard.vesselPresent') : t('dashboard.vesselAbsent')}</div>
                <div class="dash-condition-status ${vesselHere ? 'safe' : 'warning'}">${vesselHere ? 'On burner' : 'Removed'}</div>
              </div>
            </div>
            <!-- VALVE -->
            <div class="dash-condition-item" onclick="Router.navigate('devices')" role="button" aria-label="Valve: ${valveOpen ? 'Open' : 'Closed'}">
              <div class="dash-condition-icon ${valveOpen ? 'safe' : 'danger'}" aria-hidden="true">
                ${DashIcons.valve('condition-svg')}
              </div>
              <div class="dash-condition-text">
                <div class="dash-condition-label" data-i18n="dashboard.valve">${t('dashboard.valve')}</div>
                <div class="dash-condition-value">${valveOpen ? t('dashboard.valveOpen') : t('dashboard.valveClosed')}</div>
                <div class="dash-condition-status ${valveOpen ? 'safe' : 'danger'}">${valveOpen ? 'Gas flowing' : 'Gas blocked'}</div>
              </div>
            </div>
            <!-- DEVICE -->
            <div class="dash-condition-item" onclick="Router.navigate('devices')" role="button" aria-label="Device: ${devOnline ? 'Online' : 'Offline'}">
              <div class="dash-condition-icon ${devOnline ? 'safe' : 'danger'}" aria-hidden="true">
                ${DashIcons.device('condition-svg')}
              </div>
              <div class="dash-condition-text">
                <div class="dash-condition-label">Device</div>
                <div class="dash-condition-value">${devOnline ? 'Online' : 'Offline'}</div>
                <div class="dash-condition-status ${devOnline ? 'safe' : 'danger'}">${devOnline ? 'Connected' : 'Check device'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. GAS HISTORY CHART -->
        <div class="dash-chart-block">
          <div class="dash-chart-header">
            <div>
              <div class="dash-chart-title">Gas Level History</div>
              <div class="dash-chart-sub">Last 2 minutes — safe range below 100 ppm</div>
            </div>
            <span class="live-badge"><span class="live-dot"></span> LIVE</span>
          </div>
          <div class="chart-container" style="height:80px">
            <canvas id="dash-chart" style="width:100%;height:80px"></canvas>
          </div>
        </div>

        <!-- 4. QUICK ACTIONS -->
        <div>
          <div class="section-title">
            <h2>${t('dashboard.quickActions')}</h2>
          </div>
          <div class="dash-actions-grid" role="toolbar" aria-label="${t('dashboard.quickActions')}">
            <button class="dash-action-btn danger" onclick="App.shutValveConfirm()" aria-label="${t('dashboard.shutValve')}">
              <div class="dash-action-icon" aria-hidden="true">${DashIcons.lock('action-svg')}</div>
              <div class="dash-action-label">${t('dashboard.shutValve')}</div>
            </button>
            <button class="dash-action-btn warning" onclick="App.testAlarm()" aria-label="${t('dashboard.testAlarm')}">
              <div class="dash-action-icon" aria-hidden="true">${DashIcons.bell('action-svg')}</div>
              <div class="dash-action-label">${t('dashboard.testAlarm')}</div>
            </button>
            <button class="dash-action-btn info" onclick="App.resetDevice()" aria-label="${t('dashboard.resetDevice')}">
              <div class="dash-action-icon" aria-hidden="true">${DashIcons.reset('action-svg')}</div>
              <div class="dash-action-label">${t('dashboard.resetDevice')}</div>
            </button>
            <button class="dash-action-btn" onclick="App.refreshSensor()" aria-label="${t('dashboard.refresh')}">
              <div class="dash-action-icon" aria-hidden="true">${DashIcons.refresh('action-svg')}</div>
              <div class="dash-action-label">${t('dashboard.refresh')}</div>
            </button>
            <button class="dash-action-btn" onclick="Router.navigate('family')" aria-label="Family">
              <div class="dash-action-icon" aria-hidden="true">${DashIcons.users('action-svg')}</div>
              <div class="dash-action-label">Family</div>
            </button>
            <button class="dash-action-btn" onclick="Router.navigate('devices')" aria-label="Devices">
              <div class="dash-action-icon" aria-hidden="true">${DashIcons.smartphone('action-svg')}</div>
              <div class="dash-action-label">Devices</div>
            </button>
          </div>
        </div>

        <!-- 5. RECENT ACTIVITY -->
        <div>
          <div class="section-title">
            <h2>Recent Activity</h2>
            <a onclick="Router.navigate('alerts')">All →</a>
          </div>
          <div class="dash-activity" role="list" aria-label="Recent safety activity">
            ${recentActivity()}
          </div>
        </div>

        <!-- Last updated (preserved id for JS update) -->
        <div id="last-updated" aria-live="polite" aria-label="Last updated">
          Last updated: ${MockData.timeAgo(s.updatedAt)}
        </div>

      </div><!-- /dashboard-body -->
    </div>`;
}, {
  onEnter() {
    // Draw initial chart — id="dash-chart" preserved
    setTimeout(() => {
      Charts.drawLineChart('dash-chart', MockData.getGasHistory(), {
        color: State.get('appStatus') === 'emergency' ? '#EF4444'
          : State.get('appStatus') === 'warning' ? '#F59E0B'
          : '#10B981',
        bgColor: State.get('appStatus') === 'emergency' ? 'rgba(239,68,68,0.1)'
          : State.get('appStatus') === 'warning' ? 'rgba(245,158,11,0.1)'
          : 'rgba(16,185,129,0.1)',
        min: 0, max: 200,
      });
    }, 100);

    // Live update interval — preserves id="last-updated", "countdown-display", "countdown-bar"
    _dashInterval = setInterval(() => {
      // Update chart
      const appStatus = State.get('appStatus');
      Charts.drawLineChart('dash-chart', MockData.getGasHistory(), {
        color: appStatus === 'emergency' ? '#EF4444'
          : appStatus === 'warning' ? '#F59E0B'
          : '#10B981',
        bgColor: appStatus === 'emergency' ? 'rgba(239,68,68,0.1)'
          : appStatus === 'warning' ? 'rgba(245,158,11,0.1)'
          : 'rgba(16,185,129,0.1)',
        min: 0, max: 200,
      });

      // Update last-updated text
      const lu = document.getElementById('last-updated');
      if (lu) lu.textContent = `Last updated: ${MockData.timeAgo(State.get('sensor').updatedAt)}`;

      // Update countdown if in warning state
      if (State.get('appStatus') === 'warning') {
        const cd = document.getElementById('countdown-display');
        const cb = document.getElementById('countdown-bar');
        const c  = State.get('countdown');
        if (cd) cd.textContent = `${c}s`;
        if (cb) cb.style.width = `${(c / 30) * 100}%`;
      }
    }, 2000);

    MockData.onTick(() => {
      if (Router.getCurrent() !== 'dashboard') return;
      // Preserve tick registration; full re-render handled by status change
    });
  },
  onLeave() {
    if (_dashInterval) { clearInterval(_dashInterval); _dashInterval = null; }
  }
});
