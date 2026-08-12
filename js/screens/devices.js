/* Device Management Screen */

Router.register('devices', () => {
  const t = I18n.t.bind(I18n);
  const d = State.get('device');

  return `
    <div class="device-screen" role="main">
      <div class="screen-header">
        <button class="header-back" onclick="Router.navigate('settings')" aria-label="${t('common.back')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 class="t-h3" style="flex:1">${t('devices.title')}</h1>
        <button class="btn btn-primary btn-sm" onclick="App.pairDevice()" id="pair-btn">${t('devices.pair')}</button>
      </div>

      <div class="device-body">
        <!-- Device Card -->
        <div class="device-card-full">
          <div style="display:flex;align-items:center;gap:var(--sp-md);margin-bottom:var(--sp-md)">
            <div style="width:56px;height:56px;border-radius:var(--r-lg);background:var(--primary-subtle);display:flex;align-items:center;justify-content:center;font-size:1.75rem" aria-hidden="true">🛡️</div>
            <div style="flex:1">
              <div style="font-size:1rem;font-weight:700">${d.name}</div>
              <div style="font-size:0.8125rem;color:var(--text-secondary)">${d.id}</div>
              <span class="badge badge-safe" style="margin-top:4px">● ${t('devices.online')}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="device-meta-row">
            <span class="device-meta-key">MAC Address</span>
            <span class="device-meta-val" style="font-family:monospace">${d.mac}</span>
          </div>
          <div class="device-meta-row">
            <span class="device-meta-key">Firmware</span>
            <span class="device-meta-val">${d.firmware} <span class="badge badge-safe" style="font-size:0.625rem">${t('devices.firmwareUp')}</span></span>
          </div>
          <div class="device-meta-row">
            <span class="device-meta-key">Last Seen</span>
            <span class="device-meta-val">${MockData.timeAgo(d.lastSeen)}</span>
          </div>
          <div class="device-meta-row">
            <span class="device-meta-key">Signal</span>
            <span class="device-meta-val">${State.get('sensor').wifiRSSI} dBm</span>
          </div>
          <div class="device-meta-row">
            <span class="device-meta-key">Battery</span>
            <span class="device-meta-val">${State.get('sensor').batteryPercent}%</span>
          </div>
        </div>

        <!-- Actions -->
        <div style="display:flex;flex-direction:column;gap:var(--sp-sm)">
          ${Components.settingsRow({ icon: '✏️', label: t('devices.rename'),      onClick: "App.renameDevice()" })}
          ${Components.settingsRow({ icon: '📡', label: t('devices.firmware'),     sub: 'v2.1.4 — Up to date', onClick: "App.checkFirmware()" })}
          ${Components.settingsRow({ icon: '📶', label: t('devices.wifiSetup'),    onClick: "App.wifiSetup()" })}
          ${Components.settingsRow({ icon: '🔍', label: t('devices.diagnostics'),  onClick: "App.runDiagnostics()" })}
          ${Components.settingsRow({ icon: '🔄', label: t('devices.restart'),      onClick: "App.restartDevice()" })}
          ${Components.settingsRow({ icon: '⚠️', iconClass: 'danger', label: t('devices.factoryReset'), onClick: "App.factoryReset()" })}
        </div>

        <!-- Diagnostics Result Area -->
        <div id="diag-result" class="hidden card-elevated" style="padding:var(--sp-md)">
          <div style="font-size:0.875rem;font-weight:700;margin-bottom:var(--sp-md)">Diagnostics Results</div>
          <div style="display:flex;flex-direction:column;gap:8px" id="diag-items"></div>
        </div>

        <!-- Add Device -->
        <button class="btn btn-ghost btn-full" onclick="App.pairDevice()" id="add-device-btn" style="border-style:dashed">
          + ${t('devices.pair')}
        </button>
      </div>
    </div>`;
});

