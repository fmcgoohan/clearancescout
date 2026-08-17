# Research & Architecture Decisions: ClearanceScout MVP Engine

**Feature**: `specs/002-clearancescout-mvp`  
**Date**: 2026-08-17  
**Status**: Completed  

---

## 1. Multi-Format Screenplay Ingestion Engine

### Decision
Support three primary input formats in `server/agents/ScriptParserAgent.ts`:
1. **Plaintext (`.txt`)**: Standard industry sluglines (`INT.`, `EXT.`, `INT/EXT.`), character cues, and action blocks.
2. **Fountain (`.fountain`)**: Standard open screenplay markup syntax (scene headings, character names, parentheticals, dialogue, boneyard comments).
3. **Screenplay PDF (`.pdf`)**: Extracted via standard stream text parser (`pdf-parse`) and structured into scene records.

### Rationale
- Screenplays in production circulate across PDF, Fountain, and text formats. Handling all three ensures frictionless integration with production departments.
- Structured scene output preserves scene numbers, sluglines, location names, time of day (`DAY`/`NIGHT`), character dialogue, and action lines for downstream contextual risk evaluation.

---

## 2. 5-Category Entity Detection & Semantic Resolution

### Decision
Implement multi-category entity extraction and canonical deduplication in `server/workflows/canonicalRegistryWorkflow.ts` spanning 5 core clearance categories:
1. **Brands & Trademarks**: Consumer products, tech, automotive, apparel, food & beverage.
2. **Copyrighted Art & Music**: Song titles, lyrics, artwork on walls, literary references.
3. **Living Public Figures**: Real living people, political figures, celebrities.
4. **Proprietary Locations**: Private commercial properties, trademarked architectural landmarks.
5. **Graphic Text / Props**: Fictional/real warning labels, branded signage, t-shirt slogans.

### Rationale
- Entertainment errors & omissions (E&O) insurance requires clearing all 5 categories, not just consumer brand trademarks.
- Semantic deduplication hashes and matches lexical variations (e.g., "Coke can", "can of Coca-Cola", "chilled bottle of Coke") to a single canonical entity ID in Firestore ("Clear once, recognize everywhere").

---

## 3. Live Trademark Grounding via `parallel-web` SDK

### Decision
Wrap `@parallel-web/sdk` inside a native Google ADK Tool (`server/tools/parallelSearchTool.ts`).
- **Research Query Construction**: Generates targeted queries for trademark status, corporate owner, classification classes, and known dispute precedents.
- **Source Provenance Invariant**: Every assertion stores exact source URL, query, timestamp, and verbatim excerpt snippet.

### Rationale
- Aligns with **Constitution Principle II** (Live Grounding Rule).
- Prevents hallucinated trademark statuses by tying all claims to verified external web and trademark registry provenance.

---

## 4. Contextual Risk Evaluation Engine & Deterministic Pattern

### Decision
Implement a 3-step hybrid risk evaluator (`server/workflows/clearanceEvaluator.ts`):
1. **Semantic Extraction**: `gemini-3.6-flash` extracts entity occurrence excerpts and scene usage context.
2. **Deterministic Calculation**: TypeScript code computes objective mathematical metrics:
   - Sentiment polarity score (-1.0 to +1.0)
   - Defamatory keyword matching ("dangerous", "toxic", "faulty", "scam", "exploded")
   - Occurrence frequency and exposure duration estimates
   - Character relationship (hero vs. villain usage)
3. **Status Synthesis**: `gemini-3.6-flash` reasons over calculated outputs against legal guidelines to assign one of four constitutional statuses:
   - `NO ISSUE SURFACED`
   - `REVIEW RECOMMENDED`
   - `ACTION REQUIRED`
   - `INSUFFICIENT EVIDENCE`

### Rationale
- Aligns with **Constitution Principle IV** and **AGENTS.md Invariant 3**. Guarantees objective mathematical rigor while retaining nuanced legal reasoning.

---

## 5. Visual Asset Remediation & Imagen 3 Concept Cards

### Decision
For items marked `ACTION REQUIRED`, generate creative, era-appropriate replacement concepts (`server/agents/ReplacementAgent.ts`) and visual packaging cards (`server/tools/artworkTool.ts`) using Google Imagen 3 (`imagen-3.0-generate-002`).
- Outputs: Fictional replacement name, visual design brief, era aesthetic alignment, visual packaging card image, and non-infringement legal rationale.

### Rationale
- Allows production art departments to immediately fabricate non-infringing props that match the scene's period and tone without trademark infringement risk.

---

## 6. Observable Action Timeline & Production Clearance Binder Export

### Decision
1. **Real-time SSE Timeline**: Stream `ExecutionEvent` records over Server-Sent Events (`/api/projects/:id/timeline/stream`) with strict sanitization of raw model chain-of-thought (`thought`/`thinking` fields).
2. **Clearance Binder Export**: Generate a consolidated, auditable Project Clearance Binder export (`/api/projects/:id/binder/export`) in structured JSON and printable summary format containing complete scene breakdowns, canonical entities, clearance statuses, citations index, and replacement cards.

### Rationale
- Satisfies studio insurance (E&O) and distributor legal delivery requirements for verifiable audit trails.

---

## 7. Multi-Tier Execution Control

### Decision
Support three operational modes via `EXECUTION_MODE`:
- `TEST_MODE`: Uses local JSON fixtures; 0 external API calls.
- `DEMO_MODE`: Uses local cached responses (`server/integrations/cache/`) for instant zero-cost demonstration.
- `CLOUD_MODE`: Connects to live Gemini 3.6 Flash, Imagen 3, and Parallel Search APIs; raises explicit diagnostic error if credentials are missing.
