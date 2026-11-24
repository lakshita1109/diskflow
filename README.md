# DISKFLOW — Disk Scheduling & I/O Performance Simulator

A fully interactive simulator for classic disk scheduling algorithms built with pure HTML, CSS, and JavaScript. No backend. No build step. Just open `index.html`.

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

## Algorithm Verification

Default parameters: **Head = 53**, **Queue = [98, 183, 37, 122, 14, 124, 65, 67]**, **Disk = 0–199**

| Algorithm | Expected Total Seek | Reference |
|---|---|---|
| FCFS | 640 cylinders | Silberschatz Ch.10 |
| SSTF | 236 cylinders | Silberschatz Ch.10 |
| SCAN | 236 cylinders | Silberschatz Ch.10 |
| C-SCAN | 382 cylinders | Silberschatz Ch.10 |
| LOOK | 208 cylinders | Silberschatz Ch.10 |
| C-LOOK | 322 cylinders | Silberschatz Ch.10 |

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
