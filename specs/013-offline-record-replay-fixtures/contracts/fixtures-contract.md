# Interface & Fixture Contract: Offline Record Replay Fixtures

**Feature**: `specs/013-offline-record-replay-fixtures` | **Date**: 2026-08-18

---

## 1. Citation Provenance Contract

Every returned citation must include:
```json
{
  "id": "cit-12345678",
  "sourceUrl": "https://...",
  "query": "Summit Cola registered trademark status...",
  "retrievedAt": "2026-08-18T18:00:00.000Z",
  "excerptSnippet": "...",
  "registrationStatus": "REGISTERED_ACTIVE",
  "corporateOwner": "The Summit Beverage Group",
  "disputePrecedents": "...",
  "provenance": "DEMO_FIXTURE"
}
```

Permitted `provenance` values:
- `PARALLEL_LIVE` (Live Parallel Search API)
- `DEMO_FIXTURE` (Deterministic local repo fixture)
- `FALLBACK_FIXTURE` (Emergency cloud fallback)

---

## 2. Mode Contract

| Mode | Allowed Data Source | Missing Key Behavior | Client Downgrade Allowed |
|:---|:---:|:---:|:---:|
| `TEST_MODE` | Repository Fixtures | Allowed | N/A |
| `DEMO_MODE` | Repository Fixtures + Demo Screenplay | Allowed | N/A |
| `CLOUD_MODE` | Live Parallel & Gemini APIs | Fatal Error | **STRICTLY FORBIDDEN** |
