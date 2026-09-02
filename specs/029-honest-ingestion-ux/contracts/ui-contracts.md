# UI & Interaction Contracts: 029-honest-ingestion-ux

## 1. Header Navigation Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] ClearanceScout  [+ New Production]  [Project: Title ▼]  [📊 Portfolio] [🔔 Alerts] [⚙️ Settings] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- `[+ New Production]` (`data-testid="header-new-production-btn"`):
  - Accessible label: `"Create New Production"`
  - Opens creation modal with clean fields (Title, Studio, Project Type).
  - On submit, creates an unpopulated project (0 scenes, 0 clearance items, 0 tasks) and switches active project.
- `[Project: Title ▼]`:
  - Switches between existing productions. Does NOT contain "New Production" inside the list.
- `[⚙️ Settings]`:
  - Contains: Demo Access Token configuration, Serving Revision (`clearancescout-...`), System Execution Mode (`DEMO_MODE`), Live Quota Counter.

---

## 2. Empty Workspace & Next Action Hierarchy

When `scenes.length === 0`:
- **Readiness Badge**: Displays `"No Script Ingested"` (gray neutral pill) instead of `"100% Ready"`.
- **Primary Recommendation Card** (`data-testid="primary-recommendation-card"`):
  - Title: `"Upload Screenplay to Begin Clearance"`
  - Description: `"Upload a screenplay in PDF, Fountain, or Plain Text format to extract scenes and detect clearance entities."`
  - Primary Button: `"Upload Screenplay"` (`data-testid="recommendation-upload-script-btn"`)
  - Secondary Action: `"Load Sample Production"` (`data-testid="recommendation-load-sample-btn"`)
- **Clearance Registry Summary**: Displays `"No clearance items recorded"` (0 entities).
- **Scene List**: Displays `"No screenplay scenes uploaded yet."`.

---

## 3. Screenplay Intake & Preview Modal

Modal flow:
1. **File Selection**: Drag & drop or file browse (`.pdf`, `.txt`, `.fountain`).
2. **Extraction Preview Card**:
   - Displays: Filename, detected format, estimated pages, detected scene count.
   - Sample scene headings list (e.g. `Scene 1: INT. LAB - DAY`, `Scene 2: EXT. STREET - NIGHT`).
   - If `scenesDetected === 0`: Displays a prominent Amber/Red warning alert `"No valid screenplay scenes detected. Please verify the document contains standard sluglines (e.g., INT. or EXT.)."`
3. **Actions**:
   - `[Confirm Ingestion]` (`data-testid="btn-confirm-ingestion"`): Disabled if `scenesDetected === 0`.
   - `[Cancel / Upload Different File]`.
