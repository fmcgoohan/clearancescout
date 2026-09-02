# macOS VoiceOver Accessibility Protocol: ClearanceScout

This document defines the manual VoiceOver verification protocol for ClearanceScout on macOS (Safari / Chrome).

> **CRITICAL RULE**: DOM `aria-*` attributes and automated testing tools provide structural accessibility, but **NEVER** constitute an automated VoiceOver pass. VoiceOver compliance must be verified manually following this protocol.

---

## 1. VoiceOver Key Commands Reference

| Action | Shortcut | Description |
|:---|:---|:---|
| **Toggle VoiceOver** | `Cmd + F5` | Starts or stops VoiceOver |
| **VO Modifier** | `Control + Option` (or `Caps Lock`) | Designated as `VO` |
| **Next Item** | `VO + Right Arrow` | Moves VO cursor to the next element |
| **Previous Item** | `VO + Left Arrow` | Moves VO cursor to the previous element |
| **Interact with Group** | `VO + Shift + Down Arrow` | Steps into a group, container, or list |
| **Stop Interacting** | `VO + Shift + Up Arrow` | Steps out of the current container |
| **Activate Element** | `VO + Space` | Presses button, activates link, toggles checkbox |
| **Open Web Rotor** | `VO + U` | Opens landmarks, headings, links, form controls |
| **Read Status / Live Region**| `VO + Shift + M` | Reads live region / context menu |

---

## 2. Test Walkthrough Scenarios

### Scenario 1: Top Navigation & Header
1. Press `Cmd + F5` to enable VoiceOver.
2. Navigate to the top navigation using `VO + Right Arrow`.
3. **Verify**:
   - Project Title ("The Neon Horizon") is announced as a landmark/heading.
   - Project Code Badge (`[PRJ-NEON-HORIZON]`) is read clearly in one continuous utterance without letter-by-letter truncation.
   - Shooting Readiness percentage ("33.3%") and Blocked Scenes count ("2") are announced with descriptive labels.
   - Settings button announces `"Settings and Administrative Options, button, collapsed"`.

### Scenario 2: Studio Production Portfolio Switching
1. Navigate to the `📊 Portfolio` button in the header and press `VO + Space`.
2. Navigate through the Executive Summary stat tiles (`VO + Right Arrow`).
   - **Verify**: Each tile announces both the metric label and value clearly (e.g., "Active Projects: 2", "Blocked Scenes: 2", "Overdue Tasks: 11", "Studio Average Readiness: 66.7%").
3. Navigate to the filter tabs.
   - **Verify**: All three tabs announce their full accessible name: `"All (2)"`, `"Needs Attention (1)"`, `"Fully Ready (1)"`.
4. Navigate to the second portfolio card ("Cyberpunk Odyssey") and press `VO + Space` on "Open Production".
   - **Verify**: Live region announces `"Switching production to Cyberpunk Odyssey"`.
   - **Verify**: Header updates to "Cyberpunk Odyssey", readiness 100%, 0 blocked scenes.

### Scenario 3: In-Product Notifications & Deep-Link Focus
1. Navigate to the `🔔 Alerts` button in the header and press `VO + Space`.
   - **Verify**: Dialog opens with `aria-label="Notifications"`.
2. Navigate into the notification item using `VO + Right Arrow`.
   - **Verify**: Notification announces: `"Jump to task TASK-101: Create Fictional Prop Graphic: Titan Industrial Hazard Placard - Clearance Coordinator mentioned @LegalCounsel on comment cmt-seed-01"`.
3. Press `VO + Space` to activate the notification.
   - **Verify**: Drawer closes, Action Center modal opens, and VoiceOver cursor lands directly on `<h4 id="task-heading-TASK-101">`.
   - **Verify**: Live region announces `"Navigated to task: Create Fictional Prop Graphic: Titan Industrial Hazard Placard"`.

### Scenario 4: Dialogs, Focus Trap & Escape Key
1. Open the Action Center modal or Settings menu.
2. Navigate forward with `Tab` or `VO + Right Arrow`.
   - **Verify**: Keyboard focus remains trapped within the dialog container.
3. Press `Escape`.
   - **Verify**: Modal closes immediately and focus restores to the triggering button.

### Scenario 5: Mobile Viewport (375px) Testing
1. Resize browser viewport to 375x812.
2. Enable VoiceOver (`Cmd + F5`).
3. Navigate across the 3 filter tabs in Portfolio view.
   - **Verify**: Visual labels show compact text ("All", "Attention", "Ready") while VoiceOver reads the full accessible name ("All (2)", "Needs Attention (1)", "Fully Ready (1)").
   - **Verify**: No collision or overlapping bounding boxes.
