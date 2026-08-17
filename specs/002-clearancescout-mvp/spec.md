# Feature Specification: ClearanceScout MVP Engine

**Feature Directory**: `specs/002-clearancescout-mvp`  
**Created**: 2026-08-17  
**Status**: Draft  
**Input**: User description: "Create the functional and technical requirement specification for ClearanceScout MVP in alignment with Constitution v1.0.0."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Format Script Ingestion & 5-Category Entity Detection (Priority: P1)

As a film clearance researcher, script supervisor, or production attorney, I want to ingest screenplays in multiple formats (Plaintext `.txt`, Fountain `.fountain`, and Screenplay `.pdf`), so that the system automatically parses scene structure (scene numbers, INT/EXT headers, locations, time of day, character dialogue, and action lines) and extracts entity mentions across five core clearance categories, mapping them to a project-wide canonical entity registry ("Clear once, recognize everywhere").

**Why this priority**: Script parsing and cross-scene canonical entity resolution form the foundational layer for all clearance workflows. Without accurate multi-format scene parsing and multi-category entity detection, downstream trademark grounding and risk assessment cannot proceed.

**Independent Test**: Upload a screenplay file (in Plaintext, Fountain, or PDF format) with multiple mentions of items spanning different categories across several scenes (e.g., "Coca-Cola" [Brand], "Bohemian Rhapsody" [Music/Art], "Elon Musk" [Public Figure], "Empire State Building" [Proprietary Location], and "Acme Explosives warning label" [Graphic Prop]). Verify that scenes are accurately parsed, entities across all 5 categories are recognized, deduplicated into canonical IDs, and linked to their scene occurrences.

**Acceptance Scenarios**:

1. **Given** a user uploads a Plaintext (`.txt`), Fountain (`.fountain`), or Screenplay PDF document, **When** ingestion completes, **Then** the system extracts structured scenes with scene numbers, sluglines (`INT/EXT`), setting/location names, time of day (`DAY/NIGHT`), dialogue blocks, and action descriptions.
2. **Given** script text containing candidate items, **When** entity extraction runs, **Then** the system detects and classifies items across 5 core categories:
   - *Brands & Trademarks* (e.g., consumer goods, automotive, tech)
   - *Copyrighted Art & Music* (e.g., songs, paintings, literary excerpts)
   - *Living Public Figures* (e.g., celebrities, political figures)
   - *Proprietary Locations* (e.g., private stadiums, trademarked landmarks)
   - *Graphic Text / Props* (e.g., fictional or real warning labels, posters, t-shirt slogans)
3. **Given** multiple lexical variations of the same entity across scenes (e.g., "Coke can", "can of Coca-Cola", "chilled Coca-Cola bottle"), **When** canonical resolution executes, **Then** all mentions resolve to a single canonical entity record in Firestore.

---

### User Story 2 - Live Trademark Grounding & Contextual Risk Evaluation Engine (Priority: P2)

As a clearance analyst or production legal counsel, I want the system to ground entity research against live trademark databases via the `parallel-web` SDK and evaluate scene-specific risk using a hybrid deterministic-semantic pattern, so that entities receive objective clearance statuses with verifiable citations.

**Why this priority**: Legal clearance requires rigorous factual grounding. Evaluating the delta between a canonical brand's baseline clearance and its specific scene context prevents costly trademark infringement, dilution, and product disparagement liabilities.

**Independent Test**: Trigger clearance evaluation for an entity appearing in both a neutral scene (character drinking soda at a diner) and a defamatory scene (character claiming the product caused illness). Verify that live `parallel-web` citations are attached, deterministic context metrics are computed, and scene-specific statuses (`NO ISSUE SURFACED` vs. `ACTION REQUIRED`) are assigned without rendering formal legal opinions.

**Acceptance Scenarios**:

1. **Given** a canonical entity in the project registry, **When** clearance grounding is initiated, **Then** the system generates targeted ADK research queries, executes searches via `@parallel-web/sdk`, and extracts trademark registration status, corporate owner, classification classes, and known dispute precedents.
2. **Given** live research findings, **When** citations are attached to an assessment, **Then** each assertion retains full source provenance (source URL, search query, retrieval timestamp, and verbatim excerpt snippet).
3. **Given** an entity occurrence in a scene, **When** contextual risk is evaluated, **Then** the system computes objective metrics (character relationship to brand, sentiment polarity, exposure duration, defamatory usage indicators) and assigns one of four constitutional clearance statuses:
   - `NO ISSUE SURFACED` (Safe for production use without modification)
   - `REVIEW RECOMMENDED` (Minor trademark/art context requiring legal coordinator review)
   - `ACTION REQUIRED` (High risk of infringement, defamation, or unauthorized commercial use)
   - `INSUFFICIENT EVIDENCE` (Inconclusive search results requiring manual follow-up or retry)
4. **Given** any clearance report or UI view, **When** risk evaluations are rendered, **Then** a prominent legal disclaimer is displayed affirming that ClearanceScout provides research issue-spotting rather than definitive legal advice.

---

### User Story 3 - Visual Asset Remediation & Era-Appropriate Replacement Cards (Priority: P3)

As a production designer, prop master, or art director, I want the system to generate creative, era-appropriate, non-infringing replacement brand concepts and visual artwork concept cards for items marked `ACTION REQUIRED`, so that the art department can fabricate physical or digital replacement props without trademark conflict.

**Why this priority**: When a real trademark cannot be cleared, production teams need immediate, period-accurate, creative alternatives that preserve the scene's dramatic tone without creating new intellectual property risks.

**Independent Test**: Select an item marked `ACTION REQUIRED` (e.g., a modern energy drink or a 1970s cereal brand) and trigger remediation. Verify that the system generates a fictional brand name, design brief, era-appropriate aesthetic rationale, and visual artwork card image generated via Google Imagen 3 / Gemini Image Generation.

**Acceptance Scenarios**:

1. **Given** an entity with clearance status `ACTION REQUIRED`, **When** the user clicks "Generate Replacement", **Then** the system produces a fictional, non-infringing brand name and visual design brief tailored to the scene's time period and genre.
2. **Given** a generated replacement brief, **When** artwork generation runs, **Then** the system calls Google Imagen 3 / Gemini Image Generation to produce a high-resolution visual concept card displaying the fictional prop packaging.
3. **Given** a generated replacement concept, **When** reviewed by the user, **Then** the concept includes a non-infringement legal rationale explaining why the replacement avoids phonetic, visual, and conceptual trademark confusion.

---

### User Story 4 - Observable Action Timeline & Production Clearance Binder Export (Priority: P4)

As a clearance coordinator or studio executive, I want to monitor clearance workflow events on a real-time event timeline and export an auditable, timestamped Project Clearance Binder (JSON / formatted summary), so that production records are fully documented for studio insurance (E&O) and distributor delivery requirements.

**Why this priority**: Entertainment distribution requires auditable clearance logs proving due diligence. Real-time observability ensures transparency, while clearance binder export facilitates studio legal sign-off.

**Independent Test**: Run a clearance workflow on a multi-scene project, observe real-time tool events and citation updates streaming over Server-Sent Events (SSE) without exposure of raw model chain-of-thought, and trigger a Clearance Binder export. Verify that the exported document contains all scenes, canonical entities, risk verdicts, citations, replacement cards, and timestamps.

**Acceptance Scenarios**:

1. **Given** active clearance agent workflows, **When** actions occur, **Then** the system streams observable execution events (tool calls, document queries, risk evaluations, citations, replacement generations) to the UI via Server-Sent Events (SSE).
2. **Given** any event broadcast, API response, or persistent record, **When** agent payloads are processed, **Then** raw model chain-of-thought (`thought` / `thinking` fields) is strictly sanitized and omitted.
3. **Given** a cleared or in-progress project, **When** the user requests a Clearance Binder export, **Then** the system compiles an auditable, timestamped export (structured JSON and formatted summary) containing all scene breakdowns, canonical entities, clearance statuses, live citations, and replacement cards.

---

### User Story 5 - Multi-Tier Execution Control (`TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE`) (Priority: P5)

As a developer, tester, or enterprise administrator, I want to toggle execution modes to control external API expenditures and guarantee deterministic testing, while ensuring the application fails visibly with descriptive errors if cloud credentials are missing in production.

**Why this priority**: Development and demonstration must not incur uncontrolled API costs, automated tests must execute deterministically offline, and production runs must fail fast if required credentials are unavailable.

**Independent Test**: Launch the system under `TEST_MODE` (verify 0 network calls using local fixtures), `DEMO_MODE` (verify cached synthetic responses for fast demos), and `CLOUD_MODE` without API keys (verify descriptive configuration error).

**Acceptance Scenarios**:

1. **Given** `EXECUTION_MODE=TEST_MODE`, **When** workflows run, **Then** the system utilizes local deterministic fixtures with zero external network requests.
2. **Given** `EXECUTION_MODE=DEMO_MODE`, **When** clearance operations execute, **Then** the system uses cached search and model responses to deliver instant interactive feedback without incurring API fees.
3. **Given** `EXECUTION_MODE=CLOUD_MODE`, **When** initialized with valid `GEMINI_API_KEY` and `PARALLEL_WEB_API_KEY`, **Then** live API calls are dispatched; if keys are missing, the system raises an explicit diagnostic configuration error.

---

### Edge Cases

- **Mixed-Format Scripts**: Handling screenplays with non-standard formatting, missing scene numbers, or dual-column dialogue without dropping scene context.
- **Ambiguous Multi-Category Entities**: Handling items that span multiple categories (e.g., "The Beatles Abbey Road" as both Copyrighted Music and a Proprietary Location).
- **Network Rate Limits & Timeouts**: Handling temporary `parallel-web` or Gemini API interruptions gracefully by assigning `INSUFFICIENT EVIDENCE` and enabling automated retry.
- **Dynamic Script Re-writes**: Updating scene risk verdicts when screenplay text changes from neutral usage to defamatory or unauthorized commercial depiction.
- **De-anonymization / Chain-of-Thought Leakage**: Preventing raw reasoning from appearing in error traces, SSE streams, or client payloads.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST ingest screenplays in Plaintext (`.txt`), Fountain (`.fountain`), and PDF (`.pdf`) formats.
- **FR-002**: System MUST parse screenplay text into structured scenes containing scene numbers, sluglines (`INT/EXT`), location names, time of day (`DAY/NIGHT`), character dialogue, and action text.
- **FR-003**: System MUST extract candidate entity mentions across 5 core categories:
  1. *Brands & Trademarks*
  2. *Copyrighted Art & Music*
  3. *Living Public Figures*
  4. *Proprietary Locations*
  5. *Graphic Text / Props*
- **FR-004**: System MUST resolve all entity mentions to a single canonical entity ID in the project registry using semantic deduplication ("Clear once, recognize everywhere").
- **FR-005**: System MUST query live trademark and web registries using `@parallel-web/sdk` wrapped as native Google Agent Development Kit (ADK) tools.
- **FR-006**: System MUST retain full source provenance (source URL, search query string, retrieval timestamp, and citation excerpt snippet) for all research findings.
- **FR-007**: System MUST evaluate the delta between canonical baseline clearance and scene-specific usage context for every scene occurrence.
- **FR-008**: System MUST apply deterministic calculations for objective metrics (character relationship to brand, sentiment polarity, exposure duration, defamatory usage indicators).
- **FR-009**: System MUST formally assign one of four constitutional clearance statuses to each scene entity evaluation: `NO ISSUE SURFACED`, `REVIEW RECOMMENDED`, `ACTION REQUIRED`, or `INSUFFICIENT EVIDENCE`.
- **FR-010**: System MUST render a prominent legal disclaimer on all clearance reports and user interfaces stating that ClearanceScout provides issue-spotting workflow tools and not formal legal advice.
- **FR-011**: System MUST generate creative, era-appropriate, non-infringing replacement brand names and design briefs for items marked `ACTION REQUIRED`.
- **FR-012**: System MUST generate visual artwork concept cards using Google Imagen 3 / Gemini Image Generation (`imagen-3.0-generate-002`) for approved replacement concepts.
- **FR-013**: System MUST stream observable action events (tool calls, document queries, risk evaluations, citations, replacement generations) over Server-Sent Events (SSE).
- **FR-014**: System MUST sanitize and omit raw model chain-of-thought (`thought` / `thinking` fields) from all SSE streams, UI views, API responses, and database records.
- **FR-015**: System MUST compile and export an auditable, timestamped Project Clearance Binder in structured JSON and printable summary format.
- **FR-016**: System MUST persist projects, scenes, occurrences, canonical entities, assessments, citations, replacements, and events in Google Cloud Firestore Native mode.
- **FR-017**: System MUST support three configurable execution modes: `TEST_MODE` (offline deterministic mocks), `DEMO_MODE` (cached synthetic datasets), and `CLOUD_MODE` (live Gemini 3.6 Flash and Parallel Search APIs).
- **FR-018**: System MUST execute AI agent reasoning and structured evaluation exclusively using `gemini-3.6-flash`.
- **FR-019**: System MUST isolate all ADK agents, model calls, `parallel-web` tools, Firestore repositories, and secrets inside the `server/` directory.
- **FR-020**: Frontend application MUST be built as a single-page Vite/React application in `src/` communicating with the backend API via authenticated REST endpoints and SSE streams.

---

### Key Entities

- **Project**: Root container for a film/television clearance workspace. Attributes: ID, title, production company, script version, execution mode, created timestamp, updated timestamp.
- **Scene**: Parsed scene from screenplay. Attributes: ID, project ID, scene number, heading/slugline, location type (`INT` / `EXT` / `INT/EXT`), location name, time of day (`DAY` / `NIGHT`), raw text, character action summary.
- **Canonical Entity**: Unique real-world brand, mark, public figure, location, or art piece. Attributes: ID, project ID, canonical name, category (`BRAND`, `ART_MUSIC`, `PUBLIC_FIGURE`, `PROPRIETARY_LOCATION`, `GRAPHIC_PROP`), description, overall clearance status.
- **Scene Entity Occurrence**: Occurrence link between a Canonical Entity and a Scene. Attributes: ID, scene ID, canonical entity ID, line number, excerpt text, usage context, sentiment polarity, exposure estimate.
- **Clearance Risk Assessment**: Contextual legal risk evaluation for an occurrence. Attributes: ID, occurrence ID, canonical entity ID, scene ID, risk status (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`, `INSUFFICIENT_EVIDENCE`), risk score, legal rationale, context flags, citations array, evaluated timestamp, disclaimer text.
- **Clearance Citation**: Verifiable provenance for grounded facts. Attributes: ID, source URL, query string, retrieved timestamp, excerpt snippet, trademark registration status, corporate owner.
- **Replacement Concept Card**: Fictional replacement prop asset. Attributes: ID, canonical entity ID, fictional brand name, design brief, era aesthetic, artwork image URL, non-infringement rationale, status (`PROPOSED` / `APPROVED` / `REJECTED`), created timestamp.
- **Execution Event**: Observable timeline log entry. Attributes: ID, project ID, event type (`TOOL_CALL`, `DOCUMENT_QUERY`, `RISK_EVAL`, `CITATION_ADDED`, `REPLACEMENT_GEN`, `STATE_TRANSITION`), label, payload (sanitized of CoT), timestamp.
- **Clearance Binder Export**: Consolidated audit package. Attributes: project summary, scene breakdown, canonical registry, risk matrix, citations index, replacement catalog, generated timestamp, audit signature.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System parses a standard 100-page screenplay (PDF, Fountain, or TXT) and builds the canonical entity registry across all 5 categories in under 30 seconds.
- **SC-002**: 95%+ of entity mentions across multiple scenes are accurately mapped to their single canonical entity ID without duplicate entity creation.
- **SC-003**: 100% of grounded trademark research claims include verifiable `parallel-web` source URLs and timestamps.
- **SC-004**: Generating a non-infringing replacement brand concept and visual artwork concept card completes in under 15 seconds.
- **SC-005**: 100% compliance with privacy invariants: 0 occurrences of raw model chain-of-thought exposed across UI, logs, API responses, or exports.
- **SC-006**: In `DEMO_MODE`, clearance workflows execute fully with 0 live external network calls to Gemini or Parallel Web endpoints.
- **SC-007**: Generating and exporting a complete Project Clearance Binder package completes in under 5 seconds.

---

## Assumptions

- Screenplay documents adhere to general industry standard screenplay formats (PDF formatted via Final Draft/Fade In, Fountain syntax, or standard dialogue/slugline UTF-8 text).
- Entertainment legal workflows require issue-spotting and audit trail generation, while final legal sign-off remains with human production counsel.
- Cloud Run environment provides authenticated access to Google Cloud Firestore in native mode.
- Valid `GEMINI_API_KEY` and `PARALLEL_WEB_API_KEY` are provided for live `CLOUD_MODE` execution.
