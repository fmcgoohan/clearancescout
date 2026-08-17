# Quickstart Validation: Clearance Binder Export & Studio Counsel Review Module

**Feature**: `specs/003-counsel-review-binder` | **Date**: 2026-08-17

---

## 1. Automated Test Suites

Run contract and integration tests for counsel overrides, script highlighter, and clearance binder export:

```bash
# Run Vitest test suites in TEST_MODE
npm test

# Run specific counsel review contract tests
npx vitest run tests/contract/test_counsel_override.test.ts
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
3. **Execute Counsel Override**:
   - In the script viewer or entity registry, select "Coca-Cola" (marked `ACTION REQUIRED`).
   - Click "Counsel Override".
   - Change status to `NO ISSUE SURFACED`.
   - Enter rationale: `Licensed under Global Co-Promotion Agreement #GCP-2026`.
   - Submit override.
   - Verify that the badge in the script turns green (`NO ISSUE SURFACED`) with an "Overridden by Counsel" indicator.
4. **Export Legal Clearance Binder**:
   - Click "Export Clearance Binder" in the top navigation bar.
   - Verify summary metrics reflect the override.
   - Download the `.json` file and verify SHA-256 audit signature.
   - Click "Print / Save PDF" to verify `@media print` layout formatting.
