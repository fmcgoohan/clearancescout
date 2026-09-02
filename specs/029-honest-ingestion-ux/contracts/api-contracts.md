# API Contracts: 029-honest-ingestion-ux

## 1. Screenplay Ingestion Preview

### Endpoint: `POST /api/projects/:id/script/preview`

Generates an in-memory extraction summary of a screenplay file (or payload) without mutating project state.

#### Request
- **Headers**: `Content-Type: multipart/form-data` or `application/json`, `x-demo-token` (optional)
- **Body (Multipart)**: `file` (PDF, TXT, or Fountain file)
- **Body (JSON Alternative)**:
  ```json
  {
    "scriptText": "INT. OFFICE - DAY\nAlice talks with Bob.",
    "filename": "sample.txt",
    "format": "PLAINTEXT"
  }
  ```

#### Response: Success (Valid Extraction) - `HTTP 200 OK`
```json
{
  "success": true,
  "filename": "shooting_draft.pdf",
  "format": "PDF",
  "characterCount": 14250,
  "wordCount": 2340,
  "estimatedPageCount": 10,
  "scenesDetected": 4,
  "sampleHeadings": [
    "INT. METRO STATION - NIGHT",
    "EXT. CITY PLAZA - DAY",
    "INT. APEX HEADQUARTERS - DAY",
    "INT. WAREHOUSE - NIGHT"
  ],
  "warnings": [],
  "isValid": true,
  "previewTextExcerpt": "INT. METRO STATION - NIGHT\nA train arrives..."
}
```

#### Response: Warning / Blocked (0 Scenes Detected) - `HTTP 200 OK`
```json
{
  "success": true,
  "filename": "corrupt_or_image.pdf",
  "format": "PDF",
  "characterCount": 0,
  "wordCount": 0,
  "estimatedPageCount": 0,
  "scenesDetected": 0,
  "sampleHeadings": [],
  "warnings": [
    "No valid screenplay scene headings (e.g., INT. / EXT.) were detected.",
    "File appears to contain no extractable text or is a scanned image."
  ],
  "isValid": false,
  "previewTextExcerpt": ""
}
```

---

## 2. Screenplay Ingestion Commit

### Endpoint: `POST /api/projects/:id/script/upload` (and `POST /api/projects/:id/script`)

Commits the extracted scenes and runs initial clearance entity resolution.

#### Error Response: 0 Scenes Detected - `HTTP 422 Unprocessable Entity`
```json
{
  "error": "No valid scenes detected in screenplay. Check format and headings.",
  "code": "ZERO_SCENES_DETECTED",
  "scenesParsed": 0,
  "details": "Screenplay extraction did not yield any standard scene sluglines."
}
```

---

## 3. Explicit Sample Loading

### Endpoint: `POST /api/projects/:id/script/demo`

Loads bundled sample reference screenplay (*"The Neon Horizon"* or requested sample dataset) upon explicit user request.

#### Request
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "autoEvaluate": true,
    "includeSampleRights": true,
    "includeSamplePlaceholders": true
  }
  ```

#### Response - `HTTP 200 OK`
```json
{
  "success": true,
  "projectId": "proj-default",
  "scenesCount": 3,
  "entitiesCount": 7,
  "readiness": {
    "readinessPercentage": 33.3,
    "blockedScenesCount": 2
  }
}
```
