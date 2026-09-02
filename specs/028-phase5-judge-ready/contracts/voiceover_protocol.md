# Contract: macOS VoiceOver Accessibility Protocol

**Contract ID**: `CTR-028-VOICEOVER`
**Status**: ACTIVE PROTOCOL
**Scope**: Manual VoiceOver Screen Reader Walkthrough on macOS (Safari / Chrome)

## 1. Compliance Standard
- DOM accessibility attributes (`role`, `aria-label`, `aria-live`, `aria-expanded`, `aria-haspopup`) establish structural semantics.
- **Mandatory Invariant**: An automated Playwright test or DOM inspection must NEVER claim a VoiceOver PASS. VoiceOver evaluation is strictly a manual human protocol.

## 2. macOS VoiceOver Verification Matrix

| Area | Component | Expected Announcement | Verification Key Sequence |
|:---|:---|:---|:---|
| **Top Navigation** | `header` | "The Neon Horizon, landmark... [PRJ-NEON-HORIZON]... Shooting Readiness 33.3%... Blocked Scenes: 2" | `Cmd+F5`, `VO+Right` |
| **Settings Popover** | `#settings-menu-button` | "Settings and Administrative Options, button, expanded... Serving Revision: clearancescout-00052-gjt" | `VO+Space`, `VO+Right` |
| **Portfolio Switch** | `[data-portfolio-card]` | "Open Production: Cyberpunk Odyssey... Switching production to Cyberpunk Odyssey" | `VO+Space` |
| **Alerts & Notifications** | `#notification-drawer-button` | "Notifications (1 unread)... Jump to task TASK-101: Create Fictional Prop Graphic: Titan Industrial Hazard Placard" | `VO+Space`, `VO+Right` |
| **Action Center Focus** | `<h4 id="task-heading-TASK-101">` | Focus lands directly on heading. Live region: "Navigated to task: Create Fictional Prop Graphic: Titan Industrial Hazard Placard" | `VO+Space` on notif |
| **Modal Focus Trap** | `ActionListModal` | Focus stays within modal boundaries; `Escape` closes modal and restores trigger focus | `Tab`, `Escape` |
| **375px Filter Tabs** | `.portfolio-filter-tabs button` | Announces full names: "All (2)", "Needs Attention (1)", "Fully Ready (1)" with zero overlapping bounds | `VO+Right` across tabs |
