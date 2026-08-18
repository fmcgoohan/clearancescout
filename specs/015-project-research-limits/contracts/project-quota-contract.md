# Interface Contract: Per-Project Research Limits

**Feature**: `specs/015-project-research-limits` | **Date**: 2026-08-18

---

## 1. Project API Contract Extensions

### `GET /api/projects/:id`
**Response (200 OK)**:
```json
{
  "id": "proj-abc12345",
  "title": "Neon Horizon",
  "productionCompany": "Apex Entertainment",
  "scriptVersion": "v1.0",
  "executionMode": "CLOUD_MODE",
  "liveQuotaLimit": 25,
  "liveQuotaUsed": 3,
  "liveQuotaRemaining": 22
}
```

---

## 2. Quota Exhaustion Response Contract

### `POST /api/projects/:id/clearance/evaluate`
**When Quota Exhausted in CLOUD_MODE (HTTP 429 Too Many Requests)**:
```json
{
  "error": "Live research quota exceeded for this project (0/25 remaining).",
  "quota": {
    "limit": 25,
    "used": 25,
    "remaining": 0
  }
}
```
