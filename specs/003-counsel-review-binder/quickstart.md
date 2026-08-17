# Quickstart Validation: Clearance Binder Export & Studio Counsel Review Module

**Feature**: `specs/003-counsel-review-binder` | **Date**: 2026-08-18 (Updated)

---

## 1. Automated Test Suites

Run contract and integration tests for counsel overrides, hierarchical status resolution, script highlighter, and clearance binder export:

```bash
# Run Vitest test suites in TEST_MODE
npm test

# Run specific counsel review and binder contract tests
npx vitest run tests/contract/test_counsel_override.test.ts
npx vitest run tests/contract/test_binder_export.test.ts
npx vitest run tests/contract/test_script_highlighter.test.ts
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
3. **Execute Canonical & Scene-Specific Counsel Override**:
   - In the script viewer or entity registry, select "Coca-Cola" (marked `ACTION REQUIRED`).
   - Click "Counsel Override".
   - Verify counsel name starts empty.
   - Enter counsel name ("Jane Doe, Esq."), title ("Senior Production Legal Counsel"), change status to `NO ISSUE SURFACED`, and enter rationale: `Licensed under Global Co-Promotion Agreement #GCP-2026`.
   - Submit override.
   - Verify that the badge in the script turns green (`NO ISSUE SURFACED`) with an "Overridden by Counsel" indicator.
   - Next, apply a scene-specific override for Scene 2 to `REVIEW RECOMMENDED` and verify that Scene 2 displays Amber (`REVIEW RECOMMENDED`) while Scene 1 and Scene 3 remain Green (`NO ISSUE SURFACED`).
4. **Export Legal Clearance Binder**:
   - Click "Export Clearance Binder" in the top navigation bar.
   - Verify summary metrics reflect the overrides.
   - Download the `.json` file and verify the SHA-256 `integrityDigest` field.
   - Click "Print / Save PDF" to verify `@media print` layout formatting displaying the SHA-256 Integrity Digest.
