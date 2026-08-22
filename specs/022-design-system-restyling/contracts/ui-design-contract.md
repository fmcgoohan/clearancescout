# UI Design System Contract: Constitution v1.1.0

This contract specifies non-negotiable visual, typographic, and behavior invariants for ClearanceScout UI components.

## 1. Color System Contract (Article 1)

- **Green**: `CLEARED`, `WORKING_CLEAR`
  - Must use `--color-status-green`, `--bg-status-green`, `--border-status-green`.
- **Amber**: `REVIEW_RECOMMENDED`, `NEEDS_REVIEW`
  - Must use `--color-status-amber`, `--bg-status-amber`, `--border-status-amber`.
- **Red**: `BLOCKS_SHOOTING`, `ACTION_REQUIRED`, `HIGH_RISK`
  - Must use `--color-status-red`, `--bg-status-red`, `--border-status-red`.
- **Gray/Blue**: `INSUFFICIENT_EVIDENCE`, `RESEARCH_REQUIRED`
  - Must use `--color-brand-muted` or `--color-brand-primary`.
- **Prohibition**: No component JSX/TSX or localized CSS file may contain raw hex values (e.g., `#ffffff`, `#10b981`, `#ef4444`). All colors must resolve via `var(--...)`.

## 2. Typography Contract (Article 2)

- **UI Chrome**: All buttons, badges, navigation headers, table headers, table content, form labels, and modal titles MUST use `--font-sans`.
- **Text Artifacts**: Only `.fountain-script` (screenplay script text viewer) and `.json-log` (raw event payload drawer) MAY use `--font-mono`.
- **Prohibition**: Monospace fonts are strictly forbidden in UI chrome, action buttons, filter tags, or status indicators.

## 3. Iconography Contract (Article 3)

- All UI icons in headers, buttons, modal titles, and navigation controls MUST render as SVG elements with `stroke="currentColor"`.
- **Prohibition**: Emoji characters (`🎬`, `📋`, `🔁`, `🎬`, `✓`, `✕`, `⏹`) MUST NOT appear in UI chrome.

## 4. Hero Index & Blocked Hierarchy Contract (Article 4)

- **Hero Index**: The Shooting Readiness Index must render at `--font-size-4xl` (3rem) with bold weight and explicit status description in the primary header and Operations Dashboard.
- **Why-Blocked Reasons**: Every scene with `BLOCKS_SHOOTING` status must render an alert card with `--bg-status-red` detailing exact why-blocked items before listing occurrences or entities.

## 5. Body Scroll Locking Contract (Article 7)

- Opening any of the 13 modal overlays (`ScriptUploadModal`, `DemoTokenModal`, `ProductionDashboardModal`, `ActionListModal`, `ProjectListModal`, `CitationDrawer`, `RightsModal`, `PlaceholderManagerModal`, `ComparisonModal`, `EntityDetailModal`, `ItemEditModal`, `BinderExportModal`, `ReplacementCardModal`) MUST invoke `useBodyScrollLock(isOpen)` to lock background body scrolling.
- Closing the overlay MUST restore body scrolling (`document.body.style.overflow = ''`).
