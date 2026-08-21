# Contract: Ingestion Lifecycle & State Machine

## Endpoint: `POST /api/projects/:id/script/upload`
Initiates file upload ingestion.

### Request: Multipart Form Data
- `file`: Screenplay file (`.fountain`, `.txt`, `.pdf`)
- `format`: `PLAINTEXT` | `FOUNTAIN` | `PDF`

### Response (HTTP 200 OK)
```json
{
  "projectId": "proj-12345",
  "status": "COMPLETE",
  "scenesParsed": 145,
  "canonicalEntitiesExtracted": 42,
  "snapshot": {
    "project": {
      "id": "proj-12345",
      "title": "Cyberfall",
      "totalScenes": 145,
      "totalActiveEntities": 42
    },
    "entities": [ ... ],
    "scenes": [ ... ],
    "readiness": { ... }
  }
}
```

### Error Response (HTTP 400 / 502)
```json
{
  "code": "PARSING_FAILED",
  "stage": "EXTRACTING",
  "error": "Live AI screenplay parsing failed during scene extraction chunk 3: Model rate limit exceeded",
  "isRetryable": true,
  "suggestedAction": "Retry ingestion or reduce batch size."
}
```

---

## Endpoint: `POST /api/projects/:id/script/demo`
Initiates 1-click bundled demo screenplay ingestion (`The Neon Horizon`).

### Request (JSON)
```json
{
  "autoEvaluate": false,
  "includeSampleRights": false,
  "includeSamplePlaceholders": false
}
```

### Response (HTTP 200 OK)
```json
{
  "projectId": "proj-12345",
  "status": "COMPLETE",
  "source": "The Neon Horizon (Bundled Fictional Demo)",
  "scenesParsed": 3,
  "canonicalEntitiesExtracted": 4,
  "snapshot": { ... }
}
```
