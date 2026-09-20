/* ============================================================
   SafeCook Pro — Alerts Screen
   ============================================================
   Preserved JavaScript hooks:
   - id="alerts-list"                   (App.filterAlerts DOM target)
   - id="fp-all", "fp-unread",          (App.filterAlerts pill IDs)
     "fp-critical", "fp-resolved"
   - id="alert-${id}"                   (App.acknowledgeAlert DOM target)
   - class="alert-item"                 (App.filterAlerts rebuild)
   - class="filter-pill"                (App.filterAlerts style toggle)
   - class="alert-dismissed"            (App.acknowledgeAlert animation)
   - onclick="App.filterAlerts(...)"
   - onclick="App.acknowledgeAlert(...)"
   ============================================================ */

// ─── SVG Icons for Alerts ─────────────────────────────────
const AlertIcons = {
  shieldCheck: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>`,

  warning: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,

  flame: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.7-.28-1.33-.74-1.8L9 9l-1.5 2.5c-.31.51-.5 1.11-.5 1.5 0 .83.34 1.58.5 1.5z"/>
    <path d="M12 2c0 2.2.8 4 2 5.5 1.2 1.5 2 3.3 2 5.5 0 3.87-3.13 7-7 7S2 16.87 2 13c0-2.2.8-4 2-5.5.6-.77 1-1.5 1.2-2.5.6 1 1.8 1.7 2.3 3C8.5 5.5 10 4 12 2z"/>
  </svg>`,

  vessel: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 12h20"/>
    <path d="M5 12v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>
    <path d="M9 12V8a3 3 0 0 1 6 0v4"/>
  </svg>`,

  wifi: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
    <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <circle cx="12" cy="20" r="1" fill="currentColor"/>
  </svg>`,

  wifiOk: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <circle cx="12" cy="20" r="1" fill="currentColor"/>
  </svg>`,

  power: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18.36" y1="6.64" x2="6.64" y2="18.36"/>
    <path d="M20.49 9A9 9 0 0 1 12 21 9 9 0 0 1 3.51 15"/>
    <path d="M12 3v4"/>
  </svg>`,

  info: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>`,

  check: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`,

  bell: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>`,
};

// ─── Map alert type → SVG icon ─────────────────────────────
function alertIcon(alert) {
  switch (alert.type) {
    case 'GAS_LEAK':    return AlertIcons.flame();
    case 'NO_VESSEL':   return AlertIcons.vessel();
    case 'OFFLINE':     return AlertIcons.wifi();
    case 'POWER_FAIL':  return AlertIcons.power();
    case 'VALVE_SHUT':  return AlertIcons.shieldCheck();
    default:            return AlertIcons.info();
  }
}

// ─── Severity label ────────────────────────────────────────
function severityLabel(severity) {
  if (severity === 'critical') return 'Critical';
  if (severity === 'warning')  return 'Warning';
  return 'Info';
}

// ─── Render a single alert item ────────────────────────────
// NOTE: Preserves all existing class names and IDs used by app.js:
//   id="alert-${id}", class="alert-item", class="alert-dismissed",
//   class="alert-ack-btn", onclick="App.acknowledgeAlert(...)"
function renderAlertItem(alert) {
  const sevClass = alert.severity === 'critical' ? 'critical'
                 : alert.severity === 'warning'  ? 'warning'
                 : 'info';

  const ackSection = alert.acknowledged
    ? `<div class="alert-acked-badge" aria-label="${I18n.t('alerts.acknowledged')}">
         ${AlertIcons.check()}
         <span>${I18n.t('alerts.acknowledged')}</span>
       </div>`
    : `<button class="alert-ack-btn" onclick="App.acknowledgeAlert('${alert.id}')" aria-label="${I18n.t('alerts.acknowledge')}">
         ${AlertIcons.check()}
         <span>${I18n.t('alerts.acknowledge')}</span>
       </button>`;

  const actionSection = alert.action
    ? `<div class="alert-action-text">
         <div class="alert-action-label">${I18n.t('alerts.recommended')}</div>
         ${alert.action}
       </div>`
    : '';

  return `
    <div class="alert-item ${sevClass}" id="alert-${alert.id}" role="article" aria-label="${alert.title}">
      <div class="alert-icon-wrap" aria-hidden="true">
        ${alertIcon(alert)}
      </div>
      <div class="alert-content">
        <div class="alert-meta">
          <span class="alert-severity-badge">${severityLabel(alert.severity)}</span>
          <span class="alert-time">${MockData.timeAgo(alert.timestamp)}</span>
        </div>
        <div class="alert-title">${alert.title}</div>
        <div class="alert-desc">${alert.desc}</div>
        ${actionSection}
        ${ackSection}
      </div>
    </div>`;
}

// ─── Empty state ───────────────────────────────────────────
function renderAlertsEmpty() {
  return `
    <div class="alerts-empty">
      <div class="alerts-empty-icon" aria-hidden="true">${AlertIcons.shieldCheck()}</div>
      <div class="alerts-empty-title">${I18n.t('alerts.noAlerts')}</div>
      <div class="alerts-empty-sub">${I18n.t('alerts.noAlertsSub')}</div>
    </div>`;
}

// ─── Status banner ─────────────────────────────────────────
function renderStatusBanner(alerts) {
  const unread   = alerts.filter(a => !a.acknowledged);
  const critical = unread.filter(a => a.severity === 'critical');
  const warning  = unread.filter(a => a.severity === 'warning');

  let cls, iconHtml, headline, desc;

  if (critical.length > 0) {
    cls      = 'has-critical';
    iconHtml = AlertIcons.flame();
    headline = `${critical.length} Critical Alert${critical.length > 1 ? 's' : ''}`;
    desc     = 'Immediate attention required. Review the alert below.';
  } else if (warning.length > 0) {
    cls      = 'has-warning';
    iconHtml = AlertIcons.warning();
    headline = `${warning.length} Warning Alert${warning.length > 1 ? 's' : ''}`;
    desc     = 'A safety condition needs your attention.';
  } else if (unread.length > 0) {
    cls      = 'has-unread';
    iconHtml = AlertIcons.bell();
    headline = `${unread.length} Unread Alert${unread.length > 1 ? 's' : ''}`;
    desc     = 'Review and acknowledge the items below.';
  } else {
    cls      = 'no-alerts';
    iconHtml = AlertIcons.shieldCheck();
    headline = 'Kitchen Safe';
    desc     = I18n.t('alerts.noAlertsSub');
  }

  return `
    <div class="alerts-status-banner ${cls}" role="status" aria-live="polite">
      <div class="alerts-status-icon" aria-hidden="true">${iconHtml}</div>
      <div class="alerts-status-content">
        <div class="alerts-status-headline">${headline}</div>
        <div class="alerts-status-desc">${desc}</div>
      </div>
    </div>`;
}

// ─── Screen Registration ───────────────────────────────────
Router.register('alerts', () => {
  const t      = I18n.t.bind(I18n);
  const alerts = MockData.mockAlerts;
  const unread = alerts.filter(a => !a.acknowledged).length;

  function renderList(list) {
    if (list.length === 0) return renderAlertsEmpty();
    return list.map(a => renderAlertItem(a)).join('');
  }

  return `
    <div class="alerts-screen" role="main">

      <!-- HEADER -->
      <div class="alerts-header">
        <h1 class="alerts-header-title">${t('alerts.title')}</h1>
        ${unread > 0
          ? `<span class="badge badge-danger" id="alerts-header-badge" aria-label="${unread} unread alerts">${unread} new</span>`
          : `<span class="badge badge-safe" aria-label="All alerts acknowledged">All read</span>`
        }
      </div>

      <!-- BODY -->
      <div class="alerts-body">

        <!-- Status summary banner -->
        ${renderStatusBanner(alerts)}

        <!-- Filter pills -->
        <!-- IDs preserved: fp-all, fp-unread, fp-critical, fp-resolved -->
        <!-- class="filter-pill" used by App.filterAlerts() -->
        <div class="filter-pills" role="tablist" aria-label="${t('alerts.title')} filters">
          ${['all', 'unread', 'critical', 'resolved'].map(f => `
            <button
              class="filter-pill ${f === 'all' ? 'active' : ''}"
              id="fp-${f}"
              onclick="App.filterAlerts('${f}')"
              role="tab"
              aria-selected="${f === 'all'}"
            >
              ${t(`alerts.${f}`)}
              ${f === 'unread' && unread > 0
                ? `<span class="badge badge-danger" aria-label="${unread} unread">${unread}</span>`
                : ''
              }
            </button>`).join('')}
        </div>

        <!-- Alert list -->
        <!-- id="alerts-list" used by App.filterAlerts() to replace innerHTML -->
        <div id="alerts-list" role="list" aria-label="Alert history">
          ${renderList(alerts)}
        </div>

      </div>
    </div>`;
});
