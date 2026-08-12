/* Alerts Screen */

Router.register('alerts', () => {
  const t = I18n.t.bind(I18n);
  const alerts = MockData.mockAlerts;
  let filter = 'all';

  function filteredAlerts() {
    if (filter === 'unread')   return alerts.filter(a => !a.acknowledged);
    if (filter === 'critical') return alerts.filter(a => a.severity === 'critical');
    if (filter === 'resolved') return alerts.filter(a => a.acknowledged);
    return alerts;
  }

  function renderAlerts() {
    const list = filteredAlerts();
    if (list.length === 0) {
      return Components.emptyState({
        icon: '✅',
        title: t('alerts.noAlerts'),
        sub: t('alerts.noAlertsSub'),
      });
    }
    return list.map(a => Components.alertItem(a)).join('');
  }

  return `
    <div class="alerts-screen" role="main">
      <div class="screen-header">
        <h1 class="t-h3">${t('alerts.title')}</h1>
        <span class="badge badge-danger">${alerts.filter(a => !a.acknowledged).length} new</span>
      </div>

      <div class="alerts-body">
        <!-- Filter pills -->
        <div class="filter-pills" role="tablist" aria-label="Filter alerts">
          ${['all','unread','critical','resolved'].map(f => `
            <button class="filter-pill ${f === 'all' ? 'active' : ''}" id="fp-${f}" onclick="App.filterAlerts('${f}')" role="tab" aria-selected="${f === 'all'}">
              ${t(`alerts.${f}`)}
              ${f === 'unread' ? `<span class="badge badge-danger" style="margin-left:4px">${alerts.filter(a=>!a.acknowledged).length}</span>` : ''}
            </button>`).join('')}
        </div>

        <!-- Alert list -->
        <div id="alerts-list" role="list" aria-label="Alert history">
          ${renderAlerts()}
        </div>
      </div>
    </div>`;
});
