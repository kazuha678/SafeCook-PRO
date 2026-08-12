/* Live Monitoring Screen */

let _monInterval = null;

Router.register('monitoring', () => {
  const t = I18n.t.bind(I18n);
  const s = State.get('sensor');

  function barPct(val, max) { return Math.min(100, (val / max) * 100); }
  const gasColor = s.gasLevel < 100 ? 'var(--primary)' : s.gasLevel < 300 ? 'var(--warning)' : 'var(--danger)';

  function sensorBar({ icon, name, value, unit, pct, color = 'var(--primary)', sub = '', id = '' }) {
    return `
      <div class="sensor-bar-item" id="sb-${id}">
        <div class="sensor-bar-icon">${icon}</div>
        <div class="sensor-bar-info">
          <div class="sensor-bar-header">
            <span class="sensor-bar-name">${name}</span>
            <span class="sensor-bar-val" id="sbv-${id}" style="color:${color}">${value}${unit}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="sbp-${id}" style="width:${pct}%;background:${color};transition:width 0.8s ease"></div>
          </div>
          ${sub ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${sub}</div>` : ''}
        </div>
      </div>`;
  }

  return `
    <div class="monitoring-screen" role="main">
      <div class="screen-header">
        <button class="header-back" onclick="Router.navigate('dashboard')" aria-label="${t('common.back')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 class="t-h3" style="flex:1">${t('monitoring.title')}</h1>
        <span class="live-badge" aria-label="Live data"><span class="live-dot"></span>${t('monitoring.live')}</span>
      </div>

      <div class="monitoring-body">
        <!-- Range selector -->
        <div class="range-pills" role="tablist" aria-label="Time range">
          <button class="range-pill active" role="tab" aria-selected="true" id="range-60s" onclick="App.setMonRange('60s')">Live 60s</button>
          <button class="range-pill" role="tab" aria-selected="false" id="range-1h"  onclick="App.setMonRange('1h')">1 Hour</button>
          <button class="range-pill" role="tab" aria-selected="false" id="range-6h"  onclick="App.setMonRange('6h')">6 Hours</button>
          <button class="range-pill" role="tab" aria-selected="false" id="range-24h" onclick="App.setMonRange('24h')">24 Hours</button>
        </div>

        <!-- Gas Chart -->
        <div class="card-elevated">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-md)">
            <div>
              <div style="font-size:0.875rem;font-weight:700">${t('monitoring.gasPpm')}</div>
              <div style="font-size:2rem;font-weight:900;color:${gasColor}" id="chart-gas-val">${s.gasLevel} <span style="font-size:0.875rem;font-weight:500;color:var(--text-secondary)">PPM</span></div>
            </div>
            <div style="text-align:right">
              <div style="font-size:0.75rem;color:var(--text-secondary)">Threshold</div>
              <div style="font-size:0.875rem;font-weight:600;color:var(--warning)">300 PPM</div>
            </div>
          </div>
          <div class="chart-container" style="height:140px">
            <canvas id="mon-gas-chart" style="width:100%;height:140px"></canvas>
          </div>
        </div>

        <!-- PPM Gauge -->
        <div class="card-elevated" style="display:flex;flex-direction:column;align-items:center;padding:var(--sp-xl)">
          <div style="font-size:0.875rem;font-weight:700;margin-bottom:var(--sp-md)">Gas Level Gauge</div>
          <div class="chart-container" style="height:160px;width:200px">
            <canvas id="mon-ppm-gauge" style="width:200px;height:160px"></canvas>
          </div>
          <div style="display:flex;gap:var(--sp-lg);margin-top:var(--sp-md)">
            <div style="text-align:center"><div style="width:10px;height:10px;border-radius:50%;background:var(--primary);display:inline-block;margin-right:4px"></div><span style="font-size:0.75rem;color:var(--text-secondary)">Safe &lt;100</span></div>
            <div style="text-align:center"><div style="width:10px;height:10px;border-radius:50%;background:var(--warning);display:inline-block;margin-right:4px"></div><span style="font-size:0.75rem;color:var(--text-secondary)">Warn 100-300</span></div>
            <div style="text-align:center"><div style="width:10px;height:10px;border-radius:50%;background:var(--danger);display:inline-block;margin-right:4px"></div><span style="font-size:0.75rem;color:var(--text-secondary)">Danger &gt;300</span></div>
          </div>
        </div>

        <!-- Sensor Bars -->
        <div>
          <div class="section-title"><h2>All Sensors</h2></div>
          <div style="display:flex;flex-direction:column;gap:var(--sp-sm)" id="sensor-bars">
            ${sensorBar({ icon: '🔥', name: t('monitoring.gasPpm'),      value: s.gasLevel,         unit: ' PPM', pct: barPct(s.gasLevel, 500), color: gasColor,          id: 'gas',  sub: s.gasLevel < 100 ? '✓ Safe' : '⚠ Elevated' })}
            ${sensorBar({ icon: '🌡️', name: t('monitoring.temperature'),  value: s.temperature,      unit: '°C',  pct: barPct(s.temperature, 50), color: 'var(--info)',   id: 'temp', sub: 'Normal range: 10–40°C' })}
            ${sensorBar({ icon: '💧', name: t('monitoring.humidity'),      value: s.humidity,         unit: '%',   pct: s.humidity,                color: 'var(--info)',   id: 'hum',  sub: 'Normal range: 30–80%' })}
            ${sensorBar({ icon: '🔋', name: t('monitoring.battery'),       value: s.batteryPercent,   unit: '%',   pct: s.batteryPercent,          color: s.batteryPercent > 40 ? 'var(--primary)' : 'var(--danger)', id: 'bat' })}
            ${sensorBar({ icon: '📶', name: t('monitoring.network'),       value: Math.abs(s.wifiRSSI), unit: ' dBm', pct: barPct(Math.abs(s.wifiRSSI), 100) * -1 + 100, color: 'var(--info)', id: 'wifi', sub: s.wifiRSSI > -70 ? '✓ Strong signal' : '⚠ Weak signal' })}
          </div>
        </div>

        <!-- Valve & Vessel Status -->
        <div class="grid-2">
          <div class="card-elevated" style="display:flex;flex-direction:column;align-items:center;gap:var(--sp-md);padding:var(--sp-lg)">
            <div style="font-size:0.8125rem;font-weight:600;color:var(--text-secondary)">${t('monitoring.valveStatus')}</div>
            <div class="valve-indicator ${s.valveOpen ? 'open' : 'closed'}" id="valve-vis" style="width:64px;height:64px;font-size:1.75rem">
              ${s.valveOpen ? '🔓' : '🔒'}
            </div>
            <span class="badge ${s.valveOpen ? 'badge-safe' : 'badge-danger'}" id="valve-badge">${s.valveOpen ? t('dashboard.valveOpen') : t('dashboard.valveClosed')}</span>
          </div>
          <div class="card-elevated" style="display:flex;flex-direction:column;align-items:center;gap:var(--sp-md);padding:var(--sp-lg)">
            <div style="font-size:0.8125rem;font-weight:600;color:var(--text-secondary)">${t('monitoring.vesselStatus')}</div>
            <div style="font-size:3rem">${s.vesselPresent ? '🫕' : '❌'}</div>
            <span class="badge ${s.vesselPresent ? 'badge-safe' : 'badge-warning'}">${s.vesselPresent ? t('monitoring.present') : t('monitoring.absent')}</span>
          </div>
        </div>
      </div>
    </div>`;
}, {
  onEnter() {
    setTimeout(() => {
      Charts.drawLineChart('mon-gas-chart', MockData.getGasHistory(), {
        color: '#22C55E', bgColor: 'rgba(34,197,94,0.12)', min: 0, max: 300,
      });
      Charts.drawPPMGauge('mon-ppm-gauge', State.get('sensor').gasLevel);
    }, 100);

    _monInterval = setInterval(() => {
      if (Router.getCurrent() !== 'monitoring') return;
      const s = State.get('sensor');
      const gasColor = s.gasLevel < 100 ? '#22C55E' : s.gasLevel < 300 ? '#F97316' : '#EF4444';

      Charts.drawLineChart('mon-gas-chart', MockData.getGasHistory(), {
        color: gasColor, bgColor: gasColor + '20', min: 0, max: 300,
      });
      Charts.drawPPMGauge('mon-ppm-gauge', s.gasLevel);

      // Update bar values
      const update = (id, val, unit, pct) => {
        const v = document.getElementById(`sbv-${id}`);
        const p = document.getElementById(`sbp-${id}`);
        if (v) v.textContent = val + unit;
        if (p) p.style.width = pct + '%';
      };
      update('gas',  s.gasLevel,          ' PPM', Math.min(100, (s.gasLevel / 500) * 100));
      update('temp', s.temperature,        '°C',   Math.min(100, (s.temperature / 50) * 100));
      update('hum',  s.humidity,           '%',    s.humidity);
      update('bat',  s.batteryPercent,     '%',    s.batteryPercent);

      const chartVal = document.getElementById('chart-gas-val');
      if (chartVal) chartVal.innerHTML = `${s.gasLevel} <span style="font-size:0.875rem;font-weight:500;color:var(--text-secondary)">PPM</span>`;
    }, 2000);
  },
  onLeave() {
    if (_monInterval) { clearInterval(_monInterval); _monInterval = null; }
  }
});
