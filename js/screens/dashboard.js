/* Dashboard Screen */

let _dashInterval = null;

Router.register('dashboard', () => {
  const t  = I18n.t.bind(I18n);
  const s  = State.get('sensor');
  const u  = State.get('user');
  const d  = State.get('device');
  const st = State.get('appStatus');

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  function statusBanner() {
    if (st === 'emergency') {
      return `<div class="status-banner status-banner-danger pulse-danger" role="alert" aria-live="assertive" onclick="Router.navigate('emergency')" style="cursor:pointer">
        <div class="status-banner-icon">⚠️</div>
        <div>
          <div class="status-banner-title" data-i18n="dashboard.emergency">${t('dashboard.emergency')}</div>
          <div class="status-banner-sub" data-i18n="dashboard.emergencySub">${t('dashboard.emergencySub')}</div>
        </div>
      </div>`;
    }
    if (st === 'warning') {
      const cd = State.get('countdown');
      return `<div class="status-banner status-banner-warning pulse-warning" role="alert" aria-live="polite">
        <div class="status-banner-icon">🟠</div>
        <div style="flex:1">
          <div class="status-banner-title">${t('dashboard.warning')}</div>
          <div class="status-banner-sub">${t('dashboard.warningSub', { sec: cd })}</div>
          <div style="margin-top:var(--sp-sm)">
            <svg width="100%" height="6" style="border-radius:var(--r-full);overflow:hidden" viewBox="0 0 240 6">
              <rect width="240" height="6" rx="3" fill="rgba(255,255,255,0.08)"/>
              <rect width="${(cd / 30) * 240}" height="6" rx="3" fill="${cd <= 10 ? 'var(--danger)' : 'var(--warning)'}" id="countdown-bar"/>
            </svg>
          </div>
        </div>
        <div style="font-size:2rem;font-weight:900;color:var(--warning);min-width:44px;text-align:center" id="countdown-display">${cd}</div>
      </div>`;
    }
    return `<div class="status-banner status-banner-safe pulse-safe" role="status" aria-live="polite">
      <div class="status-banner-icon">✅</div>
      <div>
        <div class="status-banner-title" data-i18n="dashboard.safe">${t('dashboard.safe')}</div>
        <div class="status-banner-sub" data-i18n="dashboard.safeSub">${t('dashboard.safeSub')}</div>
      </div>
    </div>`;
  }

  const gasVariant = s.gasLevel < 100 ? 'safe' : s.gasLevel < 300 ? 'warn' : 'danger';
  const batVariant = s.batteryPercent > 40 ? 'safe' : s.batteryPercent > 15 ? 'warn' : 'danger';

  return `
    <div class="dashboard-screen" role="main" id="dashboard-main">
      <div class="dashboard-header">
        <div>
          <div class="dashboard-greeting">${greet}, ${u.name.split(' ')[0]} 👋</div>
          <div class="dashboard-name" data-i18n="dashboard.title">${t('dashboard.title')}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-full)">
            <div class="status-dot ${d.status === 'online' ? 'online' : 'offline'}"></div>
            <span style="font-size:0.75rem;font-weight:600">${d.name}</span>
          </div>
          <button class="notif-btn" onclick="Router.navigate('alerts')" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <div class="notif-dot"></div>
          </button>
        </div>
      </div>

      <div class="dashboard-body">
        ${statusBanner()}

        <!-- Quick Actions -->
        <div>
          <div class="section-title">
            <h2>${t('dashboard.quickActions')}</h2>
          </div>
          <div class="quick-actions" role="toolbar" aria-label="${t('dashboard.quickActions')}">
            ${Components.quickActionBtn({ icon: '🔒', label: t('dashboard.shutValve'),  cls: 'qa-danger',  onClick: "App.shutValveConfirm()" })}
            ${Components.quickActionBtn({ icon: '🔔', label: t('dashboard.testAlarm'),  cls: 'qa-warning', onClick: "App.testAlarm()" })}
            ${Components.quickActionBtn({ icon: '🔄', label: t('dashboard.resetDevice'),cls: 'qa-info',    onClick: "App.resetDevice()" })}
            ${Components.quickActionBtn({ icon: '↻',  label: t('dashboard.refresh'),    cls: 'qa-primary', onClick: "App.refreshSensor()" })}
            ${Components.quickActionBtn({ icon: '👨‍👩‍👧', label: 'Family', cls: '', onClick: "Router.navigate('family')" })}
            ${Components.quickActionBtn({ icon: '📱', label: 'Devices', cls: '', onClick: "Router.navigate('devices')" })}
          </div>
        </div>

        <!-- Sensor Grid -->
        <div>
          <div class="section-title">
            <h2>Sensor Readings</h2>
            <a onclick="Router.navigate('monitoring')">Live →</a>
          </div>
          <div class="grid-2">
            ${Components.sensorCard({ icon: '🔥', label: t('dashboard.gasLevel'), value: s.gasLevel || 0, unit: ' PPM', sub: gasVariant === 'safe' ? 'Safe level' : gasVariant === 'warn' ? 'Elevated' : 'DANGER', variant: gasVariant, stagger: 1 })}
            ${Components.sensorCard({ icon: s.valveOpen ? '🔓' : '🔒', label: t('dashboard.valve'), value: s.valveOpen ? t('dashboard.valveOpen') : t('dashboard.valveClosed'), unit: '', sub: s.valveOpen ? 'Gas flowing' : 'Gas blocked', variant: s.valveOpen ? 'safe' : 'danger', stagger: 2 })}
            ${Components.sensorCard({ icon: s.vesselPresent ? '🫕' : '⚠️', label: t('dashboard.vessel'), value: s.vesselPresent ? t('dashboard.vesselPresent') : t('dashboard.vesselAbsent'), unit: '', sub: s.vesselPresent ? 'On burner' : 'Removed', variant: s.vesselPresent ? 'safe' : 'warn', stagger: 3 })}
            ${Components.sensorCard({ icon: '📶', label: t('dashboard.wifi'), value: s.wifiRSSI || 0, unit: ' dBm', sub: (s.wifiRSSI || 0) > -70 ? 'Strong' : 'Weak', variant: (s.wifiRSSI || 0) > -70 ? 'safe' : 'warn', stagger: 4 })}
            ${Components.sensorCard({ icon: '🔋', label: t('dashboard.battery'), value: s.batteryPercent || 0, unit: '%', sub: (s.batteryPercent || 0) > 40 ? 'Good' : 'Low', variant: batVariant, stagger: 5 })}
            ${Components.sensorCard({ icon: '🌡️', label: t('dashboard.temperature'), value: s.temperature || 28, unit: '°C', sub: 'Device temp', variant: 'info', stagger: 6 })}
            ${Components.sensorCard({ icon: '💧', label: t('dashboard.humidity'), value: s.humidity || 60, unit: '%', sub: 'Relative', variant: 'info', stagger: 7 })}
            ${Components.sensorCard({ icon: '❤️', label: t('dashboard.sensorHealth'), value: s.sensorHealth === 'good' ? 'Good' : 'Check', unit: '', sub: 'All sensors OK', variant: s.sensorHealth === 'good' ? 'safe' : 'warn', stagger: 8 })}
          </div>
        </div>

        <!-- Mini Gas Chart -->
        <div class="card-elevated" style="padding:var(--sp-md)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-md)">
            <span style="font-size:0.875rem;font-weight:600">Gas PPM History</span>
            <span class="live-badge"><span class="live-dot"></span> LIVE</span>
          </div>
          <div class="chart-container" style="height:100px">
            <canvas id="dash-chart" style="width:100%;height:100px"></canvas>
          </div>
        </div>

        <!-- Last updated -->
        <div style="text-align:center;font-size:0.75rem;color:var(--text-muted);padding-bottom:var(--sp-md)" id="last-updated">
          🕐 Last updated: ${MockData.timeAgo(s.updatedAt)}
        </div>
      </div>
    </div>`;
}, {
  onEnter() {
    // Draw initial chart
    setTimeout(() => {
      Charts.drawLineChart('dash-chart', MockData.getGasHistory(), {
        color: '#22C55E', bgColor: 'rgba(34,197,94,0.12)', min: 0, max: 200,
      });
    }, 100);

    // Simulate emergency trigger demo (every 60s cycle)
    _dashInterval = setInterval(() => {
      Charts.drawLineChart('dash-chart', MockData.getGasHistory(), {
        color: State.get('appStatus') === 'emergency' ? '#EF4444' : '#22C55E',
        bgColor: State.get('appStatus') === 'emergency' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
        min: 0, max: 200,
      });
      // Update last updated
      const lu = document.getElementById('last-updated');
      if (lu) lu.textContent = `🕐 Last updated: ${MockData.timeAgo(State.get('sensor').updatedAt)}`;
      // Update countdown display if in warning
      if (State.get('appStatus') === 'warning') {
        const cd = document.getElementById('countdown-display');
        const cb = document.getElementById('countdown-bar');
        const c = State.get('countdown');
        if (cd) cd.textContent = c;
        if (cb) cb.style.width = `${(c / 30) * 240}px`;
      }
    }, 2000);

    MockData.onTick(() => {
      if (Router.getCurrent() !== 'dashboard') return;
      // Subtle number update on sensor cards
      const s = State.get('sensor');
      const gasEl = document.querySelector('[data-i18n="dashboard.gasLevel"]');
      // Full re-render would be expensive; just update specific values
    });
  },
  onLeave() {
    if (_dashInterval) { clearInterval(_dashInterval); _dashInterval = null; }
  }
});
