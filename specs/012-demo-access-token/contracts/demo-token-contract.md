# Interface & API Contract: Demo Access Token Protection

**Feature**: `specs/012-demo-access-token` | **Date**: 2026-08-18

---

## 1. HTTP 401 Unauthorized Response Schema

```json
{
  "error": "Unauthorized: Invalid or missing demo access token."
}
```

---

## 2. Protected vs. Public Endpoint Matrix

| Endpoint | Method | Status | Required Token |
|:---|:---:|:---:|:---:|
| `/api/health` | GET | Public | None |
| `/api/fixtures/*` | GET | Public | None |
| `/api/projects` | POST | Protected | Valid `DEMO_ACCESS_TOKEN` |
| `/api/projects/:id/script` | POST | Protected | Valid `DEMO_ACCESS_TOKEN` |
| `/api/projects/:id/clearance/evaluate` | POST | Protected | Valid `DEMO_ACCESS_TOKEN` |
| `/api/projects/:id/entities` | POST | Protected | Valid `DEMO_ACCESS_TOKEN` |
| `/api/projects/:id/entities/:entityId` | PATCH | Protected | Valid `DEMO_ACCESS_TOKEN` |
| `/api/projects/:id/entities/:entityId` | DELETE | Protected | Valid `DEMO_ACCESS_TOKEN` |
| `/api/projects/:id/entities/:entityId/retry-research` | POST | Protected | Valid `DEMO_ACCESS_TOKEN` |
| `/api/projects/:id/entities/:entityId/override` | POST | Protected | Valid `DEMO_ACCESS_TOKEN` |
| `/api/projects/:id/replacement/generate` | POST | Protected | Valid `DEMO_ACCESS_TOKEN` |
| `/api/projects/:id` | GET | Public/Read | None |
| `/api/projects/:id/entities` | GET | Public/Read | None |
| `/api/projects/:id/scenes` | GET | Public/Read | None |
| `/api/projects/:id/binder/latest` | GET | Public/Read | None |
| `/api/projects/:id/timeline/stream` | GET | Public/Read | None |
