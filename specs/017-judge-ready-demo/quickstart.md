# Quickstart & Verification Guide: Feature 017 Judge-Ready 1-Click Demo

**Feature**: `017-judge-ready-demo`  
**Created**: 2026-08-19

---

## 1. Quickstart Scenario: 1-Click Demo Ingestion in `DEMO_MODE`

### Prerequisites
- Node.js 20+, npm 10+
- Server running in `DEMO_MODE` (`npm start` or `EXECUTION_MODE=DEMO_MODE`)

### Step 1: Open the Application
Navigate to [http://localhost:8080](http://localhost:8080).

### Step 2: Verify UI Rebranding
- Verify the header reads: `ClearanceScout · Production Clearance Workspace`.
- Verify no user-facing instances of `MVP` or `ClearanceScout MVP` appear in headers or modals.

### Step 3: Click "Load Sample Screenplay"
- Click the **"Load Sample Screenplay"** button on the workspace header or project switcher.
- Verify *"The Neon Horizon"* is loaded.
- Verify the Entity Registry is immediately populated with 7 evaluated items (`Summit Cola`, `AeroTech Prism Laptop`, `Veloce GT`, `Elena Vance`, `Nocturne of the Wild`, `Midtown Spire Tower`, `Titan Industrial Hazard Placard`) with `DEMO_FIXTURE` (📦) provenance badges.

### Step 4: Verify Operations Dashboard
- Click **"📊 Operations Dashboard"**.
- Verify the dashboard displays non-zero populated metrics for Shoot Readiness %, Scene Readiness breakdown (`FINAL CLEAR`, `WORKING CLEAR`, `RED`), active blockers, upcoming rights expirations, and department action items.

### Step 5: Verify Legal Clearance Binder
- Click **"📁 Clearance Binder"**.
- Verify the multi-tab binder displays the complete Scene Schedule, Rights Catalog, Placeholders Table, and Unresolved Actions with a valid 64-character SHA-256 integrity digest.
- Click **"📝 Markdown (.md)"** to verify downloadable formatted Markdown export.

---

## 2. Automated Test Execution

```bash
# Run contract and integration tests for Feature 017
npx vitest run tests/contract/test_judge_demo_automation.test.ts
npx vitest run tests/integration/judge_demo_workflow.test.ts

# Run entire test suite
npm test
```
