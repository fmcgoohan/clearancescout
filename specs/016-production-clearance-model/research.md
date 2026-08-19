# Research: Production Clearance Operating Model (Phase 2 - Occurrence Evaluation)

**Feature**: `specs/016-production-clearance-model` | **Date**: 2026-08-19

---

## 1. Occurrence Context vs. Abstract Entity Risk

### Context
In film and television legal clearance, risk does not attach in the abstract—it attaches to **how an asset is depicted in a specific scene**.
- A car driven normally in Scene 1 poses zero tarnishment (`NO_ISSUE_SURFACED`).
- The same car depicted exploding due to "faulty steering" in Scene 4 creates acute trademark tarnishment and product disparagement liability (`ACTION_REQUIRED`).
- Conflating both into a single global entity status without occurrence tracking forces unnecessary replacements in scenes where the brand was used innocuously.

### Decision
- Make `SceneEntityOccurrenceData` the primary evaluation record.
- Evaluator processes `canonical entity research` + `occurrence excerpt text` + `scene action context`.
- Persist individual risk verdicts on each occurrence record.

---

## 2. Canonical Status Deterministic Roll-Up

### Context
Clearance coordinators still need a top-level summary of each brand or entity across the entire script.

### Decision
- Derive the canonical entity's `overallClearanceStatus` deterministically from its occurrences:
  - Severity ranking:
    1. `ACTION_REQUIRED` (Severity 4 - Red)
    2. `REVIEW_RECOMMENDED` (Severity 3 - Yellow)
    3. `INSUFFICIENT_EVIDENCE` (Severity 2 - Gray)
    4. `NO_ISSUE_SURFACED` (Severity 1 - Green)
- If an entity has multiple occurrences, its canonical status is the maximum severity across its active occurrences.
- If an entity has no occurrences, its status reflects baseline category risk.

---

## 3. Preserving 003 Scene Override Precedence

### Context
Feature 003 established that scene-specific counsel overrides take strict precedence over canonical overrides and baseline evaluations.

### Decision
- The resolution chain for an occurrence is:
  $$\text{Effective Occurrence} = \text{Scene Counsel Override} ?? \text{Occurrence Evaluated Status} ?? \text{Canonical Override} ?? \text{Baseline}$$
- The canonical roll-up evaluates each occurrence's *effective* status, so a signed scene override that clears a scene properly contributes to the project summary.
