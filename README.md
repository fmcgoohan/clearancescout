# ClearanceScout 🎬⚖️

**Autonomous Script Clearance & Brand Protection Agent for Film, TV, and Streaming Productions**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/Model-Gemini%203.6%20Flash-4285F4)](https://deepmind.google/technologies/gemini/)
[![Grounding](https://img.shields.io/badge/Grounding-Parallel%20Web%20API-06B6D4)](https://parallel.ai)
[![Deployment](https://img.shields.io/badge/Platform-Google%20Cloud%20Run-34A853)](https://cloud.google.com/run)
[![Tests](https://img.shields.io/badge/Tests-108%20Passing%20(56%20Suites)-34D399)](tests/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-34A853)](https://clearancescout-996154354252.us-central1.run.app)

**Live demo:** [https://clearancescout-996154354252.us-central1.run.app](https://clearancescout-996154354252.us-central1.run.app)

ClearanceScout is an enterprise agentic platform designed for studio legal counsel, clearance coordinators, art directors, and production delivery supervisors. It transforms unstructured screenplays into structured, auditable clearance binders by automatically extracting brand marks, music compositions, public figures, proprietary locations, and prop graphics, grounding them against live USPTO and web trademark registries via Parallel Search, generating verified non-infringing replacement assets, and orchestrating comprehensive production clearance operating workflows.

---

## 🌟 Key Capabilities & Complete Feature Architecture

### 1. Multi-Format Screenplay Ingestion & 5-Category Resolution
- Ingests Fountain (`.fountain`), Plaintext (`.txt`), and PDF screenplays.
- Extracts and categorizes mentions across 5 critical clearance domains:
  - 🏷️ **`BRAND`**: Trademarks, consumer products, electronics, automotive.
  - 🎵 **`ART_MUSIC`**: Copyrighted compositions, song lyrics, paintings, sculptures.
  - 👤 **`PUBLIC_FIGURE`**: Living real-world figures, celebrity depictions.
  - 🏛️ **`PROPRIETARY_LOCATION`**: Trademarked architectural landmarks, private venues.
  - ⚠️ **`GRAPHIC_PROP`**: Industrial placards, caution symbols, prop slogans.
- *“Clear once, recognize everywhere”*: Canonical registry resolves entity occurrences across scenes.

### 2. Live Grounded Trademark & Case-Law Research
- Grounded directly via the official `@parallel-web/sdk` web search engine.
- Retains exact source URLs, trademark owner details, registration statuses, and precedent snippets with verifiable provenance badges (`PARALLEL_LIVE` 🌐, `DEMO_FIXTURE` 📦, `FALLBACK_FIXTURE` ⚡, `MIXED` 🔀).
- Strict anti-hallucination invariant: Never invents external web evidence.

### 3. Production Projects & Multi-Type Management (`016 Phase 1`)
- Studio project organization categorized by `projectType` (`Movie`, `TV Show`, `Commercial`).
- Fast, multi-project switching with project-scoped entity registries, rights databases, and quota counters.

### 4. Occurrence-Level Evaluation as Fundamental Unit (`016 Phase 2`)
- Clearance risk is evaluated per scene occurrence using specific scene action context (dialogue sentiment, background vs foreground depiction, defamatory vs incidental use).
- Canonical entity status is deterministically derived from its most severe active occurrence status.

### 5. Advanced Entity Resolution & Material Equivalence (`016 Phase 3`)
- Disambiguates brand aliases, product lines, and parent/subsidiary corporate relationships.
- Tracks material equivalence groups to eliminate redundant research and unify cross-scene clearance decisions.

### 6. Contractual Rights & Restrictions Catalog (`016 Phase 4`)
- First-class tracking of executed licenses and agreements: `grantType` (`EXCLUSIVE`, `NON_EXCLUSIVE`, `GRATIS`, `WORK_FOR_HIRE`), `territory`, `mediaWindow`, `effectiveDate`, `expirationDate`, `isPerpetual`, and contractual covenants.

### 7. Deterministic Scene Shooting Readiness State Machine (`016 Phase 5`)
- Mathematical readiness evaluation:
  - 🟢 **`FINAL CLEAR`**: 100% of scene occurrences are clean, covered by active rights, or signed off via counsel override.
  - 🟡 **`WORKING CLEAR`**: All un-cleared items have temporary on-set approvals (`TEMP_APPROVED` placeholders).
  - 🔴 **`RED`**: Scene has at least one unresolved clearance blocker (`ACTION_REQUIRED`).

### 8. State-Transition Action & Notification Queues (`016 Phase 6`)
- Automated department task generation upon clearance state changes, routing work items to `Art Dept`, `Legal Counsel`, `Locations`, and `Production Mgmt`.
- Automatic task resolution when mitigating rights or placeholders are attached.

### 9. Generalized Replacements & Fictional Placeholders (`016 Phase 7`)
- Multi-category replacement tracking for brands, music tracks, artworks, dialogue lines, and graphic props.
- Manages on-set `TEMP_APPROVED` vs post-production `FINAL_CLEARED` lifecycles.

### 10. Evidence-Driven Live Self-Clearance Verification (`016 Phase 8`)
- Closed-loop candidate clearance loop grounded in live Parallel Search trademark evidence.
- Accumulates negative prompt constraints upon collision, enforces a deterministic loop ceiling of $\le 3$ attempts, and streams live 4-event SSE timelines (`REPLACEMENT_ATTEMPT`, `REPLACEMENT_RESEARCH_STARTED`, `REPLACEMENT_REJECTED`, `REPLACEMENT_ACCEPTED`).

### 11. Production Clearance Operations Dashboard (`016 Phase 9`)
- Executive operational cockpit surfacing active shooting blockers, upcoming rights expirations ($\le 90$ days), active placeholders, scene readiness breakdown, and department work queues with direct 1-click mitigation shortcuts.

### 12. Comprehensive Legal Clearance Binder with SHA-256 Digest (`016 Phase 10`)
- Audit-grade legal delivery dossier compiling scene schedules, canonical entities, contractual rights, fictional placeholders, open action items, research citations, and signed counsel overrides.
- Deterministic 64-character SHA-256 cryptographic integrity digest ensuring tamper-evident provenance for studio E&O insurance.
- Export formats: Auditable JSON, formatted Markdown (`.md`), and print-ready PDF.

### 13. Manual Item Management & Correction (`006`)
- Manual entity addition, property editing with automatic assessment invalidation, and clean entity deletion.

### 14. Single-Item Failed Research Retry (`007`)
- Granular retry for individual items returning `INSUFFICIENT_EVIDENCE` without re-running entire scripts.

### 15. Side-by-Side Original & Replacement Comparison (`008`)
- Visual and legal comparison view contrasting original scripted items with approved fictional replacement prop cards.

### 16. Multi-Dimension Workspace Registry Filters (`009`)
- Instant client and API filtering across Clearance Status, Entity Category, and Scene Number with 1-click reset recovery.

### 17. Deep Binder Jump to Evidence & Timeline (`010`)
- Direct navigation from exported binder dossiers into citation source drawers and observable action timeline events.

### 18. Bounded Concurrency Batch Research (`011`)
- High-throughput parallel evaluation ($N=3$) with live progress broadcast and fail-visible item isolation.

### 19. Shared Demo Access Token & Quota Controls (`012`, `015`)
- Bearer token security with client modal configuration, project-scoped live research quotas, and fail-visible 429 warnings.

### 20. Accessible, Responsive Studio Design (`014`)
- WCAG 2.1 AA accessible with full keyboard navigation (`Tab`, `Enter`, `Escape`), high-contrast focus rings, touch targets ($\ge 44\text{px}$), and responsive mobile stacking.

---

## 🏛️ System Architecture

```mermaid
graph TD
    Client[Vite / React 18 SPA] -->|REST / SSE| Server[Express 4 Cloud Run Service]
    subgraph Backend[server/ directory isolation]
        Parser[ScriptParserAgent - Gemini 3.6 Flash]
        Grounding[ParallelSearchTool - @parallel-web/sdk]
        Evaluator[ClearanceEvaluator - Deterministic Math + Gemini]
        Replacements[ReplacementGenerator - Closed-Loop Self-Clearance]
        RightsEngine[RightsManagementWorkflow - Contractual Terms]
        SceneEngine[SceneReadinessEngine - Deterministic RED/WORKING/FINAL]
        ActionEngine[ActionDispatcher - Department Work Queues]
        DashEngine[DashboardEngine - Operations Cockpit]
        BinderEngine[BinderExportWorkflow - SHA-256 Audit Seal]
        Artwork[ArtworkTool - Google Imagen 3]
        Timeline[TimelineBroadcaster - SSE Event Stream]
        Store[(Google Cloud Firestore)]
    end
    Server --> Parser
    Server --> Grounding
    Server --> Evaluator
    Server --> Replacements
    Server --> RightsEngine
    Server --> SceneEngine
    Server --> ActionEngine
    Server --> DashEngine
    Server --> BinderEngine
    Server --> Artwork
    Server --> Timeline
    Server --> Store
```

### Division of Labor Invariant
1. **Gemini 3.6 Flash**: Semantic document understanding, occurrence context extraction, dialogue sentiment, and creative replacement generation.
2. **Deterministic TypeScript**: Computes objective mathematical values (scene readiness status, expiration day deltas, override precedence, attempt counters, and SHA-256 checksums).
3. **Gemini 3.6 Flash**: Reasons over calculated outputs against legal specifications to issue final validation verdicts.

---

## ⚙️ Execution Modes

| Mode | Target | Description |
|:---|:---|:---|
| **`TEST_MODE`** | Automated CI/CD | Deterministic local fixtures for instant, isolated unit and contract testing (108/108 tests pass). |
| **`DEMO_MODE`** | Interactive Evaluation | Zero-configuration evaluation using synthetic datasets and bundled demo screenplay ("The Neon Horizon"). |
| **`CLOUD_MODE`** | Production Runtime | Live Google Gemini 3.6 Flash and Parallel Search APIs. Fails visibly with diagnostics if credentials are missing. |

---

## 🚀 Quickstart & Validation Guide

### Prerequisites
- Node.js 20+
- npm 10+

### 1. Installation
```bash
git clone https://github.com/fmcgoohan/clearancescout.git
cd clearancescout
npm install
```

### 2. Run Test Suite
```bash
npm test
```
*Executes all 108 tests across 56 test files spanning contract and integration suites with 0 failures.*

### 3. Build & Run
```bash
# Build production bundle
npm run build

# Start local server
npm start
```
Open [http://localhost:8080](http://localhost:8080) to access the ClearanceScout Studio Workspace.

---

## 🐳 Google Cloud Run Deployment

**Live demo (DEMO_MODE):** [https://clearancescout-996154354252.us-central1.run.app](https://clearancescout-996154354252.us-central1.run.app)

ClearanceScout is packaged as a single unified container serving both the Express REST/SSE API and compiled static React frontend.

### Build & Run Container Locally
```bash
docker build -t clearancescout:latest .
docker run -p 8080:8080 -e EXECUTION_MODE=DEMO_MODE clearancescout:latest
```

### Deploy to Google Cloud Run
```bash
gcloud run deploy clearancescout \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars EXECUTION_MODE=DEMO_MODE
```

For live `CLOUD_MODE`, also bind `GEMINI_API_KEY` and `PARALLEL_WEB_API_KEY` as secrets. Missing production credentials must fail visibly.

### Health & Readiness Check
```bash
curl -s https://clearancescout-996154354252.us-central1.run.app/api/health
```

---

## ⚖️ Legal Notice & Disclaimer Invariant
ClearanceScout provides automated issue-spotting, trademark research provenance, and clearance workflow management. It does **not** render formal legal opinions or replace independent legal counsel. Production counsel should independently review all chain-of-title and rights documents prior to distribution.
