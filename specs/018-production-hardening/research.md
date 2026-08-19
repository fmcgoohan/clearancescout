# Research & Technical Decisions: Feature 018 Production Hardening & Live Evidence Integrity

**Feature Branch**: `018-production-hardening`  
**Created**: 2026-08-20  
**Status**: Completed

---

## 1. Decision: Fail-Closed `CLOUD_MODE` Evidence & Authentic Live Zero-Hit Grounding

### Problem Statement
In `CLOUD_MODE`, if the Parallel Search API fails, credentials are missing, or a fallback fixture is returned, the system must not assign `NO_ISSUE_SURFACED` or `FINAL_CLEAR`. Furthermore, when a live query (`PARALLEL_LIVE`) completes with zero relevant hits, it must not fabricate synthetic registrations or classifications, nor should absence of trademark hits alone automatically grant `NO_ISSUE_SURFACED` without assessing category and dramatic context.

### Decision & Technical Pattern
1. **Strict Fail-Closed Gating**:
   - In `CLOUD_MODE`, if research returns `FALLBACK_FIXTURE` or an error occurs, the automated baseline status is `INSUFFICIENT_EVIDENCE` and risk score is set to 95.
   - It cannot be promoted to `WORKING_CLEAR` or `FINAL_CLEAR` unless independently mitigated by an active contractual rights agreement (`RightsRepo`), an approved placeholder (`PlaceholderRepo`), or a signed counsel override (`OverrideRepo`).
2. **Authentic Zero-Hit Live Search Handling**:
   - When `parallel-web` returns empty results (`results.length === 0`), the search provenance is `PARALLEL_LIVE`, with an authentic citation stating: *"Completed live search across public trademark and brand registries with zero conflicting marks surfaced."*
   - Zero synthetic owners, registration numbers, or Nice classifications are generated.
   - The status is evaluated through category-specific and dramatic context rules (e.g. living public figures still require right of publicity review even if no trademark exists; background props without trademark collisions may clear).

### Alternatives Evaluated
- *Inventing default owner names*: Rejected as a violation of Constitution Principle II (Live Grounding & Anti-Hallucination).
- *Treating zero hits as a search failure*: Rejected because zero conflicting marks is the exact desired real-world finding for non-infringing assets.

---

## 2. Decision: Gemini Structured Occurrence Context Interpretation with Deterministic State Ownership

### Problem Statement
Clearance risk depends heavily on scene context (e.g., whether a brand is featured in a dangerous context, hero prominence vs background incidental, disparaging dialogue vs neutral visual prop). However, per Constitution Principle I and Division of Labor Invariants, Gemini must not directly own or flip state machine flags.

### Decision & Technical Pattern
1. **Division of Labor**:
   - **Gemini 3.6 Flash (`ScriptParserAgent` / `ClearanceEvaluator`)**: Performs structured semantic interpretation of scene action text, character dialogue, and entity depiction, returning a strict JSON structure:
     ```typescript
     export interface OccurrenceContextInterpretation {
       prominence: 'HERO_FOREGROUND' | 'BACKGROUND_INCIDENTAL';
       modality: 'VISUAL_PROP' | 'DIALOGUE_MENTION' | 'BOTH';
       tone: 'FAVORABLE' | 'NEUTRAL' | 'DISPARAGING';
       endorsementImplication: boolean;
       safetyHazardDepiction: boolean;
       defamationRisk: boolean;
     }
     ```
   - **Deterministic TypeScript Engine (`clearanceEvaluator.ts` / `sceneReadinessEngine.ts`)**: Evaluates the structured context flags against deterministic risk thresholds and category invariants to assign `ClearanceStatus` (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`, `INSUFFICIENT_EVIDENCE`).
2. **Canonical Grounding Reuse**:
   - When an entity appears across multiple scenes, its trademark grounding search is executed once and cached canonically. Subsequent occurrence evaluations prompt Gemini only to interpret the new scene occurrence context, reusing the existing grounding citations.

---

## 3. Decision: Granular Placeholder Scoping & Strict Scene Readiness Semantics

### Problem Statement
Currently, placeholders created for an entity can unintentionally apply across all scenes in the screenplay. Furthermore, scenes containing unmitigated `REVIEW_RECOMMENDED` items were previously evaluating as `WORKING_CLEAR` rather than remaining under review as blockers.

### Decision & Technical Pattern
1. **Granular Scoping**:
   - Enhance `ReplacementPlaceholderData` with explicit scope attributes:
     - `scopeType`: `'SINGLE_OCCURRENCE' | 'SELECTED_OCCURRENCES' | 'SELECTED_SCENES' | 'PROJECT_WIDE'` (default: `'SINGLE_OCCURRENCE'`)
     - `occurrenceIds`: `string[]`
     - `sceneIds`: `string[]`
     - `isProjectWide`: `boolean`
   - A placeholder only mitigates occurrences that fall within its explicit scope.
2. **Strict `WORKING_CLEAR` Invariant**:
   - A scene evaluates as `WORKING_CLEAR` **only if** every non-cleared occurrence in the scene has an affirmative interim mitigation:
     - A `TEMP_APPROVED` placeholder whose scope covers that occurrence
     - An active interim rights agreement covering that occurrence
     - A signed counsel override covering that occurrence
   - An unmitigated `REVIEW_RECOMMENDED` occurrence evaluated without affirmative interim authorization causes the scene to evaluate as `RED` (blocker).

---

## 4. Decision: Ingestion Text Extraction & PDF Diagnostic Integrity

### Problem Statement
Screenplays uploaded as PDF files must perform genuine text stream extraction. If the PDF is scanned, encrypted, or corrupted, the system must fail visibly with clear user feedback rather than silently creating an empty project.

### Decision & Technical Pattern
- In `server/api/projectRoutes.ts` and `server/agents/ScriptParserAgent.ts`, perform text stream extraction on PDF buffers. If the extracted text contains fewer than 10 printable words, reject with `400 Bad Request` and message: *"Unable to extract text from PDF. The document may be a scanned image or encrypted. Please provide a text-based PDF, Fountain, or Plaintext screenplay."*

---

## 5. Decision: `CLOUD_MODE` Demo Boundary Enforcement

### Problem Statement
In `DEMO_MODE`, 1-click loading auto-evaluates fixtures for judge review. In `CLOUD_MODE`, loading the demo screenplay must parse the script and discover entities/occurrences, but must NOT seed fake synthetic assessments, fake rights, or fake pre-cleared readiness scores.

### Decision & Technical Pattern
- In `demoAutomationWorkflow.ts`:
  - Check `project.executionMode` (or `config.executionMode`).
  - If `CLOUD_MODE`: Ingest *"The Neon Horizon"* text and extract entities/scenes in un-evaluated state. Return `evaluationsCount: 0`, `activeRightsCount: 0`, `activePlaceholdersCount: 0`, and un-assessed scene readiness.
  - If `DEMO_MODE` / `TEST_MODE`: Continue providing full 1-click fixture-backed evaluation with `DEMO_FIXTURE` (📦) provenance.

---

## 6. Decision: Packaging Verification & Accurate Technical Claims Reconciliation

### Problem Statement
Documentation in `README.md` and `PROVENANCE.md` must truthfully reflect the actual npm dependencies and tooling architecture.

### Decision & Technical Pattern
- Verify `parallel-web` in `package.json` and `npm ci`.
- Remove any references or claims to "Parallel MCP" server integrations; describe the integration truthfully as the `parallel-web` npm package used inside Google ADK agent tools.
