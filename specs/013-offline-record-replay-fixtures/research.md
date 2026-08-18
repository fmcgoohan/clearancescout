# Research: Offline Record Replay Fixtures

**Feature**: `specs/013-offline-record-replay-fixtures` | **Date**: 2026-08-18

---

## 1. Fixture Storage & Repository Isolation

### Context
Automated tests and local demos need realistic external search results and AI model responses without triggering live API quotas, network latency, or external failures during CI. However, legacy prototypes must not be blindly copied; fixtures must be freshly structured for ClearanceScout's domain schema.

### Decision
- Store newly captured record-replay fixtures in `server/fixtures/recordReplayFixtures.ts`.
- Structure fixtures with typed interfaces for:
  1. `ParallelSearchFixture`: Query terms, source URLs, excerpt snippets, trademark registration status, corporate owners, and dispute precedents.
  2. `GeminiScriptParseFixture`: Multi-scene screenplay parsing, scene headings, location types, character action summaries, and entity extraction.
  3. `GeminiReplacementFixture`: Fictional brand name generation, visual concept descriptions, era aesthetic adaptations, and self-clearance attempts.

---

## 2. Cloud Mode Isolation & Anti-Replay Guard

### Context
In `CLOUD_MODE`, live competition judging or studio production clearance must never accidentally fall back to mock or replayed fixtures upon client request.

### Decision
- `CLOUD_MODE` strictly enforces live API requests against Gemini and Parallel Search.
- Startup check (`loadConfig()`) throws an immediate fatal error if `CLOUD_MODE` is active without `GEMINI_API_KEY` or `PARALLEL_WEB_API_KEY`.
- No client query parameter or header can switch execution mode from `CLOUD_MODE` to fixture replay.

---

## 3. Universal Provenance Tagging

### Context
Every citation must clearly communicate its grounding source to entertainment counsel.

### Decision
- `PARALLEL_LIVE`: Live search results from Parallel Web Search API.
- `DEMO_FIXTURE`: Structured benchmark fixtures in `DEMO_MODE` or `TEST_MODE`.
- `FALLBACK_FIXTURE`: Emergency fallback if live search fails in `CLOUD_MODE`.
