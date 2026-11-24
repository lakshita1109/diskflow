/**
 * DISKFLOW — DISK VISUALIZER & ANIMATION ENGINE
 * 1. 1D Platter Track Rail & Mechanical Head Carriage
 * 2. 2D Seek Trajectory Canvas (OS Textbook Time × Cylinder Graph)
 */

function renderDiskRailStructure() {
  const rulerLabels = document.getElementById('rulerLabels');
  const requestMarkersLayer = document.getElementById('requestMarkersLayer');
  const diskSize = AppState.diskSize;

  // 1. Render tick labels
  const stepCount = 4;
  let labelsHtml = '';
  for (let i = 0; i <= stepCount; i++) {
    const trackVal = Math.round((i / stepCount) * (diskSize - 1));
    labelsHtml += `<span>${trackVal}</span>`;
  }
  rulerLabels.innerHTML = labelsHtml;

  // 2. Set initial head pin
  const initPct = (AppState.initialHead / (diskSize - 1)) * 100;
  const initialPin = document.getElementById('initialHeadPin');
  initialPin.style.left = `${initPct}%`;
  initialPin.querySelector('.pin-text').textContent = `Init (${AppState.initialHead})`;

  // 3. Render request markers along track
  requestMarkersLayer.innerHTML = '';
  AppState.requestQueue.forEach((req, idx) => {
    const pct = (req.track / (diskSize - 1)) * 100;
    const marker = document.createElement('div');
    marker.className = 'track-marker marker-pending';
    marker.id = `marker-${idx}`;
    marker.style.left = `${pct}%`;
    marker.style.backgroundColor = req.appColor || '#340E19';
    marker.innerHTML = `<span class="marker-tooltip">${req.appName}: Track ${req.track}</span>`;
    marker.addEventListener('click', () => {
      showToast(`Request #${idx + 1} (${req.appName}) at track ${req.track}`);
    });
    requestMarkersLayer.appendChild(marker);
  });
}

function updateVisualizerState(stepIndex) {
  const diskSize = AppState.diskSize;
  const headCarriage = document.getElementById('headCarriage');
  const carriageLabel = document.getElementById('carriageLabel');
  const liveHeadPosition = document.getElementById('liveHeadPosition');
  const liveDirectionBadge = document.getElementById('liveDirectionBadge');
  const liveAccumulatedSeek = document.getElementById('liveAccumulatedSeek');
  const liveProgressStep = document.getElementById('liveProgressStep');

  if (stepIndex === 0) {
    const initPct = (AppState.initialHead / (diskSize - 1)) * 100;
    headCarriage.style.left = `${initPct}%`;
    carriageLabel.textContent = AppState.initialHead;
    liveHeadPosition.textContent = AppState.initialHead;

    // Show the actual direction of the upcoming first step
    const firstStepDir = (AppState.plan && AppState.plan.length > 0) 
      ? AppState.plan[0].direction 
      : AppState.initialDirection;
    liveDirectionBadge.innerHTML = firstStepDir === 'Left' ? '&larr; Left' : '&rarr; Right';
    liveAccumulatedSeek.textContent = '0 tracks';
    liveProgressStep.textContent = `0 / ${AppState.plan.length}`;

    // Reset marker styles
    document.querySelectorAll('.track-marker').forEach(m => {
      m.classList.remove('marker-completed');
      m.classList.add('marker-pending');
    });
    return;
  }

  const currentStep = AppState.plan[stepIndex - 1];
  const targetPct = (currentStep.targetTrack / (diskSize - 1)) * 100;

  // Move mechanical head smoothly
  headCarriage.style.left = `${targetPct}%`;
  carriageLabel.textContent = currentStep.targetTrack;
  liveHeadPosition.textContent = currentStep.targetTrack;

  // Update direction and progress
  liveDirectionBadge.innerHTML = currentStep.direction === 'Left' ? '&larr; Left' : '&rarr; Right';
  liveAccumulatedSeek.textContent = `${currentStep.cumulativeDistance} tracks`;
  liveProgressStep.textContent = `${stepIndex} / ${AppState.plan.length}`;

  // Update request marker states
  const completedRequestIds = new Set();
  for (let i = 0; i < stepIndex; i++) {
    if (AppState.plan[i].servicedRequest) {
      completedRequestIds.add(AppState.plan[i].servicedRequest.id);
    }
  }

  AppState.requestQueue.forEach((req, idx) => {
    const marker = document.getElementById(`marker-${idx}`);
    if (marker) {
      if (completedRequestIds.has(req.id)) {
        marker.classList.remove('marker-pending');
        marker.classList.add('marker-completed');
      } else {
        marker.classList.remove('marker-completed');
        marker.classList.add('marker-pending');
      }
    }
  });
}

function draw2DSeekTrajectory(stepIndex) {
  const canvas = document.getElementById('seekTrajectoryCanvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Handle high-DPI retina displays
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 20, right: 30, bottom: 20, left: 40 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  const diskSize = AppState.diskSize;
  const totalSteps = Math.max(1, AppState.plan.length);

  const trackToX = (t) => padding.left + (t / (diskSize - 1)) * plotW;
  const stepToY = (s) => padding.top + (s / totalSteps) * plotH;

  // 1. Grid Lines & Cylinders
  ctx.strokeStyle = '#E6DDD0';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  const tickTracks = [0, Math.round(diskSize * 0.25), Math.round(diskSize * 0.5), Math.round(diskSize * 0.75), diskSize - 1];
  ctx.fillStyle = '#6B605C';
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';

  tickTracks.forEach(t => {
    const x = trackToX(t);
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
    ctx.fillText(`${t}`, x, height - 6);
  });

  ctx.textAlign = 'right';
  ctx.fillText('0 (Init)', padding.left - 8, padding.top + 3);
  ctx.fillText(`Step ${totalSteps}`, padding.left - 8, height - padding.bottom + 3);

  ctx.setLineDash([]);

  // 2. Trajectory Segments
  const trajectoryPoints = [{ track: AppState.initialHead, step: 0 }];
  for (let i = 0; i < stepIndex; i++) {
    trajectoryPoints.push({
      track: AppState.plan[i].targetTrack,
      step: i + 1,
      isBoundary: !AppState.plan[i].isRequest
    });
  }

  if (trajectoryPoints.length > 1) {
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#340E19';
    ctx.beginPath();
    ctx.moveTo(trackToX(trajectoryPoints[0].track), stepToY(trajectoryPoints[0].step));

    for (let i = 1; i < trajectoryPoints.length; i++) {
      const pt = trajectoryPoints[i];
      ctx.lineTo(trackToX(pt.track), stepToY(pt.step));
    }
    ctx.stroke();
  }

  // 3. Draw Points
  trajectoryPoints.forEach((pt, i) => {
    const px = trackToX(pt.track);
    const py = stepToY(pt.step);

    ctx.beginPath();
    if (i === 0) {
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#1E0A10';
      ctx.fill();
      ctx.strokeStyle = '#FFFDF8';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (i === trajectoryPoints.length - 1) {
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#C86F54';
      ctx.fill();
      ctx.strokeStyle = '#FFFDF8';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = pt.isBoundary ? '#682232' : '#5E7A52';
      ctx.fill();
    }
  });

  document.getElementById('trajAlgoBadge').textContent = AppState.selectedAlgorithm;
}
