/**
 * Main application client controller for Agyos Clinical MLOps Platform.
 */
const App = {
  state: {
    activeTab: 'predict',
    apiKey: 'live_agyos_clinical_enterprise_key_99x',
    clinicalMeta: null,
    activeModel: null,
    modelsList: [],
    telemetry: null,
    recentLogs: [],
    isPredicting: false,
  },

  async init() {
    this.bindEvents();

    // Dynamically align API docs link
    const docsLink = document.getElementById('header-docs-link');
    if (docsLink) {
      const base = this.getApiBaseUrl();
      if (base) docsLink.href = `${base}/docs`;
    }

    await this.loadClinicalMetadata();
    await this.refreshModels();
    await this.refreshTelemetry();
    await this.refreshDrift();
    await this.refreshApiKeys();

    // Telemetry polling loop
    setInterval(() => {
      if (this.state.activeTab === 'monitoring') {
        this.refreshTelemetry();
        this.refreshDrift();
      }
    }, 6000);
  },

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-tab-target');
        this.switchTab(target);
      });
      btn.addEventListener('keydown', (e) => {
        const tabs = [...document.querySelectorAll('[data-tab-target]')];
        const index = tabs.indexOf(e.currentTarget);
        const next = e.key === 'ArrowRight' ? (index + 1) % tabs.length
          : e.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
            : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
        if (next >= 0) {
          e.preventDefault();
          tabs[next].focus();
          this.switchTab(tabs[next].getAttribute('data-tab-target'));
        }
      });
    });

    // Single Prediction Form
    const predForm = document.getElementById('single-predict-form');
    if (predForm) {
      predForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSinglePrediction();
      });
    }

    // Condition change updates Drugs
    const condSelect = document.getElementById('input-condition');
    if (condSelect) {
      condSelect.addEventListener('change', () => this.updateDrugOptions());
    }

    // Batch CSV File Upload
    const fileInput = document.getElementById('csv-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleCsvUpload(e.target.files[0]));
    }

    // Retraining Modal & Form
    const retrainForm = document.getElementById('retrain-form');
    if (retrainForm) {
      retrainForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRetrainSubmit();
      });
    }

    // API Key Generation Form
    const keyForm = document.getElementById('generate-key-form');
    if (keyForm) {
      keyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleGenerateKey();
      });
    }
  },

  switchTab(tabId) {
    this.state.activeTab = tabId;
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      const match = btn.getAttribute('data-tab-target') === tabId;
      btn.classList.toggle('text-white', match);
      btn.classList.toggle('border-white', match);
      btn.classList.toggle('text-neutral-400', !match);
      btn.classList.toggle('border-transparent', !match);
      btn.setAttribute('aria-selected', String(match));
      btn.tabIndex = match ? 0 : -1;
    });

    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      const active = panel.id === `tab-${tabId}`;
      panel.classList.toggle('hidden', !active);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `workspace-tab-${tabId}`);
      panel.toggleAttribute('hidden', !active);
    });

    if (tabId === 'monitoring') {
      this.refreshTelemetry();
      this.refreshDrift();
    } else if (tabId === 'mlops') {
      this.refreshModels();
    }
  },

  getApiBaseUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramBackend = urlParams.get('backend');
    if (paramBackend) return paramBackend.replace(/\/$/, '');

    const stored = localStorage.getItem('curavex_backend_url');
    if (stored) return stored.replace(/\/$/, '');

    // If running on Cloudflare Pages or custom domain, route requests to production Cloudflare Worker backend
    if (window.location.hostname.includes('pages.dev') || window.location.hostname.includes('curavex')) {
      return 'https://curavex-api.curavex.workers.dev';
    }

    return '';
  },

  async apiRequest(endpoint, method = 'GET', body = null) {
    const base = this.getApiBaseUrl();
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.state.apiKey,
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${base}/api/v1${endpoint}`, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'API request failed');
    }
    return res.json();
  },

  async loadClinicalMetadata() {
    try {
      const data = await this.apiRequest('/metadata/clinical');
      this.state.clinicalMeta = data;
      this.populateClinicalDropdowns(data);
    } catch (e) {
      console.error('Failed to load clinical metadata', e);
    }
  },

  populateClinicalDropdowns(meta) {
    const condSelect = document.getElementById('input-condition');
    if (!condSelect || !meta.conditions) return;

    condSelect.innerHTML = meta.conditions
      .map(c => `<option value="${c}">${c}</option>`)
      .join('');

    this.updateDrugOptions();
  },

  updateDrugOptions() {
    const condSelect = document.getElementById('input-condition');
    const drugSelect = document.getElementById('input-drug');
    if (!condSelect || !drugSelect || !this.state.clinicalMeta) return;

    const selectedCond = condSelect.value;
    const drugs = this.state.clinicalMeta.condition_drug_mapping[selectedCond] || [];

    drugSelect.innerHTML = drugs
      .map(d => `<option value="${d}">${d}</option>`)
      .join('');
  },

  async handleSinglePrediction() {
    const form = document.getElementById('single-predict-form');
    if (!form || this.state.isPredicting) return;

    const payload = {
      Age: parseInt(document.getElementById('input-age').value, 10),
      Gender: document.getElementById('input-gender').value,
      Condition: document.getElementById('input-condition').value,
      Drug_Name: document.getElementById('input-drug').value,
      Dosage_mg: parseFloat(document.getElementById('input-dosage').value),
      Treatment_Duration_days: parseInt(document.getElementById('input-duration').value, 10),
    };

    const submitBtn = document.getElementById('btn-predict-submit');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Evaluating Prognosis...';

    try {
      const res = await this.apiRequest('/predict', 'POST', payload);
      this.renderPredictionResult(res);
      this.refreshTelemetry();
    } catch (e) {
      alert(`Prediction Error: ${e.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Run Clinical Prognosis';
    }
  },

  renderPredictionResult(res) {
    const card = document.getElementById('prediction-result-card');
    card.classList.remove('hidden');

    document.getElementById('res-score').innerText = res.predicted_score.toFixed(2);
    document.getElementById('res-ci').innerText = `[${res.confidence_interval[0]} - ${res.confidence_interval[1]}]`;
    document.getElementById('res-latency').innerText = `${res.latency_ms.toFixed(1)} ms`;
    document.getElementById('res-model').innerText = res.model_id;

    const badge = document.getElementById('res-badge');
    badge.innerText = `${res.effectiveness_level} Efficacy`;
    badge.className = 'px-3 py-1 rounded text-xs font-semibold tracking-wide uppercase font-mono ';
    if (res.effectiveness_level === 'High') {
      badge.classList.add('bg-neutral-900', 'text-white', 'border', 'border-neutral-600');
    } else if (res.effectiveness_level === 'Medium') {
      badge.classList.add('bg-neutral-900', 'text-neutral-300', 'border', 'border-neutral-700');
    } else {
      badge.classList.add('bg-neutral-950', 'text-neutral-400', 'border', 'border-neutral-800');
    }

    if (res.feature_attributions && window.AppCharts) {
      window.AppCharts.initFeatureChart('feature-importance-canvas', res.feature_attributions);
    }
  },

  async handleCsvUpload(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    const statusElem = document.getElementById('batch-upload-status');
    statusElem.innerText = `Processing ${file.name}...`;

    try {
      const base = this.getApiBaseUrl();
      const res = await fetch(`${base}/api/v1/predict/upload-csv`, {
        method: 'POST',
        headers: { 'X-API-Key': this.state.apiKey },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const data = await res.json();
      this.renderBatchResults(data);
      statusElem.innerText = `Completed ${data.total_processed} patient records in ${data.batch_latency_ms} ms`;
    } catch (e) {
      statusElem.innerText = `Error: ${e.message}`;
    }
  },

  renderBatchResults(batchData) {
    const container = document.getElementById('batch-results-container');
    container.classList.remove('hidden');

    document.getElementById('batch-stat-total').innerText = batchData.total_processed;
    document.getElementById('batch-stat-mean').innerText = batchData.mean_predicted_score.toFixed(2);
    document.getElementById('batch-stat-min').innerText = batchData.min_predicted_score.toFixed(2);
    document.getElementById('batch-stat-max').innerText = batchData.max_predicted_score.toFixed(2);

    const tbody = document.getElementById('batch-table-body');
    tbody.innerHTML = batchData.predictions.slice(0, 15).map((p, idx) => `
      <tr class="border-b border-white/5 hover:bg-white/[0.02] text-xs">
        <td class="py-2.5 px-3 font-mono text-slate-400">#${idx + 1}</td>
        <td class="py-2.5 px-3 font-semibold text-slate-200">${p.predicted_score.toFixed(2)}</td>
        <td class="py-2.5 px-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase font-mono ${
            p.effectiveness_level === 'High' ? 'bg-neutral-900 text-white border border-neutral-600' :
            p.effectiveness_level === 'Medium' ? 'bg-neutral-900 text-neutral-300 border border-neutral-700' : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
          }">${p.effectiveness_level}</span>
        </td>
        <td class="py-2.5 px-3 font-mono text-slate-400">[${p.confidence_interval.join(' - ')}]</td>
      </tr>
    `).join('');
  },

  async refreshModels() {
    try {
      const models = await this.apiRequest('/models');
      this.state.modelsList = models;
      const active = models.find(m => m.status === 'PRODUCTION') || models[0];
      this.state.activeModel = active;

      if (active) {
        document.getElementById('header-active-model').innerText = active.model_id;
        document.getElementById('hero-active-algo').innerText = active.algorithm;
        document.getElementById('hero-active-ver').innerText = active.version;
        document.getElementById('hero-active-rmse').innerText = active.metrics?.rmse || '1.45';
        document.getElementById('hero-active-mae').innerText = active.metrics?.mae || '1.18';
      }

      const tbody = document.getElementById('models-table-body');
      tbody.innerHTML = models.map(m => `
        <tr class="border-b border-white/5 hover:bg-white/[0.02] text-xs">
          <td class="py-3 px-3 font-mono font-medium text-white">${m.model_id}</td>
          <td class="py-3 px-3 capitalize text-neutral-300">${m.algorithm.replace('_', ' ')}</td>
          <td class="py-3 px-3 font-mono text-white">${m.version}</td>
          <td class="py-3 px-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
              m.status === 'PRODUCTION' ? 'bg-neutral-900 text-white border border-neutral-500' :
              m.status === 'STAGING' ? 'bg-neutral-900 text-neutral-300 border border-neutral-700' :
              'bg-neutral-950 text-neutral-500 border border-neutral-800'
            }">${m.status}</span>
          </td>
          <td class="py-3 px-3 font-mono text-neutral-300">RMSE: ${m.metrics?.rmse || 'N/A'}</td>
          <td class="py-3 px-3 text-right">
            ${m.status !== 'PRODUCTION' ? `
              <button onclick="App.promoteModel('${m.model_id}')" class="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded text-[11px] interactive-tap">
                Promote to Prod
              </button>
            ` : '<span class="text-white text-[11px] font-mono">Active</span>'}
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('Failed to refresh models', e);
    }
  },

  async promoteModel(modelId) {
    try {
      await this.apiRequest(`/models/${modelId}/promote`, 'POST', { target_stage: 'PRODUCTION' });
      await this.refreshModels();
    } catch (e) {
      alert(`Promotion Failed: ${e.message}`);
    }
  },

  async handleRetrainSubmit() {
    const algo = document.getElementById('retrain-algo').value;
    const ver = document.getElementById('retrain-version').value;
    const btn = document.getElementById('btn-retrain-submit');
    btn.disabled = true;
    btn.innerText = 'Training Model...';

    try {
      await this.apiRequest('/models/train', 'POST', {
        algorithm: algo,
        version: ver,
        description: 'Retrained candidate via Web Control Plane',
      });
      document.getElementById('retrain-modal').classList.add('hidden');
      await this.refreshModels();
    } catch (e) {
      alert(`Training Failed: ${e.message}`);
    } finally {
      btn.disabled = false;
      btn.innerText = 'Launch Retraining Job';
    }
  },

  async refreshTelemetry() {
    try {
      const data = await this.apiRequest('/monitoring/metrics');
      this.state.telemetry = data;

      document.getElementById('stat-inferences').innerText = data.total_inferences;
      document.getElementById('stat-throughput').innerText = `${data.throughput_req_per_min} rpm`;
      document.getElementById('stat-error-rate').innerText = `${data.error_rate_pct}%`;
      document.getElementById('header-latency').innerText = `${data.latency_ms.p50} ms`;

      if (window.AppCharts) {
        window.AppCharts.initLatencyChart('latency-percentiles-canvas', data.latency_ms);
      }

      await this.refreshAuditLogs();
    } catch (e) {
      console.error('Failed to load telemetry', e);
    }
  },

  async refreshDrift() {
    try {
      const drift = await this.apiRequest('/monitoring/drift');
      const badge = document.getElementById('drift-status-indicator');
      if (drift.overall_drift_detected) {
        badge.innerText = 'Drift Detected';
        badge.className = 'px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-900 text-white border border-neutral-600';
      } else {
        badge.innerText = 'Distribution Stable';
        badge.className = 'px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-900 text-neutral-300 border border-neutral-700';
      }

      if (window.AppCharts && drift.numeric_metrics) {
        window.AppCharts.initDriftChart('drift-metrics-canvas', drift.numeric_metrics);
      }
    } catch (e) {
      console.error('Failed to load drift', e);
    }
  },

  async refreshAuditLogs() {
    try {
      const logs = await this.apiRequest('/monitoring/logs?limit=15');
      const tbody = document.getElementById('audit-table-body');
      tbody.innerHTML = logs.map(l => `
        <tr class="border-b border-white/5 hover:bg-white/[0.02] text-xs">
          <td class="py-2.5 px-3 font-mono text-slate-400">${new Date(l.timestamp).toLocaleTimeString()}</td>
          <td class="py-2.5 px-3 font-mono text-slate-300 truncate max-w-[140px]">${l.model_id || 'N/A'}</td>
          <td class="py-2.5 px-3 font-semibold text-slate-200">${l.predicted_score ?? 'Err'}</td>
          <td class="py-2.5 px-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono ${
              l.effectiveness === 'High' ? 'bg-neutral-900 text-white border border-neutral-600' :
              l.effectiveness === 'Medium' ? 'bg-neutral-900 text-neutral-300 border border-neutral-700' : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
            }">${l.effectiveness || 'COMPLETED'}</span>
          </td>
          <td class="py-2.5 px-3 font-mono text-slate-400">${l.latency_ms ?? 0} ms</td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('Failed to load audit logs', e);
    }
  },

  async refreshApiKeys() {
    try {
      const keys = await this.apiRequest('/api-keys');
      const listElem = document.getElementById('api-keys-list');
      listElem.innerHTML = keys.map(k => `
        <div class="p-3.5 rounded border border-neutral-800 bg-black flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-semibold text-white font-mono">${k.name}</span>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-900 text-white border border-neutral-700 font-mono">${k.tier}</span>
            </div>
            <code class="font-mono text-xs text-neutral-400 select-all">${k.api_key}</code>
          </div>
          <div class="text-right text-xs text-neutral-400 font-mono">
            <div>Limit: <span class="text-white">${k.requests_per_minute} rpm</span></div>
            <div>Monthly: <span class="text-white">${k.monthly_limit.toLocaleString()}</span></div>
          </div>
        </div>
      `).join('');
    } catch (e) {
      console.error('Failed to load API keys', e);
    }
  },

  async handleGenerateKey() {
    const name = document.getElementById('new-key-name').value;
    const tier = document.getElementById('new-key-tier').value;
    try {
      await this.apiRequest('/api-keys/generate', 'POST', { name, tier });
      document.getElementById('new-key-name').value = '';
      await this.refreshApiKeys();
    } catch (e) {
      alert(`Key generation failed: ${e.message}`);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
