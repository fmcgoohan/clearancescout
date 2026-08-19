# Implementation Plan: Production Clearance Operating Model (Phase 1)

**Branch**: `016-production-clearance-model` | **Date**: 2026-08-19 | **Status**: Plan Complete (Phase 1 Only)  
**Specification**: [`specs/016-production-clearance-model/spec.md`](spec.md)

---

## 1. Summary of Feature & Phase 1 Scope

The **Production Clearance Operating Model** establishes the foundation for professional film, television, and commercial legal clearance operations. This implementation plan focuses **exclusively on Phase 1**:
1. **Production Project Types (`FR-001`, `US1`)**:
   - Classify projects by `projectType`: `'Movie' | 'TV Show' | 'Commercial'`.
   - Persist `projectType` in `ProjectRepo` and expose through `POST /api/projects`, `GET /api/projects`, and `GET /api/projects/:id`.
2. **Projects List & Landing View (`US1`)**:
   - Provide `GET /api/projects` endpoint returning all persisted studio projects with metadata, type, and clearance roll-up summaries.
   - Deliver an accessible project list / landing view enabling users to create new projects and select existing productions.
3. **Project Workspace Landing Entry (`US1`, `SC-002`)**:
   - When a project is selected, open the workspace with header badges for title, `projectType` (`🎬 Movie`, `📺 TV Show`, `📢 Commercial`), and real-time clearance summary badges.
4. **Preserve Invariants (003–015)**:
   - 100% preservation of scene overrides, candidate loops, demo fixtures, item mutations, retry, comparison modals, registry filters, timeline, batch research, demo auth, live quotas, and responsive a11y.
5. **Strict Sequencing Constraint**:
   - Phases 2 through 10 remain deliberately unbuilt and unmerged until Phase 1 is fully converged.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | Phase 1 establishes project metadata and workspace routing; AI calls remain bound to Gemini 3.6 Flash. |
| **II. Live Grounding & Research Tooling** | **PASS** | Preserves Parallel Search grounding provenance and quota controls. |
| **III. Architecture & Cloud Persistence** | **PASS** | `projectType` persisted in `server/repositories/ProjectRepo.ts`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Clearance assessment roll-ups compute objective summaries without breaking existing taxonomies. |
| **V. Multi-Tier Execution Modes** | **PASS** | `TEST_MODE`, `DEMO_MODE`, and `CLOUD_MODE` strictly preserved across all project types. |
| **Observable Action Timeline** | **PASS** | Zero CoT leakage; project switching and creation emit observable timeline events. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/016-production-clearance-model/research.md`](research.md))
- **Phase 1: Data Model & Schema** ([`specs/016-production-clearance-model/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/016-production-clearance-model/contracts/project-type-contract.md`](contracts/project-type-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/016-production-clearance-model/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/repositories/ProjectRepo.ts`: Add `projectType: 'Movie' | 'TV Show' | 'Commercial'` to `ProjectData`, implement `listProjects()` method.
- `server/api/projectRoutes.ts`: Add `GET /api/projects` endpoint returning list of projects with clearance summary stats; update `POST /api/projects` to accept and validate `projectType`.
- `src/App.tsx`: Add project switcher / landing modal/drawer to list and create projects; render project type badge and clearance summary in workspace header.
- `tests/contract/test_project_types.test.ts`: Contract test suite validating `projectType` serialization, listing, and filtering.
- `tests/integration/production_projects_workflow.test.ts`: Integration test verifying multi-project creation, type categorization, switching, and landing workspace summary.
