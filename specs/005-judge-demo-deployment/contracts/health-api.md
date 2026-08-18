# API Contract: Health & Readiness Endpoint

**Endpoint**: `GET /api/health`  
**Description**: Reports container lifecycle status, active execution mode, uptime, and boolean credential presence flags without leaking secret tokens.

---

### Request

```http
GET /api/health HTTP/1.1
Host: clearancescout.a.run.app
Accept: application/json
```

---

### Response 200 OK (Healthy - DEMO_MODE / CLOUD_MODE with Credentials)

```json
{
  "status": "HEALTHY",
  "executionMode": "DEMO_MODE",
  "uptimeSeconds": 128.4,
  "timestamp": "2026-08-18T15:30:00.000Z",
  "version": "1.0.0",
  "credentials": {
    "geminiConfigured": true,
    "parallelWebConfigured": true
  }
}
```

---

### Response 200 / 503 (Degraded - CLOUD_MODE Missing Credentials)

```json
{
  "status": "DEGRADED",
  "executionMode": "CLOUD_MODE",
  "uptimeSeconds": 15.2,
  "timestamp": "2026-08-18T15:30:00.000Z",
  "version": "1.0.0",
  "credentials": {
    "geminiConfigured": false,
    "parallelWebConfigured": false
  },
  "missingCredentials": ["GEMINI_API_KEY", "PARALLEL_WEB_API_KEY"],
  "error": "CLOUD_MODE active but required API credentials are missing. Live clearance operations will fail visibly."
}
```
