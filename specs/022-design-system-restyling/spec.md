# Feature Specification: Restyle ClearanceScout UI to Constitution v1.1.0

**Feature Branch**: `022-design-system-restyling`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "Restyle ClearanceScout UI to adhere to Constitution v1.1.0 visual design system rules (Semantic Color tokens, variable sans typography, inline stroke SVG icons, hero readiness index hierarchy, single load motion sequence, body scroll lock on all modals/overlays, and HTML-entity-safe typographic characters)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visual System & Semantic Token Foundations (Priority: P1)

As a film clearance officer or producer, I want the clearance workspace to present a clean, professional, non-distracting visual palette where colors strictly signify status so that I can instantly evaluate project shooting risk without visual noise or competing accent colors.

**Why this priority**: Eliminates visual confusion by establishing sacred semantic colors (green = cleared, amber = review, red = blocks shooting) with a single non-confusable brand accent, removing all raw hex strings and competing hues.

**Independent Test**: Can be fully tested by auditing computed CSS styles across all components and themes, asserting that green/amber/red appear exclusively for clearance status states, all color tokens derive from CSS variables in `src/index.css`, and no raw hex color strings exist in component JSX/CSS.

**Acceptance Scenarios**:

1. **Given** any page or modal in the workspace, **When** reviewing visual element colors, **Then** green, amber, and red appear strictly and exclusively on status indicators and risk badges (`CLEARED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`/`BLOCKS_SHOOTING`), and all non-status chrome uses neutral slate surfaces or the single brand accent.
2. **Given** component styling in source files, **When** inspecting color declarations, **Then** all colors reference centralized CSS custom properties in `src/index.css` with zero hardcoded raw hex values in components.

---

### User Story 2 - Chrome Typography, Provenance & SVG Iconography (Priority: P1)

As an operator navigating the clearance workspace, I want UI controls, headings, and buttons to use a refined variable sans-serif typeface and inline stroke SVG icons while screenplay text and JSON logs remain in monospace, so that provenance is clear and chrome looks modern rather than prototype/engineer-built.

**Why this priority**: Typography and iconography establish visual authority; separating text artifacts (screenplay/JSON) from UI chrome creates immediate visual clarity without emoji clutter in buttons and headers.

**Independent Test**: Can be tested by verifying font-family declarations across UI elements (variable sans for chrome, monospace exclusively for `.fountain-script`, `.json-log`, or `<code>` blocks) and confirming all chrome icons render as inline stroke SVGs with zero emoji characters in headers, buttons, or modal titles.

**Acceptance Scenarios**:

1. **Given** UI headers, navigation bars, modal titles, and action buttons, **When** inspecting rendered typography, **Then** all chrome elements render using the variable sans-serif font scale without monospace typography.
2. **Given** screenplay text viewer blocks or raw JSON event logs, **When** inspecting rendered typography, **Then** monospace font styling is applied exclusively to these text artifacts.
3. **Given** UI chrome icons across buttons, headers, and tabs, **When** inspecting visual markup, **Then** all iconography renders as accessible, scalable inline stroke SVG icons with unified stroke width and zero emoji characters in chrome.

---

### User Story 3 - Hero Readiness Index & Per-Scene Blocked Reasons Hierarchy (Priority: P1)

As a physical production executive, I want the Shooting Readiness Index and per-scene "why-blocked" failure reasons to be the visual hero of the workspace, so that I can immediately answer whether the film can shoot today and why a scene is blocked.

**Why this priority**: The primary answer users seek is whether scenes are clear to shoot; elevating readiness metrics and blocking reasons above secondary metadata tables makes the product immediately useful and decision-focused.

**Independent Test**: Can be tested by rendering the main workspace and operations dashboard, asserting that the Shooting Readiness Index percentage card and per-scene why-blocked callouts have the highest visual hierarchy (font weight, size, card contrast) on the screen.

**Acceptance Scenarios**:

1. **Given** the workspace header or dashboard, **When** viewing the Shooting Readiness Index, **Then** it renders as the hero visual element with primary visual weight, large clear typography, and status context.
2. **Given** blocked scenes in the Operations Dashboard or Screenplay Breakdown, **When** reviewing scene cards, **Then** the exact why-blocked reason (e.g., "Insufficient evidence for 2 items", "1 Action Required task open") is highlighted in a prominent red alert card at the top of the scene section.

---

### User Story 4 - Motion Orchestration, Status Text Pairing & Defect Law Compliance (Priority: P2)

As a user with accessibility needs or complex multi-modal workflows, I want smooth, non-distracting animations, body scroll locking when modals open, paired status text for every color, and clean typographic character rendering without character encoding glitches.

**Why this priority**: Ensures complete WCAG accessibility compliance, eliminates background scrolling under modals, prevents mojibake encoding issues, and keeps motion restrained and purposeful.

**Independent Test**: Can be tested by opening any of the 13 modal overlays (verifying `overflow: hidden` is applied to `document.body`), inspecting status badges (verifying every badge includes explicit text alongside color), testing `prefers-reduced-motion` CSS rules, and verifying HTML entities for non-ASCII characters.

**Acceptance Scenarios**:

1. **Given** any modal overlay open, **When** scrolling the mouse wheel or touching the background, **Then** page content behind the modal remains completely locked and immobile.
2. **Given** any status badge or risk callout, **When** inspecting rendered elements, **Then** status color is always accompanied by a clear text label ("Cleared", "Review Recommended", "Blocks Shooting", "Action Required").
3. **Given** initial page load, **When** rendering motion, **Then** a single orchestrated entrance animation plays using `transform` and `opacity` properties only, and all motion collapses when `prefers-reduced-motion: reduce` is set.
4. **Given** special typographic characters (em-dashes, quotes, bullets), **When** rendered by the server, **Then** all characters render cleanly as safe HTML entities without mojibake artifacts.

---

### Edge Cases

- What happens when a user prefers reduced motion in browser/OS settings? All CSS transitions and animations collapse to instantaneous state changes (`animation: none`, `transition: none`).
- What happens when multiple modals or nested drawers are opened? Body scroll locking maintains an active counter so `overflow: hidden` is preserved until all overlays close.
- What happens when browser window is resized during high-density hero card rendering? Hero readiness cards adapt fluidly across responsive breakpoints without text truncation or clipping.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define all visual tokens (colors, font families, shadows, radii) in `src/index.css` using CSS custom properties, and MUST NOT contain raw hex strings in component code.
- **FR-002**: System MUST restrict status colors strictly to Green (`CLEARED`), Amber (`REVIEW_RECOMMENDED`), and Red (`BLOCKS_SHOOTING`/`ACTION_REQUIRED`), with exactly ONE non-confusable brand accent color for non-status chrome.
- **FR-003**: System MUST reserve monospace font styling exclusively for text artifacts (screenplay draft viewer, raw JSON event logs, code blocks) and use a single variable sans-serif typeface for UI chrome.
- **FR-004**: System MUST replace all emoji characters in UI chrome, headers, tab bars, buttons, and modal headers with inline stroke SVG icons.
- **FR-005**: System MUST present the Shooting Readiness Index as the hero visual element with primary visual hierarchy in the header and operations dashboard.
- **FR-006**: System MUST prominently highlight per-scene why-blocked reasons above secondary entity tables and controls for any scene with `RED` / `BLOCKS_SHOOTING` status.
- **FR-007**: System MUST restrict motion to a single initial load entrance sequence and at most ONE looping animation reserved for active `BLOCKS_SHOOTING` status.
- **FR-008**: System MUST implement CSS transition/animation rules using `transform` and `opacity` properties only, and MUST respect `prefers-reduced-motion: reduce`.
- **FR-009**: System MUST pair every status indicator, badge, and alert with explicit text labels alongside color.
- **FR-010**: System MUST lock body scroll (`overflow: hidden` on `document.body`) whenever any modal overlay or drawer is open.
- **FR-011**: System MUST render all typographic non-ASCII characters (em-dashes, curved quotes, non-breaking spaces) using safe HTML entities or standard ASCII to prevent mojibake.
- **FR-012**: System MUST append every design system iteration, rationale, and verification result to `DESIGN_LOG.md` per Constitution v1.1.0 Article 8.

### Key Entities

- **Design Tokens**: Centralized CSS custom properties in `src/index.css` defining semantic colors (`--color-status-green`, `--color-status-amber`, `--color-status-red`), brand accent (`--color-brand-accent`), surface colors, typography scales, and motion timing.
- **Icon Registry**: Clean, lightweight inline stroke SVG component set replacing legacy emoji icons across UI chrome.
- **Design Log**: Append-only markdown document (`DESIGN_LOG.md`) tracking visual design changes, rationale, and test verification.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of component source files free of hardcoded raw hex color strings (all color references derive from `src/index.css` custom properties).
- **SC-002**: 100% of UI chrome icons render as inline stroke SVGs with zero emoji characters in headers, buttons, tabs, or modal titles.
- **SC-003**: 100% of open modal overlays lock `document.body` scrolling without page shift.
- **SC-004**: 100% of status badges pair explicit text labels with semantic colors.
- **SC-005**: All 86 automated test suites (217 tests) pass with 100% success after restyling.
- **SC-006**: Live Playwright browser validation confirms hero readiness visual hierarchy, body scroll locking, and SVG icon rendering.

## Assumptions

- The variable sans-serif font family will use a web-safe system stack or Google Fonts Inter variable font with fallback.
- Existing modal components will leverage a shared `useModalFocus` or `useBodyScrollLock` hook to enforce scroll locking.
- Screenplay script viewer styling will retain high-legibility monospace formatting (`Courier Prime` / `Monaco` / `monospace`) as mandated by screenplay formatting conventions.
