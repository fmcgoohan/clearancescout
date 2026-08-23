# ClearanceScout UX Redesign Instructions

## Objective

Refine ClearanceScout into a polished, intuitive production-clearance workspace that supports both first-time users and experienced clearance professionals.

Use Antigravity as the implementation orchestrator and Speckit to manage requirements, specifications, implementation planning, and acceptance validation.

Preserve the existing functional workflow and data integrity while improving discoverability, terminology, visual hierarchy, responsive behavior, and accessibility.

## Product outcome

A user should be able to understand the primary workflow without training:

1. Load or upload a screenplay.
2. Review overall shooting readiness.
3. Identify highlighted clearance items in their scene context.
4. Research, mitigate, or escalate unresolved items.
5. Track assigned department work.
6. Export the final clearance binder.

The interface should guide users toward the next appropriate action instead of only presenting information.

## Preserve these strengths

Do not regress the following:

- Side-by-side screenplay and entity-registry workflow.
- Synchronized scene, entity, occurrence, status, and task counts.
- Replace-versus-merge screenplay ingestion.
- Processing stages, progress percentage, cancellation, and completion summary.
- Text labels accompanying status colors.
- Highlighted screenplay references linked to canonical entities.
- Registry filters and accessible table structure.
- Condensed registry actions with an overflow menu.
- Department Task Center and Operations Dashboard.
- Human-readable category and status labels.
- Modal focus entry, focus trapping, Escape behavior, and focus restoration.
- Durable completion confirmation.
- Seven-entity bundled-demo result.

## UX requirements

### 1. Establish a clear primary action

The page must make the recommended next step obvious.

Add a contextual recommendation area near the project summary or shooting-readiness section.

Example:

> 2 clearance items require action. Start with Nocturne of the Wild.

Requirements:

- Identify the most urgent unresolved item.
- Explain why it is recommended.
- Provide a direct action.
- Update automatically as clearance state changes.
- Hide or adapt when no immediate action exists.

### 2. Simplify terminology

Replace specialist or implementation-oriented language where it is not essential.

Preferred terminology:

- "Ground" -> "Research" or "Verify Evidence"
- "Canonical Entity Registry" -> "Clearance Items"
- "Multi-Format Script Ingestion & 5-Category Resolution" -> "Screenplay Intake & Clearance"
- "Insufficient evidence" may remain, but supporting copy must explain its consequence.
- "Department Tasks" should mean assigned work.
- "Blocking Occurrences" should mean appearances in scenes that currently prevent shoot readiness.

Technical terminology may appear in tooltips or advanced details.

### 3. Clarify navigation boundaries

Clearly distinguish the purpose of each operational area:

- Clearance Items: review and act on entities.
- Department Tasks: track assigned work and ownership.
- Operations Dashboard: understand project-wide readiness and risk.
- Observable Timeline: inspect workflow history and system activity.
- Clearance Binder: export the legal deliverable.

Use concise descriptions, tooltips, or first-use guidance.

### 4. Reduce header density

Prioritize:

- Project identity
- Project summary
- Recommended next action

Move secondary utilities into a visually subordinate area or overflow menu:

- Access token
- Execution mode
- Live quota
- Export
- Timeline

Do not give every control equal visual weight.

### 5. Improve registry usability

Preserve the compact action model:

- One primary research or mitigation action.
- Occurrences.
- More Actions.

Requirements:

- Use text labels where icons may be ambiguous.
- Keep accessible names on icon-only controls.
- Hide "Research All Pending" when the count is zero, or replace it with a non-interactive completion state.
- Support long entity names without severely compressing actions.
- Consider a resizable split pane or collapsible screenplay panel.
- Use a card-based layout at narrower breakpoints.

### 6. Improve visual readability

- Increase the size of supporting text, legends, badges, and filter labels.
- Verify text and badge contrast against the dark background.
- Reduce unnecessary nested borders and boxed panels.
- Preserve the current color system:
  - Cyan for navigation and neutral actions.
  - Amber for review.
  - Red for blocking or action-required states.
  - Green for cleared states.
- Never communicate status through color alone.
- Maintain comfortable script line length and padding.

### 7. Improve responsive behavior

Define and test desktop, tablet, and narrow-screen layouts.

Expected behavior:

- Wide desktop: screenplay and clearance items remain side by side.
- Medium width: allow resizing or collapsing either panel.
- Narrow width: stack the screenplay and clearance items.
- Keep primary actions visible.
- Avoid clipped action columns and excessive entity-name wrapping.
- Modals must fit the viewport and support internal scrolling.

### 8. Preserve count semantics

Keep these concepts distinct:

- Entities: unique clearance items.
- Blocking occurrences: appearances within scenes that block readiness.
- Department tasks: assigned work items.
- Scenes: screenplay production units.

Explain that an entity may appear multiple times within one or more scenes, so blocking occurrences can exceed entity tasks.

All counts must update atomically after ingestion or clearance changes.

### 9. Preserve and strengthen ingestion feedback

During ingestion:

- Keep the dialog modal.
- Keep background content inert and unavailable to assistive technology.
- Keep focus inside the dialog.
- Focus Cancel Upload or a meaningful processing-status element.
- Announce meaningful processing-stage changes.
- Avoid announcing elapsed-time changes every second.

On completion:

- Update scenes, entities, statuses, occurrences, tasks, and summaries together.
- Restore focus to the initiating control or updated project summary.
- Show a durable confirmation:

> Screenplay replaced successfully - 3 scenes processed - 7 entities registered - 7 department tasks created.

For accessibility:

- Use `role="status"` and `aria-live="polite"` for progress and success.
- Use `aria-atomic="true"` for completion summaries.
- Use `role="alert"` for failures.

### 10. Improve onboarding

Add lightweight first-use guidance without interrupting experienced users.

Possible treatments:

- A short three-step introduction.
- Contextual empty-state guidance.
- Tooltips on specialist concepts.
- A dismissible "How clearance works" panel.

First-time users should understand:

- Why a scene is red.
- Why insufficient evidence blocks shooting.
- The difference between researching an item and mitigating it.
- When to use rights, placeholders, or counsel overrides.
- Where department tasks come from.

## Accessibility requirements

Meet WCAG 2.2 AA expectations.

Validate:

- Full keyboard operation.
- Logical focus order.
- Visible focus indicators.
- Modal focus trapping.
- Escape behavior.
- Focus restoration.
- Overflow-menu keyboard operation.
- Collapsible-section keyboard operation.
- Table semantics.
- Screen-reader names and descriptions.
- Live-region announcements.
- 200% zoom.
- Text and non-text contrast.
- Status comprehension without color.
- Reduced-motion preferences.

Complete a real VoiceOver test in addition to automated inspection.

## Speckit workflow

### Constitution

Record these non-negotiable principles:

- No regression in project-data synchronization.
- Accessibility is a release requirement.
- Status must never rely on color alone.
- Counts must have one documented semantic source.
- Every screen must expose a clear next action.
- Domain terminology must be understandable or explained.
- Responsive behavior must be specified, not inferred.

### Specification

Create user stories for:

- First-time screenplay upload.
- Screenplay replacement.
- Screenplay version merge.
- Reviewing a red scene.
- Researching an entity.
- Viewing occurrences.
- Creating a placeholder.
- Recording rights.
- Applying a counsel override.
- Completing a department task.
- Exporting a clearance binder.
- Completing the workflow with keyboard and screen reader.

Define acceptance criteria for every user story.

### Plan

Organize implementation into independently verifiable workstreams:

1. Terminology and information architecture.
2. Header and recommended-next-action redesign.
3. Registry interaction and responsive layout.
4. Dashboard and task-center clarification.
5. Ingestion focus and live announcements.
6. Onboarding.
7. Accessibility and responsive QA.

### Tasks

Each task must include:

- Intended user outcome.
- Components affected.
- Accessibility considerations.
- Responsive behavior.
- Data/count dependencies.
- Test cases.
- Definition of done.

### Validation

Run:

- Automated component and integration tests.
- Desktop Chrome regression testing.
- Keyboard-only testing.
- VoiceOver testing.
- 200% zoom testing.
- Narrow-viewport testing.
- Ingestion synchronization testing.
- Count-consistency testing.
- Visual regression testing.

## Acceptance criteria

The redesign is complete when:

- A new user can identify the primary workflow and next action without instruction.
- "Ground" and unexplained implementation terms are absent from primary UI.
- Project summary and recommended action dominate the header.
- Secondary utilities are visually subordinate.
- All clearance counts remain synchronized.
- Registry actions remain usable at supported widths.
- No important text fails contrast or zoom requirements.
- Modal background remains inert throughout ingestion.
- Progress and completion are announced to assistive technology.
- Focus remains meaningful during processing and is restored afterward.
- The bundled demo consistently produces 3 scenes, 7 entities, and 7 department tasks.
- No critical or high-severity usability or accessibility defects remain.
