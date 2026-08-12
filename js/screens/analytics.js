/* Analytics Screen */

Router.register('analytics', () => {
  const t = I18n.t.bind(I18n);
  const data = MockData.analyticsData;
  const days  = t('analytics.days');

  return `
    <div class="analytics-screen" role="main">
      <div class="screen-header">
        <h1 class="t-h3">${t('analytics.title')}</h1>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="App.exportData('pdf')" aria-label="${t('analytics.exportPdf')}">PDF</button>
          <button class="btn btn-ghost btn-sm" onclick="App.exportData('csv')" aria-label="${t('analytics.exportCsv')}">CSV</button>
        </div>
      </div>

      <div class="analytics-body">
        <!-- Safety Score -->
        <div class="safety-score-card" role="region" aria-label="${t('analytics.safetyScore')}">
          <div class="score-ring">
            <canvas id="safety-score-gauge" style="width:110px;height:110px"></canvas>
          </div>
          <div style="flex:1">
            <div style="font-size:0.8125rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.06em">${t('analytics.safetyScore')}</div>
            <div style="font-size:2.5rem;font-weight:900;color:var(--primary);line-height:1">${data.safetyScore}</div>
            <span class="badge badge-safe" style="margin-top:6px">⭐ ${t('analytics.excellent')}</span>
            <div style="font-size:0.8125rem;color:var(--text-secondary);margin-top:8px">Your kitchen safety habits are excellent this month.</div>
          </div>
        </div>

        <!-- Monthly Report -->
        <div class="card-elevated" role="region" aria-label="${t('analytics.monthlyReport')}">
          <div style="font-size:0.9375rem;font-weight:700;margin-bottom:var(--sp-md)">${t('analytics.monthlyReport')}</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-md)">
            <div style="text-align:center">
              <div style="font-size:1.25rem;font-weight:800;color:var(--primary)">${data.monthlyReport.totalCookTime}</div>
              <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px">${t('analytics.totalCookTime')}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:1.25rem;font-weight:800;color:${data.monthlyReport.leakIncidents > 0 ? 'var(--danger)' : 'var(--primary)'}">${data.monthlyReport.leakIncidents}</div>
              <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px">${t('analytics.leakIncidents')}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:1.25rem;font-weight:800;color:var(--info)">${data.monthlyReport.avgSafetyScore}</div>
              <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px">${t('analytics.avgSafetyScore')}</div>
            </div>
          </div>
        </div>

        <!-- Daily Cooking Time Bar Chart -->
        <div class="card-elevated" role="region" aria-label="${t('analytics.cookingTime')}">
          <div style="font-size:0.9375rem;font-weight:700;margin-bottom:var(--sp-md)">${t('analytics.cookingTime')} (min)</div>
          <div class="chart-container" style="height:120px">
            <canvas id="cooking-bar" style="width:100%;height:120px"></canvas>
          </div>
        </div>

        <!-- Gas Consumption Line Chart -->
        <div class="card-elevated" role="region" aria-label="${t('analytics.gasConsumption')}">
          <div style="font-size:0.9375rem;font-weight:700;margin-bottom:var(--sp-md)">${t('analytics.gasConsumption')}</div>
          <div class="chart-container" style="height:120px">
            <canvas id="gas-line" style="width:100%;height:120px"></canvas>
          </div>
        </div>

        <!-- Leak History Heatmap -->
        <div class="card-elevated" role="region" aria-label="${t('analytics.leakHistory')}">
          <div style="font-size:0.9375rem;font-weight:700;margin-bottom:var(--sp-md)">${t('analytics.leakHistory')} — July 2025</div>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">
            ${Array.from({length:31}, (_,i) => {
              const day = i + 1;
              const hasLeak = data.leakDates.includes(day);
              return `<div style="aspect-ratio:1;border-radius:4px;background:${hasLeak ? 'var(--danger)' : 'var(--bg-elevated)'};display:flex;align-items:center;justify-content:center;font-size:0.625rem;color:${hasLeak ? '#fff' : 'var(--text-muted)'};border:1px solid var(--border)" title="Day ${day}${hasLeak ? ' — Leak detected' : ''}" aria-label="Day ${day}${hasLeak ? ': leak detected' : ': no leak'}">${day}</div>`;
            }).join('')}
          </div>
          <div style="display:flex;gap:var(--sp-md);margin-top:var(--sp-md)">
            <div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:12px;border-radius:3px;background:var(--danger)"></div><span style="font-size:0.75rem;color:var(--text-secondary)">Leak detected</span></div>
            <div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:12px;border-radius:3px;background:var(--bg-elevated);border:1px solid var(--border)"></div><span style="font-size:0.75rem;color:var(--text-secondary)">Safe</span></div>
          </div>
        </div>

        <!-- Export buttons -->
        <div style="display:flex;gap:var(--sp-md)">
          <button class="btn btn-ghost btn-full" onclick="App.exportData('pdf')" id="export-pdf-btn" style="gap:8px">
            📄 ${t('analytics.exportPdf')}
          </button>
          <button class="btn btn-ghost btn-full" onclick="App.exportData('csv')" id="export-csv-btn" style="gap:8px">
            📊 ${t('analytics.exportCsv')}
          </button>
        </div>
      </div>
    </div>`;
}, {
  onEnter() {
    const data = MockData.analyticsData;
    setTimeout(() => {
      Charts.drawArcGauge('safety-score-gauge', data.safetyScore, {
        min: 0, max: 100, label: 'Safety', unit: ''
      });
      Charts.drawBarChart('cooking-bar', data.weeklyData, {
        color: '#22C55E',
        labels: ['M','T','W','T','F','S','S'],
        max: 130,
      });
      Charts.drawLineChart('gas-line', data.gasConsumption, {
        color: '#3B82F6', bgColor: 'rgba(59,130,246,0.1)',
        min: 0, max: 3,
      });
    }, 100);
  }
});
