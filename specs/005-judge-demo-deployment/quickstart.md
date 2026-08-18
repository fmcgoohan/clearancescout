# Quickstart & Verification Guide: 005 Judge-Ready Demo, Documentation, and Production Deployment

**Feature**: `specs/005-judge-demo-deployment`  
**Status**: Completed  

---

## Scenario 1: One-Click Fictional Demo Screenplay Ingestion

### Steps
1. Start application locally or navigate to Cloud Run hosted URL:
   ```bash
   npm run dev
   ```
2. In the script workspace, click the **"Load Sample Screenplay"** button.
3. Observe script editor auto-populated with "The Neon Horizon" fictional screenplay.
4. Click **"Ingest & Extract Entities"**.

### Expected Outcome
- Scenes and entities are parsed across all 5 categories (`Summit Cola`, `AeroTech Prism`, `Veloce GT`, `Midtown Spire Tower`, `Nocturne of the Wild`).
- Zero real-world trademark infringements surfaced.
- Full clearance assessment and replacement generator loops operate cleanly.

---

## Scenario 2: Health & Readiness Endpoint Verification

### Steps
1. Query the health endpoint:
   ```bash
   curl -s http://localhost:3000/api/health
   ```
2. Verify response:
   ```json
   {
     "status": "HEALTHY",
     "executionMode": "DEMO_MODE",
     "uptimeSeconds": 14.2,
     "credentials": {
       "geminiConfigured": true,
       "parallelWebConfigured": true
     }
   }
   ```
3. Confirm zero secret API keys are leaked in the response.

---

## Scenario 3: Container Build & Local Run

### Steps
1. Build production container:
   ```bash
   docker build -t clearancescout:local .
   ```
2. Run container locally:
   ```bash
   docker run -p 8080:8080 -e EXECUTION_MODE=DEMO_MODE clearancescout:local
   ```
3. Test container readiness:
   ```bash
   curl -s http://localhost:8080/api/health
   ```
4. Open browser at `http://localhost:8080` to verify web UI.
