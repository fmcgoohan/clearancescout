# Quickstart & Verification Guide: 020 Live Operator Access and Cloud-Mode First Run

This guide defines automated and manual validation scenarios for verifying operator access, token gate behavior, client authentication, and live demo execution.

---

## 1. Automated Contract Verification

Run targeted test suites exercising the authentication gate, client requests, and health probe:

```bash
# Run contract tests for authentication and health
npx vitest run tests/contract/test_demo_auth.test.ts tests/contract/test_health_api.test.ts
```

**Expected Result**: All tests pass with HTTP 401 on unauthenticated access and HTTP 200 on authenticated access.

---

## 2. Manual Incognito First-Run Verification

1. Open `https://clearance-scout-n3tcx4jcbq-uc.a.run.app` in a clean browser incognito window (no stored `localStorage` token).
2. **Verify**:
   - The Token Configuration Modal opens immediately in blocking mode.
   - Project dropdown displays an "Authentication Required" state rather than "No projects found".
   - Token input placeholder contains `judge-pass-2026`.
3. Click "Save Token" with `judge-pass-2026`:
   - **Verify**: Modal closes, `GET /api/projects` reloads automatically, and active projects appear in the selector.

---

## 3. Client Network & SSE Stream Verification

1. Select or create a project.
2. Click **"Observable Action Timeline"** drawer:
   - **Verify**: Timeline connects without 401 error and stream events appear in real-time.
3. Click **"Operations Dashboard"**:
   - **Verify**: Dashboard KPI metrics load without 401 error.
4. Click **"Legal Clearance Binder"** -> **"Download Markdown Binder"**:
   - **Verify**: Markdown file downloads with SHA-256 integrity digest without 401 error.

---

## 4. Live 1-Click Demo & Provenance Verification

1. In a new project, click **"1-Click Demo"**:
   - **Verify**: The script parses scenes and displays extracted entities with non-zero evaluation counts.
   - **Verify**: Inspecting entity citations shows authentic provenance badges (`PARALLEL_LIVE` or `FALLBACK_FIXTURE`).
