# Two-Phase QA Brief: Demo Token Modal Regression + Bounded Workflow Simplification

The latest QA shows a mixed result: registry/count improvements are holding, but a release-blocking modal regression has appeared, and the broader workspace still feels too much like an expert operations console rather than a guided production-clearance workflow.

This pass has two ordered phases:
1. Fix and regression-protect the Demo Token modal first.
2. Then perform a bounded workflow-hierarchy/terminology simplification pass.

Do not begin the broader UX changes until the modal blocker is reproduced, fixed, and regression-tested.

## Verified state to preserve (do not regress)

- "2 Action Required", "5 Review Recommended", "7 Department Tasks"
- Art & Music is correctly humanized.
- "Showing 7 of 7 entities" is correct.
- Entity rows now have lower action density: one primary action; occurrences shortcut; overflow for secondary actions.
- Status/category capitalization is improved.
- Elena Vance and all seven entities remain synchronized.
- The highlighter explains why insufficient evidence prevents clearance.

Do not reopen entity synchronization, replacement architecture, or task-generation semantics unless validation exposes an actual regression.

## Phase 1 (P0): Demo Token modal regression

QA reproduced a serious failure after selecting "Demo Token". Observed:

```
dark modal overlay appears
-> dialog itself is not visibly rendered in the captured interface
-> underlying workspace is visually obscured
```

Keyboard/accessibility behavior also failed:

```
initial focus reaches Close
Escape does not close
Shift+Tab does not wrap/move correctly
Cancel does not reliably dismiss
underlying workspace remains in accessibility tree
```

This can leave the application effectively unusable. Treat this as release-blocking.

Have Antigravity exercise the real `workspace -> Demo Token -> token dialog` path and inspect:
- dialog DOM presence
- computed styles
- dimensions
- positioning
- portal/root location
- z-index/stacking context
- backdrop z-index
- clipping/overflow
- visibility/opacity
- focus trap
- role="dialog"
- aria-modal
- inert / aria-hidden treatment of the application
- Escape handler
- Close/Cancel handlers
- focus restoration

Determine whether the failure is: dialog rendered behind overlay; dialog rendered offscreen; dialog has zero/invalid dimensions; unsupported CSS; stacking-context conflict; portal placement problem; dialog subtree unmounted; focus-management regression; or another concrete cause. Do not merely increase z-index speculatively.

The Demo Token dialog should satisfy the same modal contract already established for ingestion:

```
trigger activated
-> visible dialog appears above backdrop
-> focus enters dialog
-> background becomes inert
-> Tab / Shift+Tab remain contained
-> Escape closes when safe
-> Close/Cancel reliably dismiss
-> focus returns to Demo Token trigger
```

The underlying workspace must also be excluded from the active accessibility context while the modal is present.

If multiple ClearanceScout dialogs now use different modal implementations, determine whether the regression resulted from duplicated accessibility/layering logic. Prefer consolidating shared modal mechanics into the existing reusable primitive if that can be done without a broad component rewrite. Do not introduce another UI framework.

Because modal behavior has regressed after previously passing QA, inspect the other major modal surfaces after fixing Demo Token: ingestion/Replace-Merge, Project Directory, Demo Token, Action Center, Operations Dashboard, occurrence details, Placeholder, Add Rights, Override. Do not redesign them. Verify only the common contract: visible above backdrop; correct modal semantics; initial focus; background inert; focus containment; Escape where appropriate; Close/Cancel; focus restoration.

Add rendered interaction regression coverage so fixing one dialog cannot silently break another. At minimum add/retain rendered tests equivalent to:

```
demo_token_dialog_renders_above_backdrop
demo_token_dialog_background_is_inert
demo_token_dialog_traps_focus
demo_token_escape_closes
demo_token_cancel_closes
demo_token_close_restores_trigger_focus
```

plus cross-modal regression coverage for the shared modal primitive.

Only once Phase 1 passes should Phase 2 begin.

## Phase 2: Bounded workflow-hierarchy / terminology simplification

The goal is not a redesign. The goal is to make existing functionality read as a workflow, not to expand the product.

### One contextual primary recommendation

The workspace presents many possible actions but no obvious next step. Use existing project state to surface one contextual primary recommendation, taking the user directly to the appropriate filtered view. Do not build a new recommendation engine -- implement a small deterministic hierarchy from existing state. There should generally be one obvious primary next action, not another row of equal-weight buttons.

For the verified state (2 Action Required, 5 Review Recommended, 7 Department Tasks), a sensible primary action would be "Review 2 action-required items" or, preferably after terminology convergence, "Review 2 clearance blockers".

The recommendation should change naturally with state, e.g.:

```
no screenplay -> Add screenplay
blockers exist -> Review 2 clearance blockers
no blockers but reviews remain -> Review 5 recommended items
unresolved department work remains -> View 7 department tasks
ready -> Review clearance binder / readiness
```

### Operator terminology

QA still identifies labels that sound like engineering concepts rather than production-clearance concepts:

```
Multi-Format Script Ingestion & 5-Category Resolution
Canonical Entity Registry
Ground
Observable Timeline
Live Convergence Verification
```

Audit where these appear in normal operator workflows. Prefer user-facing language, e.g.:

```
Multi-Format Script Ingestion & 5-Category Resolution -> Screenplay Intake
Canonical Entity Registry -> Clearance Items
Ground -> Research or Run Clearance Check
Observable Timeline -> Activity
Live Convergence Verification -> use recognizable project/workflow terminology, or remove from primary UI if diagnostic-only
```

Exact copy should be chosen based on what each function actually does. Do not blindly perform string replacement. Preserve precise technical terminology in diagnostics, developer/admin surfaces, and provenance details where genuinely useful. Primary production UI should describe the user's task and outcome.

### Status vocabulary convergence

QA still sees a legend using "Review" / "Action" while rows say "Review recommended" / "Action required". Choose one operator vocabulary and use it consistently. Prefer the already-established: Cleared, Insufficient evidence, Review recommended, Action required -- where those are the actual domain states. If the highlighter needs shorter labels because of space constraints, ensure the relationship is still explicit rather than silently introducing alternate terminology. Do not rename internal enum values.

### "Ground" replacement

"Ground" remains too implementation-oriented even with a tooltip. Determine exactly what the action initiates and rename it according to the user's outcome. Candidate: "Research" or "Run Clearance Check". If it opens existing evidence rather than performing research, use "Review Evidence". Do not retain "Ground" as the primary action merely because the backend concept is grounding. Update accessible names/tooltips accordingly.

### Header hierarchy

QA still finds the header overloaded with: project identity/switching; token configuration; execution mode; quota; export; activity/timeline; summary counts; other operational controls.

Establish a clearer hierarchy. Keep immediately visible: project identity; primary workflow/navigation; key clearance summary; contextual recommended action. Move secondary/admin/debug information such as Demo Token, execution mode, quota detail, technical diagnostics into an existing or small secondary Settings/More menu where appropriate. Do not hide information needed for the hackathon demo; make it available without giving it equal visual weight. Preserve keyboard accessibility.

### Workspace navigation / orientation

The current page reads as one long operational workspace containing: script intake, screenplay scenes, clearance registry, department work, dashboard, exports. Provide stronger orientation. Evaluate a lightweight primary navigation model such as: Overview, Screenplay, Clearance Items, Tasks. This does not necessarily require separate routes. Tabs/section navigation/anchored views are acceptable if they preserve existing state, avoid duplicating components, remain keyboard accessible, and clearly indicate the current section.

A sensible model could be:
- Overview: readiness, summary counts, recommended next action, major blockers
- Screenplay: intake, scenes, highlighter, occurrences
- Clearance Items: current Registry, filters, research, rights/replacement actions
- Tasks: current Action Center / department work

Operations Dashboard/Activity/Export can remain accessible as secondary tools rather than becoming additional competing primary sections unless the existing architecture suggests otherwise. Keep this bounded. Do not rebuild the application into a new router architecture solely for this pass.

### Registry preservation

QA specifically verified the Registry improvements. Preserve: one primary action; occurrences shortcut; secondary actions in overflow; readable status/category labels; "Showing 7 of 7 entities". Do not re-expand row actions while simplifying navigation.

## First-time-user validation (after Phase 1 and Phase 2)

Have Antigravity test the application as a first-time production user. Start with "open project" and answer from the rendered interface alone:

```
What project am I in?
What is its clearance state?
What requires my attention?
What should I do next?
Where is the screenplay?
Where are the clearance items?
Where is departmental work?
Where do I export when finished?
```

Those answers should not require knowledge of: grounding, canonicalization, convergence, CLOUD_MODE, implementation architecture.

Then validate: recommended action -> opens correct filtered workflow. Confirm all existing domain counts remain correct.

## Rerun modal contract after UX changes

Because the Demo Token modal regressed, rerun the modal contract after the UX changes. For every major modal tested: visible dialog above backdrop; focus inside; background inert; Tab trapped; Shift+Tab trapped; Escape works where applicable; Cancel/Close works; focus restoration works.

Also verify the new: recommended action; header secondary menu; section navigation; renamed Research action -- are keyboard operable and have useful accessible names.

Additional test names to add/retain:

```
action_required_state_shows_blocker_recommendation
recommended_action_opens_correct_filtered_view
ground_is_not_exposed_as_primary_operator_label
status_vocabulary_is_consistent
```

plus appropriate keyboard tests for any new navigation/menu.

## Priorities

```
P0 -> Demo Token modal
P1 -> recommended next action
P1 -> operator terminology
P1 -> header hierarchy
P1/P2 -> workspace navigation hierarchy
```

Do not allow the UX restructuring to delay or obscure the modal fix.

## Explicitly out of scope

- reopening screenplay replacement
- modifying canonicalization
- changing action-generation rules
- changing working synchronization
- introducing a new design system/framework
- performing an unrelated visual redesign

The purpose is to make existing functionality easier to understand, not to expand the product.

## Reporting

Use the installed SpecKit/convergence workflow as appropriate. Report separately for Phase 1 and Phase 2. Only proceed to Phase 2 after the Phase 1 report is delivered.

### Phase 1 report must cover
1. exact Demo Token reproduction
2. root cause of invisible/blocked dialog
3. root cause of Escape/Cancel/focus failures
4. modal implementation corrected
5. cross-modal regression results
6. rendered keyboard/accessibility evidence

### Phase 2 report must cover
1. recommended-next-action hierarchy chosen
2. operator terminology changes
3. Ground replacement and semantics
4. header hierarchy changes
5. workspace navigation/orientation approach
6. status-vocabulary convergence
7. tests added
8. rendered first-time-user validation
9. accessibility regression evidence
10. remaining release risks

## Closure criteria

First: no modal can strand a keyboard, screen-reader, or pointer user.

Then: a production user entering ClearanceScout can immediately understand the project's clearance state, identify the most important next action, and navigate naturally among the screenplay, clearance items, and departmental work without needing to understand the product's implementation terminology.
