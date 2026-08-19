# Technical Research & Architectural Decisions: Feature 017

**Feature**: `017-judge-ready-demo`  
**Created**: 2026-08-19

---

## 1. 1-Click Demo Script Ingestion & Auto-Evaluation Pattern

### Context
When hackathon judges access the deployed Cloud Run instance or local workspace in `DEMO_MODE`, clicking "Load Sample Screenplay" previously only parsed the screenplay into entities and scenes, leaving entities in an un-evaluated state until the user individually clicked evaluate on each item.

### Decision
Implement a coordinated demo workflow (`demoAutomationWorkflow.ts` / `POST /api/projects/:id/script/demo`) that:
1. Ingests *"The Neon Horizon"* screenplay (10 scenes, 5 categories).
2. Automatically triggers batch clearance evaluation across all canonical entities using deterministic `DEMO_FIXTURE` research records.
3. Automatically attaches a sample active rights agreement (e.g. for *Coca-Cola / Summit Cola* expiring in 60 days) and a sample fictional prop placeholder (e.g. *NovaTech Zenith* for *AeroTech Prism* as `TEMP_APPROVED`) so that scene readiness, rights catalog, placeholders, open action queues, operations dashboard, and legal clearance binder are instantly populated.

### Rationale
- Zero-friction onboarding for evaluators.
- Evaluators immediately see all 10 phases of Feature 016 operational without having to know which buttons to click in sequence.
- 100% deterministic, offline-capable, and requires zero external API credentials.

### Alternatives Considered
- *Client-side sequential API orchestration*: Triggering 5 separate HTTP requests from React. (Rejected: Network race conditions, slow on higher-latency connections, fragile if tab closes).
- *Hardcoding initial Firestore database state*: Pre-populating the database on startup. (Rejected: Prevents resetting the demo cleanly and prevents testing manual screenplay ingestion).

---

## 2. Provenance Integrity in DEMO_MODE

### Context
The platform strictly mandates that synthetic evidence must never pretend to be live API data, and `CLOUD_MODE` must never silently fall back to synthetic fixtures.

### Decision
- All automated demo research assessments retain explicit `DEMO_FIXTURE` (📦) provenance badges in the UI, API responses, and exported binders.
- In `CLOUD_MODE`, missing API credentials fail visibly with descriptive 401/403 errors and never trigger demo automation silently.

---

## 3. UI Rebranding Touchpoints

### Context
Eliminate obsolete prototype terminology ("MVP Workspace", "ClearanceScout MVP") in favor of "Production Clearance Workspace" / "Production Clearance Studio".

### Decision
- Update `src/App.tsx`: Default project title changed from `'ClearanceScout MVP Workspace'` to `'ClearanceScout Production Clearance Workspace'`.
- Update `src/components/ProjectListModal.tsx`: Rebrand demo project card copy to highlight the Production Clearance Operating Model.
- Update `index.html`: Ensure browser title reads `ClearanceScout | Production Clearance Workspace`.
