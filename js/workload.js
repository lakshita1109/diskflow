/**
 * DISKFLOW — MULTI-APPLICATION WORKLOAD MANAGER
 * Simulates OS concurrent I/O dispatching under Fair and Priority models
 */

function renderApplicationsGrid() {
  const container = document.getElementById('appsContainer');
  if (!container) return;

  container.innerHTML = '';

  AppState.applications.forEach(app => {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.id = `app-card-${app.id}`;

    card.innerHTML = `
      <div class="app-card-header">
        <div class="app-identity">
          <div class="app-color-badge" style="background-color: ${app.color};"></div>
          <span class="app-name">${app.name}</span>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${app.enabled ? 'checked' : ''} onchange="toggleAppEnabled('${app.id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="app-card-body">
        <div class="app-data-row">
          <span>Priority Level:</span>
          <strong>${app.priority} / 5</strong>
        </div>
        <div class="app-data-row">
          <span>Pending Requests:</span>
          <strong>${app.requestCount} I/O</strong>
        </div>
        <div class="app-queue-preview">
          [ ${app.generatedTracks.join(', ')} ]
        </div>
      </div>
      <div class="app-card-footer">
        <button class="btn-text" onclick="regenerateSingleAppTracks('${app.id}')">Shuffle Tracks</button>
        ${app.id.startsWith('custom-') ? `<button class="btn-text" style="color: #682232;" onclick="removeCustomApp('${app.id}')">Delete</button>` : ''}
      </div>
    `;

    container.appendChild(card);
  });

  updateMergedWorkloadSummary();
}

function toggleAppEnabled(appId, isChecked) {
  const app = AppState.applications.find(a => a.id === appId);
  if (app) {
    app.enabled = isChecked;
    updateMergedWorkloadSummary();
  }
}

function regenerateSingleAppTracks(appId) {
  const app = AppState.applications.find(a => a.id === appId);
  if (app) {
    const diskSize = AppState.diskSize;
    app.generatedTracks = Array.from({ length: app.requestCount }, () => Math.floor(Math.random() * (diskSize - 10)) + 5);
    renderApplicationsGrid();
    showToast(`Shuffled tracks for ${app.name}.`);
  }
}

function removeCustomApp(appId) {
  AppState.applications = AppState.applications.filter(a => a.id !== appId);
  renderApplicationsGrid();
  showToast('Custom application removed.');
}

function updateMergedWorkloadSummary() {
  const enabledApps = AppState.applications.filter(a => a.enabled);
  const synthesizedList = synthesizeMultiAppWorkload();

  document.getElementById('workloadMergedSummary').textContent = 
    `${enabledApps.length} active applications. Mode: ${AppState.dispatchMode.toUpperCase()}. Synthesizing ${synthesizedList.length} total disk requests.`;

  const tagsContainer = document.getElementById('workloadMergedTags');
  if (tagsContainer) {
    tagsContainer.innerHTML = synthesizedList.map(item => `
      <span class="app-tag" style="background-color: ${item.appColor};" title="${item.appName}">
        ${item.track}
      </span>
    `).join('');
  }
}

function synthesizeMultiAppWorkload() {
  const enabledApps = AppState.applications.filter(a => a.enabled);
  if (enabledApps.length === 0) return [];

  const synthesized = [];

  if (AppState.dispatchMode === 'fair') {
    // Fair Mode: Round-Robin interleaving across applications
    let maxLen = 0;
    enabledApps.forEach(app => maxLen = Math.max(maxLen, app.generatedTracks.length));

    for (let i = 0; i < maxLen; i++) {
      enabledApps.forEach(app => {
        if (i < app.generatedTracks.length) {
          synthesized.push({
            track: app.generatedTracks[i],
            appName: app.name,
            appColor: app.color
          });
        }
      });
    }
  } else {
    // Priority Mode: Sort apps by priority descending
    const sortedApps = [...enabledApps].sort((a, b) => b.priority - a.priority);
    sortedApps.forEach(app => {
      app.generatedTracks.forEach(t => {
        synthesized.push({
          track: t,
          appName: app.name,
          appColor: app.color
        });
      });
    });
  }

  return synthesized;
}

function loadMultiAppWorkloadIntoSimulator() {
  const synthesized = synthesizeMultiAppWorkload();
  if (synthesized.length === 0) {
    showToast('Please enable at least one application!', 'warning');
    return;
  }

  const tracks = synthesized.map(s => s.track);
  document.getElementById('queueInput').value = tracks.join(', ');

  const metaMap = {};
  synthesized.forEach((s, idx) => {
    metaMap[idx] = { name: s.appName, color: s.appColor };
  });

  AppState.requestQueue = prepareRequestObjects(tracks, metaMap);
  recomputeSimulationPlan();

  showToast(`Loaded ${tracks.length} multi-application requests into simulator!`, 'success');
  navigateTo('simulator');
}
