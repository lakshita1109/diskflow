/**
 * DISKFLOW — EXECUTION TRACE TABLE & EDUCATIONAL REASONING
 * Manages the live execution log without window viewport displacement
 */

function renderExecutionTraceTable() {
  const tbody = document.getElementById('traceTableBody');
  tbody.innerHTML = '';

  if (AppState.plan.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px; color: #6B605C;">No requests in queue.</td></tr>`;
    return;
  }

  AppState.plan.forEach((step, idx) => {
    const tr = document.createElement('tr');
    tr.id = `trace-row-${idx + 1}`;
    tr.addEventListener('click', () => {
      AppState.currentStepIndex = idx + 1;
      applyStepState(AppState.currentStepIndex);
      pauseSimulation();
    });

    const appTag = step.servicedRequest 
      ? `<span class="badge" style="background-color: ${step.servicedRequest.appColor || '#340E19'}; color: #FFFDF8;">${step.servicedRequest.appName}</span>`
      : `<span class="badge badge-wine">Boundary Reversal</span>`;

    const statusBadge = `<span class="badge badge-neutral" id="status-badge-${idx + 1}">Pending</span>`;

    tr.innerHTML = `
      <td class="font-mono font-bold">${step.stepIndex}</td>
      <td class="font-mono">${step.prevTrack}</td>
      <td class="font-mono font-bold text-burgundy">${step.targetTrack}</td>
      <td>${step.direction === 'Left' ? '&larr; Left' : '&rarr; Right'}</td>
      <td class="font-mono">${step.distance} tr</td>
      <td class="font-mono font-bold">${step.cumulativeDistance} tr</td>
      <td>${appTag}</td>
      <td>${statusBadge}</td>
      <td style="font-size: 0.76rem; color: #6B605C;">${step.explanation}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('traceSummaryText').textContent = `0 of ${AppState.plan.length} completed`;
}

function highlightTraceRow(stepIndex) {
  const total = AppState.plan.length;
  for (let i = 1; i <= total; i++) {
    const row = document.getElementById(`trace-row-${i}`);
    const badge = document.getElementById(`status-badge-${i}`);
    if (!row || !badge) continue;

    if (i < stepIndex) {
      row.className = 'row-completed';
      badge.className = 'badge badge-sage';
      badge.textContent = 'Serviced';
    } else if (i === stepIndex) {
      row.className = 'row-active';
      badge.className = 'badge badge-terracotta';
      badge.textContent = 'Active';

      // Keep viewport completely steady — scroll ONLY the table container, NEVER the window
      const tableWrapper = row.closest('.table-responsive');
      if (tableWrapper && tableWrapper.scrollHeight > tableWrapper.clientHeight) {
        const rowTop = row.offsetTop;
        const currentScroll = tableWrapper.scrollTop;
        const visibleHeight = tableWrapper.clientHeight;
        if (rowTop < currentScroll || rowTop > currentScroll + visibleHeight - 60) {
          tableWrapper.scrollTop = Math.max(0, rowTop - 50);
        }
      }
    } else {
      row.className = '';
      badge.className = 'badge badge-neutral';
      badge.textContent = 'Pending';
    }
  }

  document.getElementById('traceSummaryText').textContent = `${stepIndex} of ${total} completed`;
}

function updateEducationalRationale(stepIndex) {
  const header = document.getElementById('eduStepHeader');
  const explanation = document.getElementById('eduStepExplanation');
  const leftTags = document.getElementById('eduLeftTags');
  const rightTags = document.getElementById('eduRightTags');
  const leftCount = document.getElementById('eduLeftCount');
  const rightCount = document.getElementById('eduRightCount');

  const currHead = stepIndex === 0 ? AppState.initialHead : AppState.plan[stepIndex - 1].targetTrack;

  const completedIds = new Set();
  for (let i = 0; i < stepIndex; i++) {
    if (AppState.plan[i].servicedRequest) {
      completedIds.add(AppState.plan[i].servicedRequest.id);
    }
  }

  const pending = AppState.requestQueue.filter(r => !completedIds.has(r.id));
  const left = pending.filter(r => r.track < currHead).map(r => r.track).sort((a, b) => a - b);
  const right = pending.filter(r => r.track > currHead).map(r => r.track).sort((a, b) => a - b);

  leftCount.textContent = left.length;
  rightCount.textContent = right.length;
  leftTags.textContent = left.length > 0 ? left.join(', ') : 'None';
  rightTags.textContent = right.length > 0 ? right.join(', ') : 'None';

  if (stepIndex === 0) {
    header.textContent = `Initial Position: Cylinder ${AppState.initialHead}`;
    explanation.textContent = `Head parked at ${AppState.initialHead}. Chosen algorithm: ${AppState.selectedAlgorithm}. Initial arm sweep set to ${AppState.initialDirection}.`;
  } else if (stepIndex <= AppState.plan.length) {
    const step = AppState.plan[stepIndex - 1];
    header.textContent = `Step ${stepIndex} (${step.direction} Movement to Track ${step.targetTrack})`;
    explanation.textContent = step.explanation;
  }
}
