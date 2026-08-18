# UI Component Contract: Binder Jump to Evidence & Timeline Context

**Feature**: `specs/010-binder-jump-evidence` | **Date**: 2026-08-18

---

## 1. `BinderExportModalProps`

```typescript
export interface BinderExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  binder: ClearanceBinder | null;
  onJumpToEvidence?: (entityId: string, entityName: string, citations?: any[], rationale?: string, status?: string) => void;
  onJumpToTimeline?: (entityId: string, entityName: string) => void;
}
```

---

## 2. `CitationDrawerProps` Extension

```typescript
export interface CitationDrawerProps {
  projectId: string;
  canonicalEntityId?: string;
  sceneId?: string;
  citations: Citation[];
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  rationale?: string;
  currentStatus?: string;
  isOverridden?: boolean;
  latestOverride?: any;
  executionMode?: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
  onOverrideSaved?: () => void;
}
```

---

## 3. `TimelineDrawerProps` Extension

```typescript
export interface TimelineDrawerProps {
  events: TimelineEvent[];
  isOpen: boolean;
  onClose: () => void;
  targetEntityName?: string | null;
  targetEntityId?: string | null;
}
```
