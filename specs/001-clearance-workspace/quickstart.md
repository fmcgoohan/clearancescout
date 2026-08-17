# Quickstart & End-to-End Validation Guide: ClearanceScout

**Feature**: `specs/001-clearance-workspace`  
**Date**: 2026-08-17  

---

## 1. Prerequisites & Setup

Ensure Node.js v20+ and `npm` are installed.

```bash
# Set execution mode (TEST_MODE | DEMO_MODE | CLOUD_MODE)
export EXECUTION_MODE=DEMO_MODE

# Optional: set live API keys if using CLOUD_MODE
# export GEMINI_API_KEY="your-gemini-api-key"
# export PARALLEL_WEB_API_KEY="your-parallel-web-key"

# Install dependencies
npm install
```

---

## 2. Validation Scenario 1: Script Parsing & Canonical Registry

**Goal**: Verify script upload parses scenes and maps entity occurrences to a single canonical entity.

```bash
# Create project
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Validation Film","productionCompany":"Test Studio","scriptVersion":"v1","executionMode":"DEMO_MODE"}'

# Upload script sample
curl -X POST http://localhost:8080/api/projects/{projectId}/script \
  -F "script=@server/tests/fixtures/sample_script.txt"
```

**Expected Outcome**:
- Returns `200 OK`.
- `scenesParsed` >= 1.
- Canonical entities deduplicated and assigned status `INSUFFICIENT_EVIDENCE`.

---

## 3. Validation Scenario 2: Trademark Research Grounding & Legal Risk Assessment

**Goal**: Verify live research grounding with `parallel-web` citations and risk status categorization.

```bash
# Trigger clearance risk evaluation
curl -X POST http://localhost:8080/api/projects/{projectId}/clearance/evaluate \
  -H "Content-Type: application/json" \
  -d '{"canonicalEntityIds":["ent-coca-cola"]}'
```

**Expected Outcome**:
- Risk status returned as `ACTION_REQUIRED` or `REVIEW RECOMMENDED`.
- `citations` array contains `sourceUrl` and `query`.
- Response contains mandatory legal disclaimer ("ClearanceScout provides workflow issue-spotting and does not render legal advice.").

---

## 4. Validation Scenario 3: Replacement Artwork Concept Card Generation

**Goal**: Verify fictional replacement brand name and artwork generation for high-risk entities.

```bash
curl -X POST http://localhost:8080/api/projects/{projectId}/replacements/generate \
  -H "Content-Type: application/json" \
  -d '{"canonicalEntityId":"ent-coca-cola"}'
```

**Expected Outcome**:
- Returns `200 OK`.
- `fictionalBrandName` is non-infringing (e.g., "Summit Cola").
- `artworkImageUrl` points to a generated image card.

---

## 5. Validation Scenario 4: Observable Timeline & Chain-of-Thought Privacy

**Goal**: Verify SSE timeline streams events without raw chain-of-thought exposure.

```bash
# Connect to SSE stream
curl -N http://localhost:8080/api/projects/{projectId}/timeline/stream
```

**Expected Outcome**:
- `event: timeline_event` messages stream in real time.
- Payloads contain tool call names and status updates.
- Zero `thought` or `thinking` fields present in stream payloads.
