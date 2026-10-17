# Agentic Cinema hackathon retrospective

Date: 2026-10-17
Status: retrospective and recommendations; not a release acceptance report

## Outcome and central lesson

The original personal objective was achieved: enter a hackathon as a solo developer using agentic coding agents and ship a substantial application. ClearanceScout did not receive a Parallel-track prize.

The main competitive weakness identified in this retrospective is the allocation of effort: the surrounding platform expanded before the core live research workflow had sufficiently convincing, reproducible public proof. This is an analytical judgment, not a statement from the judges.

## Evidence and limitations

This assessment uses the current Devpost submissions, published judging criteria, the public repository README, and the development/QA history supplied in the project conversation.

It does not include private judging feedback, independent execution of the winners' applications, or a review of their embedded demo videos. Current submission pages may have changed since the deadline. Competitor descriptions in the initial comparison reflect their published claims. The source-code follow-up below adds targeted static observations at pinned commits; runtime performance remains unverified.

Historical ClearanceScout problems must not be read as current defects. In particular, earlier reviews recorded fixture/live-mode confusion, unavailable provider credentials, deployment identity uncertainty, count discrepancies, and interaction regressions. No fresh release verdict is issued here.

Sources:
- [ClearanceScout submission](https://devpost.com/software/clearancescout)
- [Competition requirements and judging criteria](https://agentic-cinema.devpost.com/)
- [CurrentCut: Parallel first place](https://devpost.com/software/currentcut)
- [Consentinel: Parallel second place](https://devpost.com/software/consentinel)
- [The Boxes: Parallel third place](https://devpost.com/software/the-boxes)

## Comparison with the Parallel winners

The published criteria cover technological implementation, coherent design, credible impact, and quality/originality of the idea. Runtime use of Google Cloud and the chosen partner must be demonstrated. Agent-assisted development achieved the entrant's personal objective but did not substitute for those product outcomes.

| Entry | Central promise | Competitive strength communicated |
| --- | --- | --- |
| ClearanceScout | Screenplay to clearance workspace and binder | Broad coverage connecting occurrences, evidence, decisions, and production workflow |
| CurrentCut | Overnight footage to a checked first cut and editorial deliverables | A precise practitioner problem, familiar deliverables, and disclosed evaluation results |
| Consentinel | Performer permission checks and unauthorized-use investigation | A clear consent-registry model, bounded decisions, and explicit trust architecture |
| The Boxes | Film premise to an evolving research archive | Visible planning, retrieval, gap discovery, contradiction checking, and stopping behavior |

### CurrentCut: specificity and measurable value

CurrentCut describes a factual-TV director's overnight work and returns an existing industry deliverable: a caption order spreadsheet. Its submission publishes evaluation failures alongside successes and explains the gate preventing restricted material from being searched externally.

Lesson: choose one costly moment in a user's day, improve it, and make the result inspectable. CurrentCut also describes a solo entrant; team size alone does not explain the gap.

### Consentinel: trust as product architecture

Consentinel describes a shared consent registry and separates model-assisted evidence interpretation from deterministic permission checks. It explicitly limits what its system establishes.

Lesson: in a clearance product, distinguish evidence, permission coverage, reviewer decisions, and remaining uncertainty. A source link alone cannot justify a clearance conclusion.

### The Boxes: observable agency

The Boxes describes an iterative loop that plans research, acquires sources through Parallel, measures coverage, checks contradictions, and opens new research categories when gaps emerge. It provides examples of runs and measured performance changes.

Lesson: show why the agent makes its next tool call and what changes because of the result. More agents or more calls are not themselves evidence of useful agency.

## Shortcomings and better alternatives

### 1. Prove the critical dependency first

Earlier QA cycles spent substantial effort distinguishing fixtures from real provider behavior and local results from serving builds. For a Parallel-track entry, deployed live research should have been the first integration milestone.

Required first milestone:

> One uploaded scene → one correctly identified item → one real Parallel operation → source-supported evidence → persisted result after reload.

Only expand the workspace after this succeeds reliably on the public service.

### 2. Reduce scope to what can be validated

Portfolio views, role perspectives, collaboration, notifications, readiness dashboards, and exports enlarged the number of states and interactions to verify. Their accumulated repair cost competed with research quality and demonstration time.

A stronger hackathon scope would concentrate on screenplay intake, a review queue, evidence inspection, and one export. Keep other capabilities as roadmap items until the central path is stable.

### 3. Evaluate research quality, not only interface behavior

Functional tests do not establish that extraction or research is useful. Publish a small, manually checked evaluation set and its limitations.

Measure:
- missed clearance-sensitive items and false detections;
- correct entity identification, including ambiguous names;
- canonical-item and occurrence accuracy;
- whether each citation supports the stated rationale;
- distinctions among zero results, provider failure, and insufficient evidence;
- unsupported confidence and appropriate abstention;
- latency and provider cost per completed review.

Disclose sample size, annotation method, raw outcomes, and failures. Set acceptance thresholds before examining results.

### 4. Explain status layers consistently

Historical reviews found apparently contradictory item, rights, task, and scene states. These concepts should be independently understandable:
- evidence finding;
- recorded permission and its scope;
- human decision;
- outstanding review;
- resulting scene readiness.

Make the dependency visible rather than expecting a reviewer to infer why an item can remain under review while a scene has recorded coverage.

A binder digest demonstrates artifact integrity. It does not establish the accuracy of its sources or conclusions. Demonstrate one conclusion traced through source evidence, reviewer decision, and history.

### 5. Lower the effort required to evaluate the entry

Creating a production, preparing a file, uploading, researching, navigating tasks, and exporting asks a judge to complete onboarding before assessing value.

Offer a clearly labeled, isolated example with an immediate result to inspect, plus a short path to run real research. Retain provenance and disclose any cached output. Make live execution distinguishable from example browsing.

### 6. Lead with outcomes rather than feature inventory

The submission should make five points quickly:
1. Who performs this work?
2. Which specific difficulty does the product remove?
3. What happens in one run?
4. What evidence shows that it works?
5. What must still be decided by a human?

An architecture diagram and feature list support that story; they should not carry it.

## A stronger, smaller ClearanceScout entry

Proposed promise:

> ClearanceScout turns a screenplay excerpt into an evidence-backed clearance review packet, linking each finding to its occurrence and exposing uncertainty.

Demonstrate three cases:
1. A repeated item: accurate canonicalization and occurrence counts.
2. An ambiguous name: clarification or abstention rather than a confident mismatch.
3. An item with recorded permission: understandable separation of evidence status and rights coverage.

Use three primary surfaces: screenplay, review queue, and evidence packet.

Make Parallel's contribution inspectable: research objective, provider outcome, retrieved sources, relevant excerpts, and any follow-up query. Follow-up research should address a specific evidence gap. Preserve provider failures visibly.

## Improve the agent-assisted development process

Manage agents around demonstrated outcomes, not successive feature phases.

| Portion of available time | Deliverable |
| --- | --- |
| First 20% | Deployed, persistent core workflow using real providers |
| Next 30% | Reliable behavior and a small quality evaluation |
| Next 20% | Coherent interface tested by unfamiliar users |
| Final 30% | Scope freeze, public regression, demo, and submission evidence |

These allocations are planning recommendations, not measured optimal values.

For each bounded implementation task, require:
- observable acceptance conditions;
- the exact commit and serving revision tested;
- a clear distinction among unit, rendered-browser, live-provider, physical accessibility, and human usability evidence;
- unresolved failures reported without replacing them with fixture success.

Use SpecKit to preserve decisions and acceptance conditions, while keeping the scope small. Documentation completion must follow demonstrated behavior.

The review/orchestration process also contributed to scope growth: too many findings became additional development phases before the core contest demonstration was secure. The corrective lesson applies to orchestration as well as implementation: enforce an early real-provider milestone, resist platform expansion, and freeze earlier.

## Submission and demo plan

A suggested three-minute demonstration:
- 0:00–0:25: identify the user and show the concrete problem;
- 0:25–1:15: ingest the excerpt and show item/occurrence accuracy;
- 1:15–2:00: show real research, its sources, and an uncertainty case;
- 2:00–2:35: record or inspect a human decision and its consequences;
- 2:35–3:00: export the traceable packet and state measured results and limits.

Use actual product recordings. Disclose cuts, cached material, fixtures, and waiting-time edits. Keep technical traces available for inspection without overwhelming the main user flow.

Before recording, ask at least three intended users to complete the central task without coaching. Record where they hesitate, which conclusions they distrust, what they would still verify, and whether the output fits their existing workflow.

## Prioritized follow-up

These are recommendations, not authorization for implementation, provider spending, data changes, or deployment.

1. Choose one target user and one essential deliverable.
2. Define a small representative evaluation set and acceptance criteria.
3. Demonstrate persistent live provider execution on an isolated project.
4. Simplify the product around the core review path.
5. Resolve confusing evidence/rights/readiness semantics.
6. Run unfamiliar-user sessions and incorporate the material findings.
7. Publish measured outcomes and limitations.
8. Freeze the release and produce a concise, reproducible demonstration.

The next competitive step is a more convincing core workflow, not a longer feature list.

## Source-code comparison: follow-up review

Reviewed 2026-10-17. This section supersedes the earlier reliance on submission descriptions for the specific implementation observations below.

### Scope and reproducibility

Four public repositories were downloaded and selected provider integrations, orchestration, evidence handling, readiness logic, and tests were read. This was a targeted static review, not a comprehensive audit. Applications and paid providers were not executed. Python pytest was unavailable in the review environment; no automated test PASS is claimed.

| Repository | Reviewed commit | Commit date |
| --- | --- | --- |
| [CurrentCut](https://github.com/tanaka-cell/currentcut) | `11050a776e16bb2aec6d319749d25f728a4bcadf` | 2026-10-15 |
| [Consentinel](https://github.com/PRACHIT27/Consentinel) | `566be6591b7709efc126393d9a6ba2f2a0be6679` | 2026-09-09 |
| [The Boxes](https://github.com/rapha18th/agentic-cinema-boxes) | `3db7f962a6397e7781cd8f519f2db7143598dbdc` | 2026-09-09 |
| [ClearanceScout](https://github.com/fmcgoohan/clearancescout) | `2cb583d71c4a207b1ff81ac6634ad617c56bf1d8` | 2026-09-09 |

CurrentCut includes post-deadline changes. These snapshots cannot establish what every judge saw or explain the judging outcome. Repository presence does not prove deployment or runtime success.

### CurrentCut: evidence support and final-deliverable tests

Observed in code:
- Claim support requires matching entity, attribute, and value, rather than accepting an unrelated page containing the same number.
- The Parallel client gates external queries and records provider identity, attempts/outcomes, request identifiers, timing, and failures.
- Caption-sheet tests check that disputed material does not reappear as an apparently unqualified quotation in another spreadsheet row.
- ADK orchestration is instructed to follow a fixed sequence; a deterministic fallback is available when orchestration fails. This is bounded workflow orchestration, not evidence of unrestricted autonomous editing.

Sources:
- [Evidence evaluator](https://github.com/tanaka-cell/currentcut/blob/11050a776e16bb2aec6d319749d25f728a4bcadf/services/agent/app/agents/evidence.py)
- [Parallel client](https://github.com/tanaka-cell/currentcut/blob/11050a776e16bb2aec6d319749d25f728a4bcadf/services/agent/app/clients/parallel_client.py)
- [Caption chain-of-custody tests](https://github.com/tanaka-cell/currentcut/blob/11050a776e16bb2aec6d319749d25f728a4bcadf/services/agent/tests/test_sheet_chain_of_custody.py)
- [ADK pipeline](https://github.com/tanaka-cell/currentcut/blob/11050a776e16bb2aec6d319749d25f728a4bcadf/services/agent/app/adk_pipeline.py)

Transferable lesson: verify that an evidence judgment remains correctly qualified in the final artifact a practitioner uses.

### Consentinel: enforceable observation/permission boundaries

Observed in code:
- A deterministic reconciler checks modality, territory, validity dates, and licensee identity.
- Unknown territory and other missing information receive explicit treatment.
- Validators check that extracted quotations occur in source text.
- The reconciler refuses to store decisive verdicts without a citation.

Qualification: the design document acknowledges that the web app runs agents in-process on Cloud Run rather than invoking the separately deployed Agent Engine runtimes. Deployment of a runtime and its use by the application are separate claims.

Sources:
- [Reconciler](https://github.com/PRACHIT27/Consentinel/blob/566be6591b7709efc126393d9a6ba2f2a0be6679/consentinel/agents/reconciler.py)
- [Extraction validators](https://github.com/PRACHIT27/Consentinel/blob/566be6591b7709efc126393d9a6ba2f2a0be6679/consentinel/agents/validators.py)
- [Runtime placement disclosure](https://github.com/PRACHIT27/Consentinel/blob/566be6591b7709efc126393d9a6ba2f2a0be6679/DESIGN.md)

Transferable lesson: make evidence requirements executable. Deterministic rules still require defensible inputs and explicit policy assumptions.

### The Boxes: iterative research with heuristic completeness

Observed in code:
- The loop selects thinly covered objectives, proposes additional objectives, retrieves more evidence, and stops according to coverage or round budgets.
- Its confidence/completeness calculation combines weighted evidence quantity, domain diversity, source quality, and contradiction penalties.
- Source quality partly relies on domain-name heuristics.
- The inspected core test file contains five tests. That observation does not establish the total verification effort or broad reliability.

Qualification: the confidence value is a heuristic score, not a calibrated probability that the archive is correct.

Sources:
- [Research loop](https://github.com/rapha18th/agentic-cinema-boxes/blob/3db7f962a6397e7781cd8f519f2db7143598dbdc/src/boxes/research_loop.py)
- [Coverage calculation](https://github.com/rapha18th/agentic-cinema-boxes/blob/3db7f962a6397e7781cd8f519f2db7143598dbdc/src/boxes/coverage.py)
- [Evidence scoring](https://github.com/rapha18th/agentic-cinema-boxes/blob/3db7f962a6397e7781cd8f519f2db7143598dbdc/src/boxes/evidence.py)
- [Core tests](https://github.com/rapha18th/agentic-cinema-boxes/blob/3db7f962a6397e7781cd8f519f2db7143598dbdc/tests/test_core.py)

Transferable lesson: make follow-up research respond to a specific missing fact, while explaining what any completeness score actually measures.

### ClearanceScout: concrete strengths and gaps

The repository contains substantive workflow infrastructure: project-scoped persistence, canonical entities and occurrences, rights coverage, readiness calculations, tasks, and exports. The principal gap identified in the inspected path is evidence verification inside that infrastructure.

| Finding | Source observation | Implication |
| --- | --- | --- |
| Generic grounding | Search uses a trademark-oriented objective for the entity and retains up to three live results; live registration status is UNKNOWN. | Research needs category-appropriate questions and explicit entity/fact verification. |
| Zero-result citation representation | An empty live result creates a citation-like record pointing to Parallel's search page. | Represent an empty search as an operation outcome, not a supporting source. |
| Context model does not receive citations | The occurrence-level Gemini prompt includes screenplay context but not retrieved evidence. | This path does not substantiate a claim that Gemini reasons over those citations to produce the assessment. |
| Brand-specific decisions | The evaluator explicitly branches on Coca-Cola and Porsche names. | Replace individual-name shortcuts with documented, evidence-supported policy and tests. |
| Unknown status can produce reassuring output | Incidental usage can receive NO_ISSUE_SURFACED with unknown registration status. | Keep evidence uncertainty distinct from production policy and human clearance decisions. |
| Fixture fallback remains implemented | Live search errors or absent credentials return labeled FALLBACK_FIXTURE data. | This contradicts a blanket no-fixture-fallback claim, although the evaluator generally marks unmitigated cloud fallback INSUFFICIENT_EVIDENCE. |
| Test title overstates its environment | A test labeled Full End-to-End Live Runtime creates a TEST_MODE project and uses Supertest against Express. | Useful integration coverage does not establish public-browser or real-provider validation. |

Sources:
- [Parallel search tool](https://github.com/fmcgoohan/clearancescout/blob/2cb583d71c4a207b1ff81ac6634ad617c56bf1d8/server/tools/parallelSearchTool.ts)
- [Occurrence evaluator](https://github.com/fmcgoohan/clearancescout/blob/2cb583d71c4a207b1ff81ac6634ad617c56bf1d8/server/workflows/clearanceEvaluator.ts)
- [Readiness engine](https://github.com/fmcgoohan/clearancescout/blob/2cb583d71c4a207b1ff81ac6634ad617c56bf1d8/server/workflows/sceneReadinessEngine.ts)
- [Datastore selection](https://github.com/fmcgoohan/clearancescout/blob/2cb583d71c4a207b1ff81ac6634ad617c56bf1d8/server/repositories/firestoreClient.ts)
- [Runtime integrity integration test](https://github.com/fmcgoohan/clearancescout/blob/2cb583d71c4a207b1ff81ac6634ad617c56bf1d8/tests/integration/test_live_runtime_integrity_workflow.test.ts)

These are observations about the pinned source snapshot. They are not new live-production reproductions, a legal assessment of clearance policy, or proof that all evaluation paths behave identically.

### Revised engineering priorities

1. Strengthen one category-specific research path: verify the correct entity and source support for each extracted factual claim.
2. Separate evidence observations, permission coverage, production policy, and human decisions in both data and presentation.
3. Represent provider errors and zero results directly, without generating citation records that imply supporting evidence.
4. Replace brand-name branches with explicit policies and representative tests.
5. Test the exported packet end to end: source excerpts, occurrence links, qualifications, decisions, and history.
6. Publish a small annotated benchmark, including false confidence, misses, abstentions, latency, and cost, before expanding the UI.

The follow-up supports the original recommendation to narrow scope, with a more precise diagnosis: ClearanceScout had substantial workflow infrastructure, but deeper verification of evidence would have been a more valuable next investment than further interface breadth.

### Interpretation of the third-party video reaction

The third-party assessment discussed in the project conversation was based on the videos, not a deep implementation review. It can inform presentation analysis but cannot establish that winners were thin wrappers or that ClearanceScout lost because it was more practical. The targeted source review found substantive work and limitations in all four projects. Private judging reasoning remains unknown.
