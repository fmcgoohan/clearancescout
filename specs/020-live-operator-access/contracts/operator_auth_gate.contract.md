# Contract: Operator Auth Gate & First-Run Bootstrap

## 1. Initial Project Fetch (`GET /api/projects`)

### Unauthenticated First Run (CLOUD_MODE)
- **Request**:
  ```http
  GET /api/projects HTTP/1.1
  Host: clearance-scout-n3tcx4jcbq-uc.a.run.app
  ```
- **Response**:
  ```http
  HTTP/1.1 401 Unauthorized
  Content-Type: application/json; charset=utf-8

  {
    "error": "Unauthorized: Invalid or missing demo access token."
  }
  ```

### Client UI Reaction:
1. Intercept `401` response.
2. Set `isAuthModalOpen = true` in blocking state.
3. Render `TokenConfigModal` with:
   - Clear explanation: "Production Access Token Required for Live Cloud Mode".
   - Helper badge indicating that both read and mutation workflows are protected.
   - Placeholder pre-filled with documented judge token: `judge-pass-2026`.
4. Render project selector in `AUTH_REQUIRED` state instead of "No projects found".

---

## 2. Authenticated Project Fetch

- **Request**:
  ```http
  GET /api/projects HTTP/1.1
  Host: clearance-scout-n3tcx4jcbq-uc.a.run.app
  Authorization: Bearer judge-pass-2026
  ```
- **Response**:
  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json; charset=utf-8

  [
    {
      "id": "proj-abc12345",
      "title": "The Neon Horizon",
      "productionCompany": "Apex Pictures",
      "scriptVersion": "v1.0",
      "executionMode": "CLOUD_MODE",
      "createdAt": "2026-08-21T00:00:00.000Z"
    }
  ]
  ```
