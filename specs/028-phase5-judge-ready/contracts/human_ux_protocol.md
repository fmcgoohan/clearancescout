# Contract: Human UX Protocol

**Contract ID**: `CTR-028-HUMAN-UX`
**Status**: ACTIVE PROTOCOL
**Scope**: 3 Core Production Workflow Goals for Legal Clearance Coordinators & Producers

## Three Production Goals

### Goal 1: Identify the Next Clearance Blocker
- **Actor**: Production Legal Counsel / Clearance Coordinator
- **Action**: Look at the top workspace summary header or open the Portfolio dashboard.
- **Observable Result**:
  - In Workspace: Header displays `Shooting Readiness: 33.3%` and `Red (Blocked): 2` for *The Neon Horizon*.
  - In Portfolio: Executive summary displays `ACTIVE PROJECTS 2`, `BLOCKED SCENES 2`, `OVERDUE TASKS 11`.
  - The blocker list immediately identifies Scene 1 (`Titan Industrial Hazard Placard`) and Scene 3 (`Neon Cola Billboard`) as blocking production.

### Goal 2: Open and Resolve the Blocker Task
- **Actor**: Clearance Coordinator / Art Department Lead
- **Action**:
  - Click on the `🔔 Alerts` drawer $\to$ click `Mentioned on Task TASK-101: Create Fictional Prop Graphic: Titan Industrial Hazard Placard`, OR
  - Click `Department Tasks (11 Open)` in Workspace $\to$ select `TASK-101`.
- **Observable Result**:
  - Action Center modal opens with task details, priority `HIGH`, assigned department `ART_DEPT`.
  - Focus lands directly on `<h4 id="task-heading-TASK-101">`.
  - User can update status to `RESOLVED` or attach replacement artwork.

### Goal 3: Assess Readiness and Export Clearance Binder
- **Actor**: Studio Production Manager / Executive Producer
- **Action**:
  - Check project shooting readiness percentage after task resolution.
  - Click `Export Clearance Binder` (or trigger `/api/binder/export`).
- **Observable Result**:
  - Legal clearance packet generates with full evidentiary chain-of-custody, citations from Parallel Search, and legal counsel audit log.
