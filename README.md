# 💽 DISKFLOW — Disk Scheduling & I/O Performance Simulator

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/No_Backend-Pure_Static-green?style=for-the-badge" alt="No Backend"/>
  <img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white" alt="Chart.js"/>
</p>

<p align="center">
  A beautiful, fully interactive simulator for classic disk scheduling algorithms — built with pure HTML, CSS, and JavaScript. No backend. No build step. Just open <code>index.html</code>.
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎬 **Live 1D Animation** | Watch the disk head sweep across the platter rail in real time |
| 📐 **2D Seek Trajectory** | Canvas-drawn seek-time vs cylinder chart for every algorithm |
| 📊 **Algorithm Comparison** | Side-by-side bar + radar charts across all 6 algorithms |
| 🧮 **Workload Manager** | Simulate multi-process I/O queues with Fair / Priority scheduling |
| 📈 **Analytics Dashboard** | Benchmarks, seek-rate distributions, efficiency leaderboard |
| 📋 **Trace Table** | Step-by-step head movement log with cumulative seek times |
| ⚡ **Instant Reactivity** | Every parameter change triggers instant re-simulation |
| 🎨 **Dark Burgundy UI** | Elegant sidebar with Outfit + Plus Jakarta Sans typography |

---

## 🧠 Algorithms Implemented

| Algorithm | Full Name | Key Characteristic |
|---|---|---|
| **FCFS** | First Come First Served | Requests served in arrival order |
| **SSTF** | Shortest Seek Time First | Greedy — nearest cylinder wins |
| **SCAN** | Elevator Algorithm | Head sweeps end-to-end, serves en-route |
| **C-SCAN** | Circular SCAN | Returns to 0 after reaching end, one-directional |
| **LOOK** | Optimized SCAN | Reverses at last request, not disk end |
| **C-LOOK** | Circular LOOK | Like LOOK but jumps back after last request |

---

## 🚀 Quick Start

### Option 1 — Open directly (simplest)
```bash
# Double-click index.html
# or in your terminal:
start index.html          # Windows
open index.html           # macOS
xdg-open index.html       # Linux
```

### Option 2 — Python local server (recommended for Chromium strict-origin)
```bash
cd diskflow
python -m http.server 8080
# Then open: http://localhost:8080
```

### Option 3 — Node.js serve
```bash
npx serve .
# Then open the printed localhost URL
```

---

## 📁 File Structure

```
diskflow/
├── index.html              # Main entry point (all views)
│
├── css/
│   ├── variables.css       # Design tokens — colors, fonts, spacing
│   ├── layout.css          # Sidebar, header, responsive grid
│   ├── components.css      # Buttons, cards, modals, toasts, tables
│   ├── simulator.css       # 1D platter rail, carriage, 2D canvas
│   └── views.css           # Overview, Comparison, Workload, Analytics, About
│
├── js/
│   ├── state.js            # AppState store (single source of truth)
│   ├── algorithms.js       # Pure math: FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK
│   ├── visualizer.js       # 1D animation + 2D canvas trajectory render
│   ├── trace.js            # Trace table render + scroll management
│   ├── workload.js         # Multi-app Fair/Priority I/O synthesis
│   ├── analytics.js        # Benchmarks, Chart.js charts, leaderboard
│   └── app.js              # Orchestrator — events, navigation, re-simulation
│
├── package.json            # Dev convenience scripts (open, serve)
├── .gitignore
└── README.md
```

---

## 🔬 Algorithm Verification (Silberschatz Textbook)

Default parameters: **Head = 53**, **Queue = [98, 183, 37, 122, 14, 124, 65, 67]**, **Disk = 0–199**

| Algorithm | Expected Total Seek | Direction |
|---|---|---|
| FCFS | **640 cylinders** | Arrival order |
| SSTF | **236 cylinders** | Greedy nearest |
| SCAN | **236 cylinders** | Initial → Right |
| C-SCAN | **382 cylinders** | Initial → Right |
| LOOK | **208 cylinders** | Initial → Right |
| C-LOOK | **322 cylinders** | Initial → Right |

> Values match *Operating System Concepts* (Silberschatz, Galvin, Gagne) — Chapter 10.

---

## 🛠 Tech Stack

| Library / Tool | Version | Usage |
|---|---|---|
| **Chart.js** | 4.x (CDN) | Bar + Radar charts in Comparison & Analytics |
| **Google Fonts** | Outfit, Plus Jakarta Sans, JetBrains Mono | Typography |
| **Vanilla JS** | ES2020 | All logic — no frameworks |
| **HTML5 Canvas** | Native | 2D seek trajectory drawing |

---

## 📸 Screenshots

> _Coming soon — open `index.html` to see the live simulator!_

### Simulator View
- Real-time 1D platter animation with seek needle
- Cylinder movement trace table
- 2D seek trajectory canvas

### Comparison View
- Bar chart: total seek distance per algorithm
- Radar chart: multi-metric performance comparison

### Analytics View
- Benchmark leaderboard
- Seek distribution histogram
- Performance insights

---

## 🤝 Contributing

Pull requests are welcome! To contribute:

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made with ❤️ and way too much coffee — DISKFLOW</p>
