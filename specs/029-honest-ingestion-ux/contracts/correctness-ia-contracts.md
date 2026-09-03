# Correctness, IA, Terminology & Mobile Responsive Contracts (Feature 029)

## 1. Single Status Contract & Task Pruning (FR-013)

### Server Evaluator Interface
When clearanceEvaluator.evaluateEntityClearance(projectId, entityId) completes:
1. It updates the canonical entity clearance status in EntityRepo.
2. It queries ActionNotificationRepo.getActionsByProject(projectId) for all actionType === "RETRY_RESEARCH" where canonicalEntityId === entityId.
3. For each found RETRY_RESEARCH task with status === "OPEN", it calls updateActionItemStatus(projectId, actionId, "RESOLVED", "EVALUATION_COMPLETED", "Entity evaluated to " + newStatus).
4. It emits a TASK_UPDATED event on timelineEmitter.

**Invariant**: An entity with overallClearanceStatus === "NO_ISSUE_SURFACED" or overallClearanceStatus === "REVIEW_RECOMMENDED" or overallClearanceStatus === "ACTION_REQUIRED" MUST NOT have an active OPEN RETRY_RESEARCH task in ActionNotificationRepo.

---

## 2. High-Fidelity Slugline Temporal Parsing (FR-014)

### Screenplay Parser Contract
In ScriptParserAgent.buildSceneShell(sceneStr, index):
- locationType: "INT" | "EXT" | "INT/EXT"
- timeOfDay: Extracted from the slugline delimiter (after the last "-" or ",").
  - If includes CONTINUOUS -> "CONTINUOUS"
  - If includes SAME -> "SAME"
  - If includes MOMENTS LATER -> "MOMENTS LATER"
  - If includes DAWN -> "DAWN"
  - If includes DUSK -> "DUSK"
  - If includes MAGIC HOUR -> "MAGIC HOUR"
  - If includes NIGHT or LATER THAT NIGHT -> "NIGHT"
  - If includes DAY -> "DAY"
  - Default -> "CONTINUOUS" if preceded by "- CONTINUOUS", else "DAY".

**Invariant**: EXT. NEIGHBORHOOD CORNER - CONTINUOUS MUST store "timeOfDay": "CONTINUOUS".

---

## 3. Screenplay Page Break Marker Filtering (FR-015)

In ScriptParserAgent.extractTextFromPdfBuffer and buildSceneShell:
- Regex filter removes:
  - /^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gim
  - /^\s*\d+\.\s*$/gm (standalone page numbers on their own lines)
- Cleaned text is passed to scene parsing and excerpt extraction.

---

## 4. Header & Workspace IA Contracts (FR-017, FR-018, FR-019, FR-020)

### Single Compact Header (<=64px)
- **Primary Header**:
  - [CS Logo + Brand Title]
  - [Project Select Dropdown (Active Title + Code)]
  - [Role Perspective Switcher]
  - [Alerts Notification Bell]
  - [More Menu Button (⋯ or ⚙️)]
- **More Menu Dropdown / Popover**:
  - + New Production
  - Portfolio Dashboard
  - Export Clearance Binder
  - Settings & Provenance (Execution Mode, Quota: X of 25 remaining, Revision: K_REVISION)
  - User Admin (if Administrator)

### First-Class Department Tasks Section
- Tab strip in workspace: Overview, Screenplay, Clearance Items, Department Tasks.
- Selecting Department Tasks renders the ActionListModal content directly within the workspace page body.
- URL query param ?tab=tasks&task=TASK-101 opens the Tasks tab and focuses TASK-101.

### Onboarding Banner Placement
- Rendered below RecommendedActionCard.
- Auto-hidden if scenesCount > 0 or if dismissed in localStorage.

---

## 5. Domain Vocabulary & Touch Targets (FR-021, FR-022, FR-023, FR-024)

- Primary table / card column: "Clearance Items"
- Occurrence button: "{count} scene occurrence" / "{count} scene occurrences"
- Research button for evaluated item: "View Evidence"
- API Quota string: "API Research Quota (X of 25 remaining)"
- Pluralization: "1 clearance item requires action" vs "{count} clearance items require action"
- Viewports < 768px: Table renders as responsive stacked cards with display: flex; flex-direction: column.
- All touch targets: Minimum height and width >= 44px.
