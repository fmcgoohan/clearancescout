# Phase 5 Quickstart & End-to-End Validation Guide

**Feature**: [`specs/028-phase5-judge-ready/spec.md`](./spec.md)
**Date**: 2026-09-01
**Status**: Ready

---

## 1. Overview & Prerequisites

This quickstart guide provides step-by-step instructions to validate all Phase 5 capabilities locally and against the live Cloud Run deployment.

### Prerequisites
- Node.js v20.x
- Google Chrome / Playwright browser binaries
- Cloud Run deployment access (or local port `8088`)

---

## 2. Validation Scenarios

### Scenario 1: Judge Demo Token & Baseline Metrics Verification
**Objective**: Confirm immediate authenticated entry via `judge-pass-2026` with exact baseline state.

```bash
# 1. Run live audit against Cloud Run
node tests/repro_live.js
```

**Expected Results**:
- Project Title: `The Neon Horizon`
- Project Code: `[PRJ-NEON-HORIZON]` (Zero occurrences of `PRJ-DEFAULT`)
- Shooting Readiness: `33.3%`
- Blocked Scenes: `2` (`Red (Blocked): 2`)
- Navigation Tabs: `Screenplay (3 scenes)`, `Clearance Items (7)`, `Department Tasks (11 Open)`
- Summary Bar: `Summary: 3 Cleared 2 Action Required 2 Review Recommended (7 entities)`

---

### Scenario 2: Two-Project Switching & Zero-Hybrid Isolation
**Objective**: Confirm atomic transition between `The Neon Horizon` and `Cyberpunk Odyssey`.

```bash
# Executed as part of repro_live.js Step 3
```

**Expected Results**:
- On clicking `Open Production` on `Cyberpunk Odyssey`:
  - Full overlay rendered with `"Switching production..."`
  - Zero transient frames showing 7 entities + 0 scenes / 0 items / 0 tasks
  - Post-switch workspace displays `Cyberpunk Odyssey`, `[PRJ-CYBERPUNK]`, `100%` readiness, `0` blocked scenes
- On returning to `The Neon Horizon`:
  - Zero leftover Cyberpunk chrome
  - Post-switch workspace displays `The Neon Horizon`, `[PRJ-NEON-HORIZON]`, `33.3%` readiness, `2` blocked scenes

---

### Scenario 3: 375px Mobile Viewport & Filter Tab Balance
**Objective**: Verify 375x667 and 375x812 mobile ergonomics, tab width balance, and sticky header non-intersection.

```bash
# Executed as part of repro_live.js Step 2
```

**Expected Results**:
- Filter tabs render with balanced, proportional widths (`All (2)`, `Needs Attention (1)`, `Fully Ready (1)`).
- `getClientRects().length === 1` for all tab text nodes.
- `document.documentElement.scrollWidth <= 375` (Zero horizontal scroll overflow).
- Portfolio cards and Open Production buttons clear sticky header after `scrollIntoView`.

---

### Scenario 4: 1,000-Task Virtualization Performance Benchmark
**Objective**: Prove $\ge 1,000$-task rendering and 60 FPS scrolling budgets.

```bash
node tests/local_1000_task_virtualization.js
```

**Expected Results**:
- Task Dataset Size: `1,000`
- Initial Mount Latency: `≤ 500ms`
- Active DOM Card Elements: `≤ 30` (Clamped)
- Scroll Frame Rate: `≥ 60 FPS` (Avg frame duration $\le 16.6$ms)
- Filter Execution Time: `≤ 50ms`

---

### Scenario 5: Notification Deep-Link & Accessible Focus Flow
**Objective**: Confirm Notification drawer jump to `TASK-101` with ARIA announcement and focus trapping.

```bash
# Executed as part of repro_live.js Step 4
```

**Expected Results**:
- Clicking `Jump to task TASK-101` opens modal.
- Live region announces: `"Navigated to task: Create Fictional Prop Graphic: Titan Industrial Hazard Placard"`.
- Focused element: `<h4 id="task-heading-TASK-101">`.
- Zero modal chrome flashing (`0 of 0` is never rendered).

---

### Scenario 6: Submission Artifact Package Audit
**Objective**: Validate `README.md`, `PROVENANCE.md`, `DEMO_SCRIPT.md`, and `LICENSE`.

```bash
node -e "
const fs = require('fs');
const readme = fs.readFileSync('README.md', 'utf8');
const provenance = fs.readFileSync('PROVENANCE.md', 'utf8');
const license = fs.readFileSync('LICENSE', 'utf8');

console.log('README contains Live URL:', readme.includes('https://clearancescout-n3tcx4jcbq-uc.a.run.app'));
console.log('README contains Demo Token:', readme.includes('judge-pass-2026'));
console.log('PROVENANCE contains Google ADK:', provenance.includes('Google Agent Development Kit') || provenance.includes('Google ADK'));
console.log('PROVENANCE contains gemini-3.6-flash:', provenance.includes('gemini-3.6-flash'));
console.log('LICENSE contains MIT:', license.includes('MIT License'));
"
```

**Expected Results**:
- All assertions return `true`.
