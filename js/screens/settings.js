/* Settings Screen */

Router.register('settings', () => {
  const t   = I18n.t.bind(I18n);
  const u   = State.get('user');
  const th  = State.get('theme');
  const fs  = State.get('fontsize');
  const hc  = State.get('contrast');
  const vo  = State.get('voiceEnabled');
  const ha  = State.get('hapticEnabled');
  const lang = I18n.getAvailableLangs().find(l => l.code === I18n.getLang());

  return `
    <div class="settings-screen" role="main">
      <div class="screen-header">
        <h1 class="t-h3">${t('settings.title')}</h1>
      </div>

      <div class="settings-body">
        <!-- Profile Card -->
        <div class="settings-profile-card" role="banner">
          <div class="profile-avatar-lg" aria-hidden="true">${u.avatar}</div>
          <div style="flex:1">
            <div style="font-size:1.125rem;font-weight:700">${u.name}</div>
            <div style="font-size:0.875rem;color:var(--text-secondary)">${u.email}</div>
            <span class="badge badge-safe" style="margin-top:6px">👑 ${I18n.t(`family.${u.role}`)}</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="App.editProfile()" aria-label="Edit profile">Edit</button>
        </div>

        <!-- Appearance -->
        <div class="settings-section-label">${'Appearance'}</div>
        <div class="settings-group">
          ${Components.settingsRow({
            icon: '🌙', label: t('settings.darkMode'),
            sub: th === 'dark' ? 'Currently dark' : 'Currently light',
            toggle: `App.toggleTheme(this)`,
            chevron: false,
          })}
        </div>

        <!-- Language -->
        <div class="settings-section-label">${t('settings.language')}</div>
        <div class="settings-group">
          ${Components.settingsRow({
            icon: '🌐', label: t('settings.language'),
            sub: `${lang?.flag || ''} ${lang?.nativeName || ''}`,
            onClick: "App.showLanguagePicker()",
          })}
        </div>

        <!-- Accessibility -->
        <div class="settings-section-label">${t('settings.accessibility')}</div>
        <div class="settings-group">
          <div class="settings-row" style="flex-direction:column;align-items:flex-start;gap:var(--sp-md)">
            <div style="font-size:0.9375rem;font-weight:500">${t('settings.fontSize')}</div>
            <div style="display:flex;gap:var(--sp-sm);width:100%">
              ${['normal','large','xlarge'].map(size => `
                <button onclick="App.setFontSize('${size}')" style="flex:1;padding:8px;border-radius:var(--r-md);border:1.5px solid ${fs === size ? 'var(--primary)' : 'var(--border)'};background:${fs === size ? 'var(--primary-subtle)' : 'var(--bg-elevated)'};color:${fs === size ? 'var(--primary)' : 'var(--text-secondary)'};font-size:${size === 'normal' ? '13px' : size === 'large' ? '15px' : '18px'};font-weight:600;cursor:pointer;font-family:var(--font)" aria-pressed="${fs === size}">${t(`settings.font${size.charAt(0).toUpperCase()+size.slice(1)}`)}</button>`).join('')}
            </div>
          </div>
          ${Components.settingsRow({
            icon: '🔆', label: t('settings.highContrast'),
            toggle: `App.toggleContrast(this)`, chevron: false,
          })}
          ${Components.settingsRow({
            icon: '🔊', label: t('settings.voiceAnnounce'),
            sub: 'Voice alerts in your language',
            toggle: `App.toggleVoice(this)`, chevron: false,
          })}
          ${Components.settingsRow({
            icon: '📳', label: t('settings.haptic'),
            toggle: `App.toggleHaptic(this)`, chevron: false,
          })}
        </div>

        <!-- Safety -->
        <div class="settings-section-label">Safety</div>
        <div class="settings-group">
          ${Components.settingsRow({ icon: '🚨', iconClass: 'danger', label: t('settings.emergencyContacts'), sub: '3 contacts', onClick: "App.showEmergencyContacts()" })}
          ${Components.settingsRow({ icon: '🔔', label: t('settings.notifications'), sub: 'All alerts enabled', onClick: "App.showNotifSettings()" })}
        </div>

        <!-- Device & Family -->
        <div class="settings-section-label">Device & Family</div>
        <div class="settings-group">
          ${Components.settingsRow({ icon: '📱', label: t('settings.devices'), sub: '1 device connected', onClick: "Router.navigate('devices')" })}
          ${Components.settingsRow({ icon: '👨‍👩‍👧', label: t('settings.family'), sub: '3 members', onClick: "Router.navigate('family')" })}
        </div>

        <!-- Account -->
        <div class="settings-section-label">Account</div>
        <div class="settings-group">
          ${Components.settingsRow({ icon: '🔒', label: t('settings.privacy'), onClick: "App.showPrivacy()" })}
          ${Components.settingsRow({ icon: 'ℹ️', label: t('settings.about'), sub: t('settings.version'), onClick: "App.showAbout()" })}
          ${Components.settingsRow({ icon: '🚪', iconClass: 'danger', label: t('settings.logout'), onClick: "App.logout()" })}
        </div>
      </div>
    </div>`;
});
