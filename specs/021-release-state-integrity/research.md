# Research & Technical Decisions: Feature 021 Release State Integrity and Operator Trust

## 1. Ingestion State Machine & Atomic Snapshot Synchronization (P0-1)

### Decision
Implement a single-source-of-truth ingestion state machine with explicit lifecycle phases (`IDLE`, `UPLOADING`, `PARSING`, `EXTRACTING`, `RECONCILING`, `COMPLETE`, `FAILED`) shared across both file upload (`ScriptUploadModal`) and 1-click demo screenplay ingestion (`handleLoadSampleScreenplay`). Enforce atomic refresh on `COMPLETE` where scenes, canonical entities, action items, summary counts, and shooting readiness are fetched concurrently from a single committed snapshot.

### Rationale
- Previously, sample script ingestion disabled the button without any progress modal, while file uploads ran a separate timer that jumped to fake progress percentages.
- Concurrent intermediate queries to Firestore during active ingestion returned partial records (e.g. summary banner reading 35 items while the entity registry read 0, or scene counts briefly showing 188 before dropping to 3).
- Moving to an explicit state machine with an atomic publish step guarantees that no partial counts leak to the UI, and prevents duplicate submissions.

### Alternatives Considered
- **WebSockets / Real-time Firestore listeners**: Rejected because ClearanceScout is architected around stateless Cloud Run containers and SSE event streams. SSE + atomic snapshot completion provides identical responsiveness without introducing stateful connection servers.
- **Client-only optimistic count calculation**: Rejected because client-calculated entity counts diverge from server-side deduplication, violating the deterministic calculation invariant.

---

## 2. Interactive Overlays & Action Drawer Stacking Context (P0-2, P0-6)

### Decision
Standardize all modal and drawer overlay containers to an elevated stacking layer (`zIndex: 1400` for modals, `zIndex: 1350` for sliding drawers) with explicit fixed positioning (`position: fixed; inset: 0`), high-contrast dark backdrop filters, and full keyboard focus trapping (`role="dialog"`, `aria-modal="true"`, `Escape` key listeners, and focus restoration to triggering buttons). Position primary action triggers (Actions counter, Operations Dashboard, Ingestion button, Binder Export) in a fixed, stable primary control bar.

### Rationale
- QA identified dead focus states where elements received focus without rendering a visible drawer or modal. The root causes were:
  1. Tailwind-only utility classes remaining in certain dialog components where Tailwind is not configured in the repository.
  2. Drawer z-index (1300) conflicting with modal backdrops (1400) and layout headers (100).
  3. Swallowed clicks when demo tokens were invalid instead of surfacing visible authentication modals.

### Alternatives Considered
- **Third-party UI libraries (Radix / Headless UI)**: Rejected to preserve zero new framework dependencies and keep the lightweight React bundle clean.
- **Absolute positioning inside relative scroll containers**: Rejected because parent overflow styling (`overflow: hidden` or `overflow: auto`) clips drawers and causes invisible rendering.

---

## 3. Generic Canonical Entity Disambiguation & Alias Normalization (P0-3)

### Decision
Enhance `EntityResolutionEngine` with generic lexical normalization that:
1. Strips all punctuation and standardizes whitespace.
2. Extracts and matches parenthetical expansions (e.g. `A.P. (Associated Press)` → `A.P.` and `Associated Press`).
3. Splits compound alias separators (e.g. `Associated Press / A.P.` → `Associated Press` and `A.P.`).
4. Generates and matches acronym initials from multi-word canonical entities (e.g. `Associated Press` → `AP`, `A.P.`, `A. P.`).
5. Normalizes dotted acronyms to clean tokens (e.g. `A.P.` → `AP`, `U.S.A.` → `USA`).

### Rationale
- Previous resolution only performed strict substring prefix matching, causing `Associated Press`, `A.P.`, and `Associated Press / A.P.` to spawn duplicate canonical entities.
- A generic normalization algorithm handles all brands, studios, publishers, and trademarks without hardcoding special cases.

### Alternatives Considered
- **Gemini LLM-based entity matching on every occurrence**: Rejected because LLM calls for every occurrence add unacceptable latency and cost, violating the Constitution's division of labor between fast deterministic code and AI reasoning.

---

## 4. Current-Draft Occurrence Scoping & Historical Revision Archival (P0-4)

### Decision
Enforce that all active canonical entities displayed in the primary workspace registry possess at least one valid occurrence on a scene belonging to the current active script draft. When a new screenplay draft is uploaded:
1. Superseded scenes and occurrences are cleared.
2. Canonical entities not mentioned in the new draft are marked with `origin = 'HISTORICAL_ARCHIVE'` or `status = 'NOT_IN_CURRENT_DRAFT'`.
3. Primary registry views and shooting readiness engines filter strictly for active draft entities (`occurrencesCount > 0`), while an optional "Include Historical Revisions" filter allows audit inspection.

### Rationale
- Entities without occurrences in the current draft were lingering in `EntityRepo` from previous uploads, distorting blocker metrics and shooting readiness percentages.

### Alternatives Considered
- **Hard deleting unmentioned canonical entities on draft re-upload**: Rejected because historical clearance decisions, counsel overrides, and research notes must be preserved for compliance and audit integrity.

---

## 5. Side-Effect Free Observation & Timeline Idempotency (P0-5)

### Decision
Eliminate synthetic timeline growth by:
1. Ensuring all GET endpoints, dashboard polls, and SSE stream handlers are strictly read-only and emit zero `timelineEmitter.emit` events.
2. Implementing client-side event deduplication by `id` in `useTimelineSSE` (`setEvents(prev => prev.some(e => e.id === newEvt.id) ? prev : [...prev, newEvt])`).
3. Preventing double-replay of event history between REST history fetch and SSE connection.

### Rationale
- `useTimelineSSE` fetched history via REST on mount, while `timelineEmitter.addClient` simultaneously wrote the entire event history down the SSE stream.
- Reconnections appended duplicate events repeatedly, inflating the event count from 1400 to 1700+ during passive viewing.

### Alternatives Considered
- **Dropping REST history endpoint and relying solely on SSE replay**: Rejected because REST history enables immediate SSR and offline replay without requiring an open persistent connection.

---

## 6. Truthful Sample Labeling & Operational Recovery Guidance (P0-7, P0-8)

### Decision
1. Update `handleLoadSampleScreenplay` and `demoAutomationWorkflow` to explicitly set and return `The Neon Horizon (Bundled Fictional Demo)` as the script title and source, removing any stale third-party references.
2. In `ScriptUploadModal` and long-running operations, display active stage indicators, elapsed seconds, reason for processing duration when exceeding 30s, an active "Cancel" button, and actionable "Retry" triggers on failure.

### Rationale
- Eliminates operator confusion and establishes trust by being completely transparent about data provenance and operation health.
