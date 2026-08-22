# Feature Specification: Workspace Restyle

**Feature Branch**: `023-workspace-restyle`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "workspace restyle -- all five surfaces of the ClearanceScout clearance workspace, as ONE feature (they share tokens, status vocabulary, and a single verification gate; do not split into separate features). Structure the spec as five component sections, each with its own intent statement and acceptance checklist, plus a shared acceptance section at the end. Users: line producers and clearance coordinators scanning 'can we shoot, and if not, why not, and what unblocks it.'"

---

## Target Audience & Core User Journey

**Target Users**: Line Producers, Unit Production Managers, and Clearance Coordinators scanning the workspace with one primary question: *"Can we shoot, and if not, why not, and what unblocks it?"*

---

## Five Component Sections

### SECTION 1: TOOLBAR (Command Bar)

**Intent Statement**:
Collapse the multi-row header into a single unified command bar that immediately answers three core operator questions: *Where am I?* (Project Switcher), *What is my budget?* (Live Quota Meter with numeric tabular figures), and *What do I do next?* (Single primary action button for open tasks).

**Acceptance Checklist**:
- [ ] **TC-1.1**: Exactly ONE primary button (`.btn-primary`) exists page-wide, pointing directly to the open-tasks entry with a live count badge.
- [ ] **TC-1.2**: Live quota meter visually reflects remaining vs total research quota with numeric display formatted in tabular figures (`font-variant-numeric: tabular-nums`).
- [ ] **TC-1.3**: Command bar layout cleanly wraps below ~900px viewport width without text truncation, component clipping, or horizontal page scrolling.

---

### SECTION 2: READINESS BAND (Page Hero)

**Intent Statement**:
Establish high-contrast shooting readiness status as the primary hero metric for line producers, rendering overall readiness percentage at display scale with a severity edge, accompanied by per-scene status cards containing plain-language, producer-focused reasons.

**Acceptance Checklist**:
- [ ] **RB-2.1**: Shooting Readiness percentage is rendered as the largest text element on the page (display scale, minimum `2.75rem`).
- [ ] **RB-2.2**: Readiness card displays a high-visibility severity border edge reflecting project clearance health (Green = Cleared, Amber = Review Recommended, Red = Action Required / Blocks Shooting).
- [ ] **RB-2.3**: Every non-cleared scene (`BLOCKS_SHOOTING`, `ACTION_REQUIRED`, `REVIEW_RECOMMENDED`) displays a one-sentence plain-language reason a producer would accept (e.g., *"Hazard placard artwork needs rights or replacement"*), strictly avoiding raw variable names or developer system-speak.
- [ ] **RB-2.4**: Every scene card features a standardized status chip, INT/EXT location indicator, and time-of-day micro-label.

---

### SECTION 3: SCREENPLAY PANEL (Legal Mono Zone)

**Intent Statement**:
Present screenplay manuscript text strictly within a legal monospace zone where detected clearance entities are highlighted using subtle status-colored dotted underlines (no background color fills) and source manuscript content is preserved with 100% integrity.

**Acceptance Checklist**:
- [ ] **SP-3.1**: Manuscript text maintains complete content parity with source script content with zero text rewrites or presentation modifications.
- [ ] **SP-3.2**: Screenplay text uses a monospace typeface (`Courier Prime` / `monospace`), establishing this panel as an explicit legal mono zone.
- [ ] **SP-3.3**: Detected clearance entities in visible scenes are highlighted strictly using status-colored dotted underlines (`text-decoration: underline dotted var(--status-color)`), with zero background color fills.
- [ ] **SP-3.4**: A single highlight legend explaining underline status colors appears exactly once above or alongside the screenplay panel.
- [ ] **SP-3.5**: Every registry entity with an active occurrence in a visible scene is correctly underlined in the screenplay panel.

---

### SECTION 4: ENTITY REGISTRY (Scan-First Table)

**Intent Statement**:
Provide a scan-first clearance tracking table for clearance coordinators, grouping entity context by rendering category as a muted sub-line beneath bold entity names, using standardized chip-plus-word status badges, and right-aligning meaningful action controls.

**Acceptance Checklist**:
- [ ] **ER-4.1**: Entity name is displayed in bold typography with category as a muted sub-line context rather than a separate peer table column.
- [ ] **ER-4.2**: Clearance status is rendered strictly as a chip-plus-word badge matching the exact status vocabulary of the Readiness Band.
- [ ] **ER-4.3**: Right-aligned action controls are labeled by domain meaning (e.g., *"2 uses"*, *"Ground"*, *"Compare"*) rather than internal system nouns.
- [ ] **ER-4.4**: Table typography uses variable sans-serif (`Inter`) with zero monospace fonts and zero raw emojis in table chrome or content.

---

### SECTION 5: MODALS (Operations Dashboard & Task Center)

**Intent Statement**:
Deliver high-density clearance intelligence via an Operations Dashboard modal featuring five KPI tiles and row-level triage actions, alongside a Department Task Center modal supporting tabbed department views and layout-stable in-place resolution.

**Acceptance Checklist**:
- [ ] **MD-5.1**: Operations Dashboard modal renders exactly five KPI tiles (Shooting Readiness Index, Blocking Entities, Unresolved Placeholders, Rights Expiring <90 Days, Open Department Tasks).
- [ ] **MD-5.2**: Triage list rows in the Operations Dashboard present direct row-level resolution buttons ON the row for every blocking occurrence.
- [ ] **MD-5.3**: Department Task Center provides tabbed department navigation with open task counts, severity-striped task cards, and an in-place "Resolve" transition that eases into a labeled "RESOLVED" state without layout shift.
- [ ] **MD-5.4**: Modal overlays lock body scrolling (`document.body.style.overflow = 'hidden'`) upon opening and cleanly restore scrolling upon dismissal.
- [ ] **MD-5.5**: All modals support dismissal via Escape key, backdrop click, and close icon button (`✕`).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One-Touch Command Bar & Quota Visibility (Priority: P1) 🎯 MVP

Line producers and clearance coordinators need a clean command bar that instantly establishes project context, displays remaining research quota, and highlights the single next required action.

**Why this priority**: Essential for immediate workspace orientation and preventing accidental research quota exhaustion.

**Independent Test**: Can be tested by loading the workspace header and asserting exactly one primary button exists, quota numerals use tabular figures, and toolbar wraps cleanly at 900px width.

**Acceptance Scenarios**:
1. **Given** a user viewing the workspace, **When** examining the command bar, **Then** exactly one primary button (`.btn-primary`) is present page-wide.
2. **Given** active quota usage, **When** research tasks run, **Then** the quota meter visually updates showing remaining/total quota with tabular figure numerals.
3. **Given** a viewport width below 900px, **When** resizing the window, **Then** command bar elements wrap gracefully without horizontal scrollbars or truncated content.

---

### User Story 2 - Hero Shooting Readiness & Plain-Language Scene Reasons (Priority: P1)

Line producers scanning the page hero need to know instantly if production can shoot, and for any blocked scene, receive a plain-language explanation of what is holding up clearance.

**Why this priority**: The primary business utility of ClearanceScout is determining shooting readiness and identifying unblocking actions.

**Independent Test**: Can be tested by loading a project with blocked scenes and asserting readiness percentage font size is the largest text on page and non-cleared scenes show human-readable reasons.

**Acceptance Scenarios**:
1. **Given** a project workspace, **When** viewing the page hero, **Then** the readiness index percentage renders as the largest text on the page (`>= 2.75rem`).
2. **Given** a scene with `BLOCKS_SHOOTING` or `ACTION_REQUIRED` status, **When** inspecting the scene card in the readiness band, **Then** a plain-language reason (e.g., *"Hazard placard artwork needs rights or replacement"*) is clearly displayed.

---

### User Story 3 - Monospace Screenplay Panel with Dotted Underline Entities (Priority: P1)

Clearance coordinators reading screenplay scenes need to see detected entities in context with status-colored dotted underlines without altering original manuscript text.

**Why this priority**: Ensures legal accuracy and content fidelity while reading script occurrences.

**Independent Test**: Can be tested by viewing the script panel and verifying monospace font, dotted underlines on detected entities, zero background fills, and source manuscript text parity.

**Acceptance Scenarios**:
1. **Given** a screenplay scene, **When** displayed in the script panel, **Then** text renders in monospace with 100% source content parity.
2. **Given** detected entities in a scene, **When** rendered in the script panel, **Then** entities display status-colored dotted underlines with no background color fills.

---

### User Story 4 - Scan-First Entity Registry Table (Priority: P1)

Clearance coordinators scanning the registry need entity names, category contexts, and status badges presented clearly without column clutter or system noise.

**Why this priority**: Streamlines clearance tracking and research execution across dozens of script entities.

**Independent Test**: Can be tested by inspecting the registry table and verifying bold entity names with sub-line categories, chip-plus-word status badges, and domain-meaning action labels.

**Acceptance Scenarios**:
1. **Given** registry entities, **When** rendered in the table, **Then** entity names are bold, categories appear as muted sub-lines, and status badges use chip-plus-word format.
2. **Given** occurrence actions, **When** rendered in the table, **Then** buttons display domain labels such as *"2 uses"* or *"Ground"* instead of system database nouns.

---

### User Story 5 - Operations Dashboard & Department Task Center Modals (Priority: P2)

Line producers and department heads opening dashboard modals need high-level KPI tiles, row-level triage controls, department tabs, and scroll-locked modal overlays.

**Why this priority**: Provides comprehensive executive summaries and actionable task resolution for production departments.

**Independent Test**: Can be tested by opening the Operations Dashboard or Task Center modal, verifying 5 KPI tiles, row-level triage buttons, body scroll locking, and smooth in-place task resolution.

**Acceptance Scenarios**:
1. **Given** the Operations Dashboard modal is opened, **When** inspecting tiles and triage rows, **Then** 5 KPI tiles render at top and row-level resolve buttons appear on triage rows.
2. **Given** any modal overlay is opened, **When** active, **Then** `document.body.style.overflow` is set to `'hidden'`, and pressing Escape, clicking the backdrop, or clicking `✕` dismisses the modal and restores scrolling.

---

## Regression Clause (Constitution Article 7)

Per Constitution Article 7 (Finding 2026-08-22):
1. **Body Scroll Lock**: Modal overlays MUST lock background body scrolling (`document.body.style.overflow = 'hidden'`) upon opening and restore original overflow style upon dismissal.
2. **Dismissal Integrity**: Keyboard Escape key, backdrop overlay click, and close button control (`✕`) MUST all reliably dismiss any open modal without state leak.

---

## Shared Acceptance (Applies Page-Wide)

- **SA-001**: **Status Never Color Alone**: Clearance and risk status MUST always pair HSL semantic color with explicit text labels (`CLEARED`, `REVIEW RECOMMENDED`, `ACTION REQUIRED`).
- **SA-002**: **No Emoji in Chrome**: UI chrome, buttons, headers, table cells, and badges MUST use inline stroke SVG icons only, with zero raw emoji characters.
- **SA-003**: **Visible Keyboard Focus**: All interactive elements (buttons, inputs, dropdowns, tabs) MUST display visible focus outlines when focused via keyboard navigation.
- **SA-004**: **Verifiable Assertions**: Every mechanical requirement MUST be expressible as an automated DOM assertion or grep pattern verifiable by testing scripts.

---

## Edge Cases

- **Viewport Shrink (<600px)**: Command bar wraps buttons into vertical stack without clipping; quota meter shrinks gracefully.
- **Long Plain-Language Reasons**: Scene reason text wraps cleanly within scene cards without overflowing card boundaries.
- **Empty Registry Search**: Registry displays clean empty state with SearchIcon and clear active filter summary.
- **Rapid Modal Toggling**: Body scroll lock counter correctly handles nested or rapidly reopened modals without leaving body locked.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toolbar MUST collapse header actions into a single-row command bar containing project switcher, live tabular-figure quota meter, and exactly one primary open-tasks button.
- **FR-002**: Page hero MUST feature a display-scale Shooting Readiness Index with severity edge and per-scene cards containing plain-language unblocking reasons.
- **FR-003**: Screenplay panel MUST render source script text in monospace with status-colored dotted underlines on detected entities and zero background color fills.
- **FR-004**: Entity registry table MUST format rows with bold entity names, muted category sub-lines, chip-plus-word status badges, and domain-meaning action labels.
- **FR-005**: Operations Dashboard modal MUST display 5 KPI tiles and row-level triage action controls for blocking occurrences.
- **FR-006**: Department Task Center modal MUST provide tabbed department views with open counts and layout-stable in-place task resolution.
- **FR-007**: System MUST lock body scroll during modal display and support Escape, backdrop, and close icon dismissal on all modal overlays.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of clearance status badges pair HSL semantic color with explicit text labels.
- **SC-002**: Zero raw emoji characters exist within application chrome, buttons, or data tables.
- **SC-003**: 100% of modal overlays enforce body scroll locking when open and restore scroll position on close.
- **SC-004**: All automated contract tests (`npm test`) and live browser validation scripts (`live_design_system_validation.js`) pass with 100% success rate.

---

## Assumptions

- Target users access the workspace on desktop and tablet viewports (>=768px recommended; mobile responsive down to ~600px via column stacking).
- Existing backend API contracts and data models (`scenes`, `entities`, `occurrences`, `departmentTasks`) remain authoritative and unchanged.
- All styling relies strictly on HSL CSS custom properties defined in `src/index.css`.
