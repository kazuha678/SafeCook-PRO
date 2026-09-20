/* ============================================================
   SafeCook Pro — Live Monitoring Screen (SVR System)
   ============================================================
   Preserved JavaScript hooks & functionality:
   - id="mon-gas-chart"        (Charts.drawLineChart canvas)
   - id="chart-gas-val"        (Live PPM text update)
   - id="sbv-gas", "sbp-gas"   (Live Gas bar update)
   - id="sbv-temp", "sbp-temp" (Live Temp bar update)
   - id="sbv-hum", "sbp-hum"   (Live Humidity bar update)
   - id="sbv-bat", "sbp-bat"   (Live Battery bar update)
   - id="sbv-wifi", "sbp-wifi" (Live Wifi bar update)
   - id="range-60s", "range-1h", "range-6h", "range-24h"
   - onclick="App.setMonRange(...)"
   - onclick="App.shutValveConfirm()"
   - onclick="App.testAlarm()"
   - onclick="App.resetDevice()"
   - onclick="App.refreshSensor()"
   - onclick="Router.navigate('dashboard')"
   - data-i18n attributes
   ============================================================ */

let _monInterval = null;

// ─── SVG Icon System (Consistent 1.75px stroke) ───────────
const MonIcons = {
  shield: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>`,

  warning: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,

  flame: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.7-.28-1.33-.74-1.8L9 9l-1.5 2.5c-.31.51-.5 1.11-.5 1.5 0 .83.34 1.58.5 1.5z"/>
    <path d="M12 2c0 2.2.8 4 2 5.5 1.2 1.5 2 3.3 2 5.5 0 3.87-3.13 7-7 7S2 16.87 2 13c0-2.2.8-4 2-5.5.6-.77 1-1.5 1.2-2.5.6 1 1.8 1.7 2.3 3C8.5 5.5 10 4 12 2z"/>
  </svg>`,

  vessel: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 12h20"/>
    <path d="M5 12v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>
    <path d="M9 12V8a3 3 0 0 1 6 0v4"/>
    <path d="M7 8h10"/>
  </svg>`,

  valve: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>`,

  thermometer: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
  </svg>`,

  droplet: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>`,

  battery: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="6" width="18" height="12" rx="2" ry="2"/>
    <line x1="23" y1="13" x2="23" y2="11"/>
  </svg>`,

  wifi: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <circle cx="12" cy="20" r="1" fill="currentColor"/>
  </svg>`,

  lock: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>`,

  bell: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>`,

  reset: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-3.6"/>
  </svg>`,

  refresh: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>`,

  back: (cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>`,
};

Router.register('monitoring', () => {
  const t  = I18n.t.bind(I18n);
  const s  = State.get('sensor');
  const d  = State.get('device');
  const st = State.get('appStatus');

  const gasLevel   = s.gasLevel || 0;
  const valveOpen  = s.valveOpen;
  const vesselHere = s.vesselPresent;
  const devOnline  = d.status === 'online';

  // ─── Status Determination ─────────────────────────────
  let stateKey, stateClass, stateTitle, stateDesc, stateSub, iconSvg;

  if (st === 'emergency' || gasLevel >= 300) {
    stateKey   = 'emergency';
    stateClass = 'state-emergency';
    stateTitle = 'GAS LEAK DETECTED';
    stateDesc  = 'Critical gas levels detected. Gas supply shut off.';
    stateSub   = 'Ventilate kitchen and stay safe.';
    iconSvg    = MonIcons.warning('mon-state-icon-svg');
  } else if (!vesselHere && valveOpen) {
    stateKey   = 'warning';
    stateClass = 'state-warning';
    stateTitle = 'VESSEL REMOVED';
    stateDesc  = 'No pan detected on active burner.';
    stateSub   = 'Valve will automatically close to prevent unattended gas flow.';
    iconSvg    = MonIcons.warning('mon-state-icon-svg');
  } else if (!valveOpen) {
    stateKey   = 'safe';
    stateClass = 'state-safe';
    stateTitle = 'VALVE CLOSED';
    stateDesc  = 'Gas supply stopped for safety.';
    stateSub   = 'No gas is currently flowing to burners.';
    iconSvg    = MonIcons.lock('mon-state-icon-svg');
  } else {
    stateKey   = 'safe';
    stateClass = 'state-safe';
    stateTitle = 'NORMAL';
    stateDesc  = 'Cooking safely and continuously monitored.';
    stateSub   = 'All sensor readings within normal operating parameters.';
    iconSvg    = MonIcons.shield('mon-state-icon-svg');
  }

  // ─── Gas reading color & label ────────────────────────
  const gasVariant = gasLevel < 100 ? 'safe' : gasLevel < 300 ? 'warning' : 'danger';
  const gasColor   = gasLevel < 100 ? 'var(--safe)' : gasLevel < 300 ? 'var(--warning)' : 'var(--danger)';
  const gasStatus  = gasLevel < 100 ? 'Normal' : gasLevel < 300 ? 'Elevated' : 'Danger';

  function barPct(val, max) {
    return Math.min(100, Math.max(0, (val / max) * 100));
  }

  // ─── Dynamic Countdown (only if warning state active) ──
  let countdownHtml = '';
  if (stateKey === 'warning') {
    const cd = State.get('countdown') || 30;
    countdownHtml = `
      <div class="mon-countdown-card">
        <div class="mon-countdown-row">
          <span class="mon-countdown-title">Automatic Valve Shutoff in</span>
          <span class="mon-countdown-val" id="mon-countdown-display">${cd}s</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill warning" id="mon-countdown-bar" style="width:${(cd / 30) * 100}%"></div>
        </div>
      </div>`;
  }

  // ─── Sensor Bar Helper ────────────────────────────────
  function renderSensorBar({ id, name, value, unit, pct, iconSvg, sub = '', color = 'var(--safe)' }) {
    return `
      <div class="sensor-bar-item" id="sb-${id}">
        <div class="sensor-bar-icon-wrap" aria-hidden="true">${iconSvg}</div>
        <div class="sensor-bar-info">
          <div class="sensor-bar-header">
            <span class="sensor-bar-name">${name}</span>
            <span class="sensor-bar-val" id="sbv-${id}" style="color:${color}">${value}${unit}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="sbp-${id}" style="width:${pct}%;background:${color};transition:width 0.6s ease"></div>
          </div>
          ${sub ? `<div class="sensor-bar-sub">${sub}</div>` : ''}
        </div>
      </div>`;
  }

  return `
    <div class="monitoring-screen" role="main">

      <!-- HEADER -->
      <div class="monitoring-header">
        <div class="mon-header-left">
          <button class="header-back" onclick="Router.navigate('dashboard')" aria-label="${t('common.back')}">
            ${MonIcons.back()}
          </button>
          <div class="mon-title-group">
            <h1 class="mon-screen-title">${t('monitoring.title')}</h1>
            <div class="mon-screen-sub">${d.name} · SVR Real-Time</div>
          </div>
        </div>
        <span class="live-badge" aria-label="Live monitoring active">
          <span class="live-dot"></span>
          ${t('monitoring.live')}
        </span>
      </div>

      <!-- BODY -->
      <div class="monitoring-body">

        <!-- 1. PRIMARY MONITORING STATE BANNER -->
        <div class="mon-state-banner ${stateClass}" role="status" aria-live="polite">
          <div class="mon-state-header">
            <div class="mon-state-icon-wrap" aria-hidden="true">
              ${iconSvg}
            </div>
            <div class="mon-state-info">
              <div class="mon-state-title">${stateTitle}</div>
              <div class="mon-state-desc">${stateDesc}</div>
              <div class="mon-state-sub">${stateSub}</div>
            </div>
          </div>
          ${countdownHtml}
        </div>

        <!-- 2. CORE STATUS TILES (GAS, VESSEL, VALVE) -->
        <div class="mon-tiles-grid">
          <!-- GAS -->
          <div class="mon-tile ${gasVariant}">
            <div class="mon-tile-top">
              <div class="mon-tile-icon" aria-hidden="true">${MonIcons.flame()}</div>
              <span class="mon-tile-badge ${gasVariant}">${gasStatus}</span>
            </div>
            <div class="mon-tile-content">
              <div class="mon-tile-label" data-i18n="dashboard.gasLevel">${t('dashboard.gasLevel')}</div>
              <div class="mon-tile-value">${gasLevel} ppm</div>
              <div class="mon-tile-sub ${gasVariant}">${gasLevel < 100 ? 'Safe Level' : 'Check Stove'}</div>
            </div>
          </div>

          <!-- VESSEL -->
          <div class="mon-tile ${vesselHere ? 'safe' : 'warning'}">
            <div class="mon-tile-top">
              <div class="mon-tile-icon" aria-hidden="true">${MonIcons.vessel()}</div>
              <span class="mon-tile-badge ${vesselHere ? 'safe' : 'warning'}">${vesselHere ? 'Detected' : 'Absent'}</span>
            </div>
            <div class="mon-tile-content">
              <div class="mon-tile-label" data-i18n="dashboard.vessel">${t('dashboard.vessel')}</div>
              <div class="mon-tile-value">${vesselHere ? 'Pan on Burner' : 'No Vessel'}</div>
              <div class="mon-tile-sub ${vesselHere ? 'safe' : 'warning'}">${vesselHere ? 'Cooking Active' : 'Burner Empty'}</div>
            </div>
          </div>

          <!-- VALVE -->
          <div class="mon-tile ${valveOpen ? 'safe' : 'danger'}">
            <div class="mon-tile-top">
              <div class="mon-tile-icon" aria-hidden="true">${MonIcons.valve()}</div>
              <span class="mon-tile-badge ${valveOpen ? 'safe' : 'danger'}">${valveOpen ? 'Open' : 'Closed'}</span>
            </div>
            <div class="mon-tile-content">
              <div class="mon-tile-label" data-i18n="dashboard.valve">${t('dashboard.valve')}</div>
              <div class="mon-tile-value">${valveOpen ? 'Gas Flowing' : 'Gas Blocked'}</div>
              <div class="mon-tile-sub ${valveOpen ? 'safe' : 'danger'}">${valveOpen ? 'Supply Active' : 'Safety Shut'}</div>
            </div>
          </div>
        </div>

        <!-- 3. SAFETY CONTROLS -->
        <div class="mon-actions-card">
          <div class="mon-actions-header">
            <span class="mon-actions-title">Safety Controls</span>
          </div>

          <!-- Primary Dangerous Action -->
          <button class="mon-primary-action-btn" onclick="App.shutValveConfirm()" aria-label="${t('dashboard.shutValve')}">
            ${MonIcons.lock()}
            <span>${t('dashboard.shutValve')}</span>
          </button>

          <!-- Secondary Quick Actions -->
          <div class="mon-secondary-actions">
            <button class="mon-sec-btn" onclick="App.refreshSensor()" aria-label="${t('dashboard.refresh')}">
              ${MonIcons.refresh()}
              <span>${t('dashboard.refresh')}</span>
            </button>
            <button class="mon-sec-btn" onclick="App.resetDevice()" aria-label="${t('dashboard.resetDevice')}">
              ${MonIcons.reset()}
              <span>${t('dashboard.resetDevice')}</span>
            </button>
            <button class="mon-sec-btn" onclick="App.testAlarm()" aria-label="${t('dashboard.testAlarm')}">
              ${MonIcons.bell()}
              <span>${t('dashboard.testAlarm')}</span>
            </button>
          </div>
        </div>

        <!-- 4. GAS LEVEL HISTORY & TREND CHART -->
        <div class="mon-chart-card">
          <div class="mon-chart-header">
            <div class="mon-chart-title-wrap">
              <div class="mon-chart-title">Gas Level Trend</div>
              <div class="mon-chart-sub">Real-time concentration history</div>
            </div>
            <!-- Range Selector (Preserved IDs & Handlers) -->
            <div class="range-pills" role="tablist" aria-label="Time range">
              <button class="range-pill active" role="tab" aria-selected="true" id="range-60s" onclick="App.setMonRange('60s')">60s</button>
              <button class="range-pill" role="tab" aria-selected="false" id="range-1h"  onclick="App.setMonRange('1h')">1h</button>
              <button class="range-pill" role="tab" aria-selected="false" id="range-6h"  onclick="App.setMonRange('6h')">6h</button>
              <button class="range-pill" role="tab" aria-selected="false" id="range-24h" onclick="App.setMonRange('24h')">24h</button>
            </div>
          </div>

          <div class="mon-gas-reading-row">
            <div>
              <span class="mon-large-gas-num" id="chart-gas-val" style="color:${gasColor}">${gasLevel}</span>
              <span class="mon-large-gas-unit">PPM</span>
            </div>
            <div class="mon-threshold-pill">
              Warning threshold: 300 PPM
            </div>
          </div>

          <div class="chart-container" style="height:140px">
            <canvas id="mon-gas-chart" style="width:100%;height:140px"></canvas>
          </div>
        </div>

        <!-- 5. DETAILED SENSORS BREAKDOWN -->
        <div>
          <div class="section-title">
            <h2>Detailed Sensor Readings</h2>
          </div>
          <div class="mon-sensors-list" id="sensor-bars">
            ${renderSensorBar({
              id: 'gas',
              name: t('monitoring.gasPpm'),
              value: gasLevel,
              unit: ' PPM',
              pct: barPct(gasLevel, 500),
              iconSvg: MonIcons.flame(),
              color: gasColor,
              sub: gasLevel < 100 ? '✓ Safe level' : '⚠ Elevated reading'
            })}
            ${renderSensorBar({
              id: 'temp',
              name: t('monitoring.temperature'),
              value: s.temperature,
              unit: '°C',
              pct: barPct(s.temperature, 50),
              iconSvg: MonIcons.thermometer(),
              color: 'var(--info)',
              sub: 'Ambient stove temperature'
            })}
            ${renderSensorBar({
              id: 'hum',
              name: t('monitoring.humidity'),
              value: s.humidity,
              unit: '%',
              pct: s.humidity,
              iconSvg: MonIcons.droplet(),
              color: 'var(--info)',
              sub: 'Kitchen relative humidity'
            })}
            ${renderSensorBar({
              id: 'bat',
              name: t('monitoring.battery'),
              value: s.batteryPercent,
              unit: '%',
              pct: s.batteryPercent,
              iconSvg: MonIcons.battery(),
              color: s.batteryPercent > 30 ? 'var(--safe)' : 'var(--danger)',
              sub: s.batteryPercent > 30 ? 'Backup battery healthy' : 'Low battery warning'
            })}
            ${renderSensorBar({
              id: 'wifi',
              name: t('monitoring.network'),
              value: Math.abs(s.wifiRSSI),
              unit: ' dBm',
              pct: barPct(Math.abs(s.wifiRSSI), 100) * -1 + 100,
              iconSvg: MonIcons.wifi(),
              color: 'var(--info)',
              sub: s.wifiRSSI > -70 ? '✓ Signal strong' : '⚠ Signal weak'
            })}
          </div>
        </div>

        <!-- 6. DEVICE CONNECTION FOOTER -->
        <div class="mon-device-footer">
          <div class="mon-device-status-left">
            <span class="mon-dev-dot ${devOnline ? 'online' : 'offline'}"></span>
            <span class="mon-dev-name">${d.name} (${devOnline ? 'Online' : 'Offline'})</span>
          </div>
          <span class="mon-dev-updated" id="mon-last-updated">
            Updated: ${MockData.timeAgo(s.updatedAt)}
          </span>
        </div>

      </div><!-- /monitoring-body -->
    </div>`;
}, {
  onEnter() {
    // Initial Chart Drawing
    setTimeout(() => {
      const s = State.get('sensor');
      const gasColor = s.gasLevel < 100 ? '#10B981' : s.gasLevel < 300 ? '#F59E0B' : '#EF4444';
      Charts.drawLineChart('mon-gas-chart', MockData.getGasHistory(), {
        color: gasColor,
        bgColor: gasColor === '#10B981' ? 'rgba(16,185,129,0.12)' : gasColor === '#F59E0B' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
        min: 0,
        max: 300,
      });
    }, 100);

    // Live update interval
    _monInterval = setInterval(() => {
      if (Router.getCurrent() !== 'monitoring') return;
      const s = State.get('sensor');
      const gasColor = s.gasLevel < 100 ? '#10B981' : s.gasLevel < 300 ? '#F59E0B' : '#EF4444';

      // Update gas chart
      Charts.drawLineChart('mon-gas-chart', MockData.getGasHistory(), {
        color: gasColor,
        bgColor: gasColor === '#10B981' ? 'rgba(16,185,129,0.12)' : gasColor === '#F59E0B' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
        min: 0,
        max: 300,
      });

      // Update large chart numerical reading
      const chartVal = document.getElementById('chart-gas-val');
      if (chartVal) {
        chartVal.textContent = s.gasLevel;
        chartVal.style.color = gasColor;
      }

      // Update sensor bar values & widths
      const updateBar = (id, val, unit, pct) => {
        const v = document.getElementById(`sbv-${id}`);
        const p = document.getElementById(`sbp-${id}`);
        if (v) v.textContent = val + unit;
        if (p) p.style.width = pct + '%';
      };
      updateBar('gas',  s.gasLevel,          ' PPM', Math.min(100, (s.gasLevel / 500) * 100));
      updateBar('temp', s.temperature,        '°C',   Math.min(100, (s.temperature / 50) * 100));
      updateBar('hum',  s.humidity,           '%',    s.humidity);
      updateBar('bat',  s.batteryPercent,     '%',    s.batteryPercent);

      // Update countdown if warning active
      if (State.get('appStatus') === 'warning') {
        const cd = document.getElementById('mon-countdown-display');
        const cb = document.getElementById('mon-countdown-bar');
        const c  = State.get('countdown');
        if (cd) cd.textContent = `${c}s`;
        if (cb) cb.style.width = `${(c / 30) * 100}%`;
      }

      // Update last updated footer text
      const lu = document.getElementById('mon-last-updated');
      if (lu) lu.textContent = `Updated: ${MockData.timeAgo(s.updatedAt)}`;
    }, 2000);

    MockData.onTick(() => {
      if (Router.getCurrent() !== 'monitoring') return;
      // Re-render handled by status changes if needed
    });
  },
  onLeave() {
    if (_monInterval) {
      clearInterval(_monInterval);
      _monInterval = null;
    }
  }
});
