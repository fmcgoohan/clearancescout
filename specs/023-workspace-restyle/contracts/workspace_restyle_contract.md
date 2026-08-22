# Interface & DOM Contracts: Feature 023 Workspace Restyle

**Feature**: Workspace Restyle (All Five Surfaces)
**Spec**: [`spec.md`](../spec.md)

---

## DOM & Component Class Contracts

| Surface / Component | Mandatory DOM Selector / Attribute | Contract Requirement |
| :--- | :--- | :--- |
| **Toolbar Command Bar** | `.header-command-bar` | Must contain exactly ONE `.btn-primary` element page-wide. |
| **Quota Counter** | `.quota-meter-number` | Must apply CSS `font-variant-numeric: tabular-nums`. |
| **Hero Readiness Card** | `.readiness-hero-value` | Must render font size `>= 2.75rem` (`44px`). |
| **Scene Card Reason** | `.scene-card-reason` | Must contain plain-language human-readable text without raw system variable names. |
| **Screenplay Panel** | `.fountain-script` | Must apply `font-family: var(--font-mono)` (`Courier Prime`). |
| **Script Entity Match** | `.entity-underline-match` | Must apply `text-decoration: underline dotted var(--status-color)` with `background-color: transparent`. |
| **Entity Table Name** | `.entity-table-name` | Bold title (`font-weight: 600`) with `.entity-category-subline` (`font-size: 0.75rem`, `color: var(--text-muted)`). |
| **Entity Status Badge** | `.badge` | Must pair HSL status color with explicit status text (`CLEARED`, `REVIEW RECOMMENDED`, `ACTION REQUIRED`). |
| **Entity Table Action** | `.entity-action-btn` | Right-aligned, labeled by domain meaning (e.g. *"2 uses"*, *"Ground"*, *"Compare"*). |
| **Modal Container** | `dialog`, `.modal-overlay` | When open, `document.body.style.overflow` MUST evaluate to `'hidden'`. |
| **Modal Dismissal** | Escape key, `.modal-backdrop`, `.modal-close-btn` | MUST dismiss active modal overlay and restore body overflow style to `""`. |
