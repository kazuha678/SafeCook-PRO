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
    const sevClass = alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info';
    const ackText  = alert.acknowledged ? `<span class="badge badge-safe">✓ ${I18n.t('alerts.acknowledged')}</span>` : `<button class="alert-ack-btn" onclick="App.acknowledgeAlert('${alert.id}')">✓ ${I18n.t('alerts.acknowledge')}</button>`;
    return `
      <div class="alert-item ${sevClass}" id="alert-${alert.id}" role="article" aria-label="${alert.title}">
        <div class="alert-icon-wrap">${alert.icon}</div>
        <div style="flex:1">
          <div class="alert-time">${MockData.timeAgo(alert.timestamp)}</div>
          <div class="alert-title">${alert.title}</div>
          <div class="alert-desc">${alert.desc}</div>
          ${alert.action ? `<div class="alert-desc" style="margin-top:4px;color:var(--primary);font-size:0.8125rem">💡 ${alert.action}</div>` : ''}
          <div style="margin-top:8px">${ackText}</div>
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
