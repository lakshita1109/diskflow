/**
 * DISKFLOW — PURE MATHEMATICAL DISK SCHEDULING ALGORITHMS
 * 1. FCFS (First Come First Serve)
 * 2. SSTF (Shortest Seek Time First)
 * 3. SCAN (Elevator Algorithm)
 * 4. C-SCAN (Circular SCAN)
 * 5. LOOK (Optimized Elevator)
 * 6. C-LOOK (Circular LOOK)
 */

/**
 * Normalizes an array of tracks into standard request objects
 */
function prepareRequestObjects(trackList, sourceAppsMap = {}) {
  return trackList.map((track, idx) => {
    const meta = sourceAppsMap[idx] || {
      name: 'Direct I/O',
      color: '#340E19'
    };
    return {
      id: `req-${idx}-${track}-${Date.now()}`,
      orderIndex: idx,
      track: Number(track),
      appName: meta.name || 'User Workload',
      appColor: meta.color || '#340E19'
    };
  });
}

/**
 * 1. FCFS: First Come First Serve
 */
function solveFCFS(initialHead, requests) {
  const plan = [];
  let currHead = initialHead;
  let cumulative = 0;

  requests.forEach((req, idx) => {
    const dist = Math.abs(req.track - currHead);
    const dir = req.track >= currHead ? 'Right' : 'Left';
    cumulative += dist;

    plan.push({
      stepIndex: idx + 1,
      prevTrack: currHead,
      targetTrack: req.track,
      distance: dist,
      direction: dir,
      cumulativeDistance: cumulative,
      isRequest: true,
      servicedRequest: req,
      explanation: `Arrival FIFO order. Traveled from ${currHead} to requested cylinder ${req.track} (|${currHead} - ${req.track}| = ${dist} tracks).`
    });

    currHead = req.track;
  });

  return plan;
}

/**
 * 2. SSTF: Shortest Seek Time First
 */
function solveSSTF(initialHead, requests) {
  const plan = [];
  let currHead = initialHead;
  let cumulative = 0;
  let pending = [...requests];
  let step = 1;

  while (pending.length > 0) {
    let bestIdx = 0;
    let minDist = Infinity;

    for (let i = 0; i < pending.length; i++) {
      const dist = Math.abs(pending[i].track - currHead);
      if (dist < minDist) {
        minDist = dist;
        bestIdx = i;
      } else if (dist === minDist) {
        // Deterministic tie-breaking: prefer lower cylinder
        if (pending[i].track < pending[bestIdx].track) {
          bestIdx = i;
        }
      }
    }

    const selected = pending.splice(bestIdx, 1)[0];
    const dist = Math.abs(selected.track - currHead);
    const dir = selected.track >= currHead ? 'Right' : 'Left';
    cumulative += dist;

    plan.push({
      stepIndex: step++,
      prevTrack: currHead,
      targetTrack: selected.track,
      distance: dist,
      direction: dir,
      cumulativeDistance: cumulative,
      isRequest: true,
      servicedRequest: selected,
      explanation: `Greedy seek: cylinder ${selected.track} is nearest to current head ${currHead} (${dist} tracks away).`
    });

    currHead = selected.track;
  }

  return plan;
}

/**
 * 3. SCAN: Elevator Algorithm
 */
function solveSCAN(initialHead, requests, diskSize, initialDirection) {
  const plan = [];
  let currHead = initialHead;
  let cumulative = 0;
  let step = 1;

  const leftReqs = requests.filter(r => r.track < initialHead).sort((a, b) => b.track - a.track);
  const rightReqs = requests.filter(r => r.track > initialHead).sort((a, b) => a.track - b.track);
  const exactHeadReqs = requests.filter(r => r.track === initialHead);

  // First handle any requests already at initial head
  exactHeadReqs.forEach(req => {
    plan.push({
      stepIndex: step++,
      prevTrack: currHead,
      targetTrack: req.track,
      distance: 0,
      direction: initialDirection,
      cumulativeDistance: cumulative,
      isRequest: true,
      servicedRequest: req,
      explanation: `Immediate servicing of request at initial head cylinder ${req.track} (0 distance).`
    });
  });

  if (initialDirection === 'Left') {
    leftReqs.forEach(req => {
      const dist = Math.abs(req.track - currHead);
      cumulative += dist;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: req.track,
        distance: dist,
        direction: 'Left',
        cumulativeDistance: cumulative,
        isRequest: true,
        servicedRequest: req,
        explanation: `Elevator sweeping Left towards disk boundary: serviced cylinder ${req.track}.`
      });
      currHead = req.track;
    });

    if (rightReqs.length > 0) {
      if (currHead !== 0) {
        const dist = currHead - 0;
        cumulative += dist;
        plan.push({
          stepIndex: step++,
          prevTrack: currHead,
          targetTrack: 0,
          distance: dist,
          direction: 'Left',
          cumulativeDistance: cumulative,
          isRequest: false,
          boundaryStop: true,
          explanation: `SCAN reached lower disk boundary (cylinder 0) and reverses direction to Right.`
        });
        currHead = 0;
      }

      rightReqs.forEach(req => {
        const dist = Math.abs(req.track - currHead);
        cumulative += dist;
        plan.push({
          stepIndex: step++,
          prevTrack: currHead,
          targetTrack: req.track,
          distance: dist,
          direction: 'Right',
          cumulativeDistance: cumulative,
          isRequest: true,
          servicedRequest: req,
          explanation: `Elevator sweeping Right on return journey: serviced cylinder ${req.track}.`
        });
        currHead = req.track;
      });
    }
  } else {
    // Initial Direction is Right
    rightReqs.forEach(req => {
      const dist = Math.abs(req.track - currHead);
      cumulative += dist;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: req.track,
        distance: dist,
        direction: 'Right',
        cumulativeDistance: cumulative,
        isRequest: true,
        servicedRequest: req,
        explanation: `Elevator sweeping Right towards disk boundary: serviced cylinder ${req.track}.`
      });
      currHead = req.track;
    });

    if (leftReqs.length > 0) {
      const maxTrack = diskSize - 1;
      if (currHead !== maxTrack) {
        const dist = maxTrack - currHead;
        cumulative += dist;
        plan.push({
          stepIndex: step++,
          prevTrack: currHead,
          targetTrack: maxTrack,
          distance: dist,
          direction: 'Right',
          cumulativeDistance: cumulative,
          isRequest: false,
          boundaryStop: true,
          explanation: `SCAN reached upper disk boundary (cylinder ${maxTrack}) and reverses direction to Left.`
        });
        currHead = maxTrack;
      }

      leftReqs.forEach(req => {
        const dist = Math.abs(req.track - currHead);
        cumulative += dist;
        plan.push({
          stepIndex: step++,
          prevTrack: currHead,
          targetTrack: req.track,
          distance: dist,
          direction: 'Left',
          cumulativeDistance: cumulative,
          isRequest: true,
          servicedRequest: req,
          explanation: `Elevator sweeping Left on return journey: serviced cylinder ${req.track}.`
        });
        currHead = req.track;
      });
    }
  }

  return plan;
}

/**
 * 4. C-SCAN: Circular SCAN
 */
function solveCSCAN(initialHead, requests, diskSize, initialDirection) {
  const plan = [];
  let currHead = initialHead;
  let cumulative = 0;
  let step = 1;
  const maxTrack = diskSize - 1;

  const leftReqs = requests.filter(r => r.track < initialHead);
  const rightReqs = requests.filter(r => r.track > initialHead);
  const exactHeadReqs = requests.filter(r => r.track === initialHead);

  exactHeadReqs.forEach(req => {
    plan.push({
      stepIndex: step++,
      prevTrack: currHead,
      targetTrack: req.track,
      distance: 0,
      direction: initialDirection,
      cumulativeDistance: cumulative,
      isRequest: true,
      servicedRequest: req,
      explanation: `Immediate servicing of request at initial head cylinder ${req.track}.`
    });
  });

  if (initialDirection === 'Right') {
    rightReqs.sort((a, b) => a.track - b.track).forEach(req => {
      const dist = Math.abs(req.track - currHead);
      cumulative += dist;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: req.track,
        distance: dist,
        direction: 'Right',
        cumulativeDistance: cumulative,
        isRequest: true,
        servicedRequest: req,
        explanation: `C-SCAN sweeping Right: serviced cylinder ${req.track}.`
      });
      currHead = req.track;
    });

    if (leftReqs.length > 0) {
      if (currHead !== maxTrack) {
        const dist = maxTrack - currHead;
        cumulative += dist;
        plan.push({
          stepIndex: step++,
          prevTrack: currHead,
          targetTrack: maxTrack,
          distance: dist,
          direction: 'Right',
          cumulativeDistance: cumulative,
          isRequest: false,
          boundaryStop: true,
          explanation: `C-SCAN reached cylinder ${maxTrack}. Preparing circular jump to cylinder 0.`
        });
        currHead = maxTrack;
      }

      const jumpDist = maxTrack - 0;
      cumulative += jumpDist;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: 0,
        distance: jumpDist,
        direction: 'Left',
        cumulativeDistance: cumulative,
        isRequest: false,
        circularJump: true,
        explanation: `C-SCAN circular return jump from ${maxTrack} to 0 without servicing I/O on return.`
      });
      currHead = 0;

      leftReqs.sort((a, b) => a.track - b.track).forEach(req => {
        const dist = Math.abs(req.track - currHead);
        cumulative += dist;
        plan.push({
          stepIndex: step++,
          prevTrack: currHead,
          targetTrack: req.track,
          distance: dist,
          direction: 'Right',
          cumulativeDistance: cumulative,
          isRequest: true,
          servicedRequest: req,
          explanation: `C-SCAN sweeping Right after wrap: serviced cylinder ${req.track}.`
        });
        currHead = req.track;
      });
    }
  } else {
    // Initial Direction is Left
    leftReqs.sort((a, b) => b.track - a.track).forEach(req => {
      const dist = Math.abs(req.track - currHead);
      cumulative += dist;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: req.track,
        distance: dist,
        direction: 'Left',
        cumulativeDistance: cumulative,
        isRequest: true,
        servicedRequest: req,
        explanation: `C-SCAN sweeping Left: serviced cylinder ${req.track}.`
      });
      currHead = req.track;
    });

    if (rightReqs.length > 0) {
      if (currHead !== 0) {
        const dist = currHead - 0;
        cumulative += dist;
        plan.push({
          stepIndex: step++,
          prevTrack: currHead,
          targetTrack: 0,
          distance: dist,
          direction: 'Left',
          cumulativeDistance: cumulative,
          isRequest: false,
          boundaryStop: true,
          explanation: `C-SCAN reached cylinder 0. Preparing circular jump to cylinder ${maxTrack}.`
        });
        currHead = 0;
      }

      const jumpDist = maxTrack - 0;
      cumulative += jumpDist;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: maxTrack,
        distance: jumpDist,
        direction: 'Right',
        cumulativeDistance: cumulative,
        isRequest: false,
        circularJump: true,
        explanation: `C-SCAN circular return jump from 0 to ${maxTrack} without servicing I/O.`
      });
      currHead = maxTrack;

      rightReqs.sort((a, b) => b.track - a.track).forEach(req => {
        const dist = Math.abs(req.track - currHead);
        cumulative += dist;
        plan.push({
          stepIndex: step++,
          prevTrack: currHead,
          targetTrack: req.track,
          distance: dist,
          direction: 'Left',
          cumulativeDistance: cumulative,
          isRequest: true,
          servicedRequest: req,
          explanation: `C-SCAN sweeping Left after wrap: serviced cylinder ${req.track}.`
        });
        currHead = req.track;
      });
    }
  }

  return plan;
}

/**
 * 5. LOOK: Lookahead Elevator
 */
function solveLOOK(initialHead, requests, initialDirection) {
  const plan = [];
  let currHead = initialHead;
  let cumulative = 0;
  let step = 1;

  const leftReqs = requests.filter(r => r.track < initialHead).sort((a, b) => b.track - a.track);
  const rightReqs = requests.filter(r => r.track > initialHead).sort((a, b) => a.track - b.track);
  const exactHeadReqs = requests.filter(r => r.track === initialHead);

  exactHeadReqs.forEach(req => {
    plan.push({
      stepIndex: step++,
      prevTrack: currHead,
      targetTrack: req.track,
      distance: 0,
      direction: initialDirection,
      cumulativeDistance: cumulative,
      isRequest: true,
      servicedRequest: req,
      explanation: `Immediate servicing of request at initial head cylinder ${req.track}.`
    });
  });

  if (initialDirection === 'Left') {
    leftReqs.forEach((req, idx) => {
      const dist = Math.abs(req.track - currHead);
      cumulative += dist;
      const isLast = idx === leftReqs.length - 1;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: req.track,
        distance: dist,
        direction: 'Left',
        cumulativeDistance: cumulative,
        isRequest: true,
        servicedRequest: req,
        explanation: isLast && rightReqs.length > 0 
          ? `LOOK reached furthest pending request on left (${req.track}). Reversing directly without touching boundary 0!`
          : `LOOK sweeping Left: serviced cylinder ${req.track}.`
      });
      currHead = req.track;
    });

    rightReqs.forEach(req => {
      const dist = Math.abs(req.track - currHead);
      cumulative += dist;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: req.track,
        distance: dist,
        direction: 'Right',
        cumulativeDistance: cumulative,
        isRequest: true,
        servicedRequest: req,
        explanation: `LOOK sweeping Right on return journey: serviced cylinder ${req.track}.`
      });
      currHead = req.track;
    });
  } else {
    // Initial Direction is Right
    rightReqs.forEach((req, idx) => {
      const dist = Math.abs(req.track - currHead);
      cumulative += dist;
      const isLast = idx === rightReqs.length - 1;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: req.track,
        distance: dist,
        direction: 'Right',
        cumulativeDistance: cumulative,
        isRequest: true,
        servicedRequest: req,
        explanation: isLast && leftReqs.length > 0
          ? `LOOK reached furthest pending request on right (${req.track}). Reversing directly without touching boundary!`
          : `LOOK sweeping Right: serviced cylinder ${req.track}.`
      });
      currHead = req.track;
    });

    leftReqs.forEach(req => {
      const dist = Math.abs(req.track - currHead);
      cumulative += dist;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: req.track,
        distance: dist,
        direction: 'Left',
        cumulativeDistance: cumulative,
        isRequest: true,
        servicedRequest: req,
        explanation: `LOOK sweeping Left on return journey: serviced cylinder ${req.track}.`
      });
      currHead = req.track;
    });
  }

  return plan;
}

/**
 * 6. C-LOOK: Circular LOOK
 */
function solveCLOOK(initialHead, requests, initialDirection) {
  const plan = [];
  let currHead = initialHead;
  let cumulative = 0;
  let step = 1;

  const leftReqs = requests.filter(r => r.track < initialHead);
  const rightReqs = requests.filter(r => r.track > initialHead);
  const exactHeadReqs = requests.filter(r => r.track === initialHead);

  exactHeadReqs.forEach(req => {
    plan.push({
      stepIndex: step++,
      prevTrack: currHead,
      targetTrack: req.track,
      distance: 0,
      direction: initialDirection,
      cumulativeDistance: cumulative,
      isRequest: true,
      servicedRequest: req,
      explanation: `Immediate servicing of request at initial head cylinder ${req.track}.`
    });
  });

  if (initialDirection === 'Right') {
    rightReqs.sort((a, b) => a.track - b.track).forEach(req => {
      const dist = Math.abs(req.track - currHead);
      cumulative += dist;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: req.track,
        distance: dist,
        direction: 'Right',
        cumulativeDistance: cumulative,
        isRequest: true,
        servicedRequest: req,
        explanation: `C-LOOK sweeping Right: serviced cylinder ${req.track}.`
      });
      currHead = req.track;
    });

    if (leftReqs.length > 0) {
      const sortedLeft = leftReqs.sort((a, b) => a.track - b.track);
      const lowestReq = sortedLeft[0];

      const jumpDist = Math.abs(lowestReq.track - currHead);
      cumulative += jumpDist;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: lowestReq.track,
        distance: jumpDist,
        direction: 'Left',
        cumulativeDistance: cumulative,
        isRequest: true,
        servicedRequest: lowestReq,
        circularJump: true,
        explanation: `C-LOOK circular jump directly from ${currHead} to lowest requested cylinder ${lowestReq.track} (skipping boundary).`
      });
      currHead = lowestReq.track;

      sortedLeft.slice(1).forEach(req => {
        const dist = Math.abs(req.track - currHead);
        cumulative += dist;
        plan.push({
          stepIndex: step++,
          prevTrack: currHead,
          targetTrack: req.track,
          distance: dist,
          direction: 'Right',
          cumulativeDistance: cumulative,
          isRequest: true,
          servicedRequest: req,
          explanation: `C-LOOK sweeping Right after wrap: serviced cylinder ${req.track}.`
        });
        currHead = req.track;
      });
    }
  } else {
    // Initial Direction is Left
    leftReqs.sort((a, b) => b.track - a.track).forEach(req => {
      const dist = Math.abs(req.track - currHead);
      cumulative += dist;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: req.track,
        distance: dist,
        direction: 'Left',
        cumulativeDistance: cumulative,
        isRequest: true,
        servicedRequest: req,
        explanation: `C-LOOK sweeping Left: serviced cylinder ${req.track}.`
      });
      currHead = req.track;
    });

    if (rightReqs.length > 0) {
      const sortedRight = rightReqs.sort((a, b) => b.track - a.track);
      const highestReq = sortedRight[0];

      const jumpDist = Math.abs(highestReq.track - currHead);
      cumulative += jumpDist;
      plan.push({
        stepIndex: step++,
        prevTrack: currHead,
        targetTrack: highestReq.track,
        distance: jumpDist,
        direction: 'Right',
        cumulativeDistance: cumulative,
        isRequest: true,
        servicedRequest: highestReq,
        circularJump: true,
        explanation: `C-LOOK circular jump directly from ${currHead} to highest requested cylinder ${highestReq.track} (skipping boundary).`
      });
      currHead = highestReq.track;

      sortedRight.slice(1).forEach(req => {
        const dist = Math.abs(req.track - currHead);
        cumulative += dist;
        plan.push({
          stepIndex: step++,
          prevTrack: currHead,
          targetTrack: req.track,
          distance: dist,
          direction: 'Left',
          cumulativeDistance: cumulative,
          isRequest: true,
          servicedRequest: req,
          explanation: `C-LOOK sweeping Left after wrap: serviced cylinder ${req.track}.`
        });
        currHead = req.track;
      });
    }
  }

  return plan;
}

/**
 * Dispatch solver for any algorithm
 */
function generateAlgorithmPlan(algoName, initialHead, requests, diskSize, initialDirection) {
  if (!requests || requests.length === 0) return [];

  switch (algoName) {
    case 'FCFS':
      return solveFCFS(initialHead, requests);
    case 'SSTF':
      return solveSSTF(initialHead, requests);
    case 'SCAN':
      return solveSCAN(initialHead, requests, diskSize, initialDirection);
    case 'C-SCAN':
      return solveCSCAN(initialHead, requests, diskSize, initialDirection);
    case 'LOOK':
      return solveLOOK(initialHead, requests, initialDirection);
    case 'C-LOOK':
      return solveCLOOK(initialHead, requests, initialDirection);
    default:
      return solveSCAN(initialHead, requests, diskSize, initialDirection);
  }
}
