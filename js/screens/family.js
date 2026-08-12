/* ============================================================
   SafeCook Pro — Family & Multi-User Management Screen
   ============================================================ */

Router.register('family', () => {
  const t = I18n.t.bind(I18n);
  const members = MockData.familyMembers;

  return `
    <div class="device-screen" role="main">
      <div class="screen-header">
        <button class="header-back" onclick="Router.navigate('settings')" aria-label="${t('common.back')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 class="t-h3" style="flex:1">${t('family.title')}</h1>
        <button class="btn btn-primary btn-sm" onclick="App.inviteMember()" id="invite-btn">${t('family.invite')}</button>
      </div>

      <div class="device-body">
        <!-- Alert toggle -->
        <div style="display:flex;align-items:center;gap:var(--sp-md);padding:var(--sp-md);background:var(--primary-subtle);border:1px solid var(--primary);border-radius:var(--r-lg)" role="note">
          <span style="font-size:1.25rem">🚨</span>
          <div style="flex:1;font-size:0.875rem;font-weight:500">${t('family.allReceiveAlerts')}</div>
          <label class="toggle">
            <input type="checkbox" checked aria-label="Toggle alert notifications for all family members">
            <div class="toggle-track"></div>
          </label>
        </div>

        <!-- Members list -->
        <div>
          <div class="section-title"><h2>Members (${members.length})</h2></div>
          <div style="display:flex;flex-direction:column;gap:var(--sp-sm)" role="list">
            ${members.map(m => Components.memberCard(m)).join('')}
          </div>
        </div>

        <!-- Invite options -->
        <div>
          <div class="section-title"><h2>Invite Methods</h2></div>
          <div style="display:flex;flex-direction:column;gap:var(--sp-sm)">
            ${Components.settingsRow({ icon: '🔗', label: t('family.inviteLink'), onClick: "App.shareInviteLink()" })}
            ${Components.settingsRow({ icon: '📷', label: t('family.inviteQr'),   onClick: "App.showInviteQr()" })}
          </div>
        </div>
      </div>
    </div>`;
});
