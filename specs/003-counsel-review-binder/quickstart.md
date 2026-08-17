# Quickstart Validation: Clearance Binder Export & Studio Counsel Review Module

**Feature**: `specs/003-counsel-review-binder` | **Date**: 2026-08-18 (Updated)

---

## 1. Automated Test Suites

Run contract and integration tests for counsel overrides, scene isolation, hierarchical status resolution, script highlighter, and clearance binder export:

```bash
# Run all Vitest test suites in TEST_MODE
npm test

# Run specific counsel review and binder contract tests
npx vitest run tests/contract/test_counsel_override.test.ts
npx vitest run tests/contract/test_binder_export.test.ts
npx vitest run tests/contract/test_script_highlighter.test.ts
npx vitest run tests/integration/counsel_review_workflow.test.ts
```

---

## 2. Interactive Verification Flow

1. **Launch DEMO_MODE**:
   ```bash
   npm run start:demo
   ```
2. **Ingest Multi-Category Script**:
   - Open `http://localhost:3000`.
   - Click "Ingest Screenplay".
   - Confirm script viewer renders scenes with interactive, color-coded inline badges for "Coca-Cola", "Rolex", "Porsche", and "Bohemian Rhapsody".
3. **Execute Scene-Specific Override Isolation Test**:
   - In Scene 1, click the inline badge for "Coca-Cola" (marked `ACTION REQUIRED`).
   - Confirm `CitationDrawer` opens with `sceneId="scene-1"` populated.
   - Check "Apply as Scene-Specific Override only for current scene (scene-1)".
   - Enter counsel name ("Jane Doe, Esq."), select `NO ISSUE SURFACED`, enter rationale (`Scene 1 paid prop placement`).
   - Submit override.
   - Verify:
     - Scene 1 badge turns green (`NO ISSUE SURFACED`).
     - Scene 2 / Scene 3 badges for "Coca-Cola" remain red (`ACTION REQUIRED`).
     - Entity Registry table shows baseline status `ACTION REQUIRED` (`isOverridden: false`).
4. **Export Legal Clearance Binder & Verify Mixed Provenance**:
   - Click "Export Clearance Binder" in the top navigation bar.
   - Verify `provenanceSummary` reflects the breakdown of citations across categories.
   - Download the `.json` file and verify `integrityDigest` and `provenanceSummary`.
   - Click "Print / Save PDF" to verify `@media print` layout formatting displaying the SHA-256 Integrity Digest.
