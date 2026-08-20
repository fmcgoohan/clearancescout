# API Contract: Screenplay Draft Replacement & Versioning

**Scope**: Rules and response contracts for re-uploading revised screenplay drafts.

---

## 1. Lifecycle Operations

When a screenplay is uploaded to a project with existing scenes (`replaceExisting: true`):

1. **Scene Hierarchy Purge / Superseding**:
   - All previous scene documents (`projects/{projectId}/scenes/*`) and their occurrences are deleted or moved to archive subcollection.
   - Scene sequence numbers are recreated from 1 to $N$ matching the new screenplay draft.

2. **Entity Re-indexing & Overrides Preservation**:
   - For newly extracted entities that match existing canonical entity names in the project, retain:
     - `parentEntityId`, `relationshipType`, `aliases`
     - Signed legal counsel overrides (unless scene-scoped to a scene number that no longer exists)
     - Executed contractual rights agreements
   - For entities completely removed in the new draft, archive or soft-delete the canonical entity record.

3. **Orphaned Action Cleanup**:
   - Open action items linked to deleted occurrences are transitioned to `CANCELLED` with resolution trigger `SCRIPT_REVISION_SUPERSEDED`.
   - New action items are dispatched for newly surfaced risk occurrences.

---

## 2. Ingestion Response Contract

```json
{
  "success": true,
  "projectId": "proj-12345678",
  "draftVersion": 2,
  "replacementSummary": {
    "previousSceneCount": 10,
    "newSceneCount": 14,
    "orphanedOccurrencesCleaned": 18,
    "actionsCancelled": 4,
    "retainedOverrides": 2,
    "retainedRights": 1
  },
  "ingestedAt": "2026-08-21T01:28:00.000Z"
}
```
