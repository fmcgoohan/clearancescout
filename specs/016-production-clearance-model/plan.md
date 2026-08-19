# Implementation Plan: Production Clearance Operating Model (Phase 9 - Production Operations Dashboard)

**Branch**: `016-production-clearance-model` | **Date**: 2026-08-19 | **Status**: Plan Complete (Phase 9 Focus)  
**Specification**: [`specs/016-production-clearance-model/spec.md`](spec.md)

---

## 1. Summary of Feature & Phase 9 Scope

Phase 9 establishes the **Production Clearance Operations Dashboard** (`US9`, `FR-010`), providing a unified executive cockpit for Executive Producers, Production Counsel, Line Producers, and Clearance Coordinators:
- **Executive KPIs**: Total Scenes, % Shooting Readiness, Critical Blocker Items, Active Placeholders (`TEMP_APPROVED` vs `FINAL_CLEARED`), Expiring Rights ($\le 90$ days), and Pending Department Actions.
- **Scene Readiness Distribution**: Visual breakdown of `FINAL CLEAR`, `WORKING CLEAR`, and `RED` scenes.
- **Shoot Blocker Triage Center**: Scene-by-scene actionable table listing all blocking occurrences with instant resolution shortcuts (Attach Placeholder, Add Rights Agreement, Sign Counsel Override).
- **Upcoming Rights Expirations**: Active contracts expiring within 30/60/90 days with remaining days calculations.
- **Department Action Summary**: Real-time breakdown of open to-dos across `Art Dept`, `Legal Counsel`, `Locations`, and `Production Mgmt`.
- **Recent Activity Feed**: Real-time observable state transition events.

### Core Objectives (Phase 9 Only):
1. **Aggregated Dashboard Workflow (`server/workflows/dashboardEngine.ts`)**:
   - Deterministically compute consolidated metrics across `SceneReadinessEngine`, `RightsRepo`, `PlaceholderRepo`, `ActionNotificationRepo`, and `EntityRepo`.
2. **REST API Contract (`server/api/dashboardRoutes.ts`)**:
   - `GET /api/projects/:id/dashboard`
3. **Executive Dashboard UI (`src/components/ProductionDashboardModal.tsx`)**:
   - Multi-metric KPI cards, scene readiness distribution graphs, blocker mitigation shortcuts, expiring rights alerts, and department work queues.
   - Header button in `src/pages/WorkspacePage.tsx`: `📊 Operations Dashboard`.
4. **Strict Scope Boundaries**:
   - Phase 10 (Final Clearance Binder Export) remains strictly unbuilt until Phase 9 is converged and committed.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | Dashboard uses deterministic TypeScript calculation over repository data; no unneeded model calls. |
| **II. Live Grounding & Research Tooling** | **PASS** | Cites exact repository data, occurrence records, and rights agreement dates. |
| **III. Architecture & Cloud Persistence** | **PASS** | Backend aggregation in `server/workflows/dashboardEngine.ts` and `server/api/dashboardRoutes.ts`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Accurately rolls up occurrence blockers, rights coverage, and scene readiness. |
| **V. Multi-Tier Execution Modes** | **PASS** | Functions identically in `TEST_MODE`, `DEMO_MODE`, and `CLOUD_MODE`. |
| **Observable Action Timeline** | **PASS** | Integrates recent activity stream without raw model CoT. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/016-production-clearance-model/research.md`](research.md))
- **Phase 1: Data Model & Schema** ([`specs/016-production-clearance-model/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/016-production-clearance-model/contracts/dashboard-contract.md`](contracts/dashboard-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/016-production-clearance-model/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/workflows/dashboardEngine.ts`:
  - New service aggregating cross-repository production metrics and blocker lists.
- `server/api/dashboardRoutes.ts`:
  - Express endpoint `GET /projects/:id/dashboard`.
- `src/components/ProductionDashboardModal.tsx`:
  - Executive dashboard modal with KPI summary cards, blocker triage table, rights expiration alerts, and department queues.
- `src/pages/WorkspacePage.tsx`:
  - Header integration for `📊 Operations Dashboard` trigger.
- `tests/contract/test_production_dashboard.test.ts`:
  - Contract test validating consolidated KPI calculations, blocker listings, and expiration filters.
- `tests/integration/production_dashboard_workflow.test.ts`:
  - End-to-end integration test validating multi-department dashboard aggregation and mitigation workflows.
