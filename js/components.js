/* ============================================================
   SafeCook Pro — Shared Components
   ============================================================ */

const Components = (() => {

  function toast(msg, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => {
      t.style.animation = 'toastOut 0.3s forwards';
      setTimeout(() => t.remove(), 300);
    }, duration);
  }

  function confirm({ title, message, confirmText, cancelText, danger = false, onConfirm, onCancel }) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="bottom-sheet" style="max-width:440px">
        <div class="sheet-handle"></div>
        <div class="sheet-title">${title}</div>
        <p style="text-align:center;color:var(--text-secondary);font-size:0.9375rem;margin-bottom:var(--sp-xl)">${message}</p>
        <div style="display:flex;flex-direction:column;gap:var(--sp-sm)">
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-full" id="confirm-yes">${confirmText || I18n.t('common.confirm')}</button>
          <button class="btn btn-ghost btn-full" id="confirm-no">${cancelText || I18n.t('common.cancel')}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#confirm-yes').onclick = () => { overlay.remove(); onConfirm && onConfirm(); };
    overlay.querySelector('#confirm-no').onclick  = () => { overlay.remove(); onCancel  && onCancel();  };
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); onCancel && onCancel(); } });
  }

  function modal({ title, content, onClose }) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="bottom-sheet" style="max-width:440px;max-height:80dvh;overflow-y:auto">
        <div class="sheet-handle"></div>
        <div class="sheet-title">${title}</div>
        <div>${content}</div>
        <button class="btn btn-ghost btn-full" style="margin-top:var(--sp-md)">${I18n.t('common.close')}</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.btn-ghost').onclick = () => { overlay.remove(); onClose && onClose(); };
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); onClose && onClose(); } });
  }

  function sensorCard({ icon, label, value, unit = '', sub = '', variant = 'safe', stagger = 1, onClick }) {
    return `
      <div class="sensor-card ${variant} stagger-${stagger} slideInUp" style="animation:slideInUp 0.4s ${(stagger-1)*60}ms both" ${onClick ? `onclick="${onClick}"` : ''} role="group" aria-label="${label}: ${value}${unit}">
        <div class="sensor-card-icon">${icon}</div>
        <div class="sensor-card-value">${value}<span style="font-size:0.875rem;font-weight:500;opacity:0.7">${unit}</span></div>
        <div class="sensor-card-label">${label}</div>
        ${sub ? `<div class="sensor-card-sub">${sub}</div>` : ''}
      </div>`;
  }

  function settingsRow({ icon, label, sub = '', iconClass = '', chevron = true, toggle = null, onClick = '' }) {
    const toggleHtml = toggle !== null
      ? `<label class="toggle" aria-label="${label}">
          <input type="checkbox" ${toggle ? 'checked' : ''} onclick="${toggle}">
          <div class="toggle-track"></div>
        </label>`
      : '';
    return `
      <div class="settings-row" onclick="${onClick}" role="button" tabindex="0" aria-label="${label}">
        <div class="settings-icon ${iconClass}">${icon}</div>
        <div class="settings-row-text">
          <div class="settings-row-title">${label}</div>
          ${sub ? `<div class="settings-row-sub">${sub}</div>` : ''}
        </div>
        ${toggleHtml || (chevron ? `<div class="settings-row-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>` : '')}
      </div>`;
  }

  function alertItem(alert) {
    // SVG icon mapped from alert type
    const iconMap = {
      GAS_LEAK:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.7-.28-1.33-.74-1.8L9 9l-1.5 2.5c-.31.51-.5 1.11-.5 1.5 0 .83.34 1.58.5 1.5z"/><path d="M12 2c0 2.2.8 4 2 5.5 1.2 1.5 2 3.3 2 5.5 0 3.87-3.13 7-7 7S2 16.87 2 13c0-2.2.8-4 2-5.5.6-.77 1-1.5 1.2-2.5.6 1 1.8 1.7 2.3 3C8.5 5.5 10 4 12 2z"/></svg>`,
      NO_VESSEL:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M5 12v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/><path d="M9 12V8a3 3 0 0 1 6 0v4"/></svg>`,
      OFFLINE:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>`,
      POWER_FAIL: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="18.36" y1="6.64" x2="6.64" y2="18.36"/><path d="M20.49 9A9 9 0 0 1 12 21 9 9 0 0 1 3.51 15"/><path d="M12 3v4"/></svg>`,
      VALVE_SHUT: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
    };
    const checkSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="20 6 9 17 4 12"/></svg>`;
    const iconSvg = iconMap[alert.type] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    const sevClass = alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info';
    const sevLabel = alert.severity === 'critical' ? 'Critical' : alert.severity === 'warning' ? 'Warning' : 'Info';
    const ackSection = alert.acknowledged
      ? `<div class="alert-acked-badge">${checkSvg}<span>${I18n.t('alerts.acknowledged')}</span></div>`
      : `<button class="alert-ack-btn" onclick="App.acknowledgeAlert('${alert.id}')">${checkSvg}<span>${I18n.t('alerts.acknowledge')}</span></button>`;
    const actionHtml = alert.action
      ? `<div class="alert-action-text"><div class="alert-action-label">${I18n.t('alerts.recommended')}</div>${alert.action}</div>`
      : '';
    return `
      <div class="alert-item ${sevClass}" id="alert-${alert.id}" role="article" aria-label="${alert.title}">
        <div class="alert-icon-wrap" aria-hidden="true">${iconSvg}</div>
        <div class="alert-content">
          <div class="alert-meta">
            <span class="alert-severity-badge">${sevLabel}</span>
            <span class="alert-time">${MockData.timeAgo(alert.timestamp)}</span>
          </div>
          <div class="alert-title">${alert.title}</div>
          <div class="alert-desc">${alert.desc}</div>
          ${actionHtml}
          ${ackSection}
        </div>
      </div>`;
  }

  function quickActionBtn({ icon, label, cls = '', onClick }) {
    return `
      <button class="qa-btn ${cls}" onclick="${onClick}" aria-label="${label}" role="button">
        <div class="qa-btn-icon">${icon}</div>
        <div class="qa-btn-label">${label}</div>
      </button>`;
  }

  function memberCard(member) {
    const roleLabel = I18n.t(`family.${member.role}`);
    const roleBadge = member.role === 'owner' ? 'badge-safe' : member.role === 'member' ? 'badge-info' : 'badge-muted';
    return `
      <div class="member-card" role="listitem">
        <div class="member-avatar">${member.avatar}</div>
        <div style="flex:1">
          <div style="font-size:0.9375rem;font-weight:600">${member.name}</div>
          <span class="badge ${roleBadge}" style="margin-top:4px">${roleLabel}</span>
        </div>
        <div class="status-dot ${member.status === 'online' ? 'online' : 'offline'}"></div>
      </div>`;
  }

  function emptyState({ icon, title, sub, btnText = '', btnClick = '' }) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <div class="empty-title">${title}</div>
        <div class="empty-sub">${sub}</div>
        ${btnText ? `<button class="btn btn-primary" onclick="${btnClick}">${btnText}</button>` : ''}
      </div>`;
  }

  function skeletonCard() {
    return `<div class="skeleton skeleton-card"></div>`;
  }

  function valveIndicator(isOpen) {
    return `
      <div class="valve-indicator ${isOpen ? 'open' : 'closed pulse-danger'}" aria-label="Valve ${isOpen ? 'open' : 'closed'}">
        ${isOpen ? '🔓' : '🔒'}
      </div>`;
  }

  return { toast, confirm, modal, sensorCard, settingsRow, alertItem, quickActionBtn, memberCard, emptyState, skeletonCard, valveIndicator };
})();

window.Components = Components;
