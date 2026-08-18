# Technical Research & Architecture Decisions: Replacement Self-Clearance Loop

**Feature**: `specs/004-replacement-clearance-loop`  
**Date**: 2026-08-18  
**Status**: Approved  

---

## 1. Autonomous Self-Clearance Workflow Architecture

### Problem
Fictional replacement brands proposed by LLMs (e.g. generating "Nuka-Cola" or "Velocity" to replace "Coca-Cola" or "Porsche") may inadvertently collide with real-world registered trademarks, regional brands, or copyrighted titles. Previous implementations generated a fictional card without automated verification, shifting the burden of research to the user.

### Decision
Implement an autonomous candidate verification loop inside `server/workflows/replacementGenerator.ts`:
1. **Candidate Generation**: Prompt `gemini-3.6-flash` to propose a fictional brand (name, tagline, visual prompt, backstory) respecting the parent entity category, era aesthetic, and negative constraints from prior attempts.
2. **Clearance Evaluation**: Automatically invoke `clearanceEvaluator.evaluateCandidate(projectId, candidate)` using the exact same grounded research tool (`ParallelSearch` or execution-mode fixtures) used for original script entities.
3. **Evidence Policy Decision**:
   - `NO_ISSUE_SURFACED`: **ACCEPT**. Finalize replacement card, attach citations, emit `REPLACEMENT_ACCEPTED`, and persist to repository.
   - `ACTION_REQUIRED` | `REVIEW_RECOMMENDED` | `INSUFFICIENT_EVIDENCE`: **REJECT**. Emit `REPLACEMENT_REJECTED` with the collision reason, append to attempt history, and loop to step 1 if `attemptCount < 3`.
4. **Deterministic Loop Ceiling**: Bounded at $\le 3$ attempts. If attempt 3 fails, terminate loop, set status to `ESCALATED_TO_COUNSEL`, and present the attempt 3 candidate with all collision citations.

### Alternatives Considered
- *Batch generate 3 candidates simultaneously and pick the best*: Rejected. Unnecessarily burns search API quota when candidate 1 might clear immediately. Sequential generation with negative prompting allows candidate 2 to explicitly avoid the specific trademark territory that disqualified candidate 1.
- *Invented heuristic risk scoring (e.g. 0-100 score)*: Rejected per user clarification and constitution. Fictional brand clearance is categorical (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`, `INSUFFICIENT_EVIDENCE`) grounded in actual legal citations.

---

## 2. Negative Constraint Injection & Prompt Strategy

### Problem
When a candidate is rejected (e.g. "AeroLux" rejected because of an existing trademark for luxury goods), the next prompt must avoid proposing synonymous or phonetically similar names.

### Decision
Structure the generator prompt with accumulated collision history:
```typescript
const prompt = `
Generate an era-authentic fictional replacement brand for ${entity.canonicalName} (${entity.entityCategory}).
Era Aesthetic: ${eraAesthetic}

NEGATIVE CONSTRAINTS (DO NOT USE OR IMITATE):
${attemptHistory.map(a => `- Candidate "${a.candidateName}" was REJECTED: ${a.collisionRationale}`).join('\n')}

Return JSON with: proposedName, tagline, visualPrompt, fictionalBackstory.
`;
```

### Alternatives Considered
- *Stateless retry without negative context*: Rejected. Frequently resulted in model repeating the same name or minor spelling variations.

---

## 3. Fail-Visible Outage Handling in `CLOUD_MODE`

### Problem
In `CLOUD_MODE`, if the live search API is unreachable or credentials are missing, silent fallbacks to offline demo fixtures could deceive production legal into believing a fictional brand cleared live search when it was never verified.

### Decision
- In `CLOUD_MODE`, any research tool exception or empty response must result in status `INSUFFICIENT_EVIDENCE` with explicit failure diagnostics.
- The system MUST NEVER silently switch to `DEMO_FIXTURE` in `CLOUD_MODE`.
- In `DEMO_MODE` and `TEST_MODE`, deterministic fixture data is used with provenance tagged as `DEMO_FIXTURE`.

---

## 4. SSE Action Timeline Event Protocol

### Problem
The frontend action timeline requires precise, predictable event streams for observable diagnostics without polluting client logs with raw LLM chain-of-thought.

### Decision
Emit strictly four discrete timeline events via `timelineEmitter`:
1. `REPLACEMENT_ATTEMPT`: `{ canonicalEntityId, candidateName, eraAesthetic, attemptNumber }`
2. `REPLACEMENT_RESEARCH_STARTED`: `{ canonicalEntityId, candidateName, attemptNumber }`
3. `REPLACEMENT_REJECTED`: `{ canonicalEntityId, candidateName, attemptNumber, rejectionStatus, collisionRationale }`
4. `REPLACEMENT_ACCEPTED`: `{ canonicalEntityId, acceptedName, attemptNumber, totalAttempts, clearanceStatus: 'NO_ISSUE_SURFACED' }`

---

## 5. Summary of Architecture Decisions

| Area | Choice | Justification |
|:---|:---|:---|
| **Model** | `gemini-3.6-flash` | ADK Constitution Principle I compliance |
| **Search Tool** | `ParallelSearch` SDK (ADK tool) | ADK Constitution Principle II compliance |
| **Max Attempts** | Bounded at 3 | Bounded runtime, operational predictability |
| **Acceptance Rule** | `status === 'NO_ISSUE_SURFACED'` | Zero-tolerance for unverified fictional brand risk |
| **Outage Rule** | Fail-visible `INSUFFICIENT_EVIDENCE` in `CLOUD_MODE` | No silent synthetic fallback in live production |
| **Timeline Events** | 4 strict event types | Observable action timeline without raw chain-of-thought |
