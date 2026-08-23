# Requirements Checklist: Feature 024 UX Redesign

**Feature**: `024-ux-redesign` | **Spec**: [`spec.md`](../spec.md) | **Plan**: [`plan.md`](../plan.md)

---

## 10 UX Requirement Areas Verification Checklist

- [ ] **Area 1: Primary Action**: Contextual recommendation card rendered near project summary/hero with direct 1-click action button.
- [ ] **Area 2: Terminology**: Primary UI uses `"Research"`, `"Clearance Items"`, `"Screenplay Intake & Clearance"`, `"Blocking Occurrences"`. Specialist terms relegated to tooltips.
- [ ] **Area 3: Navigation**: Clear boundaries for Clearance Items, Department Tasks, Operations Dashboard, Observable Timeline, Clearance Binder.
- [ ] **Area 4: Header Density**: Header emphasizes Project Identity, Project Summary, Recommended Action; secondary tools moved to overflow menu.
- [ ] **Area 5: Registry Usability**: Text labels on primary action controls; `"Research All Pending"` hidden or disabled when count is 0; resizable/collapsible script panel.
- [ ] **Area 6: Readability**: Minimum 12px font scale for supporting labels; 4.5:1 text contrast on dark background; clean borders; sacred color system.
- [ ] **Area 7: Responsive**: Wide Desktop (>=1200px side-by-side), Medium Tablet (768px-1199px collapsible), Narrow Mobile (<768px stacked card view).
- [ ] **Area 8: Count Semantics**: Entities, Blocking Occurrences, Department Tasks, Scenes distinctly defined and derived from `ProjectState`.
- [ ] **Area 9: Ingestion Feedback**: Focus locked inside modal during ingestion; background inert (`aria-hidden="true"`); live stage updates announced via `aria-live="polite"`; durable completion summary banner.
- [ ] **Area 10: Onboarding**: 3-step introduction, contextual empty states, tooltips on specialist concepts, dismissible "How clearance works" panel.

---

## 12 User Stories Acceptance Checklist

- [ ] **US 1**: First-time screenplay upload with multi-stage progress feedback and durable summary.
- [ ] **US 2**: Screenplay replacement purging prior script state and re-initializing counts atomically.
- [ ] **US 3**: Screenplay version merge preserving cleared entities and recording new entities.
- [ ] **US 4**: Reviewing red scenes with plain-language producer failure reasons and auto-scroll.
- [ ] **US 5**: Researching entities with text buttons and live citation lookup.
- [ ] **US 6**: Viewing scene occurrences with occurrence count drawer and per-scene risk status.
- [ ] **US 7**: Creating fictional replacement brand/artwork placeholders.
- [ ] **US 8**: Recording signed rights agreements and updating expiring rights KPIs.
- [ ] **US 9**: Applying counsel review overrides with required legal rationale.
- [ ] **US 10**: Completing department tasks with tabbed navigation and layout-stable "Resolve" transitions.
- [ ] **US 11**: Exporting clearance binder with SHA-256 digest and legal breakdown.
- [ ] **US 12**: Operating entire workspace via keyboard navigation and screen reader announcements.
