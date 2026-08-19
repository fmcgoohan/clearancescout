# Research: Production Clearance Operating Model (Phase 1)

**Feature**: `specs/016-production-clearance-model` | **Date**: 2026-08-19

---

## 1. Project Type Taxonomy

### Context
Entertainment clearance requirements differ fundamentally across production formats:
- **Feature Films (`Movie`)**: Deep narrative scripts, multi-scene continuity, synchronization rights for score and soundtrack, hero prop licensing.
- **Episodic Series (`TV Show`)**: Episodic scripts, recurring character brands, multi-season licensing, broadcast Standards & Practices (S&P).
- **Short-Form Advertising (`Commercial`)**: Tight product placement covenants, competitor disparagement rules, broadcast legal vetting.

### Decision
- Formally support `projectType: 'Movie' | 'TV Show' | 'Commercial'` in `ProjectData`.
- Default to `'Movie'` when unspecified to ensure 100% backward compatibility with existing tests and scripts.

---

## 2. Project List & Workspace Landing Pattern

### Context
Users need to browse existing studio productions, create new ones with explicit type categorization, and land on a workspace that reflects the active production's title, type, and current clearance summary.

### Decision
- Add `GET /api/projects` in `server/api/projectRoutes.ts` returning an array of projects with their live quota and entity count summary.
- Add an accessible project switcher & creation UI in `src/App.tsx` / `src/components/ProjectListModal.tsx` allowing switching between projects without page reload.
- Display a prominent production type pill badge in the header:
  - `🎬 Movie` (accent blue)
  - `📺 TV Show` (accent cyan)
  - `📢 Commercial` (accent amber)

---

## 3. Strict 10-Phase Scope Boundary

### Context
The user's directive explicitly mandates that Phase 1 must not collapse or implement Phases 2 through 10.

### Decision
- Restrict all Phase 1 schema, API, and UI changes strictly to project types, project listing, and landing workspace summary.
- Defer occurrence-level evaluation modeling to Phase 2.
