# Implementation Plan: Offline Record Replay Fixtures

**Branch**: `013-offline-record-replay-fixtures` | **Date**: 2026-08-18 | **Status**: Plan Complete  
**Specification**: [`specs/013-offline-record-replay-fixtures/spec.md`](spec.md)

---

## 1. Summary of Feature & Architectural Goals

The **Offline Record Replay Fixtures** feature establishes deterministic, repository-isolated record-replay fixtures for Parallel Search and Gemini API responses:
1. **Newly Captured Repository Fixtures**: Adds structured, schema-validated record-replay fixtures directly in `server/fixtures/` covering Parallel search queries, USPTO trademark records, and Gemini structured risk/replacement payloads (not copied from legacy prototypes).
2. **Mode-Locked Isolation**:
   - `TEST_MODE` & `DEMO_MODE`: Use repository record-replay fixtures for deterministic zero-network offline contract and integration testing.
   - `CLOUD_MODE`: Exclusively invokes live Google ADK Gemini models and Parallel Search APIs. Client requests cannot downgrade or force fixture replay in cloud mode.
3. **Fail-Visible Startup Guard**: If `CLOUD_MODE` is configured without required API credentials (`GEMINI_API_KEY`, `PARALLEL_WEB_API_KEY`), the server fails visibly with an explicit configuration error.
4. **Universal Provenance Grounding**: Every citation retains an explicit, visible provenance badge (`PARALLEL_LIVE`, `DEMO_FIXTURE`, or `FALLBACK_FIXTURE`) in UI components and exported binder summaries.
5. **Preserve Invariants (003–012)**: Maintains 100% test pass rate across all existing contract and integration test suites.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | `CLOUD_MODE` uses live `gemini-3.6-flash` and Imagen 3; `TEST_MODE` uses repository fixtures. |
| **II. Live Grounding & Research Tooling** | **PASS** | Live citations retain Parallel Search URLs; fixtures retain explicit `DEMO_FIXTURE` tags. |
| **III. Architecture & Cloud Persistence** | **PASS** | Fixtures located in `server/fixtures/`; integrations in `server/tools/`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Preserves standard 4-status clearance taxonomy and legal disclaimers. |
| **V. Multi-Tier Execution Modes** | **PASS** | `TEST_MODE`, `DEMO_MODE`, and `CLOUD_MODE` strictly isolated. |
| **Observable Action Timeline** | **PASS** | Preserves observable action events without raw chain-of-thought. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/013-offline-record-replay-fixtures/research.md`](research.md))
- **Phase 1: Data Model & Interfaces** ([`specs/013-offline-record-replay-fixtures/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/013-offline-record-replay-fixtures/contracts/fixtures-contract.md`](contracts/fixtures-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/013-offline-record-replay-fixtures/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/fixtures/recordReplayFixtures.ts`: Newly captured structured fixtures for Parallel Search queries and Gemini structured response payloads.
- `server/tools/parallelSearchTool.ts`: Connect `TEST_MODE` and `DEMO_MODE` to `recordReplayFixtures.ts`; strictly enforce live calls and `FALLBACK_FIXTURE` tagging in `CLOUD_MODE`.
- `server/agents/ScriptParserAgent.ts`: Connect offline scene extraction and entity recognition to structured record-replay fixtures.
- `server/agents/ReplacementAgent.ts`: Connect offline replacement generation and self-clearance attempts to structured record-replay fixtures.
- `tests/contract/test_offline_fixtures.test.ts`: Contract tests for fixture schema validation, deterministic query matching, and provenance labeling.
- `tests/integration/offline_replay_workflow.test.ts`: Integration test verifying zero-network end-to-end clearance research, replacement generation, and binder compilation in `TEST_MODE`.
