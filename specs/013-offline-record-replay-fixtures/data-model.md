# Data Model: Offline Record Replay Fixtures

**Feature**: `specs/013-offline-record-replay-fixtures` | **Date**: 2026-08-18

---

## 1. Parallel Search Record-Replay Fixture Schema

```typescript
export interface ParallelSearchRecordFixture {
  entityKey: string;
  sourceUrl: string;
  excerptSnippet: string;
  registrationStatus: 'REGISTERED_ACTIVE' | 'PENDING' | 'ABANDONED' | 'UNREGISTERED';
  corporateOwner: string;
  disputePrecedents: string;
}
```

---

## 2. Gemini Response Fixture Schemas

```typescript
export interface GeminiScriptParseFixture {
  scriptKeyword: string;
  scenes: Array<{
    sceneNumber: number;
    heading: string;
    locationType: 'INT' | 'EXT';
    timeOfDay: string;
    rawText: string;
    characterActionSummary: string;
    entities: Array<{
      name: string;
      category: 'BRAND_OR_PRODUCT' | 'CORPORATION' | 'PUBLIC_FIGURE' | 'REAL_WORLD_LOCATION' | 'COPYRIGHTED_WORK';
      context: string;
    }>;
  }>;
}

export interface GeminiReplacementFixture {
  entityCategory: string;
  candidateNames: string[];
  fictionalRationale: string;
  visualPrompt: string;
}
```
