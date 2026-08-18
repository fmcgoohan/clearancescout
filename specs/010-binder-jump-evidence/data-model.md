# Data Model: Binder Jump to Evidence & Timeline Context

**Feature**: `specs/010-binder-jump-evidence` | **Date**: 2026-08-18

---

## 1. Binder Jump Target

```typescript
export interface BinderJumpTarget {
  entityId: string;
  entityName: string;
  category?: string;
  status?: string;
  rationale?: string;
  citations?: Citation[];
  replacementCard?: any;
  mode: 'EVIDENCE' | 'TIMELINE';
}
```

---

## 2. Citation Drawer Supporting Shapes

```typescript
export interface Citation {
  id: string;
  sourceUrl: string;
  query: string;
  retrievedAt: string;
  excerptSnippet: string;
  registrationStatus: string;
  corporateOwner?: string;
  disputePrecedents?: string;
  provenance?: 'PARALLEL_LIVE' | 'DEMO_FIXTURE' | 'FALLBACK_FIXTURE';
}
```

---

## 3. Timeline Filter / Focus Shape

```typescript
export interface TimelineFocusOptions {
  targetEntityId?: string;
  targetEntityName?: string;
}
```
