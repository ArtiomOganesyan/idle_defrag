# DEFRAG_FS (Idle Defragmenter)

```text
  ____  _____ _____ ____      _    ____     _____ ____  
 |  _ \| ____|  ___|  _ \    / \  / ___|   |  ___/ ___| 
 | | | |  _| | |_  | |_) |  / _ \| |  _    | |_  \___ \ 
 | |_| | |___|  _| |  _ <  / ___ \ |_| |   |  _|  ___) |
 |____/|_____|_|   |_| \_\/_/   \_\____|___|_|   |____/ 
                                       |_____|          
 [ Vintage Disk Defragmenter Simulator & Idle Clicker Terminal ]
```

> A terminal-inspired vintage disk defragmentation simulator, idle incremental game, and productivity Pomodoro workstation.

**Live Demo:** [https://ArtiomOganesyan.github.io/idle_defrag/](https://ArtiomOganesyan.github.io/idle_defrag/)  
**GitHub Repository:** [https://github.com/ArtiomOganesyan/idle_defrag](https://github.com/ArtiomOganesyan/idle_defrag)

---

## Features

- **Interactive Cluster Grid**: Real-time sector visualization featuring contiguous blocks, fragmented clusters, unallocated space, system files, and dynamic bit-rot bad sectors.
- **Dual Idle & Active Gameplay**: Manually sweep cluster sectors with drive heads using `[SPACE]`, or automate head operations through RPM spindle upgrades and read-ahead caches.
- **Background Defrag & Ingestion Daemons**: Background daemon worker threads (`cron.daily`, `syslog`, `journald`) continually write data and fragment clusters for continuous defragmentation loops.
- **Built-in Pomodoro Focus Protocol**:
  - `★ FOCUS`: Active defrag session (25m default) with live multiplier boost.
  - `c[_] BREAK`: Short rest cycle (5m default) with drive heads safely parked.
  - `zZz LONG`: Extended rest cycle (15m default) automatically unlocked after every 4 completed work sessions.
- **Prestige Mechanism (`FORMAT DISK`)**: Wipe and low-level reformat the drive to earn permanent Prestige Points granting additive throughput multipliers.
- **Retro Terminal Aesthetic**:
  - Authentic CRT scanline flicker toggle (`[C]`).
  - Web Audio API PC speaker click synthesizer (`[M]`).
  - Multiple classic phosphor palettes (`[T]`): Retro Amber, Matrix Green, Cyberpunk Magenta, DOS Classic, and more.
- **Keyboard-Driven Shortcuts**: Full terminal hotkey navigation for power users.

---

## Keyboard Controls

| Hotkey | Action |
|---|---|
| `[SPACE]` | Manual cluster defrag pulse |
| `[P]` | Toggle Pomodoro focus timer |
| `[F]` | Open Format Disk / Prestige modal |
| `[R]` | Inject random fragmented data burst |
| `[T]` | Cycle terminal theme color scheme |
| `[M]` | Toggle PC speaker sound synthesis |
| `[C]` | Toggle CRT scanline overlay |
| `[?]` | Toggle terminal manual & help dialog |
| `[1] - [5]` | Switch sidebar dock panels (Tuning, Legend, Log, Daemons, Threads) |

---

## Getting Started

### Prerequisites
- Node.js (v18 or newer recommended)
- npm or bun

### Installation
```bash
# Clone repository
git clone https://github.com/ArtiomOganesyan/idle_defrag.git
cd idle_defrag

# Install dependencies
npm install

# Start local development server (runs on port 3000)
npm run dev
```

### Production Build & GitHub Pages Deployment
```bash
# Build production bundle
npm run build

# Deploy to GitHub Pages
npm run deploy
```

---

## License & Usage Terms

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)**.

### Summary of Terms:
- **Public & Non-Commercial**: You are welcome to view, study, share, experiment with, and adapt this code for **personal, non-commercial, and educational purposes**.
- **No Commercial Use**: You **MAY NOT** sell, monetize, copy, or redistribute this codebase or derivatives thereof for commercial purposes, financial gain, or in connection with paid services without prior written permission from the copyright owner.
- **Attribution Required**: Any permitted personal or educational reuse must provide appropriate credit and retain the original copyright notice.

See the full [LICENSE](./LICENSE) file for complete legal terms.

Copyright (c) 2024-2026 **Artiom Oganesyan**. All rights reserved.
