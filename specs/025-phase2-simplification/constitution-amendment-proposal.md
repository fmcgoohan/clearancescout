# Proposed Constitution Amendments for Phase 2: Workflow Hierarchy & Terminology Simplification

**Target File**: `.specify/memory/constitution.md`  
**Proposed Version Bump**: `v1.3.0` -> `v1.4.0` (MINOR: Addition of Section Navigation & Header Hierarchy Invariants)  
**Status**: DRAFT PROPOSAL FOR HUMAN REVIEW (Phase 2 PROPOSE Stage)  

---

## 1. Amendment to Article 13: Every Screen Exposes a Clear Next Action (NON-NEGOTIABLE)

### Existing Text (v1.3.0)
> Every application surface MUST proactively guide operators by identifying and highlighting the contextual recommended next action. The UI MUST prominently answer *"What do I do next?"* by rendering a recommended action card explaining the highest-priority unresolved blocker, why it is recommended, and providing a 1-click resolution path.

### Proposed Amended Text (v1.4.0)
> Every workspace view MUST present **one contextual primary recommendation card** at the top of the primary flow that dynamically calculates the highest-priority next step from current project state.
> 
> The recommendation MUST follow a strict deterministic priority cascade:
> 1. **No Screenplay Ingested** -> Primary Action: `"Add Screenplay"` (opens intake modal).
> 2. **Clearance Blockers Exist (`Action Required` > 0)** -> Primary Action: `"Review X Clearance Blockers"` (navigates/filters to `Clearance Items` tab filtered by `Action Required`).
> 3. **No Blockers, Recommended Reviews Exist (`Review Recommended` > 0)** -> Primary Action: `"Review Y Recommended Items"` (navigates/filters to `Clearance Items` tab filtered by `Review Recommended`).
> 4. **Unresolved Department Work (`Department Tasks` > 0)** -> Primary Action: `"View Z Department Tasks"` (navigates to `Tasks` tab).
> 5. **Ready / All Items Resolved** -> Primary Action: `"Export Clearance Binder"` (opens Binder Export drawer).
> 
> The UI MUST NOT render competing rows of equal-weight primary buttons; exactly one primary action is highlighted.

---

## 2. Amendment to Article 14: Domain Terminology Is Understandable or Explained (NON-NEGOTIABLE)

### Existing Text (v1.3.0)
> Primary UI chrome and action controls MUST use domain-appropriate production terminology (e.g., *"Research"* / *"Verify Evidence"* instead of *"Ground"*, *"Clearance Items"* instead of *"Canonical Entity Registry"*, *"Screenplay Intake & Clearance"* instead of *"Multi-Format Script Ingestion"*).
> Technical implementation terms and specialist concepts MUST be relegated to tooltips or advanced detail views, or accompanied by supporting explanatory text.

### Proposed Amended Text (v1.4.0)
> Primary UI chrome, section headings, and interactive buttons MUST strictly use production clearance domain terminology and a converged status vocabulary:
> 
> 1. **Primary Terminology Mappings**:
>    - `"Multi-Format Script Ingestion & 5-Category Resolution"` -> `"Screenplay Intake"`
>    - `"Canonical Entity Registry"` -> `"Clearance Items"`
>    - `"Ground"` / `"Grounding"` -> `"Research"` or `"Run Clearance Check"` (or `"Review Evidence"` when viewing existing results)
>    - `"Observable Timeline"` -> `"Activity"`
>    - `"Live Convergence Verification"` -> `"Clearance Readiness & Verification"`
> 
> 2. **Status Vocabulary Standardization**:
>    - Primary UI badges, filters, and reason cards MUST strictly converge on four standardized status labels:
>      - `Cleared` (Green / OK)
>      - `Insufficient evidence` (Gray / Faint)
>      - `Review recommended` (Yellow / Warn)
>      - `Action required` (Red / Critical)
>    - Alternative shorthand or engineering phrases (e.g., `"Grounding Required"`, `"Unsatisfied"`) MUST NOT appear in primary operator chrome.
> 
> 3. **Diagnostic Confinement**: Technical terms (`canonicalEntityId`, `GROUNDING_ATTEMPT`, `SSE stream`) ARE PERMITTED ONLY inside technical tooltips, developer logs, and provenance drawers.

---

## 3. Addition of Article 16: Streamlined Header & Workspace Section Navigation (NEW NON-NEGOTIABLE)

### Proposed New Article Text (v1.4.0)
> ### XXI. Article 16: Streamlined Header & Workspace Section Navigation (NON-NEGOTIABLE)
> 
> 1. **Header Hierarchy & Administrative Control Offloading**:
>    - The primary header bar MUST contain only essential identity and navigation controls:
>      - Project Identity & Switcher (`ClearanceScout` logo + Project Select)
>      - Primary Section Navigation Tabs (`Overview`, `Screenplay`, `Clearance Items`, `Tasks`)
>      - High-level Shooting Readiness Badge (`85% Ready`)
>      - Secondary Settings/More Menu Trigger (`"Settings"` button rendered with SVG icon component, zero raw emojis per Article 3)
>    - Secondary diagnostic/admin controls (`Demo Access Token`, `Execution Mode` pill, `Live Quota Counter`, `Technical Logs`) MUST be housed inside the secondary Settings popover menu to avoid overloading the header chrome.
> 
> 2. **Section Navigation & Contextual Orientation**:
>    - The workspace MUST organize content into four primary sections:
>      - **Overview**: Hero Shooting Readiness index, Contextual Primary Recommendation Card, Key Clearance Blockers summary.
>      - **Screenplay**: Intake trigger, Monospace Script Viewer, Scene Navigator, Occurrence highlighter.
>      - **Clearance Items**: Scan-first Entity Table, Search & Filter controls, Research & Replacement actions.
>      - **Tasks**: Department Task Center & Operations Dashboard.
>    - Section switching MUST preserve active project state, support full keyboard navigation (Arrow keys / Tab / ARIA `role="tablist"`), and update the URL query or local state without triggering full page reloads.
