# Research & Architectural Decisions: 029-honest-ingestion-ux

## 1. Eliminate Silent Demo Seeding

### Decision
Completely remove automatic calls to `POST /api/projects/:id/script/demo` from `src/App.tsx` (`initProject`, `loadProjectDetails`, and project creation). Sample reference productions (`proj-default` and `proj-cyberpunk`) will be loaded exclusively via explicit user intent (e.g., clicking "Load Sample Production Data" in the empty workspace, or selecting the sample cards in Portfolio).

### Rationale
Silent demo substitution violates core trust principles and causes user script uploads to be silently overwritten or confused with synthetic demo data (*"The Neon Horizon"*). Real productions must remain clean with 0 scenes and 0 items until the user uploads a script or explicitly requests sample data.

### Alternatives Considered
- Auto-seeding only when project title is "Untitled": Rejected because user-created untitled projects were still getting polluted.
- Prompting on every load: Unnecessary; keeping newly created projects empty is the standard, expected behavior.

---

## 2. Pre-Commit Extraction Preview Endpoint & Validation

### Decision
Implement `POST /api/projects/:id/script/preview` (and update `/api/projects/:id/script/upload`) to parse screenplay text in-memory before committing to Firestore:
1. Extract text from PDF, Fountain, or plain text.
2. Run standard scene slugline detection (e.g. `INT.`, `EXT.`, `INT./EXT.`, `I/E`).
3. Compute document statistics: character count, estimated page count (~250 words or ~1500 chars/page), detected scene count, and excerpt up to 5 sample scene headings.
4. If detected scene count is 0 or text is empty, generate explicit warnings and set `isValid: false`.
5. On actual upload (`POST /api/projects/:id/script`), reject 0-scene extractions with HTTP 422 `ZERO_SCENES_DETECTED` instead of reporting false `success: true`.

### Rationale
Prevents malformed, scanned image, or unparseable PDFs from corrupting the project database or appearing as "cleared" empty productions. Gives operators confidence and transparency before committing data.

### Alternatives Considered
- Committing immediately and letting the user delete scenes: Creates messy database state and triggers erroneous readiness calculations.
- Client-side only PDF parsing: Browser PDF parsers have varying font/encoding support; server-side extraction provides consistent results and matches the live Cloud Run runtime.

---

## 3. Persistent Header "New Production" & Header Simplification

### Decision
1. Add a dedicated, high-visibility "New Production" button in the primary header (`[data-testid="header-new-production-btn"]`).
2. Retain the "Switch Project" button purely for switching active projects and viewing the portfolio dashboard.
3. Move administrative and diagnostic items (Execution Mode pill, Live API Quota counter, Serving Revision K_REVISION) strictly into the Settings dialog.

### Rationale
Creating a production is a P0 primary action that should never be buried inside a switcher modal. Moving secondary administrative chrome into Settings aligns with Article 16 of the ClearanceScout Constitution and declutters mobile viewports.

---

## 4. Honest Empty-State & Primary Action Hierarchy

### Decision
Update `RecommendedActionCard` and workspace summary bars:
- When a project has 0 scenes:
  - Header & Summary Bar: Display "No screenplay uploaded" / "0 scenes".
  - Recommendation Card: Displays "Upload Screenplay" (opens intake modal) with subtext "Upload a screenplay (PDF, Fountain, or text) to begin automated clearance analysis."
  - Never display "All Clearance Items Cleared" or "100% Ready" for an empty project.
- When a project has scenes with 0 clearance blockers:
  - Display "No clearance blockers recorded" and "No clearance items recorded".

### Rationale
Prevents false claims of production readiness on unanalyzed projects.

---

## 5. In-Memory DEMO_MODE Instance Identity & Production Project Discovery (P1 Remediation)

### Root Cause Analysis: Disappearing Productions After Reload
In Cloud Run DEMO_MODE, Firestore operates using in-memory mocks (`MockFirestore` in `server/repositories/ProjectRepo.ts`), which are scoped to individual Cloud Run container instance lifecycles. 
1. **Fresh Instance Cold Starts**: When a new Cloud Run revision is deployed or a container cold-starts, the in-memory store starts with exactly two baseline projects:
   - `proj-default`: Default Production Workspace (honest-empty, 0 scenes, 0 clearance items, 0% readiness).
   - `proj-cyberpunk`: Cyberpunk (1 scene `INT. VIRTUAL LAB - DAY`, 0 clearance items, 0% readiness / Pending Review).
2. **User-Created / Sample Productions**: Any user-created production (e.g. Mountain Refuge with `proj-<uuid>`) or sample loaded via "Load Sample Production Data" (The Neon Horizon) exists in the container instance's memory. If a hard reload hits a new container instance, or if local storage clears the active project, the client defaults back to `proj-default`.
3. **Explicit User Intent vs Silent Auto-Seeding**: Per the non-negotiable hackathon rule and architectural principle of honest ingestion, the backend must NOT silently reseed or auto-populate user workspaces upon token reload or page refresh. Instead, the populate path must remain explicit via:
   - Clicking "Load Sample Production Data" in `proj-default` to load The Neon Horizon.
   - Or creating a new production via "+ New Production".
4. **Disambiguation of Same-Name Productions**: When multiple productions share identical titles (such as duplicate "Mountain Refuge" entries created during testing), visual ambiguity caused user confusion. To resolve this deterministically:
   - Both the Project Switcher modal (`src/components/ProjectListModal.tsx`) and Portfolio Dashboard (`src/components/PortfolioDashboard.tsx`) explicitly render stable project ID chips (`[proj-<uuid>]` alongside `[formatProjectCode]`).
   - Cards display creation timestamps to provide unmistakable provenance without mutating or reseeding shared datasets.

