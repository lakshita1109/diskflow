/**
 * DISKFLOW — COMPARATIVE ANALYTICS & BENCHMARK SUITE
 * Performance metrics, Chart.js visualizations, automated insights engine
 */

function updateMetricCards(stepIndex) {
  const totalReqs = AppState.requestQueue.length;
  let cumulativeDist = 0;
  let completedCount = 0;

  if (stepIndex > 0) {
    const currentStep = AppState.plan[stepIndex - 1];
    cumulativeDist = currentStep.cumulativeDistance;
    for (let i = 0; i < stepIndex; i++) {
      if (AppState.plan[i].servicedRequest) completedCount++;
    }
  } else if (stepIndex === 0 && AppState.plan.length > 0) {
    const finalStep = AppState.plan[AppState.plan.length - 1];
    cumulativeDist = finalStep.cumulativeDistance;
  }

  const avgSeek = totalReqs > 0 ? (cumulativeDist / totalReqs).toFixed(1) : 0;
  const seekTime = (cumulativeDist * AppState.seekTimeRate).toFixed(0);

  // Simulated Throughput: Seek Time (ms) + Rotational Latency (~4.2ms) + Transfer (~0.5ms) per request
  const totalSimulatedSeconds = (cumulativeDist * AppState.seekTimeRate + completedCount * 4.7) / 1000;
  const throughput = totalSimulatedSeconds > 0 ? (completedCount / totalSimulatedSeconds).toFixed(2) : '0.00';

  document.getElementById('metricTotalRequests').textContent = totalReqs;
  document.getElementById('metricTotalMovement').innerHTML = `${cumulativeDist} <span class="metric-unit">tracks</span>`;
  document.getElementById('metricAvgSeek').innerHTML = `${avgSeek} <span class="metric-unit">tr/req</span>`;
  document.getElementById('metricSeekTime').innerHTML = `${Number(seekTime).toLocaleString()} <span class="metric-unit">ms</span>`;
  document.getElementById('metricThroughput').innerHTML = `${throughput} <span class="metric-unit">req/sec</span>`;
  document.getElementById('metricCompleted').textContent = `${completedCount} / ${totalReqs}`;

  const pct = totalReqs > 0 ? Math.round((completedCount / totalReqs) * 100) : 0;
  document.getElementById('metricProgressBar').style.width = `${pct}%`;
}

function updateOverviewSummary() {
  document.getElementById('sumAlgorithm').textContent = AppState.selectedAlgorithm;
  document.getElementById('sumInitialHead').textContent = `Track ${AppState.initialHead}`;
  document.getElementById('sumDiskSize').textContent = `${AppState.diskSize} Tracks (0 – ${AppState.diskSize - 1})`;
  document.getElementById('sumDirection').innerHTML = AppState.initialDirection === 'Left' ? '&larr; Left (Decreasing)' : '&rarr; Right (Increasing)';
  document.getElementById('sumSeekRate').textContent = `${AppState.seekTimeRate.toFixed(1)} ms / track`;
  document.getElementById('sumRawQueue').textContent = AppState.requestQueue.map(r => r.track).join(', ');
}

function runComparisonBenchmark() {
  const algos = ['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'];
  const results = [];

  algos.forEach(algo => {
    const plan = generateAlgorithmPlan(
      algo,
      AppState.initialHead,
      AppState.requestQueue,
      AppState.diskSize,
      AppState.initialDirection
    );

    const totalMovement = plan.length > 0 ? plan[plan.length - 1].cumulativeDistance : 0;
    const reqCount = AppState.requestQueue.length;
    const avgSeek = reqCount > 0 ? (totalMovement / reqCount).toFixed(1) : 0;
    const seekTime = (totalMovement * AppState.seekTimeRate).toFixed(0);
    const totalSimulatedSeconds = (totalMovement * AppState.seekTimeRate + reqCount * 4.7) / 1000;
    const throughput = totalSimulatedSeconds > 0 ? (reqCount / totalSimulatedSeconds).toFixed(2) : 0;
    const boundaryStops = plan.filter(s => s.boundaryStop || s.circularJump).length;

    results.push({
      algo,
      totalMovement,
      avgSeek: parseFloat(avgSeek),
      seekTime: parseFloat(seekTime),
      throughput: parseFloat(throughput),
      boundaryStops,
      completed: reqCount
    });

    const cardEl = document.getElementById(`cardSeek-${algo}`);
    if (cardEl) {
      cardEl.textContent = `${totalMovement} tracks`;
    }
  });

  results.sort((a, b) => a.totalMovement - b.totalMovement);
  const best = results[0];

  document.getElementById('bestPerformerBadge').textContent = `Best: ${best.algo} (${best.totalMovement} tracks)`;
  document.getElementById('compHeadVal').textContent = AppState.initialHead;
  document.getElementById('compQueueVal').textContent = `${AppState.requestQueue.length} items`;
  document.getElementById('compDiskVal').textContent = `${AppState.diskSize} tracks`;

  const tbody = document.getElementById('comparisonTableBody');
  tbody.innerHTML = '';

  results.forEach(res => {
    const tr = document.createElement('tr');
    const isBest = res.algo === best.algo;
    const efficiencyRel = best.totalMovement > 0 ? Math.round(((res.totalMovement - best.totalMovement) / best.totalMovement) * 100) : 0;
    const effBadge = isBest 
      ? `<span class="badge badge-sage">Optimal (Best)</span>`
      : `<span class="badge badge-neutral">+${efficiencyRel}% Seek</span>`;

    tr.innerHTML = `
      <td><strong>${res.algo}</strong></td>
      <td class="font-mono font-bold text-burgundy">${res.totalMovement} tracks</td>
      <td class="font-mono">${res.avgSeek} tr/req</td>
      <td class="font-mono">${Number(res.seekTime).toLocaleString()} ms</td>
      <td class="font-mono text-sage">${res.throughput} req/s</td>
      <td class="font-mono">${res.completed} / ${res.completed}</td>
      <td class="font-mono">${res.boundaryStops}</td>
      <td>${effBadge}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="selectAlgoAndSimulate('${res.algo}')">Load in Simulator</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderComparisonCharts(results);
  generateAutomatedInsights(results);
}

function renderComparisonCharts(results) {
  if (typeof Chart === 'undefined') return;

  const labels = results.map(r => r.algo);
  const movements = results.map(r => r.totalMovement);
  const avgSeeks = results.map(r => r.avgSeek);
  const seekTimes = results.map(r => r.seekTime);
  const throughputs = results.map(r => r.throughput);

  const colors = {
    burgundy: '#340E19',
    maroon: '#682232',
    terracotta: '#C86F54',
    sage: '#5E7A52',
    dark: '#1E0A10'
  };

  renderBarChart('compChartHeadMovement', labels, movements, 'Tracks', colors.burgundy);
  renderBarChart('compChartAvgSeek', labels, avgSeeks, 'Tracks/Req', colors.maroon);
  renderBarChart('compChartSeekTime', labels, seekTimes, 'Seek Time (ms)', colors.terracotta);
  renderBarChart('compChartThroughput', labels, throughputs, 'Req / Sec', colors.sage);
  renderBarChart('overviewSnapshotChart', labels, movements, 'Head Movement', colors.burgundy);
  renderRadarChart(results);
}

function renderBarChart(canvasId, labels, data, labelName, barColor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (ChartInstances[canvasId]) {
    ChartInstances[canvasId].destroy();
  }

  ChartInstances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: labelName,
        data: data,
        backgroundColor: barColor,
        borderRadius: 4,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#E6DDD0' },
          ticks: { font: { family: 'JetBrains Mono', size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Plus Jakarta Sans', weight: '600', size: 11 } }
        }
      }
    }
  });
}

function renderRadarChart(results) {
  const canvas = document.getElementById('analyticsRadarChart');
  if (!canvas) return;

  if (ChartInstances.analyticsRadar) {
    ChartInstances.analyticsRadar.destroy();
  }

  const maxMovement = Math.max(...results.map(r => r.totalMovement)) || 1;

  ChartInstances.analyticsRadar = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: ['Low Head Travel', 'Uniform Response Time', 'No Boundary Overhead', 'Starvation Resistance', 'Throughput Index'],
      datasets: results.map((r, i) => {
        const colors = ['#340E19', '#682232', '#C86F54', '#5E7A52', '#1E0A10', '#C59B27'];
        const scoreTravel = Math.round((1 - (r.totalMovement / (maxMovement * 1.2))) * 100);
        const scoreUniform = ['C-SCAN', 'C-LOOK'].includes(r.algo) ? 95 : ['SCAN', 'LOOK'].includes(r.algo) ? 75 : 40;
        const scoreNoBoundary = ['LOOK', 'C-LOOK', 'SSTF', 'FCFS'].includes(r.algo) ? 95 : 45;
        const scoreStarvation = r.algo === 'SSTF' ? 20 : ['FCFS'].includes(r.algo) ? 95 : 85;
        const scoreThroughput = Math.round((r.throughput / 10) * 100);

        return {
          label: r.algo,
          data: [scoreTravel, scoreUniform, scoreNoBoundary, scoreStarvation, scoreThroughput],
          borderColor: colors[i % colors.length],
          backgroundColor: colors[i % colors.length] + '1A',
          borderWidth: 2,
          pointRadius: 3
        };
      })
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { display: false },
          grid: { color: '#E6DDD0' }
        }
      }
    }
  });
}

function generateAutomatedInsights(sortedResults) {
  const insightsList = document.getElementById('analyticsInsightsList');
  const leaderboard = document.getElementById('analyticsLeaderboard');
  if (!insightsList || !leaderboard) return;

  const best = sortedResults[0];
  const worst = sortedResults[sortedResults.length - 1];

  const fcfs = sortedResults.find(r => r.algo === 'FCFS');
  const sstf = sortedResults.find(r => r.algo === 'SSTF');
  const scan = sortedResults.find(r => r.algo === 'SCAN');
  const look = sortedResults.find(r => r.algo === 'LOOK');
  const cscan = sortedResults.find(r => r.algo === 'C-SCAN');
  const clook = sortedResults.find(r => r.algo === 'C-LOOK');

  const insights = [];

  const reductionPct = worst.totalMovement > 0 
    ? Math.round(((worst.totalMovement - best.totalMovement) / worst.totalMovement) * 100)
    : 0;
  insights.push(`<strong>${best.algo}</strong> achieved optimal efficiency on this workload, reducing head movement by <strong>${reductionPct}%</strong> compared with ${worst.algo} (${best.totalMovement} vs ${worst.totalMovement} tracks).`);

  if (scan && look) {
    const diff = scan.totalMovement - look.totalMovement;
    if (diff > 0) {
      insights.push(`<strong>LOOK</strong> avoided unnecessary sweeps to disk boundary cylinders, saving <strong>${diff} tracks</strong> (${look.totalMovement} vs ${scan.totalMovement} tracks for SCAN).`);
    } else {
      insights.push(`<strong>LOOK and SCAN</strong> yielded identical head travel because requests extended to the disk boundary cylinders.`);
    }
  }

  if (sstf && fcfs) {
    const sstfSavings = fcfs.totalMovement > 0 
      ? Math.round(((fcfs.totalMovement - sstf.totalMovement) / fcfs.totalMovement) * 100)
      : 0;
    insights.push(`<strong>SSTF</strong> greedy cylinder selection decreased mechanical travel by <strong>${sstfSavings}%</strong> over chronological FCFS, though it introduces starvation risk for outer cylinders.`);
  }

  if (clook && cscan) {
    const clookSavings = cscan.totalMovement - clook.totalMovement;
    insights.push(`<strong>C-LOOK</strong> circular wrap directly connected extreme requested cylinders, shaving <strong>${clookSavings} tracks</strong> off C-SCAN's full-boundary turnaround.`);
  }

  insightsList.innerHTML = insights.map(text => `
    <li class="insight-item">
      <span>&bull;</span>
      <div>${text}</div>
    </li>
  `).join('');

  leaderboard.innerHTML = sortedResults.map((r, idx) => `
    <div class="leaderboard-item">
      <div class="leaderboard-info">
        <span class="leaderboard-rank rank-${idx + 1}">#${idx + 1}</span>
        <span class="leaderboard-name">${r.algo}</span>
      </div>
      <div class="leaderboard-score text-burgundy">${r.totalMovement} tracks <span style="font-size: 0.72rem; color: #6B605C;">(${r.avgSeek} tr/req)</span></div>
    </div>
  `).join('');
}
