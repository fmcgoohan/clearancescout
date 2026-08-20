# API Contract: Public Cloud Run Endpoint Protection & Auth Guard

**Scope**: Security rules for all Express REST API endpoints in ClearanceScout.

---

## 1. Route Classification

| Route Pattern | Method | Access Level | Description |
|:---|:---:|:---:|:---|
| `/api/health` | `GET` | **Public** | Health and diagnostic status (API keys masked). |
| `/api/projects` | `GET` | **Public** | List studio projects for workspace navigation. |
| `/api/projects/:id` | `GET` | **Public** | Retrieve project details, scenes, and entities. |
| `/api/projects/:id/script/demo` | `POST` | **Public** | Load bundled entrant demo script (*"The Neon Horizon"*). |
| `/api/projects/:id/binder` | `GET` | **Public** | View and download compiled clearance binder. |
| `/api/projects/:id/timeline` | `GET` | **Public** | Subscribe to SSE timeline events. |
| `/api/projects/:id/script/upload` | `POST` | **Protected** | Upload and parse new screenplay file. |
| `/api/projects/:id/script` | `POST` | **Protected** | Raw script text ingestion. |
| `/api/projects/:id/clearance/batch` | `POST` | **Protected** | Trigger live AI batch research. |
| `/api/projects/:id/entities/:entId/research` | `POST` | **Protected** | Single entity retry research execution. |
| `/api/projects/:id/replacements/generate` | `POST` | **Protected** | Execute replacement generation & self-clearance loop. |
| `/api/projects/:id/overrides` | `POST` | **Protected** | Record legal counsel review override. |
| `/api/projects/:id/rights` | `POST` | **Protected** | Create or modify contractual rights record. |
| `/api/projects/:id/actions/sync` | `POST` | **Protected** | Sync department action items. |

---

## 2. Authentication Protocol

### 2.1 Protected Request Format
Requests targeting protected routes on public deployments must include the Bearer token in the `Authorization` header:

```http
POST /api/projects/proj-123/clearance/batch HTTP/1.1
Host: clearance-scout-n3tcx4jcbq-uc.a.run.app
Authorization: Bearer <DEMO_ACCESS_TOKEN>
Content-Type: application/json
```

### 2.2 Rejection Response (401 Unauthorized)

```json
{
  "success": false,
  "errorCode": "UNAUTHORIZED",
  "message": "Authorization token required for live AI and write endpoints on public Cloud Run.",
  "hint": "Provide a valid Bearer token via Authorization header or in-app token settings modal."
}
```
