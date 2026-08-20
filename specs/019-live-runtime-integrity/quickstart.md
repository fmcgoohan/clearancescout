# Quickstart & Validation Guide: Feature 019 - Live Runtime and Real-Script Integrity

**Feature Branch**: `019-live-runtime-integrity`  
**Created**: 2026-08-21  
**Status**: Ready for Validation  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## 1. Prerequisites & Environment Setup

```bash
# Set runtime environment variables
export NODE_ENV=development
export EXECUTION_MODE=CLOUD_MODE
export GEMINI_API_KEY="your-gemini-api-key"
export PARALLEL_WEB_API_KEY="your-parallel-api-key"
export GOOGLE_CLOUD_PROJECT="clearance-scout-2026"

# Verify dependencies and clean build
npm install
npm run build
```

---

## 2. Validation Scenarios

### Scenario 1: Native Multipart Screenplay File Upload (.fountain & .pdf)
1. Launch the local server: `npm start`
2. Open the studio web application at `http://localhost:8080`
3. Click **"New Project"** and select project type `Movie`.
4. Click **"Upload Screenplay"**, select a genuine `.fountain` or `.pdf` file (e.g. 100+ pages).
5. **Expected Outcome**:
   - The browser transmits the file via `multipart/form-data` with a progress bar.
   - Server processes the script across windowed chunks without truncation.
   - All scenes and detected entities populate the Script Viewer and Entity Registry.

---

### Scenario 2: Fail-Closed Unparseable File Upload
1. Create a dummy corrupted PDF file (`echo "corrupted binary data" > corrupted.pdf`).
2. Attempt to upload `corrupted.pdf` in the web application.
3. **Expected Outcome**:
   - The server rejects the upload with HTTP 400 and error code `PDF_EXTRACTION_FAILED`.
   - The UI immediately renders an alert banner: *"Unable to extract text from PDF screenplay... Please convert your screenplay to text or Fountain format."*
   - No corrupted scenes or ghost entities are created in Firestore.

---

### Scenario 3: Server CLOUD_MODE Precedence & No Silent Demo Fallback
1. Create a project with persisted flag `executionMode: 'DEMO_MODE'` while the server runs with `EXECUTION_MODE=CLOUD_MODE`.
2. Upload a custom script mentioning an un-indexed fictional brand mark: `Apex Cybernetics`.
3. Trigger live research.
4. **Expected Outcome**:
   - Evaluator strictly executes live Parallel Search queries (badge: `PARALLEL_LIVE` 🌐).
   - Server ignores the project's `DEMO_MODE` flag and uses live models.
   - If `GEMINI_API_KEY` is missing, the request fails visibly as `INSUFFICIENT_EVIDENCE` without silently generating synthetic demo recognizers.

---

### Scenario 4: Failed Replacement & Strict Scene Readiness State
1. Ingest a script containing a conflicted brand mark in Scene 1.
2. Trigger replacement generation with a forced conflict collision.
3. Observe the generated replacement record status: `TEMP_REJECTED` or `FAILED`.
4. Check Scene 1 Shooting Readiness in the Operations Dashboard.
5. **Expected Outcome**:
   - The failed replacement provides 0 mitigation.
   - Scene 1 remains strictly in **`RED`** status.
   - The Operations Dashboard lists Scene 1 under **Active Blockers**.

---

### Scenario 5: Atomic Quota Depletion (25 Means 25)
1. Run the atomic quota concurrency test:
   ```bash
   npm test tests/contract/test_atomic_quota_accounting.test.ts
   ```
2. **Expected Outcome**:
   - 30 concurrent research requests against a 25-call quota balance result in exactly 25 successful deductions and 5 requests rejected with `429 Quota Exceeded`.
   - Final `liveResearchQuotaConsumed` balance is exactly 25.

---

### Scenario 6: Screenplay Re-Upload & Scene Replacement
1. Upload "Draft 1" containing 10 scenes and 15 entities.
2. Record 1 counsel override in Scene 2.
3. Upload "Draft 2" containing 12 scenes.
4. **Expected Outcome**:
   - Scene list cleanly updates to 12 scenes (no duplicate Scene 1s or Scene 2s).
   - Counsel override on Scene 2 is preserved.
   - Orphaned occurrences are cleaned up and obsolete action items are marked `CANCELLED`.

---

## 3. Automated Verification Commands

```bash
# Run full contract and integration suite
npm test

# Verify production container build and Vite bundle
npm run build
```
