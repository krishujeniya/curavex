/**
 * Chart rendering service for clinical feature attributions, MLOps telemetry, and drift detection.
 */
window.AppCharts = {
  instances: {},

  initFeatureChart(canvasId, items) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    const labels = items.map(i => i.feature);
    const data = items.map(i => Math.abs(i.impact || i.importance || 0));

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Attribution Magnitude',
          data: data,
          backgroundColor: '#06b6d4',
          borderRadius: 4,
          maxBarThickness: 24,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            bodyFont: { family: 'Inter', size: 12 },
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
          }
        }
      }
    });
  },

  initLatencyChart(canvasId, latencyData) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Avg', 'p50', 'p95', 'p99'],
        datasets: [{
          label: 'Latency (ms)',
          data: [latencyData.avg || 0, latencyData.p50 || 0, latencyData.p95 || 0, latencyData.p99 || 0],
          backgroundColor: ['#38bdf8', '#0ea5e9', '#0284c7', '#f43f5e'],
          borderRadius: 6,
          maxBarThickness: 36,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#0f172a' }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b' }
          }
        }
      }
    });
  },

  initDriftChart(canvasId, numericMetrics) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    const labels = Object.keys(numericMetrics);
    const pValues = labels.map(k => numericMetrics[k].p_value);
    const backgroundColors = pValues.map(p => p < 0.05 ? '#f43f5e' : '#10b981');

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'KS-test p-value (Threshold: 0.05)',
          data: pValues,
          backgroundColor: backgroundColors,
          borderRadius: 4,
          maxBarThickness: 28,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => ctx.raw < 0.05 ? 'DRIFT ALERT' : 'Normal Distribution'
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
          y: {
            min: 0,
            max: 1.0,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b' }
          }
        }
      }
    });
  }
};
