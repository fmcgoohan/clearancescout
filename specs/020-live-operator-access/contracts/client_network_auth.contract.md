# Contract: Client Network Authentication Layer

## 1. Observable Action Timeline SSE Stream (`GET /api/events`)

### Query Parameter Token Authentication
- **Request**:
  ```http
  GET /api/events?projectId=proj-12345&token=judge-pass-2026 HTTP/1.1
  Host: clearance-scout-n3tcx4jcbq-uc.a.run.app
  Accept: text/event-stream
  ```
- **Response**:
  ```http
  HTTP/1.1 200 OK
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive

  data: {"projectId":"proj-12345","eventType":"SYSTEM_BOOT","description":"Timeline stream established","payload":{},"timestamp":"2026-08-21T00:00:00.000Z"}
  ```

---

## 2. Markdown Clearance Binder Export (`GET /api/projects/:id/binder/markdown`)

- **Request**:
  ```http
  GET /api/projects/proj-12345/binder/markdown HTTP/1.1
  Host: clearance-scout-n3tcx4jcbq-uc.a.run.app
  Authorization: Bearer judge-pass-2026
  ```
- **Response**:
  ```http
  HTTP/1.1 200 OK
  Content-Type: text/markdown; charset=utf-8
  Content-Disposition: attachment; filename="ClearanceBinder-proj-12345.md"

  # Production Legal Clearance Binder: The Neon Horizon
  ...
  ```

---

## 3. Operations Dashboard Metrics (`GET /api/projects/:id/dashboard`)

- **Request**:
  ```http
  GET /api/projects/proj-12345/dashboard HTTP/1.1
  Host: clearance-scout-n3tcx4jcbq-uc.a.run.app
  Authorization: Bearer judge-pass-2026
  ```
- **Response**:
  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json; charset=utf-8

  {
    "projectId": "proj-12345",
    "totalEntities": 12,
    "clearedEntities": 8,
    "flaggedEntities": 4,
    "shootingReadinessScore": 85
  }
  ```
