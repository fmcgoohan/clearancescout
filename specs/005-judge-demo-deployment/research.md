# Research & Architecture Decisions: 005 Judge-Ready Demo, Documentation, and Production Deployment

**Feature**: `specs/005-judge-demo-deployment`  
**Status**: Completed  

---

## 1. Single-Service Containerization on Google Cloud Run

### Decision
Deploy ClearanceScout as a single unified Google Cloud Run service using a multi-stage `Dockerfile`.
- **Stage 1 (Frontend Build)**: Installs dependencies and runs `npm run build` to produce compiled Vite/React static assets in `dist/`.
- **Stage 2 (Production Runtime)**: Light Alpine/Node 20 runtime image, runs `node server/index.js` listening on `PORT` (provided by Cloud Run, default: 3000 / 8080).
- **Static Asset Serving**: Express serves static files from `dist/` and redirects non-API GET requests to `dist/index.html` for client-side routing.

### Rationale
- Eliminates multi-service networking complexity, CORS configuration, and disparate deployment targets.
- Meets judge accessibility criteria: a single Cloud Run URL provides immediate access to both the interactive web application and the REST API.
- Cold start latency is $< 1.5\text{s}$ on Cloud Run second-generation execution environment.

### Alternatives Considered
- *Separate Frontend (Firebase Hosting) and Backend (Cloud Run)*: Adds unnecessary cross-origin authentication headers and dual-step deployment complexity.

---

## 2. Health / Readiness Endpoint & Secret Masking

### Decision
Expose `GET /api/health` with strict secret masking:
```json
{
  "status": "HEALTHY",
  "executionMode": "DEMO_MODE",
  "uptimeSeconds": 142.5,
  "timestamp": "2026-08-18T15:30:00.000Z",
  "credentials": {
    "geminiConfigured": true,
    "parallelWebConfigured": true
  },
  "version": "1.0.0"
}
```
In `CLOUD_MODE` when credentials are missing:
```json
{
  "status": "DEGRADED",
  "executionMode": "CLOUD_MODE",
  "uptimeSeconds": 12.0,
  "timestamp": "2026-08-18T15:30:00.000Z",
  "credentials": {
    "geminiConfigured": false,
    "parallelWebConfigured": false
  },
  "missingCredentials": ["GEMINI_API_KEY", "PARALLEL_WEB_API_KEY"],
  "error": "Production CLOUD_MODE requires valid Gemini and Parallel Search API keys.",
  "version": "1.0.0"
}
```

### Rationale
- Complies with Constitution Principle V (fail-visible cloud execution) and Security Invariants (zero secret leakage).
- Standard Cloud Run and Kubernetes HTTP health checking probes query `/api/health` to confirm container readiness.

---

## 3. Bundled Fictional Screenplay Specification ("The Neon Horizon")

### Decision
Author and bundle a fully fictional, entrant-created demo screenplay ("The Neon Horizon") covering all 5 clearance categories:
- **`BRAND`**: `Summit Cola`, `AeroTech Prism Laptop`, `Veloce GT Sports Coupe`.
- **`ART_MUSIC`**: `Nocturne of the Wild` (theatrical synth-rock score).
- **`PUBLIC_FIGURE`**: `Elena Vance` (fictional solar-grid pioneer).
- **`PROPRIETARY_LOCATION`**: `Midtown Spire Tower` (fictional art-deco skyscraper).
- **`GRAPHIC_PROP`**: `Titan Industrial Hazard Placard` (fictional caution prop).

### Rationale
- Allows evaluators and judges to test script ingestion, category parsing, risk assessment, self-clearance loops, and counsel overrides in 1 click without requiring third-party script uploads.
- Strictly adheres to the project fictional-content policy, avoiding any real-world trademark infringement or copyright issues.

---

## 4. Truthful Documentation & Development Provenance

### Decision
Provide:
- **`LICENSE`**: Standard MIT license with copyright notice.
- **`README.md`**: Truthful documentation of architecture, ADK agents (`gemini-3.6-flash`, Imagen 3), `parallel-web` live search, execution modes, API endpoints, and step-by-step local & cloud setup guides.
- **`PROVENANCE.md`**: Chronological engineering ledger recording tool usage, architecture milestones, and model selection rationale.

### Rationale
- Establishes transparent open-source provenance and meets all hackathon submission evaluation criteria.
