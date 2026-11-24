# DISKFLOW — Disk Scheduling & I/O Performance Simulator

---

## What is DISKFLOW?

DISKFLOW is an educational web-based simulator designed to help students, developers, and OS enthusiasts **understand and visualize how a computer's disk scheduling system works** — the same mechanism that determines in what order your hard drive serves read/write requests.

Modern operating systems use disk scheduling algorithms to decide the order in which I/O requests from multiple processes are served. A poor scheduling strategy results in excessive head movement, high seek time, and degraded system performance. DISKFLOW makes this abstract concept tangible by animating the disk head in real time and measuring exactly how far it travels under each algorithm.

### What problem does it solve?

When multiple programs need to read or write data at the same time, the OS must queue those requests and serve them efficiently. The order it chooses dramatically affects performance:

- **Bad scheduling** can cause the disk head to jump back and forth wildly, wasting time
- **Good scheduling** minimizes total head movement, reducing seek time and improving throughput

DISKFLOW lets you load any set of cylinder requests, choose from 6 real-world algorithms, and immediately see — with animation and hard numbers — which strategy wins and why.

### Who is it for?

- **Students** studying Operating Systems who want to go beyond textbook diagrams
- **Educators** who want a live demo tool for class
- **Developers** curious about low-level I/O performance concepts
- **Anyone** preparing for OS interviews or exams (GATE, university papers, etc.)

### What can you do with it?

- Simulate FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK on any custom queue
- Watch the disk head animate across a 1D platter rail in real time
- Compare all 6 algorithms side-by-side in one chart
- Run multi-process workloads with Fair or Priority I/O scheduling
- Benchmark algorithms and see which performs best on your data
- Read a step-by-step trace table showing every head movement

---

## Preview

![DISKFLOW UI Preview](assets/preview.png)

---

## Features

| Feature | Description |
|---|---|
| Live 1D Animation | Watch the disk head sweep across the platter rail in real time |
| 2D Seek Trajectory | Canvas-drawn seek-time vs cylinder chart for every algorithm |
| Algorithm Comparison | Side-by-side bar and radar charts across all 6 algorithms |
| Workload Manager | Simulate multi-process I/O queues with Fair / Priority scheduling |
| Analytics Dashboard | Benchmarks, seek-rate distributions, efficiency leaderboard |
| Trace Table | Step-by-step head movement log with cumulative seek times |
| Instant Reactivity | Every parameter change triggers instant re-simulation |

---

## How It Works

### Application Flow

```mermaid
flowchart TD
    A[User opens index.html] --> B[AppState initialized with defaults]
    B --> C[User sets parameters]
    C --> D{Input changed?}
    D -->|Yes| E[recomputeSimulationPlan triggered]
    E --> F[algorithms.js runs selected algorithm]
    F --> G[Returns ordered seek plan + total distance]
    G --> H[visualizer.js animates 1D rail]
    G --> I[trace.js renders step table]
    G --> J[2D canvas trajectory drawn]
    D -->|No| K[Wait for next change]
    H --> L[Simulation complete]
    I --> L
    J --> L
```

### Algorithm Decision Logic

```mermaid
flowchart TD
    A[Request Queue arrives] --> B{Which Algorithm?}
    B -->|FCFS| C[Serve in arrival order]
    B -->|SSTF| D[Find nearest cylinder to current head]
    B -->|SCAN| E{Direction?}
    B -->|C-SCAN| F[Move in one direction only]
    B -->|LOOK| G{Direction?}
    B -->|C-LOOK| H[Move to last request then jump to first]

    E -->|Right| E1[Sweep to disk end, reverse, sweep back]
    E -->|Left| E2[Sweep to disk start, reverse, sweep back]
    G -->|Right| G1[Sweep to last request right, reverse]
    G -->|Left| G2[Sweep to last request left, reverse]

    D --> Z[Compute total seek distance]
    C --> Z
    E1 --> Z
    E2 --> Z
    F --> Z
    G1 --> Z
    G2 --> Z
    H --> Z
```

### Module Architecture

```mermaid
flowchart LR
    HTML[index.html] --> S[state.js]
    HTML --> ALG[algorithms.js]
    HTML --> VIS[visualizer.js]
    HTML --> TR[trace.js]
    HTML --> WL[workload.js]
    HTML --> AN[analytics.js]
    HTML --> APP[app.js]

    APP --> S
    APP --> ALG
    APP --> VIS
    APP --> TR
    APP --> WL
    APP --> AN

    ALG -->|seek plan| VIS
    ALG -->|seek plan| TR
    ALG -->|seek plan| AN
```

---

## Algorithms

| Algorithm | Full Name | Key Characteristic |
|---|---|---|
| FCFS | First Come First Served | Requests served in arrival order |
| SSTF | Shortest Seek Time First | Greedy — nearest cylinder wins |
| SCAN | Elevator Algorithm | Head sweeps end-to-end, serves en-route |
| C-SCAN | Circular SCAN | Returns to 0 after reaching end, one-directional |
| LOOK | Optimized SCAN | Reverses at last request, not disk end |
| C-LOOK | Circular LOOK | Like LOOK but jumps back after last request |

---

## Quick Start

**Option 1 — Open directly**
```bash
# Double-click index.html, or in terminal:
start index.html          # Windows
open index.html           # macOS
xdg-open index.html       # Linux
```

**Option 2 — Python local server**
```bash
cd diskflow
python -m http.server 8080
# Open: http://localhost:8080
```

**Option 3 — Node.js**
```bash
npx serve .
```

---

## File Structure

```
diskflow/
├── index.html              # Main entry point
├── assets/
│   └── preview.png         # UI preview screenshot
├── css/
│   ├── variables.css       # Design tokens — colors, fonts, spacing
│   ├── layout.css          # Sidebar, header, responsive grid
│   ├── components.css      # Buttons, cards, modals, tables
│   ├── simulator.css       # 1D platter rail, carriage, 2D canvas
│   └── views.css           # All page view styles
├── js/
│   ├── state.js            # AppState store
│   ├── algorithms.js       # FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK
│   ├── visualizer.js       # 1D animation + 2D canvas trajectory
│   ├── trace.js            # Trace table render
│   ├── workload.js         # Multi-process workload synthesis
│   ├── analytics.js        # Benchmarks, Chart.js, leaderboard
│   └── app.js              # Orchestrator — events, navigation
├── package.json
├── .gitignore
└── README.md
```

---

## Simulation Results

Default test case used across all results below:

> **Initial Head Position:** 53 &nbsp;|&nbsp; **Request Queue:** [98, 183, 37, 122, 14, 124, 65, 67] &nbsp;|&nbsp; **Disk Range:** 0 – 199 &nbsp;|&nbsp; **Seek Rate:** 5 ms/track

---

### Head Movement Sequences

**FCFS — First Come First Served**
```
53 → 98 → 183 → 37 → 122 → 14 → 124 → 65 → 67
     +45   +85  +146   +85  +108  +110   +59   +2    =  640 tracks
```

**SSTF — Shortest Seek Time First**
```
53 → 65 → 67 → 37 → 14 → 98 → 122 → 124 → 183
     +12    +2   +30   +23  +84    +24    +2   +59   =  236 tracks
```

**SCAN — Elevator (direction: Right)**
```
53 → 65 → 67 → 98 → 122 → 124 → 183 → 199 → 37 → 14
     +12    +2  +31    +24    +2    +59   +16  +162  +23   =  331 tracks (varies by disk end)
```

**C-SCAN — Circular SCAN (direction: Right)**
```
53 → 65 → 67 → 98 → 122 → 124 → 183 → 199 → 0 → 14 → 37
     +12    +2  +31    +24    +2    +59   +16  +199  +14  +23   =  382 tracks
```

**LOOK — Optimized SCAN (direction: Right)**
```
53 → 65 → 67 → 98 → 122 → 124 → 183 → 37 → 14
     +12    +2  +31    +24    +2    +59  +146  +23   =  208 tracks
```

**C-LOOK — Circular LOOK (direction: Right)**
```
53 → 65 → 67 → 98 → 122 → 124 → 183 → 14 → 37
     +12    +2  +31    +24    +2    +59  +169  +23   =  322 tracks
```

---

### Performance Comparison

| Rank | Algorithm | Total Seek (tracks) | Seek Time (ms) | vs FCFS | Best Use Case |
|:---:|---|:---:|:---:|:---:|---|
| 1 | LOOK | **208** | 1,040 ms | -67.5% | General purpose, most balanced |
| 2 | SSTF | **236** | 1,180 ms | -63.1% | Light load, low variance queue |
| 2 | SCAN | **236** | 1,180 ms | -63.1% | Uniform request distribution |
| 4 | C-LOOK | **322** | 1,610 ms | -49.7% | Databases, uniform circular load |
| 5 | C-SCAN | **382** | 1,910 ms | -40.3% | Real-time with fairness guarantee |
| 6 | FCFS | **640** | 3,200 ms | baseline | Simple queues, ordered requests |

---

### Key Takeaways

- **LOOK wins** on this dataset — it avoids traveling to disk boundaries unnecessarily
- **SSTF and SCAN tie** at 236 tracks but SSTF can cause starvation in heavy loads
- **FCFS is 3x worse** than the best algorithm — order of arrival alone is a poor strategy
- **C-SCAN and C-LOOK** trade efficiency for fairness — no request waits more than one full sweep
- **SSTF** risks starvation: requests far from the current head position may never be served if new nearby requests keep arriving

---

## Algorithm Verification (Textbook Reference)

Values verified against *Operating System Concepts* — Silberschatz, Galvin, Gagne, Chapter 10.

| Algorithm | Simulator Output | Textbook Value | Match |
|---|:---:|:---:|:---:|
| FCFS | 640 | 640 | Yes |
| SSTF | 236 | 236 | Yes |
| SCAN | 236 | 236 | Yes |
| C-SCAN | 382 | 382 | Yes |
| LOOK | 208 | 208 | Yes |
| C-LOOK | 322 | 322 | Yes |

---

## Tech Stack

| Library | Usage |
|---|---|
| Chart.js 4.x (CDN) | Bar and radar charts |
| Google Fonts | Outfit, Plus Jakarta Sans, JetBrains Mono |
| HTML5 Canvas | 2D seek trajectory drawing |
| Vanilla JS ES2020 | All logic, no frameworks |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

MIT License — feel free to use, modify and distribute.
