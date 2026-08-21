# Contract: Health Diagnostics API (`GET /api/health`)

## 1. Cloud Run Live Health Check (CLOUD_MODE)

- **Request**:
  ```http
  GET /api/health HTTP/1.1
  Host: clearance-scout-n3tcx4jcbq-uc.a.run.app
  ```
- **Response (Healthy Cloud Mode)**:
  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json; charset=utf-8

  {
    "status": "HEALTHY",
    "executionMode": "CLOUD_MODE",
    "uptimeSeconds": 14.5,
    "timestamp": "2026-08-21T00:00:00.000Z",
    "version": "1.0.0",
    "credentials": {
      "geminiConfigured": true,
      "parallelWebConfigured": true
    },
    "firestoreConnected": true
  }
  ```

---

## 2. Unconfigured / Degraded Health Check (CLOUD_MODE)

- **Response (Missing Credentials or Firestore Disconnected)**:
  ```http
  HTTP/1.1 503 Service Unavailable
  Content-Type: application/json; charset=utf-8

  {
    "status": "DEGRADED",
    "executionMode": "CLOUD_MODE",
    "uptimeSeconds": 4.2,
    "timestamp": "2026-08-21T00:00:00.000Z",
    "version": "1.0.0",
    "credentials": {
      "geminiConfigured": false,
      "parallelWebConfigured": false
    },
    "firestoreConnected": false,
    "missingCredentials": ["GEMINI_API_KEY", "PARALLEL_WEB_API_KEY"],
    "error": "CLOUD_MODE is active but missing required API credentials: GEMINI_API_KEY, PARALLEL_WEB_API_KEY."
  }
  ```
