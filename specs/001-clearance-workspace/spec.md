# Feature Specification: ClearanceScout Entertainment Clearance Workspace

**Feature Directory**: `specs/001-clearance-workspace`  
**Created**: 2026-08-17  
**Status**: Draft  
**Input**: User description: "Create the product specification for ClearanceScout: an agentic entertainment clearance workspace that parses scripts, matches entities against a canonical registry, grounds trademark data via parallel-web SDK, flags scene-specific legal risks, and generates non-infringing placeholders."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Script Parsing & Canonical Entity Registry (Priority: P1)

As a legal clearance manager or film producer, I want to upload a production script so that the system automatically parses script scenes, identifies all brand, trademark, product, logo, and location mentions, and maps them to a project-wide canonical entity registry ("Clear once, recognize everywhere").

**Why this priority**: Script parsing and canonical entity resolution form the core foundation of the clearance workspace. Without canonical entities and scene mapping, downstream trademark grounding and risk assessment cannot function.

**Independent Test**: Upload a script containing multiple mentions of the same brand across different scenes (e.g., "Coca-Cola" mentioned in Scene 3, Scene 12, and Scene 45). Verify that the system parses all scenes, creates a single canonical entity record for "Coca-Cola", links all 3 scene occurrences to it, and initializes their clearance statuses.

**Acceptance Scenarios**:

1. **Given** a user uploads a valid script file (PDF, plain text, or Final Draft format), **When** script parsing completes, **Then** the system creates a structured Project containing all parsed scenes with headings, scene numbers, character action text, and initial entity occurrences.
2. **Given** multiple scene occurrences of the same real-world brand or trademark across a script, **When** entity extraction runs, **Then** the system matches them to a single canonical entity ID in the project registry, avoiding duplicate entity entries.
3. **Given** a new scene is added or an existing scene script text is edited, **When** the script is re-parsed, **Then** the canonical entity registry retains existing entity IDs and updates scene occurrence linkages.

---

### User Story 2 - Trademark Research Grounding & Scene Legal Risk Assessment (Priority: P2)

As a clearance analyst, I want the system to execute live trademark and web research using the `parallel-web` SDK to evaluate the legal risk of each entity within its specific scene context, assigning clear risk statuses and source citations.

**Why this priority**: Entertainment clearance relies on verified, grounded evidence to assess whether a brand mention in a specific scene creates trademark infringement, tarnishment, or product placement risk.

**Independent Test**: Trigger a clearance evaluation for a brand entity used in a scene with negative character dialogue (e.g., character claiming a brand of car has faulty brakes). Verify that the system queries live trademark records via `parallel-web`, links exact source citations to the assessment, and assigns a scene-specific status of `ACTION REQUIRED` or `REVIEW RECOMMENDED` without rendering formal legal opinions.

**Acceptance Scenarios**:

1. **Given** a canonical entity linked to one or more script scenes, **When** clearance assessment is executed, **Then** the system queries live trademark registries and web data via `parallel-web` SDK native ADK tools and grounds all factual findings.
2. **Given** an entity assessment result, **When** research evidence is displayed, **Then** every factual assertion includes exact source provenance (URL, query, timestamp, and citation snippet).
3. **Given** a scene context risk evaluation, **When** the verdict is finalized, **Then** the status MUST be assigned strictly to one of four formal categories: `NO ISSUE SURFACED`, `REVIEW RECOMMENDED`, `ACTION REQUIRED`, or `INSUFFICIENT EVIDENCE`.
4. **Given** any clearance report or UI view, **When** legal findings are displayed, **Then** a prominent non-legal-advice disclaimer is presented, affirming that ClearanceScout provides workflow issue-spotting rather than formal legal advice.

---

### User Story 3 - Replacement Brand & Artwork Concept Card Generation (Priority: P3)

As a production designer or clearance coordinator, I want the system to generate fictional, non-infringing replacement brand names and visual artwork concept cards for high-risk entities (`ACTION REQUIRED`), allowing production to proceed smoothly.

**Why this priority**: When a real trademark cannot be cleared for a scene, production teams need immediate, creative, non-infringing alternatives that preserve the story's dramatic intent.

**Independent Test**: Select an entity marked `ACTION REQUIRED` in a scene (e.g., a high-risk beverage brand) and click "Generate Replacement". Verify that the system generates a fictional, non-infringing brand name (e.g., "Summit Sip"), a detailed visual design brief, a generated replacement artwork card image, and a rationale explaining why the replacement avoids conflict.

**Acceptance Scenarios**:

1. **Given** an entity with clearance status `ACTION REQUIRED` or `REVIEW RECOMMENDED`, **When** a user requests a replacement brand, **Then** the system generates a fictional brand name that is distinct from existing registered trademarks.
2. **Given** a generated replacement brand name, **When** replacement asset generation is triggered, **Then** the system produces a visual concept artwork card image and design rationale tailored to the scene's aesthetic.
3. **Given** an approved replacement brand concept, **When** the user accepts it, **Then** the system links the replacement concept card to the canonical entity and scene record for production asset tracking.

---

### User Story 4 - Multi-Tier Execution Modes & Observable Event Timeline (Priority: P4)

As a system operator or clearance researcher, I want to switch between execution modes (`TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE`) and monitor clearance workflows via a real-time event timeline that shows tool calls, research steps, and risk evaluations without exposing raw AI chain-of-thought.

**Why this priority**: Users need transparency into the agent's research workflow, cost control via cached/demo modes, and strict privacy regarding internal AI thinking.

**Independent Test**: Set the environment mode to `DEMO_MODE`, trigger script clearance processing, and observe the timeline interface. Verify that execution events (script parsing, entity matching, trademark lookup, risk scoring, citation rendering) stream live to the timeline, cached mock responses are used to minimize external API costs, and raw model chain-of-thought is hidden.

**Acceptance Scenarios**:

1. **Given** the application running in `DEMO_MODE`, **When** clearance operations run, **Then** the system uses cached synthetic research data to fulfill queries without incurring external API fees.
2. **Given** the application running in `CLOUD_MODE` without valid Google Gemini or Parallel Search API keys, **When** an operation is initiated, **Then** the system fails visibly with an explicit, user-friendly diagnostic message.
3. **Given** an active clearance analysis workflow, **When** agent activities occur, **Then** the UI displays an observable timeline of events (tool calls, queries, math outputs, risk evaluations, citations, state updates).
4. **Given** any system log, API response payload, or UI view, **When** agent outputs are processed, **Then** raw model chain-of-thought is strictly omitted and never displayed or persisted.

---

### Edge Cases

- **Large Script Uploads**: Handling feature scripts with 120+ pages and 500+ entity mentions without exceeding request limits or dropping scene context.
- **Entity Name Ambiguity**: Disambiguating multi-meaning entity names (e.g., "Apple" used as a fresh fruit vs. "Apple Inc." consumer electronics vs. "Apple Corps" music publishing) based on surrounding scene dialogue and props.
- **Search API Network Failures**: Gracefully handling timeouts or rate limits from `parallel-web` API calls by setting clearance status to `INSUFFICIENT EVIDENCE` and flagging for retry.
- **Contextual Script Changes**: Automatically invalidating and re-evaluating risk verdicts when a scene's script text is edited from neutral usage to defamatory usage.
- **Missing API Credentials in Cloud Mode**: Preventing silent crashes when `CLOUD_MODE` is active but API keys are missing by raising explicit configuration errors.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST parse uploaded script files (PDF, plain text, Final Draft) into structured scenes with scene numbers, headings, location metadata, and character dialogue/action text.
- **FR-002**: System MUST extract entity references (brands, trademarks, products, logos, real locations, character names) from parsed scene text.
- **FR-003**: System MUST resolve all entity references across a project to canonical entity IDs in a project-level registry ("Clear once, recognize everywhere").
- **FR-004**: System MUST perform live web and trademark research for canonical entities using the official `parallel-web` SDK wrapped as native Google Agent Development Kit (ADK) tools.
- **FR-005**: System MUST evaluate contextual legal risk for each canonical entity on a per-scene basis whenever scene script text or entity usage changes.
- **FR-006**: System MUST assign every scene-entity clearance assessment strictly to one of four statuses: `NO ISSUE SURFACED`, `REVIEW RECOMMENDED`, `ACTION REQUIRED`, or `INSUFFICIENT EVIDENCE`.
- **FR-007**: System MUST retain exact source provenance (URL, search query, timestamp, citation snippet) for all research factual assertions and link them directly to risk assessments.
- **FR-008**: System MUST display a mandatory legal disclaimer on all clearance reports and user interfaces stating that ClearanceScout provides issue-spotting workflow tools and not legal advice.
- **FR-009**: System MUST generate fictional, non-infringing replacement brand names for entities assigned `ACTION REQUIRED` or `REVIEW RECOMMENDED` statuses.
- **FR-010**: System MUST generate visual artwork concept cards (image asset + design rationale) for approved replacement brand names.
- **FR-011**: System MUST persist project state, scene data, canonical entity registries, clearance assessments, and replacement cards in Google Cloud Firestore.
- **FR-012**: System MUST support three distinct execution modes: `TEST_MODE` (offline automated testing), `DEMO_MODE` (cached synthetic datasets for low-cost demonstration), and `CLOUD_MODE` (live Gemini and Parallel Search APIs).
- **FR-013**: System MUST visibly render an observable action timeline in the UI tracking tool calls, queries, risk evaluations, citations, and state changes.
- **FR-014**: System MUST NOT display, store, or log raw AI model chain-of-thought in any user-facing interface, API payload, or persistent storage.
- **FR-015**: System MUST run AI agent reasoning, document parsing, and structured risk assessments exclusively on `gemini-3.6-flash`.
- **FR-016**: System MUST isolate all ADK agents, model calls, `parallel-web` tools, Firestore repositories, and secrets inside the `server/` backend directory.
- **FR-017**: Frontend application MUST be built as a Vite/React application in `src/` communicating with the backend API via authenticated REST endpoints and Server-Sent Events (SSE).
- **FR-018**: System MUST fail visibly with actionable diagnostic messages if required API keys are missing when operating in `CLOUD_MODE`.

---

### Key Entities

- **Project**: Represents a film, television, or media production project. Attributes: ID, title, production company, script version, created date, updated date.
- **Scene**: Represents an individual scene parsed from a script. Attributes: ID, project ID, scene number, heading, location type (INT/EXT), time of day (DAY/NIGHT), dialogue text, action description.
- **Canonical Entity**: Represents a unique real-world brand, trademark, product, logo, or organization identified across the project. Attributes: ID, project ID, canonical name, entity category (Brand, Product, Logo, Location), description, clearance status summary.
- **Scene Entity Occurrence**: Links a Canonical Entity to a specific Scene. Attributes: ID, scene ID, canonical entity ID, script line number, excerpt text, usage context description.
- **Clearance Risk Assessment**: Captures the contextual risk evaluation of a Canonical Entity in a specific Scene. Attributes: ID, occurrence ID, risk status (`NO ISSUE SURFACED`, `REVIEW RECOMMENDED`, `ACTION REQUIRED`, `INSUFFICIENT EVIDENCE`), risk rationale, risk score, context flags, evaluated timestamp.
- **Clearance Citation**: Represents source provenance for a research assertion. Attributes: ID, assessment ID, source URL, search query string, retrieved timestamp, excerpt snippet, trademark registration status.
- **Replacement Concept Card**: Represents a generated fictional alternative brand for high-risk entities. Attributes: ID, canonical entity ID, fictional brand name, design brief, artwork image URL, non-infringement rationale, approval status.
- **Execution Event**: An observable timeline entry tracking agent workflow progression. Attributes: ID, project ID, event type (tool_call, document_query, risk_eval, citation_added, state_change), label, payload detail, timestamp.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System parses a standard 100-page feature film script and extracts all scene entities into the canonical registry in under 30 seconds.
- **SC-002**: 95%+ of entity occurrences across different scenes are correctly resolved to their single matching canonical entity ID without manual deduplication.
- **SC-003**: 100% of trademark research assertions in clearance reports include verified `parallel-web` source citations with exact URLs and timestamps.
- **SC-004**: Generating a fictional replacement brand name and visual concept artwork card completes in under 15 seconds per request.
- **SC-005**: 100% compliance with privacy and governance rules: 0 occurrences of raw model chain-of-thought exposed in UI, client responses, or system logs.
- **SC-006**: In `DEMO_MODE`, clearance workflows execute fully with 0 live external API calls to `parallel-web` or Gemini endpoints.

---

## Assumptions

- **Script Formats**: Input scripts follow standard Hollywood screenplay formatting (PDF, UTF-8 text, or Final Draft `.fdx`).
- **User Roles**: Target users include entertainment clearance attorneys, production coordinators, script supervisors, and art department leads.
- **Browser Compatibility**: Users access the workspace via modern web browsers with WebSockets/SSE support for real-time timeline updates.
- **Cloud Run Deployment**: The backend service runs as a stateless containerized application on Google Cloud Run with Firestore integration.
- **API Credentials**: Live operation in `CLOUD_MODE` assumes valid `GEMINI_API_KEY` and `PARALLEL_WEB_API_KEY` environment variables.
