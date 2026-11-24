/**
 * DISKFLOW — APPLICATION CONTROLLER & PLAYBACK ORCHESTRATOR
 * Coordinates playback, event handlers, and UI navigation
 */

function recomputeSimulationPlan() {
  parseAndValidateInputs();

  AppState.plan = generateAlgorithmPlan(
    AppState.selectedAlgorithm,
    AppState.initialHead,
    AppState.requestQueue,
    AppState.diskSize,
    AppState.initialDirection
  );

  AppState.currentStepIndex = 0;
  AppState.currentHead = AppState.initialHead;
  AppState.simStatus = 'ready';

  renderDiskRailStructure();
  updateVisualizerState(0);
  renderExecutionTraceTable();
  updateMetricCards(0);
  updateEducationalRationale(0);
  draw2DSeekTrajectory(0);
  updateStatusBadge('ready');
  updateOverviewSummary();

  runComparisonBenchmark();
}

function parseAndValidateInputs() {
  const diskSizeInput = document.getElementById('diskSizeInput');
  const initialHeadInput = document.getElementById('initialHeadInput');
  const queueInput = document.getElementById('queueInput');
  const directionSelect = document.getElementById('directionSelect');
  const seekTimeRateInput = document.getElementById('seekTimeRateInput');
  const algoSelect = document.getElementById('algoSelect');

  const diskSize = Math.max(10, parseInt(diskSizeInput.value, 10) || 200);
  const initialHead = Math.max(0, Math.min(diskSize - 1, parseInt(initialHeadInput.value, 10) || 0));
  const seekRate = Math.max(0.1, parseFloat(seekTimeRateInput.value) || 5.0);
  const direction = directionSelect ? (directionSelect.value || 'Left') : 'Left';
  const algo = algoSelect ? (algoSelect.value || 'FCFS') : 'FCFS';

  AppState.diskSize = diskSize;
  AppState.initialHead = initialHead;
  AppState.seekTimeRate = seekRate;
  AppState.initialDirection = direction;
  AppState.selectedAlgorithm = algo;

  const rawText = queueInput.value.trim();
  const tokens = rawText.split(/[\s,]+/).filter(t => t.length > 0);
  const validTracks = [];
  const rejectedTracks = [];

  tokens.forEach(tok => {
    const num = Number(tok);
    if (!isNaN(num) && Number.isInteger(num)) {
      if (num >= 0 && num < diskSize) {
        validTracks.push(num);
      } else {
        rejectedTracks.push(tok);
      }
    } else {
      rejectedTracks.push(tok);
    }
  });

  if (rejectedTracks.length > 0) {
    showToast(`Rejected out-of-range track(s): ${rejectedTracks.join(', ')}. Must be 0 to ${diskSize - 1}.`, 'warning');
  }

  if (validTracks.length === 0) {
    showToast('Queue is empty! Inserting default track workload.', 'warning');
    validTracks.push(53, 98, 183, 37, 122, 14, 124, 65, 67);
    queueInput.value = validTracks.join(', ');
  }

  AppState.requestQueue = prepareRequestObjects(validTracks);
  document.getElementById('queueCountBadge').textContent = `${validTracks.length} requests`;
  document.getElementById('queueValidationMsg').textContent = `Valid tracks: 0 to ${diskSize - 1}. Comma or space separated.`;
}

function startOrResumeSimulation() {
  if (AppState.simStatus === 'completed') {
    AppState.currentStepIndex = 0;
  }

  if (AppState.plan.length === 0) {
    recomputeSimulationPlan();
  }

  AppState.simStatus = 'running';
  updateStatusBadge('running');
  updatePlayPauseButtons(true);

  scheduleNextAnimationStep();
}

function pauseSimulation() {
  if (AppState.simStatus === 'running') {
    clearTimeout(AppState.timerId);
    AppState.simStatus = 'paused';
    updateStatusBadge('paused');
    updatePlayPauseButtons(false);
  }
}

function resetSimulation() {
  clearTimeout(AppState.timerId);
  AppState.simStatus = 'ready';
  AppState.currentStepIndex = 0;
  AppState.currentHead = AppState.initialHead;

  updateStatusBadge('ready');
  updatePlayPauseButtons(false);
  updateVisualizerState(0);
  updateMetricCards(0);
  updateEducationalRationale(0);
  renderExecutionTraceTable();
  draw2DSeekTrajectory(0);
}

function stepForward() {
  if (AppState.simStatus === 'running') {
    pauseSimulation();
  }

  if (AppState.currentStepIndex < AppState.plan.length) {
    AppState.currentStepIndex++;
    applyStepState(AppState.currentStepIndex);

    if (AppState.currentStepIndex === AppState.plan.length) {
      AppState.simStatus = 'completed';
      updateStatusBadge('completed');
      updatePlayPauseButtons(false);
      showToast('Simulation execution completed.', 'success');
    } else {
      AppState.simStatus = 'paused';
      updateStatusBadge('paused');
      updatePlayPauseButtons(false);
    }
  }
}

function stepBackward() {
  if (AppState.simStatus === 'running') {
    pauseSimulation();
  }

  if (AppState.currentStepIndex > 0) {
    AppState.currentStepIndex--;
    applyStepState(AppState.currentStepIndex);
    AppState.simStatus = 'paused';
    updateStatusBadge('paused');
    updatePlayPauseButtons(false);
  }
}

function scheduleNextAnimationStep() {
  if (AppState.simStatus !== 'running') return;

  const baseDelay = 1200;
  const delay = baseDelay / AppState.playbackSpeed;

  AppState.timerId = setTimeout(() => {
    if (AppState.currentStepIndex < AppState.plan.length) {
      AppState.currentStepIndex++;
      applyStepState(AppState.currentStepIndex);

      if (AppState.currentStepIndex < AppState.plan.length) {
        scheduleNextAnimationStep();
      } else {
        AppState.simStatus = 'completed';
        updateStatusBadge('completed');
        updatePlayPauseButtons(false);
        showToast('All requests serviced successfully!', 'success');
      }
    }
  }, delay);
}

function applyStepState(stepIndex) {
  updateVisualizerState(stepIndex);
  updateMetricCards(stepIndex);
  updateEducationalRationale(stepIndex);
  highlightTraceRow(stepIndex);
  draw2DSeekTrajectory(stepIndex);
  logTimelineActivity(stepIndex);
}

function applyPresetWorkload(presetType) {
  const diskSize = AppState.diskSize;
  let tracks = [];

  switch (presetType) {
    case 'textbook':
      tracks = [98, 183, 37, 122, 14, 124, 65, 67];
      document.getElementById('initialHeadInput').value = 53;
      document.getElementById('directionSelect').value = 'Left';
      break;

    case 'random':
      tracks = Array.from({ length: 10 }, () => Math.floor(Math.random() * (diskSize - 5)) + 2);
      break;

    case 'sequential':
      const start = Math.floor(Math.random() * (diskSize - 40)) + 10;
      tracks = [start, start + 1, start + 3, start + 4, start + 8, start + 10, start + 12, start + 15];
      break;

    case 'clustered':
      const lowCluster = [12, 15, 18, 22];
      const highCluster = [160, 165, 172, 180];
      tracks = [...lowCluster, ...highCluster].sort(() => Math.random() - 0.5);
      break;

    case 'heavy':
      tracks = Array.from({ length: 20 }, () => Math.floor(Math.random() * (diskSize - 2)) + 1);
      break;
  }

  document.getElementById('queueInput').value = tracks.join(', ');
  recomputeSimulationPlan();
  showToast(`Applied preset: ${presetType.toUpperCase()}`);
}

function navigateTo(viewId) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === viewId);
  });

  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === `view-${viewId}`);
  });

  AppState.activeView = viewId;

  const titleMap = {
    overview: { title: 'Overview Dashboard', desc: 'Monitor real-time disk head scheduling metrics, performance snapshot, and system activity.' },
    simulator: { title: 'Disk Simulator', desc: 'Interactive mechanical arm animation, track visualization, and live execution trace.' },
    comparison: { title: 'Algorithm Comparison', desc: 'Direct benchmark matrix and charts for all six disk scheduling strategies.' },
    workload: { title: 'Workload Manager', desc: 'Multi-process I/O dispatching under Fair and Priority queue models.' },
    analytics: { title: 'Performance Analytics', desc: 'Automated insights, efficiency ranking, and seek variance radar.' },
    about: { title: 'About Project', desc: 'Educational documentation, mathematical models, viva reference, and system architecture.' }
  };

  const meta = titleMap[viewId] || titleMap.overview;
  document.getElementById('pageTitle').textContent = meta.title;
  document.getElementById('pageDescription').textContent = meta.desc;

  window.scrollTo(0, 0);

  document.getElementById('sidebar').classList.remove('mobile-open');

  if (viewId === 'comparison') {
    setTimeout(runComparisonBenchmark, 100);
  } else if (viewId === 'simulator') {
    setTimeout(() => draw2DSeekTrajectory(AppState.currentStepIndex), 100);
  }
}

function selectAlgoAndSimulate(algoName) {
  document.getElementById('algoSelect').value = algoName;
  AppState.selectedAlgorithm = algoName;
  recomputeSimulationPlan();
  navigateTo('simulator');
  showToast(`Switched algorithm to ${algoName}.`);
}

function updateStatusBadge(status) {
  const badge = document.getElementById('simStatusBadge');
  const text = document.getElementById('simStatusText');
  badge.className = `status-badge status-${status}`;
  text.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

function updatePlayPauseButtons(isPlaying) {
  const startBtnText = document.getElementById('globalStartText');
  const playPauseText = document.getElementById('playPauseText');

  const globalPlay = document.querySelector('#globalStartBtn .play-icon');
  const globalPause = document.querySelector('#globalStartBtn .pause-icon');
  const simPlay = document.querySelector('#simPlayPauseBtn .play-svg');
  const simPause = document.querySelector('#simPlayPauseBtn .pause-svg');

  if (isPlaying) {
    startBtnText.textContent = 'Pause';
    playPauseText.textContent = 'Pause';
    globalPlay.classList.add('hidden');
    globalPause.classList.remove('hidden');
    simPlay.classList.add('hidden');
    simPause.classList.remove('hidden');
  } else {
    startBtnText.textContent = AppState.simStatus === 'completed' ? 'Restart' : 'Resume';
    playPauseText.textContent = AppState.simStatus === 'completed' ? 'Restart' : 'Play';
    globalPlay.classList.remove('hidden');
    globalPause.classList.add('hidden');
    simPlay.classList.remove('hidden');
    simPause.classList.add('hidden');
  }
}

function logTimelineActivity(stepIndex) {
  if (stepIndex === 0) return;
  const container = document.getElementById('overviewActivityLog');
  const currentStep = AppState.plan[stepIndex - 1];

  const item = document.createElement('div');
  item.className = 'timeline-item';
  item.innerHTML = `
    <strong>Step ${stepIndex}:</strong> Head traversed to cylinder <strong>${currentStep.targetTrack}</strong> (${currentStep.distance} tracks, &Sigma; ${currentStep.cumulativeDistance} tr).
  `;

  if (container.querySelector('.timeline-empty')) {
    container.innerHTML = '';
  }
  container.insertBefore(item, container.firstChild);

  while (container.children.length > 10) {
    container.removeChild(container.lastChild);
  }

  document.getElementById('overviewActivityCount').textContent = `${stepIndex} events`;
}

// Attach functions to window for inline HTML onclick compatibility
window.navigateTo = navigateTo;
window.selectAlgoAndSimulate = selectAlgoAndSimulate;
window.runComparisonBenchmark = runComparisonBenchmark;
window.toggleAppEnabled = toggleAppEnabled;
window.regenerateSingleAppTracks = regenerateSingleAppTracks;
window.removeCustomApp = removeCustomApp;
window.applyPresetWorkload = applyPresetWorkload;
window.startOrResumeSimulation = startOrResumeSimulation;
window.pauseSimulation = pauseSimulation;
window.resetSimulation = resetSimulation;
window.stepForward = stepForward;
window.stepBackward = stepBackward;

// Boot on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.view);
    });
  });

  const sidebar = document.getElementById('sidebar');
  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    sidebar.classList.add('mobile-open');
  });
  document.getElementById('sidebarCloseBtn').addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
  });

  document.getElementById('globalStartBtn').addEventListener('click', () => {
    if (AppState.simStatus === 'running') {
      pauseSimulation();
    } else {
      startOrResumeSimulation();
    }
  });

  document.getElementById('globalResetBtn').addEventListener('click', () => {
    resetSimulation();
  });

  document.getElementById('simPlayPauseBtn').addEventListener('click', () => {
    if (AppState.simStatus === 'running') {
      pauseSimulation();
    } else {
      startOrResumeSimulation();
    }
  });

  document.getElementById('simRestartBtn').addEventListener('click', () => {
    resetSimulation();
  });

  document.getElementById('simStepForwardBtn').addEventListener('click', () => {
    stepForward();
  });

  document.getElementById('simStepBackBtn').addEventListener('click', () => {
    stepBackward();
  });

  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.playbackSpeed = parseFloat(btn.dataset.speed);
    });
  });

  document.getElementById('applyConfigBtn').addEventListener('click', () => {
    recomputeSimulationPlan();
    showToast('Applied new simulation parameters.');
  });

  // Instant reactive updates on ANY parameter change
  document.getElementById('algoSelect').addEventListener('change', () => {
    recomputeSimulationPlan();
    showToast(`Switched algorithm to ${document.getElementById('algoSelect').value}`);
  });
  document.getElementById('directionSelect').addEventListener('change', () => {
    recomputeSimulationPlan();
  });
  document.getElementById('initialHeadInput').addEventListener('input', () => {
    recomputeSimulationPlan();
  });
  document.getElementById('diskSizeInput').addEventListener('input', () => {
    recomputeSimulationPlan();
  });
  document.getElementById('seekTimeRateInput').addEventListener('input', () => {
    recomputeSimulationPlan();
  });
  document.getElementById('queueInput').addEventListener('change', () => {
    recomputeSimulationPlan();
  });

  document.getElementById('clearQueueBtn').addEventListener('click', () => {
    document.getElementById('queueInput').value = '';
    recomputeSimulationPlan();
  });

  document.getElementById('randomQueueBtn').addEventListener('click', () => {
    applyPresetWorkload('random');
  });

  document.getElementById('resetDefaultsBtn').addEventListener('click', () => {
    applyPresetWorkload('textbook');
  });

  document.querySelectorAll('.preset-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      applyPresetWorkload(pill.dataset.preset);
    });
  });

  const eduToggle = document.getElementById('eduModeToggle');
  eduToggle.addEventListener('change', () => {
    AppState.educationalMode = eduToggle.checked;
    document.getElementById('eduModeLabel').textContent = eduToggle.checked ? 'Active' : 'Off';
    document.getElementById('eduReasoningBox').style.display = eduToggle.checked ? 'block' : 'none';
  });

  document.querySelectorAll('input[name="dispatchMode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      AppState.dispatchMode = radio.value;
      updateMergedWorkloadSummary();
    });
  });

  document.getElementById('regenerateWorkloadsBtn').addEventListener('click', () => {
    AppState.applications.forEach(app => regenerateSingleAppTracks(app.id));
    showToast('Regenerated request queues for all applications.');
  });

  document.getElementById('loadWorkloadToSimulatorBtn').addEventListener('click', () => {
    loadMultiAppWorkloadIntoSimulator();
  });

  const addAppModal = document.getElementById('addAppModal');
  document.getElementById('addNewAppBtn').addEventListener('click', () => {
    addAppModal.classList.remove('hidden');
  });
  document.getElementById('closeAddAppModalBtn').addEventListener('click', () => {
    addAppModal.classList.add('hidden');
  });
  document.getElementById('cancelAddAppBtn').addEventListener('click', () => {
    addAppModal.classList.add('hidden');
  });

  document.getElementById('confirmAddAppBtn').addEventListener('click', () => {
    const name = document.getElementById('newAppName').value.trim() || 'Custom Daemon';
    const color = document.getElementById('newAppColor').value;
    const priority = parseInt(document.getElementById('newAppPriority').value, 10);
    const count = parseInt(document.getElementById('newAppReqCount').value, 10) || 3;
    const diskSize = AppState.diskSize;

    const newApp = {
      id: `custom-${Date.now()}`,
      name: name,
      color: color,
      priority: priority,
      enabled: true,
      requestCount: count,
      generatedTracks: Array.from({ length: count }, () => Math.floor(Math.random() * (diskSize - 10)) + 5),
      completedCount: 0
    };

    AppState.applications.push(newApp);
    addAppModal.classList.add('hidden');
    renderApplicationsGrid();
    showToast(`Added custom process: ${name}`);
  });

  window.addEventListener('resize', () => {
    draw2DSeekTrajectory(AppState.currentStepIndex);
  });

  renderApplicationsGrid();
  recomputeSimulationPlan();
  navigateTo('overview');
});
