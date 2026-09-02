# Data Model & Schema Changes: 029-honest-ingestion-ux

## 1. Project Entity

```typescript
export interface ProjectData {
  id: string;
  title: string;
  productionCompany: string;
  scriptVersion: string;
  projectType?: 'Movie' | 'TV Show' | 'Commercial';
  executionMode: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
  isSample?: boolean;             // Explicit flag for golden demo productions (The Neon Horizon, Cyberpunk Odyssey)
  liveQuotaLimit?: number;
  liveQuotaUsed?: number;
  createdAt: string;
  updatedAt: string;
}
```

## 2. Screenplay Extraction Preview

```typescript
export interface ScriptExtractionPreview {
  filename: string;
  format: 'PLAINTEXT' | 'FOUNTAIN' | 'PDF';
  characterCount: number;
  wordCount: number;
  estimatedPageCount: number;
  scenesDetected: number;
  sampleHeadings: string[];       // Up to 5 detected scene headings (e.g. "INT. APARTMENT - NIGHT")
  warnings: string[];             // e.g. "No scene headings detected.", "File contains no extractable text."
  isValid: boolean;               // True only if scenesDetected > 0 and characterCount > 0
  previewTextExcerpt: string;     // First ~500 characters of extracted text
}
```

## 3. Project Workspace State Transitions

```text
[New Production Created]
         │
         ▼
[EMPTY WORKSPACE] (0 scenes, 0 clearance items, 0 tasks)
  • Primary Action: "Upload Screenplay"
  • Alternative Action: "Load Sample Production Data"
         │
         ├── User uploads script ──► [EXTRACTION PREVIEW]
         │                                │
         │                                ├── Invalid (0 scenes) ──► Blocked (Must re-upload)
         │                                └── Valid (>= 1 scene) ──► Confirm Ingestion
         │                                                                │
         │                                                                ▼
         │                                                   [CLEARANCE REVIEW STAGE]
         │                                                     • Blockers > 0 ──► "Resolve Next Blocker"
         │                                                     • Blockers = 0 ──► "Review Tasks"
         │                                                                │
         │                                                                ▼
         │                                                   [READINESS & EXPORT STAGE]
         │                                                     • All clear ──► "Export Clearance Binder"
         │
         └── User clicks "Load Sample" ──► [SAMPLE BENCHMARK LOADED]
                                             • Neon Horizon: 3/7/11, 33.3%, 2 blocked
                                             • Cyberpunk Odyssey: 1/0/0, 100%, 0 blocked
```
