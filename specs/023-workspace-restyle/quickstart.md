# Phase 1 Quickstart: Feature 023 Workspace Restyle

**Feature**: Workspace Restyle (All Five Surfaces)  
**Spec**: [`spec.md`](spec.md)  

---

## Development & Verification Guide

### 1. Static Spec Check Gate Script
```bash
# Run static compliance scan (zero raw emojis, hex colors outside tokens, monospace confinement, HTML entities)
./scripts/spec-check.sh
```

### 2. Build & Local Preview Server
```bash
# Compile TypeScript and build production assets
npm run build

# Start local preview server on port 3000
npx vite preview --port 3000
```

### 3. Running Automated Unit & Contract Test Suite
```bash
# Execute complete Vitest test suite (86 test files, 217 tests)
npm test
```

### 4. Running Playwright E2E Behavioral Verification
```bash
# Run Playwright E2E tests validating scroll lock, Esc/backdrop dismiss, and layout stability
TARGET_URL=http://localhost:3000 node tests/live_design_system_validation.js
```

---

## Visual Design System Invariant Checkpoints

1. **Toolbar Command Bar**:
   - Single `.btn-primary` button page-wide.
   - Quota counter numerals formatted in tabular figures (`tabular-nums`).
   - Flex layout wrapping cleanly below ~900px without horizontal scroll.

2. **Readiness Band**:
   - Hero Readiness percentage rendered at display scale (`font-size: 2.75rem`).
   - Plain-language unblocking reasons on non-cleared scene cards (`.scene-why-blocked-reason`).

3. **Screenplay Panel**:
   - Monospace script typography (`Courier Prime`) confined strictly to `ScriptViewer.tsx` and `EventLog.tsx`.
   - Status-colored dotted underlines on entity occurrences without background color fills.

4. **Entity Registry Table**:
   - Bold entity title with category as a muted sub-line context.
   - Chip-plus-word status badges and domain-meaning action buttons (*"2 uses"*, *"Ground"*).
   - Zero raw emojis or monospace text in table chrome.

5. **Modals & Overlays**:
   - Operations Dashboard features 5 KPI tiles and row-level triage actions (`.resolve-row-action`).
   - Department Task Center features department tabs and layout-stable in-place task resolution.
   - Modal open setting `document.body.style.overflow = 'hidden'`, cleanly restored on Escape / backdrop / close button dismissal.
