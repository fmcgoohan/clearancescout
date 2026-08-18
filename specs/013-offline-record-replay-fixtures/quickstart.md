# Quickstart Validation Guide: Offline Record Replay Fixtures

**Feature**: `specs/013-offline-record-replay-fixtures` | **Date**: 2026-08-18

---

## Scenario 1: Deterministic Offline Test Execution

1. Ensure network is disconnected or no API keys are exported.
2. Run test suite:
   ```bash
   EXECUTION_MODE=TEST_MODE npm test
   ```
3. Verify 100% of test suites pass without network errors.

---

## Scenario 2: Cloud Mode Startup Credential Enforcement

1. Attempt to start server in `CLOUD_MODE` without API keys:
   ```bash
   EXECUTION_MODE=CLOUD_MODE npm run dev
   ```
2. Verify server fails visibly on startup with:
   `[ClearanceScout Configuration Error] Execution mode is CLOUD_MODE, but required API key(s) missing: ...`
