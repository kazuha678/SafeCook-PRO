/* ============================================================
   SafeCook Pro — Canvas Charts
   ============================================================ */

const Charts = (() => {

  function drawLineChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { color = '#22C55E', bgColor = 'rgba(34,197,94,0.1)', min = 0, max = 200, label = 'PPM' } = options;

    canvas.width  = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const pad = { top: 20, right: 10, bottom: 30, left: 40 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top  - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
    }

    // Y axis labels
    ctx.fillStyle = 'rgba(156,163,175,0.8)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = Math.round(max - (max - min) / 4 * i);
      const y = pad.top + (chartH / 4) * i;
      ctx.fillText(val, pad.left - 6, y + 4);
    }

    if (!data || data.length < 2) return;

    // Compute points
    const pts = data.map((v, i) => ({
      x: pad.left + (i / (data.length - 1)) * chartW,
      y: pad.top + chartH - ((v - min) / (max - min)) * chartH,
    }));

    // Fill area
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, bgColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i-1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cpx, pts[i-1].y, cpx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.lineTo(pts[pts.length-1].x, pad.top + chartH);
    ctx.lineTo(pts[0].x, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i-1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cpx, pts[i-1].y, cpx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Last point dot
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'var(--bg-base, #0A0F1E)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // X axis ticks (last 6)
    const tickIndices = [0, 12, 24, 36, 48, 59];
    ctx.fillStyle = 'rgba(156,163,175,0.6)';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    tickIndices.forEach(i => {
      if (pts[i]) {
        const age = (data.length - 1 - i) * 2;
        ctx.fillText(`-${age}s`, pts[i].x, pad.top + chartH + 18);
      }
    });
  }

  function drawBarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { color = '#3B82F6', labels = [], max: maxVal = null } = options;

    canvas.width  = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const pad = { top: 15, right: 10, bottom: 30, left: 10 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top  - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    const dataMax = maxVal || Math.max(...data) * 1.2 || 1;
    const barW = (chartW / data.length) * 0.6;
    const gap  = chartW / data.length;

    data.forEach((val, i) => {
      const x = pad.left + gap * i + (gap - barW) / 2;
      const barH = (val / dataMax) * chartH;
      const y = pad.top + chartH - barH;

      // Gradient bar
      const grad = ctx.createLinearGradient(0, y, 0, pad.top + chartH);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '40');

      const radius = Math.min(6, barW / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barW - radius, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
      ctx.lineTo(x + barW, pad.top + chartH);
      ctx.lineTo(x, pad.top + chartH);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Label
      if (labels[i]) {
        ctx.fillStyle = 'rgba(156,163,175,0.7)';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + barW / 2, pad.top + chartH + 16);
      }
    });
  }

  function drawArcGauge(canvasId, value, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { min = 0, max = 100, label = '', unit = '' } = options;

    canvas.width  = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const cx = W / 2;
    const cy = H * 0.55;
    const r  = Math.min(W, H) * 0.38;
    const startAngle = Math.PI * 0.75;
    const endAngle   = Math.PI * 2.25;
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const fillAngle  = startAngle + normalized * (endAngle - startAngle);

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Fill
    const pct = normalized;
    const color = pct > 0.7 ? '#22C55E' : pct > 0.4 ? '#F97316' : '#EF4444';
    const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#3B82F6');
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, fillAngle);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value text
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.round(r * 0.45)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${value}${unit}`, cx, cy);

    // Label
    ctx.fillStyle = 'rgba(156,163,175,0.8)';
    ctx.font = `${Math.round(r * 0.18)}px Inter, sans-serif`;
    ctx.fillText(label, cx, cy + r * 0.38);
  }

  function drawPPMGauge(canvasId, ppm) {
    const color = ppm < 100 ? '#22C55E' : ppm < 300 ? '#F97316' : '#EF4444';
    drawArcGauge(canvasId, ppm, { min: 0, max: 1000, label: 'PPM', unit: '' });
  }

  return { drawLineChart, drawBarChart, drawArcGauge, drawPPMGauge };
})();

window.Charts = Charts;
