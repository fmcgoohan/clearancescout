# Quickstart Validation Guide: Feature 018 Production Hardening & Live Evidence Integrity

**Feature Branch**: `018-production-hardening`  
**Created**: 2026-08-20  
**Status**: Completed

---

## 1. Prerequisites

- Node.js $\ge 20.x$ installed
- Clean installation dependencies: `npm ci`
- Test runner: `npm test`

---

## 2. Validation Scenario 1: Fail-Closed `CLOUD_MODE` Invariant Verification

**Objective**: Prove that missing search keys or fallback fixtures in `CLOUD_MODE` strictly fail closed to `INSUFFICIENT_EVIDENCE`.

```bash
# Run contract test for fail-closed cloud evaluation
npx vitest run tests/contract/test_cloud_fail_closed.test.ts
```

**Expected Outcome**:
- Evaluation returns status `INSUFFICIENT_EVIDENCE` and provenance `FALLBACK_FIXTURE` (⚡).
- Scene readiness evaluates to `RED` (blocker).

---

## 3. Validation Scenario 2: Authentic `PARALLEL_LIVE` Zero-Hit Grounding

**Objective**: Prove that live search returning zero hits records authentic completed research without fabricating synthetic owners or registration numbers.

```bash
# Run contract test for clean zero-hit live search handling
npx vitest run tests/contract/test_live_zero_hit.test.ts
```

**Expected Outcome**:
- Provenance is `PARALLEL_LIVE` (🌐).
- Citation notes that zero conflicting marks were surfaced.
- No synthetic owner or serial number fields are populated.

---

## 4. Validation Scenario 3: Granular Scoped Placeholders & Strict `WORKING_CLEAR`

**Objective**: Prove that a `TEMP_APPROVED` placeholder scoped to Scene 1 transitions Scene 1 to `WORKING_CLEAR`, while Scene 4 with the same brand remains `RED`.

```bash
# Run integration test for scoped placeholders and scene readiness
npx vitest run tests/integration/scoped_placeholder_workflow.test.ts
```

**Expected Outcome**:
- Scene 1 evaluates to `WORKING_CLEAR` with an affirmative interim placeholder mitigation.
- Scene 4 evaluates to `RED` because the placeholder scope does not include Scene 4.
- Scene containing unmitigated `REVIEW_RECOMMENDED` evaluates to `RED`.

---

## 5. Validation Scenario 4: PDF Ingestion & Failure Diagnostics

**Objective**: Prove genuine PDF text extraction and visible `400 Bad Request` diagnostic reporting on corrupt/unparseable files.

```bash
# Run contract test for PDF ingestion
npx vitest run tests/contract/test_pdf_ingestion.test.ts
```

**Expected Outcome**:
- Valid text-based PDF screenplays parse into scenes and occurrences.
- Unparseable/scanned binary files fail visibly with `code: "PDF_EXTRACTION_FAILED"`.

---

## 6. Validation Scenario 5: Full Regression Suite Verification

```bash
# Run complete test suite and TypeScript build
npm test
npm run build
```

**Expected Outcome**:
- 100% pass rate across all 60+ test suites (115+ tests).
- Clean production bundle with zero compilation errors.
