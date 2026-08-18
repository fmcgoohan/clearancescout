# Research: Side-by-Side Original and Replacement Comparison

**Feature**: `specs/008-replacement-comparison` | **Date**: 2026-08-18

---

## 1. Comparison Data Assembly: Server Endpoint vs Client Composition

### Context
The side-by-side comparison requires data from multiple sources:
- Original entity metadata & category (`EntityRepo`)
- Original clearance risk assessment & citations (`AssessmentRepo`)
- Replacement card metadata, design prompt, and card visual (`ReplacementRepo`)
- Candidate attempt self-clearance history ($\le 3$ attempts, negative constraints) (`ReplacementRepo`)
- Counsel override status if present (`OverrideRepo`)

### Decision
Expose a dedicated compound read-only REST endpoint:
`GET /api/projects/:id/entities/:entityId/comparison`
- Assembles original entity details, latest automated assessment with citations, replacement card details, and candidate attempt history into a single structured response.
- Enables instant UI modal rendering and powers both the workspace modal and the binder export view.
- Strictly read-only; performs zero state mutations.

---

## 2. Visual Differentiation: Accepted vs Escalated Candidate Display

### Context
Feature 004 implements an autonomous self-clearance loop capped at 3 attempts. If Candidate 1 or 2 achieves `NO_ISSUE_SURFACED`, the candidate is autonomously accepted. If Candidate 3 fails to achieve `NO_ISSUE_SURFACED`, it is escalated to legal counsel without assigning a fabricated clearance rating.

### Decision
In the comparison view:
- **Autonomously Cleared Candidates**: Render standard `NO_ISSUE_SURFACED` badge with a checkmark and "Autonomously Cleared (Attempt X/3)".
- **Escalated 3rd Candidates**: Render a prominent amber/red banner: `"⚖️ Counsel Review Required (Escalated on 3rd Candidate Attempt)"`, highlighting that legal counsel approval or an explicit override is mandatory.

---

## 3. Clearance Binder Print Integration

### Decision
In `src/components/BinderViewer.tsx`:
- Under the "Fictional Replacement Catalog" section, add a "Side-by-Side Asset Comparison" layout.
- Displays each replaced entity alongside its generated replacement card, comparison table of attributes (name, category, clearance status), and attempt history summary for printed legal dossiers.
