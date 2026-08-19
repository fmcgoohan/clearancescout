# Research & Architectural Decisions: Production Clearance Operating Model (Phase 7)

**Feature**: `specs/016-production-clearance-model` (Phase 7 Focus)  
**Date**: 2026-08-19  
**Status**: Completed  

---

## 1. Multi-Domain Placeholder Parameterization

### Context & Problem
In film & TV productions, replacement assets are not limited to fictional brand logos. Different departments have distinct replacement needs:
- **Art Department (Props & Graphics)**: Needs printable fictional prop packaging with exact physical dimensions.
- **Music Department**: Needs tempo (BPM), musical key, and acoustic style guidelines for score/source composition substitutes.
- **Dialogue / Script Supervisors**: Needs scripted alternative lines with preserved dramatic subtext to replace defamatory or trademarked dialogue.
- **Set Dressing / Art Gallery**: Needs artist prompt guidelines and copyright-free visual artwork specs.

### Decision
Implement `ReplacementPlaceholderData` supporting a polymorphic `categoryDetails` JSON structure:

```typescript
export interface CategoryDetailsMap {
  BRAND: {
    trademarkSearchNotes?: string;
    packagingDimensions?: string;
    fictionalTagline?: string;
  };
  ART_MUSIC: {
    bpm?: number;
    key?: string;
    musicalStyle?: string;
    licenseType?: string;
  };
  ARTWORK: {
    artistPrompt?: string;
    visualStyle?: string;
    dimensions?: string;
    imageUrl?: string;
  };
  DIALOGUE: {
    alternativeLines?: string[];
    subtextRationale?: string;
  };
  GRAPHIC_PROP: {
    physicalSpecs?: string;
    safetyClearanceNotes?: string;
    graphicLabelUrl?: string;
  };
}
```

---

## 2. Two-Tier Lifecycle: `TEMP_APPROVED` vs `FINAL_CLEARED`

### Definition:
1. **`TEMP_APPROVED` (On-Set / Shooting Clearance)**:
   - Asset is approved by the Department Lead (e.g. Prop Master, Music Supervisor) for physical filming on set.
   - **Scene Readiness Impact**: Satisfies shooting safety, yielding **`WORKING CLEAR`** (allows call sheet lock).
2. **`FINAL_CLEARED` (Distribution / Picture Lock Clearance)**:
   - Asset has completed final trademark clearance searches, written release execution, or counsel review.
   - **Scene Readiness Impact**: Unlocks full distribution clearance, yielding **`FINAL CLEAR`**.

### Transition Matrix:

| Current State | Target Action | New Tier | Scene Readiness Impact |
|:---|:---|:---:|:---:|
| No placeholder | Create on-set replacement | `TEMP_APPROVED` | Scene becomes `WORKING_CLEAR` |
| `TEMP_APPROVED` | Legal Counsel sign-off | `FINAL_CLEARED` | Scene upgrades to `FINAL_CLEAR` |
| `FINAL_CLEARED` | Demote / Re-evaluate | `TEMP_APPROVED` | Scene shifts to `WORKING_CLEAR` |

---

## 3. Alternatives Considered

| Approach | Assessment | Decision |
|:---|:---|:---|
| **Simple Boolean Flag** | Fails to capture the rich metadata needed by music supervisors (BPM/key) or script supervisors (alternative lines). | **Rejected**: Use domain-specific parameter mapping. |
| **Separate Independent Repositories per Category** | High architectural sprawl (5 distinct tables/repos). | **Rejected**: Unified `PlaceholderRepo` with typed category discriminant. |
