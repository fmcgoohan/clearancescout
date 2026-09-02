# Quickstart & Verification Guide: 029-honest-ingestion-ux

## Purpose
Demonstrate and verify that newly created productions initialize with 0 scenes/items without silent demo seeding, preview extraction accurately before commit, and block invalid/empty screenplay uploads.

## Prerequisites
- Local development server running on `http://localhost:8088` (or target Cloud Run URL)
- Playwright Chromium installed (`npx playwright install chromium`)

## Automated Test Verification

Execute the local verification test suite:

```bash
# 1. Build TypeScript and Vite frontend bundle
npm run build

# 2. Run local Playwright regression suite covering Scenarios A through F
node tests/repro_local.js
```

## Manual Verification Steps

### Scenario A: Persistent "New Production" Button in Header
1. Open `http://localhost:8088`.
2. Observe top navigation header.
3. Confirm `+ New Production` button is directly visible next to the Project selector.

### Scenario B: Honest Empty State
1. Click `+ New Production`.
2. Enter Title: "Solaris Dawn", Studio: "A24".
3. Click "Create Production".
4. Confirm workspace opens with 0 scenes, 0 clearance items, 0 tasks.
5. Confirm Primary Recommendation Card prompts "Upload Screenplay to Begin Clearance".
6. Confirm summary displays "No clearance items recorded" and "No clearance blockers recorded".

### Scenario C: Extraction Preview & Validation Error on Malformed PDF
1. Click "Upload Screenplay".
2. Select an empty or non-text PDF file.
3. Confirm Extraction Preview displays `0 scenes detected` and warning banner.
4. Confirm "Confirm Ingestion" button is disabled.
5. Close modal; confirm project remains at 0 scenes and is NOT replaced by Neon Horizon.

### Scenario D: Explicit Sample Loading
1. On the empty production workspace, click "Load Sample Production".
2. Confirm The Neon Horizon sample data loads with 3 scenes, 7 clearance items, 11 tasks, 33.3% readiness, and 2 blocked scenes.

### Scenario E: Multi-Project Isolation
1. Open Portfolio switcher.
2. Select "Cyberpunk Odyssey".
3. Confirm 100% readiness and 0 blocked scenes.
