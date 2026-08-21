# Quickstart Validation Guide: Feature 021 Release State Integrity and Operator Trust

This guide outlines the concrete validation sequence for testing the end-to-end operator journey and verifying that displayed state is current, internally consistent, and responsive to actions.

## Prerequisites
- Node.js 20+ installed
- Repository dependencies installed (`npm install`)
- Test environment running (`npm test` or local dev server `npm run dev`)

---

## Validation Scenarios

### Scenario 1: Fresh Project Creation & Empty Count Agreement
1. Open the application in a clean browser session and provide the operator demo token.
2. Create a new project: `Title: "Integrity Test Project"`, `Production Company: "Paramount"`.
3. **Assert**:
   - Total Scenes: 0
   - Total Active Entities: 0
   - Shooting Readiness: 100% (No blockers)
   - Summary banner and empty registry state match exactly with zero discrepancy.

### Scenario 2: Deterministic Ingestion State Machine & Honest Progress
1. Click **📁 Upload Screenplay** and select `Big-Fish.fountain.txt` (or click **🎬 Load Sample Screenplay**).
2. **Observe**:
   - The upload modal transitions through explicit states: `UPLOADING` (15%) → `PARSING` (30%) → `EXTRACTING` (55%) → `RECONCILING` (75%) → `COMPLETE` (100%).
   - Live elapsed seconds increment steadily (`Elapsed: Xs`).
   - Progress bar does not jump to fake 90% or stall silently.
   - The submit button is locked to prevent duplicate submissions.
3. Upon reaching `COMPLETE`:
   - Modal closes automatically or shows completion summary.
   - Summary banner, scene counter, and canonical entity registry update simultaneously from the committed snapshot.
   - Zero count jumps (e.g. no 188 → 3 flash).

### Scenario 3: Visible Overlays & Keyboard Accessibility (Actions & Timeline)
1. In the workspace, click the **📋 Actions** button in the primary toolbar.
2. **Assert**:
   - The `ActionListModal` renders visibly on top of the entire workspace (`zIndex: 9999` / `1400`), blurring the backdrop.
   - Pressing `Escape` closes the modal and returns focus to the Actions trigger button.
3. In the application header, click the **Timeline** button.
4. **Assert**:
   - The `TimelineDrawer` slides in visibly above the workspace content (`zIndex: 1350`).
   - Pressing `Escape` or clicking "✕ Close" dismisses the drawer cleanly.

### Scenario 4: Generic Canonical Entity Disambiguation & Alias Merging
1. Ingest a screenplay draft containing:
   - Scene 1: "The reporter holds a microphone from Associated Press."
   - Scene 2: "A memo marked A.P. sits on the desk."
   - Scene 3: "A badge reads Associated Press / A.P."
2. **Assert**:
   - Registry contains exactly **1** canonical entity: `"Associated Press"`.
   - Aliases list includes `"A.P."`, `"AP"`, `"Associated Press / A.P."`.
   - Occurrences count is **3**, mapping correctly to Scenes 1, 2, and 3 with exact surface excerpts preserved.

### Scenario 5: Occurrence Grounding & Historical Draft Archival
1. Ingest Draft 1 containing `"Summit Cola"` and `"Midtown Spire Tower"`.
2. Ingest Draft 2 which omits `"Summit Cola"` and introduces `"AeroTech Laptop"`.
3. **Assert**:
   - Primary active registry displays `"Midtown Spire Tower"` and `"AeroTech Laptop"`.
   - `"Summit Cola"` is classified as `NOT_IN_CURRENT_DRAFT` (`occurrencesCount: 0`).
   - Shooting readiness calculation includes only active draft entities.

### Scenario 6: Passive Timeline Idempotency
1. Open the timeline drawer on a populated project.
2. Note the initial event count (e.g. 24 events).
3. Leave the tab open for 3 minutes while background polls occur and switch between browser tabs.
4. **Assert**:
   - Event count remains strictly constant (e.g. 24 events).
   - Zero synthetic duplicate events generated.

---

## Automated Test Command
Run the complete regression suite:
```bash
npm test
npm run build
```
