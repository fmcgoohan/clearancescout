# Data Model: Production Clearance Operating Model (Phase 7)

**Feature**: `specs/016-production-clearance-model` (Phase 7 Focus)  
**Date**: 2026-08-19  
**Status**: Completed  

---

## 1. Generalized Replacement & Placeholder Domain Models

### Enums
```typescript
export type PlaceholderAssetCategory =
  | 'BRAND'
  | 'ART_MUSIC'
  | 'ARTWORK'
  | 'DIALOGUE'
  | 'GRAPHIC_PROP';

export type PlaceholderClearanceTier = 'TEMP_APPROVED' | 'FINAL_CLEARED';
```

### `ReplacementPlaceholderData`
Stored in Firestore at `projects/{projectId}/placeholders/{placeholderId}`.

```typescript
export interface ReplacementPlaceholderData {
  id: string;                      // e.g. 'ph-a1b2c3d4'
  projectId: string;
  canonicalEntityId: string;
  canonicalName: string;
  assetCategory: PlaceholderAssetCategory;
  fictionalName: string;
  description: string;
  clearanceTier: PlaceholderClearanceTier;
  creativeRationale: string;
  approvedBy: string;
  approvedRole?: string;
  approvalDate: string;
  expirationDate?: string;
  categoryDetails?: {
    // Brand
    trademarkSearchNotes?: string;
    packagingDimensions?: string;
    fictionalTagline?: string;

    // Music
    bpm?: number;
    key?: string;
    musicalStyle?: string;
    licenseType?: string;

    // Artwork
    artistPrompt?: string;
    visualStyle?: string;
    dimensions?: string;
    imageUrl?: string;

    // Dialogue
    alternativeLines?: string[];
    subtextRationale?: string;

    // Prop
    physicalSpecs?: string;
    safetyClearanceNotes?: string;
    graphicLabelUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. Scene Readiness Integration

```typescript
// sceneReadinessEngine.ts
if (placeholder) {
  if (placeholder.clearanceTier === 'FINAL_CLEARED') {
    readinessTier = 'FINAL_CLEAR';
  } else if (placeholder.clearanceTier === 'TEMP_APPROVED') {
    readinessTier = 'WORKING_CLEAR';
  }
}
```
