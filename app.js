/**
 * app.js — SatFusion Main Application Logic
 * Handles: Upload, Algorithm Viz, Charts, Timeline, Disaster Tracking
 */

// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────
const state = {
  activeSats: new Set(['SAT-A', 'SAT-B', 'SAT-C']),
  customDatasets: {},
  disabledCustom: new Set(),   // tracks which custom sats are toggled off (data kept)
  selectedAlgo: 'kway',
  mergedData: [],
  mergeSteps: [],
  currentStep: 0,
  autoPlayTimer: null,
  mainChart: null,
  disasterChart: null,
  activeTab: 'timeline',
  sliderValue: 100,
  searchQuery: '',
  filterSat: 'all',
};

// ─────────────────────────────────────────
// STAR BACKGROUND
// ─────────────────────────────────────────
function initStars() {
  const container = document.getElementById('bgStars');
  const count = 180;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    const size = Math.random() * 2.5 + 0.5;
    const opacity = Math.random() * 0.8 + 0.2;
    const delay = Math.random() * 8;
    const dur = Math.random() * 4 + 3;
    star.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      border-radius:50%;
      background:white;
      opacity:${opacity};
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      animation: starTwinkle ${dur}s ${delay}s ease-in-out infinite alternate;
    `;
    container.appendChild(star);
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes starTwinkle {
      from { opacity: 0.1; transform: scale(0.8); }
      to   { opacity: 0.9; transform: scale(1.2); }
    }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────
// LIVE CLOCK
// ─────────────────────────────────────────
function initClock() {
  const el = document.getElementById('liveClock');
  function tick() {
    const now = new Date();
    el.textContent = now.toUTCString().split(' ').slice(4, 5)[0] + ' UTC';
  }
  tick();
  setInterval(tick, 1000);
}

// ─────────────────────────────────────────
// SATELLITE TOGGLES
// ─────────────────────────────────────────
function initSatToggles() {
  ['A', 'B', 'C', 'D'].forEach(letter => {
    const satId = `SAT-${letter}`;
    const card = document.getElementById(`preload${letter}`);
    const toggle = document.getElementById(`toggle${letter}`);

    card.addEventListener('click', () => {
      if (state.activeSats.has(satId)) {
        state.activeSats.delete(satId);
        toggle.textContent = 'OFF';
        toggle.classList.remove('active');
        card.classList.remove('active');
      } else {
        state.activeSats.add(satId);
        toggle.textContent = 'ON';
        toggle.classList.add('active');
        card.classList.add('active');
      }
      updateStatSats();
    });
  });
}

function updateStatSats() {
  const activeCustom = Object.keys(state.customDatasets).filter(id => !state.disabledCustom.has(id)).length;
  const total = state.activeSats.size + activeCustom;
  document.getElementById('statSats').textContent = total;
}

// ─────────────────────────────────────────
// ALGORITHM SELECTION
// ─────────────────────────────────────────
function initAlgoSelector() {
  document.querySelectorAll('.algo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedAlgo = btn.dataset.algo;
      const names = { kway: 'K-Way Merge', heap: 'Heap Merge', naive: 'Naive Merge' };
      document.getElementById('currentAlgo').textContent = names[state.selectedAlgo];
      document.getElementById('statAlgo').textContent = names[state.selectedAlgo].split(' ')[0];
    });
  });
}

// ─────────────────────────────────────────
// FILE UPLOAD
// ─────────────────────────────────────────
function initUpload() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('fileInput');

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  input.addEventListener('change', e => handleFiles(e.target.files));
}

function handleFiles(files) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        let data;
        if (file.name.endsWith('.json')) {
          data = JSON.parse(e.target.result);
          if (!Array.isArray(data)) data = Object.values(data).flat();
        } else {
          data = parseCSV(e.target.result, file.name);
        }

        const satId = `CUSTOM-${file.name.replace(/\.[^.]+$/, '').toUpperCase().slice(0, 8)}`;
        state.customDatasets[satId] = data
          .map(d => ({ ...d, satellite: satId }))
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const _hue = Math.floor(Math.random() * 360); // single hue for both color & bg
        SAT_COLORS[satId] = {
          color: `hsl(${_hue}, 80%, 60%)`,
          bg: `hsla(${_hue}, 80%, 60%, 0.15)`,
          label: file.name.replace(/\.[^.]+$/, ''),
          icon: '📡',
        };

        addCustomSatCard(satId, file.name, data.length);
        updateStatSats();
        toast(`📡 Loaded: ${file.name} (${data.length} records)`, 'success');
      } catch (err) {
        toast(`❌ Failed to parse ${file.name}: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  });
}

function parseCSV(text, filename) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      const v = (vals[i] || '').trim().replace(/^"|"$/g, '');
      obj[h] = isNaN(v) || v === '' ? v : +v;
    });
    if (!obj.timestamp && obj.time)   obj.timestamp = obj.time;
    if (!obj.timestamp && obj.date)   obj.timestamp = obj.date;
    if (!obj.timestamp)               obj.timestamp = new Date().toISOString();
    return obj;
  }).filter(r => r.timestamp);
}

function addCustomSatCard(satId, filename, count) {
  const list = document.getElementById('customSatsList');
  const info = SAT_COLORS[satId];
  const card = document.createElement('div');
  card.className = 'satellite-card active';
  card.innerHTML = `
    <div class="sat-icon" style="background: linear-gradient(135deg,${info.color},#1a1a4a)">📡</div>
    <div class="sat-info">
      <div class="sat-name">${info.label}</div>
      <div class="sat-meta">${count} records · Custom Upload</div>
    </div>
    <div class="sat-toggle active" id="toggle-${satId}">ON</div>
  `;
  card.addEventListener('click', () => {
    const toggle = card.querySelector('.sat-toggle');
    if (state.disabledCustom.has(satId)) {
      // Re-enable
      state.disabledCustom.delete(satId);
      toggle.textContent = 'ON';
      toggle.classList.add('active');
      card.classList.add('active');
    } else {
      // Disable (data preserved so it can be re-enabled)
      state.disabledCustom.add(satId);
      toggle.textContent = 'OFF';
      toggle.classList.remove('active');
      card.classList.remove('active');
    }
    updateStatSats();
  });

  // Add this satellite as a filter option if not already present
  const filterSelect = document.getElementById('timelineFilter');
  if (!filterSelect.querySelector(`option[value="${satId}"]`)) {
    const opt = document.createElement('option');
    opt.value = satId;
    opt.textContent = info.label;
    filterSelect.appendChild(opt);
  }

  list.appendChild(card);
}

// ─────────────────────────────────────────
// RUN MERGE
// ─────────────────────────────────────────
function initRunMerge() {
  document.getElementById('runMergeBtn').addEventListener('click', runFusion);
}

async function runFusion() {
  const btn = document.getElementById('runMergeBtn');
  btn.classList.add('running');
  btn.innerHTML = `<span class="run-icon">⏳</span><span>Processing…</span><span class="run-badge">FUSING</span>`;
  setStatus('Fusing…', '#f59e0b');

  // Small delay for UX
  await new Promise(r => setTimeout(r, 300));

  // Gather active arrays
  const arrays = [];
  state.activeSats.forEach(satId => {
    if (PRELOADED_DATA[satId]) arrays.push([...PRELOADED_DATA[satId]]);
  });
  Object.entries(state.customDatasets).forEach(([id, d]) => {
    if (!state.disabledCustom.has(id)) {
      // Ensure it's sorted before passing to K-way merge (which requires sorted inputs)
      const sorted = [...d].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      arrays.push(sorted);
    }
  });

  if (arrays.length === 0) {
    toast('⚠ No satellites selected!', 'error');
    resetRunBtn();
    return;
  }

  const output = runMerge(arrays, state.selectedAlgo);
  state.mergedData = output.result;
  state.mergeSteps = output.steps;
  state.currentStep = 0;

  // Update stats
  document.getElementById('statTotal').textContent = output.result.length.toLocaleString();
  document.getElementById('statTime').textContent = output.elapsed;

  // Render
  renderTimeline(state.mergedData);
  renderAlgoViz();
  updateChart();
  document.getElementById('exportSection').style.display = 'flex';
  document.getElementById('timeSliderSection').style.display = 'block';
  setupTimeSlider();

  setStatus('Live', '#10b981');
  toast(`✅ Fused ${output.result.length} records from ${arrays.length} satellites in ${output.elapsed}ms`, 'success');
  resetRunBtn();
}

function resetRunBtn() {
  const btn = document.getElementById('runMergeBtn');
  btn.classList.remove('running');
  btn.innerHTML = `<span class="run-icon">▶</span><span>Run Fusion</span><span class="run-badge">MERGE NOW</span>`;
}

function setStatus(text, color) {
  document.getElementById('statusText').textContent = text;
  const dot = document.querySelector('.status-dot');
  dot.style.background = color;
  dot.style.boxShadow = `0 0 8px ${color}`;
}

// ─────────────────────────────────────────
// TIMELINE RENDER
// ─────────────────────────────────────────
function renderTimeline(data) {
  const list = document.getElementById('timelineList');
  list.innerHTML = '';

  const filtered = getFilteredData(data);
  const visible = filtered.slice(0, 300);

  if (visible.length === 0) {
    list.innerHTML = `<div class="timeline-empty"><div style="font-size:2rem">🔍</div><div>No records match filter</div></div>`;
    return;
  }

  visible.forEach((record, idx) => {
    const satInfo = SAT_COLORS[record.satellite] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: record.satellite };
    const item = document.createElement('div');
    item.className = 'timeline-item';

    const fields = Object.entries(record).filter(([k]) => !['timestamp','satellite'].includes(k));
    const valHtml = fields.slice(0, 3).map(([k, v]) =>
      `<span class="tl-val">${k.replace(/_/g,' ')}: <b>${typeof v === 'number' ? v.toFixed(2) : v}</b></span>`
    ).join('');

    item.innerHTML = `
      <div class="tl-dot" style="background:${satInfo.color};color:${satInfo.color}"></div>
      <span class="tl-time">${formatTime(record.timestamp)}</span>
      <span class="tl-sat" style="background:${satInfo.bg};color:${satInfo.color}">${satInfo.label}</span>
      <div class="tl-values">${valHtml}</div>
    `;

    // Staggered animation
    item.style.animationDelay = `${Math.min(idx * 8, 200)}ms`;
    list.appendChild(item);
  });

  if (filtered.length > 300) {
    const note = document.createElement('div');
    note.style.cssText = 'text-align:center;font-size:0.72rem;color:#475569;padding:10px;';
    note.textContent = `Showing 300 of ${filtered.length} records`;
    list.appendChild(note);
  }
}

function getFilteredData(data) {
  let filtered = data;

  // Satellite filter
  if (state.filterSat !== 'all') {
    filtered = filtered.filter(r => r.satellite === state.filterSat);
  }

  // Search filter
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(q))
    );
  }

  // Time slider filter
  if (state.sliderValue < 100) {
    const cutoff = Math.floor(filtered.length * state.sliderValue / 100);
    filtered = filtered.slice(0, cutoff);
  }

  return filtered;
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short' }) + ' ' +
           d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  } catch { return iso; }
}

// ─────────────────────────────────────────
// TIMELINE SEARCH & FILTER
// ─────────────────────────────────────────
function initTimelineControls() {
  const search = document.getElementById('timelineSearch');
  const filter = document.getElementById('timelineFilter');

  search.addEventListener('input', () => {
    state.searchQuery = search.value;
    if (state.mergedData.length) renderTimeline(state.mergedData);
  });
  filter.addEventListener('change', () => {
    state.filterSat = filter.value;
    if (state.mergedData.length) renderTimeline(state.mergedData);
  });
}

// ─────────────────────────────────────────
// TIME SLIDER
// ─────────────────────────────────────────
function setupTimeSlider() {
  const slider = document.getElementById('timeSlider');
  const rangeEl = document.getElementById('sliderRange');
  const startEl = document.getElementById('sliderStart');
  const endEl   = document.getElementById('sliderEnd');
  slider.value = 100;
  state.sliderValue = 100;

  if (state.mergedData.length > 0) {
    startEl.textContent = formatTime(state.mergedData[0].timestamp);
    endEl.textContent   = formatTime(state.mergedData[state.mergedData.length - 1].timestamp);
  }

  slider.addEventListener('input', () => {
    state.sliderValue = +slider.value;
    const count = Math.floor(state.mergedData.length * state.sliderValue / 100);
    rangeEl.textContent = `${count} records visible`;

    // Update slider gradient
    slider.style.background = `linear-gradient(90deg, var(--cyan) ${state.sliderValue}%, var(--border) ${state.sliderValue}%)`;

    renderTimeline(state.mergedData);
    updateChart();
  });
}

// ─────────────────────────────────────────
// ALGORITHM VISUALIZER (sidebar steps)
// ─────────────────────────────────────────
function renderAlgoViz() {
  const viz = document.getElementById('algoViz');
  viz.style.display = 'block';

  const steps = state.mergeSteps.slice(0, 10);
  const heap = document.getElementById('heapDisplay');
  const stepsEl = document.getElementById('mergeSteps');

  // Show last step's heap state
  const lastStep = steps[steps.length - 1];
  heap.innerHTML = '';
  if (lastStep?.heapState?.length > 0) {
    lastStep.heapState.slice(0, 6).forEach((item, i) => {
      const div = document.createElement('div');
      div.className = `heap-item${i === 0 ? ' top' : ''}`;
      div.textContent = item;
      heap.appendChild(div);
    });
  } else {
    heap.innerHTML = `<div class="heap-item" style="color:#10b981">✓ Heap empty</div>`;
  }

  stepsEl.innerHTML = '';
  steps.slice(0, 8).forEach(step => {
    const div = document.createElement('div');
    div.className = 'merge-step';
    div.textContent = `▸ ${step.desc}`;
    stepsEl.appendChild(div);
  });
}

// ─────────────────────────────────────────
// CHART RENDERING
// ─────────────────────────────────────────
function initVizTabs() {
  document.querySelectorAll('.viz-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.viz-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeTab = tab.dataset.tab;

      const disPanel         = document.getElementById('disasterPanel');
      const chartContainer   = document.getElementById('chartContainer');
      const timeSliderSection = document.getElementById('timeSliderSection');

      if (state.activeTab === 'disaster') {
        // Hide main chart and slider so they don't stack with disaster panel
        chartContainer.style.display   = 'none';
        timeSliderSection.style.display = 'none';
        disPanel.style.display          = 'block';
      } else {
        disPanel.style.display          = 'none';
        chartContainer.style.display   = 'block';
        if (state.mergedData.length > 0) {
          timeSliderSection.style.display = 'block';
        }
        updateChart();
      }
    });
  });
}

function updateChart() {
  const placeholder = document.getElementById('chartPlaceholder');
  const canvas = document.getElementById('mainChart');
  const wrapper = document.getElementById('canvasWrapper');

  if (state.mergedData.length === 0) return;

  placeholder.style.display = 'none';
  wrapper.style.display = 'block';

  if (state.mainChart) { state.mainChart.destroy(); state.mainChart = null; }

  const ctx = canvas.getContext('2d');

  switch (state.activeTab) {
    case 'timeline': renderTimelineChart(ctx); break;
    case 'multi':    renderMultiMetricChart(ctx); break;
    case 'radar':    renderRadarChart(ctx); break;
    default:         renderTimelineChart(ctx); break;
  }

  // Force Chart.js to re-measure the canvas after display:none → block transition
  if (state.mainChart) state.mainChart.resize();
}

// ── Timeline Chart (multi-satellite line chart)
function renderTimelineChart(ctx) {
  const visible = getFilteredData(state.mergedData);
  // Do not sample down to 80 points. Show all visible data (up to reasonable limits) so user can scroll.
  const sample = sampleData(visible, Math.min(visible.length, 600));

  const allTimestamps = [...new Set(sample.map(r => r.timestamp))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Adjust canvas wrapper width dynamically for scroll mode
  const wrapper = document.getElementById('canvasWrapper');
  const containerWidth = document.getElementById('chartContainer').clientWidth;
  if(state.activeTab === 'timeline') {
    const requiredWidth = Math.max(containerWidth, allTimestamps.length * 35); // 35px per record
    wrapper.style.minWidth = `${requiredWidth}px`;
  } else {
    wrapper.style.minWidth = '100%';
  }

  const satGroups = {};
  sample.forEach(rec => {
    if (!satGroups[rec.satellite]) satGroups[rec.satellite] = [];
    satGroups[rec.satellite].push(rec);
  });

  const labels = allTimestamps.map(t => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));

  const datasets = Object.entries(satGroups).map(([satId, records]) => {
    const info = SAT_COLORS[satId] || { color: '#94a3b8', label: satId };
    const numericFields = Object.keys(records[0] || {}).filter(k => !['timestamp','satellite'].includes(k) && typeof records[0]?.[k] === 'number');
    const field = numericFields[0] || 'value';

    const dataMap = {};
    records.forEach(r => { dataMap[r.timestamp] = r[field]; });

    return {
      label: `${info.label} — ${field.replace(/_/g, ' ')}`,
      data: allTimestamps.map(t => dataMap[t] ?? null),
      borderColor: info.color,
      backgroundColor: info.bg,
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 5,
      tension: 0.4,
      spanGaps: true,
      fill: false,
    };
  });

  state.mainChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: chartOptions('Unified Satellite Timeline'),
  });
}

// ── Multi-Metric Chart (bar comparison)
function renderMultiMetricChart(ctx) {
  const visible = getFilteredData(state.mergedData);

  const satGroups = {};
  visible.forEach(rec => {
    if (!satGroups[rec.satellite]) satGroups[rec.satellite] = [];
    satGroups[rec.satellite].push(rec);
  });

  const metrics = [];
  Object.entries(satGroups).forEach(([satId, records]) => {
    const info = SAT_COLORS[satId] || { color: '#94a3b8', label: satId };
    const numericFields = Object.keys(records[0] || {}).filter(k => !['timestamp','satellite'].includes(k) && typeof records[0]?.[k] === 'number');

    numericFields.slice(0, 3).forEach(field => {
      const vals = records.map(r => r[field]).filter(v => v != null);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      // store bg alongside color so backgroundColor doesn't rely on string-appending '66' (breaks HSL)
      metrics.push({ sat: info.label, field: field.replace(/_/g, ' '), avg: +avg.toFixed(2), color: info.color, bg: info.bg || 'rgba(148,163,184,0.15)' });
    });
  });

  const labels = metrics.map(m => `${m.sat}\n${m.field}`);
  const data   = metrics.map(m => m.avg);
  const colors = metrics.map(m => m.color);
  const bgs    = metrics.map(m => m.bg);  // pre-built bg avoids broken 'hsl(...)66' strings

  // Adjust width based on bars
  const wrapper = document.getElementById('canvasWrapper');
  const containerWidth = document.getElementById('chartContainer').clientWidth;
  const requiredWidth = Math.max(containerWidth, labels.length * 80);
  wrapper.style.minWidth = `${requiredWidth}px`;

  state.mainChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Average Value',
        data,
        backgroundColor: bgs,
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
      }],
    },
    options: chartOptions('Multi-Satellite Metric Comparison'),
  });
}

// ── Radar Chart
function renderRadarChart(ctx) {
  const visible = getFilteredData(state.mergedData);
  const satGroups = {};
  visible.forEach(rec => {
    if (!satGroups[rec.satellite]) satGroups[rec.satellite] = [];
    satGroups[rec.satellite].push(rec);
  });

  const commonFields = ['temperature','humidity','rainfall_mm','wind_kmh','uv_index','pressure_hpa','sea_surface_temp','altitude_km'];
  const labels = commonFields.map(f => f.replace(/_/g,' '));

  const datasets = Object.entries(satGroups).map(([satId, records]) => {
    const info = SAT_COLORS[satId] || { color: '#94a3b8', label: satId };
    const data = commonFields.map(field => {
      const vals = records.map(r => r[field]).filter(v => v != null && !isNaN(v));
      if (!vals.length) return 0;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return +avg.toFixed(2);
    });

    return {
      label: info.label,
      data,
      borderColor: info.color,
      backgroundColor: info.bg,
      borderWidth: 2,
      pointBackgroundColor: info.color,
    };
  });

  // Radar charts shouldn't be horizontally scrollable
  const wrapper = document.getElementById('canvasWrapper');
  wrapper.style.minWidth = '100%';

  state.mainChart = new Chart(ctx, {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } }, title: { display: true, text: 'Satellite Data Radar Comparison', color: '#00d4ff', font: { family: 'Orbitron', size: 13 } } },
      scales: { r: { ticks: { color: '#475569', backdropColor: 'transparent' }, grid: { color: 'rgba(0,212,255,0.1)' }, pointLabels: { color: '#94a3b8', font: { size: 10 } } } },
    },
  });
}

// ── Shared Chart Options
function chartOptions(title) {
  return {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 14 },
      },
      title: {
        display: true, text: title,
        color: '#00d4ff', font: { family: 'Orbitron', size: 13 }, padding: { bottom: 14 },
      },
      tooltip: {
        backgroundColor: 'rgba(6,15,42,0.95)',
        borderColor: 'rgba(0,212,255,0.3)', borderWidth: 1,
        titleColor: '#00d4ff', bodyColor: '#94a3b8',
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'JetBrains Mono', size: 10 },
      },
    },
    scales: {
      x: {
        ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 12 },
        grid: { color: 'rgba(0,212,255,0.06)' },
        border: { color: 'rgba(0,212,255,0.1)' },
      },
      y: {
        ticks: { color: '#475569', font: { size: 10 } },
        grid: { color: 'rgba(0,212,255,0.06)' },
        border: { color: 'rgba(0,212,255,0.1)' },
      },
    },
  };
}

function sampleData(data, maxPoints) {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
}

// ─────────────────────────────────────────
// DISASTER TRACKER
// ─────────────────────────────────────────
function initDisasterTracker() {
  document.getElementById('simulateDisaster').addEventListener('click', () => {
    const type = document.getElementById('disasterType').value;
    simulateDisaster(type);
  });
}

function simulateDisaster(type) {
  const dis = DISASTER_DATA[type];
  if (!dis) return;

  const canvas = document.getElementById('disasterChart');
  canvas.style.display = 'block';
  canvas.style.height = '220px';

  if (state.disasterChart) { state.disasterChart.destroy(); state.disasterChart = null; }

  const ctx = canvas.getContext('2d');

  const datasets = dis.datasets.map(ds => ({
    label: ds.name,
    data: ds.data,
    borderColor: ds.color,
    backgroundColor: ds.fill ? ds.color + '22' : 'transparent',
    borderWidth: 2.5,
    tension: 0.4,
    fill: ds.fill,
    pointRadius: 3,
    pointHoverRadius: 6,
    pointBackgroundColor: ds.color,
  }));

  state.disasterChart = new Chart(ctx, {
    type: 'line',
    data: { labels: dis.labels, datasets },
    options: {
      ...chartOptions(dis.label),
      animation: { duration: 1200, easing: 'easeInOutQuart' },
    },
  });

  // Render alerts
  const alertsEl = document.getElementById('disasterAlerts');
  alertsEl.innerHTML = '';
  dis.alerts.forEach((a, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = `disaster-alert alert-${a.level}`;
      div.innerHTML = `${a.msg}`;
      alertsEl.appendChild(div);
    }, i * 400);
  });

  toast(`🌪 Simulating: ${dis.label}`, 'info');
}

// ─────────────────────────────────────────
// STEP-BY-STEP MODAL
// ─────────────────────────────────────────
function initModal() {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('stepPrev').addEventListener('click', () => showStep(state.currentStep - 1));
  document.getElementById('stepNext').addEventListener('click', () => showStep(state.currentStep + 1));
  document.getElementById('stepAuto').addEventListener('click', toggleAutoPlay);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  // Close modal on ESC key
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function openModal() {
  if (!state.mergeSteps.length) {
    toast('⚠ Run fusion first to see algorithm steps!', 'error');
    return;
  }
  state.currentStep = 0;
  document.getElementById('modalOverlay').style.display = 'flex';
  showStep(0);
}

function closeModal() {
  clearInterval(state.autoPlayTimer);
  state.autoPlayTimer = null;
  document.getElementById('stepAuto').textContent = '▶ Auto Play';
  document.getElementById('modalOverlay').style.display = 'none';
}

function showStep(idx) {
  const steps = state.mergeSteps;
  if (idx < 0 || idx >= steps.length) return;
  state.currentStep = idx;

  const step = steps[idx];
  document.getElementById('stepCounter').textContent = `Step ${idx + 1} / ${steps.length}`;
  document.getElementById('stepPrev').disabled = idx === 0;
  document.getElementById('stepNext').disabled = idx === steps.length - 1;

  const container = document.getElementById('stepVizContainer');
  container.innerHTML = '';

  const typeIcons = { init: '🚀', insert: '➕', extract: '⬇', concat: '📎', sort: '🔀', done: '✅' };
  const typeColors = {
    init: '#00d4ff', insert: '#a855f7', extract: '#10b981',
    concat: '#f59e0b', sort: '#ff6b35', done: '#10b981',
  };

  const div = document.createElement('div');
  div.className = 'step-viz';
  div.innerHTML = `
    <div class="step-title" style="color:${typeColors[step.type] || '#00d4ff'}">
      ${typeIcons[step.type] || '▸'} ${step.type.toUpperCase()} — Step ${idx + 1}
    </div>

    ${step.columns?.length ? `
      <div class="step-columns">
        ${step.columns.map(col => {
          const info = SAT_COLORS[col.sat] || { color: '#94a3b8', label: col.sat };
          return `
            <div class="step-col">
              <div class="step-col-label" style="background:${info.bg || 'rgba(148,163,184,0.1)'};color:${info.color}">${info.label || col.sat}</div>
              <div class="step-cell" style="font-size:0.6rem;color:#475569">Records: ${col.len}</div>
              <div class="step-cell ${step.extracted === col.sat ? 'highlight' : ''}">
                ptr: ${col.ptr}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}

    ${step.heapState?.length ? `
      <div style="margin-bottom:12px;">
        <div style="font-size:0.7rem;color:#475569;margin-bottom:6px;font-family:var(--font-mono);">Min-Heap State:</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${step.heapState.map((item, i) => `
            <div style="
              padding:4px 8px; border-radius:4px; font-size:0.65rem;
              font-family:var(--font-mono);
              background:${i === 0 ? 'rgba(0,212,255,0.15)' : 'rgba(15,30,75,0.7)'};
              border:1px solid ${i === 0 ? 'rgba(0,212,255,0.4)' : 'rgba(0,212,255,0.1)'};
              color:${i === 0 ? '#00d4ff' : '#64748b'};
              ${i === 0 ? 'transform:scale(1.05);box-shadow:0 0 8px rgba(0,212,255,0.3);' : ''}
            ">${i === 0 ? '👑 ' : ''}${item}</div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div class="step-desc">${step.desc}</div>
  `;
  container.appendChild(div);
}

function toggleAutoPlay() {
  const btn = document.getElementById('stepAuto');
  if (state.autoPlayTimer) {
    clearInterval(state.autoPlayTimer);
    state.autoPlayTimer = null;
    btn.textContent = '▶ Auto Play';
  } else {
    btn.textContent = '⏸ Pause';
    state.autoPlayTimer = setInterval(() => {
      if (state.currentStep < state.mergeSteps.length - 1) {
        showStep(state.currentStep + 1);
      } else {
        clearInterval(state.autoPlayTimer);
        state.autoPlayTimer = null;
        btn.textContent = '▶ Auto Play';
      }
    }, 900);
  }
}

// ─────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────
function initExport() {
  document.getElementById('exportCSV').addEventListener('click', () => {
    if (!state.mergedData.length) return;
    const keys = Object.keys(state.mergedData[0]);
    const rows = [keys.join(','), ...state.mergedData.map(r => keys.map(k => r[k]).join(','))];
    downloadFile(rows.join('\n'), 'satfusion_merged.csv', 'text/csv');
    toast('📥 CSV exported!', 'success');
  });

  document.getElementById('exportJSON').addEventListener('click', () => {
    if (!state.mergedData.length) return;
    downloadFile(JSON.stringify(state.mergedData, null, 2), 'satfusion_merged.json', 'application/json');
    toast('📥 JSON exported!', 'success');
  });
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────
function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: '📡' };
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || '📡'}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut 0.3s ease forwards';
    el.addEventListener('animationend', () => el.remove());
  }, 4000);
}

// Add toast out animation
const toastStyle = document.createElement('style');
toastStyle.textContent = `@keyframes toastOut { to { opacity:0; transform:translateX(20px); } }`;
document.head.appendChild(toastStyle);

// ─────────────────────────────────────────
// ALGO VIZ STEP BUTTON (in panel header)
// ─────────────────────────────────────────
function addStepVizButton() {
  const header = document.querySelector('.panel-timeline .panel-header');
  const btn = document.createElement('button');
  btn.id = 'btnStepViz';
  btn.className = 'viz-tab';
  btn.title = 'View Algorithm Steps';
  btn.textContent = '⚙';
  btn.style.marginLeft = 'auto';
  btn.addEventListener('click', openModal);
  header.appendChild(btn);
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initStars();
  initClock();
  initSatToggles();
  initAlgoSelector();
  initUpload();
  initRunMerge();
  initVizTabs();
  initDisasterTracker();
  initModal();
  initExport();
  initTimelineControls();
  addStepVizButton();

  // Auto-run a first fusion on load for instant wow-factor
  setTimeout(() => {
    document.getElementById('runMergeBtn').click();
  }, 600);
});
