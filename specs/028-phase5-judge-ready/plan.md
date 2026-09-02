# Implementation Plan: Phase 5 - Judge-Ready Final Wrap & Submission Packaging

**Branch**: `028-phase5-judge-ready` | **Date**: 2026-09-01 | **Spec**: [`specs/028-phase5-judge-ready/spec.md`](./spec.md)

**Input**: Approved Feature Specification from [`specs/028-phase5-judge-ready/spec.md`](./spec.md)

---

## Executive Summary

Phase 5 delivers the final judge-ready hardening, verification, and packaging milestone for **ClearanceScout** ahead of the September 7, 2026 submission deadline. This plan outlines the technical approach, test suites, and compliance verifications required to guarantee flawless judge walkthroughs, independent proof of 1,000-task virtualization budgets via `tests/local_1000_task_virtualization.js`, 375px mobile filter tab balance, and full submission documentation integrity (`README.md`, `PROVENANCE.md`, `DEMO_SCRIPT.md`, `LICENSE`).

---

## Technical Context & Stack Decisions

### Reused Technical Stack & Architecture
- **Runtime & Framework**: Node.js v20 (ESM/TypeScript) backend (`server/`), React v18 + Vite frontend (`src/`).
- **Backend Isolation (Rule 1)**: All API routes, repositories, agents, storage integrations, and security middleware reside strictly in `server/`.
- **Primary Agent Model (Rule 2)**: All agent reasoning, document parsing, and clearance assessment logic uses `gemini-3.6-flash` via `@google/genai` and the Google Agent Development Kit (ADK).
- **Grounding Engine**: All live trademark and web search grounding uses the official `parallel-web` SDK wrapped as ADK tools. Prohibited frameworks (LangChain, CrewAI, AutoGen, OpenAI, Claude) are strictly barred.
- **Deterministic Math Engine (Rule 3)**: All readiness percentages, task counts, and date deltas computed mathematically prior to agent reasoning. Mapped to $1 + 9 + 1 + 0 = 11$ baseline.
- **Observable Timeline (Rule 4)**: All mutations emit observable execution events; zero raw model chain-of-thought logged or exposed.
- **Server Mode Authority (Rule 5)**: Server mode is authoritative; request payloads cannot downgrade runtime to `TEST_MODE`.

### In-Scope Implementation Areas
1. **Mobile Ergonomics (D-01)**: Balanced, proportional flex distribution on 375px viewports for Portfolio Dashboard filter tabs (`flex: 1 1 80px / 110px / 95px` with visible $\ge 8$px gap).
2. **High-Scale Virtualization Proof (D-02)**: Automated Playwright performance test (`tests/local_1000_task_virtualization.js`) proving $\le 500$ms initial render, $\le 30$ active DOM cards, and $\ge 60$ FPS scroll frame rate under 1,000 synthetic tasks.
3. **Judge Demo Flow Hardening (D-03)**: Seamless `judge-pass-2026` token authentication via Settings popover (`DemoTokenModal.tsx`) and `x-demo-token` HTTP header, zero-hybrid project switching, and notification deep-link focus traversal. URL query-param auto-auth is out of scope.
4. **Submission Package Compliance (D-04)**: Verification of live Cloud Run URL, `PROVENANCE.md`, `DEMO_SCRIPT.md`, and `LICENSE`.

---

## Constitution & Invariant Checks

*GATE: Evaluation against ClearanceScout Constitution (v1.4.0) with specific code evidence.*

- **Article 1 (Semantic Color Is Sacred)**: `src/index.css` defines `--status-cleared`, `--status-review`, and `--status-action` exclusively for clearance statuses, with cyan/indigo brand accents for non-status chrome.
- **Article 2 (Type Encodes Provenance)**: `src/index.css` applies `font-family: var(--mono)` strictly to script excerpts and project code badges, preserving sans-serif for UI chrome.
- **Article 3 (No Emoji in Chrome)**: Header, modal, and tab iconography in `src/App.tsx` and `src/components/` use inline SVG stroke components (`<FileTextIcon>`, `<XIcon>`, `<RefreshCwIcon>`).
- **Article 4 (The Hero Is the Answer)**: The Shooting Readiness Index (33.3%) and blocked status in `src/App.tsx` outrank all secondary tables with primary visual weight.
- **Article 5 (Motion Is One Moment Plus One Signal)**: CSS transitions in `src/index.css` are restricted to `transform`/`opacity` and collapse when `prefers-reduced-motion: reduce` is enabled.
- **Article 6 (Status Is Never Color Alone)**: Status pills in `src/components/PortfolioDashboard.tsx` and `src/components/ActionListModal.tsx` pair color with explicit text labels ("Cleared", "Action Required", "Review Recommended").
- **Article 7 (Every Defect Becomes Law)**: Body scrolling is locked on modal open via `useModalFocus` (`overflow: hidden`), and non-ASCII characters use safe entities per defect laws.
- **Article 8 (Append-Only Design Log)**: `DESIGN_LOG.md` maintains an append-only record of all design iterations and rationale.
- **Article 9 (Target Shipped Architecture)**: Implementation targets the real TypeScript + Express + React codebase in `server/` and `src/`.
- **Article 10 (No Regression in Project Synchronization)**: Zero-hybrid switching overlay in `src/App.tsx` synchronizes header identity, summary bar, navigation tabs, and workspace content atomically.
- **Article 11 (Accessibility Is a Release Requirement)**: WCAG 2.2 AA compliance is verified via `useModalFocus` focus trapping, `:focus-visible` outlines, and ARIA live regions (`role="status"`, `aria-live="polite"`).
- **Article 12 (Counts Have One Documented Semantic Source)**: The single authoritative data source in `server/repositories/` maintains exact counts (3 scenes, 7 items, 11 tasks).
- **Article 13 (Every Screen Exposes a Clear Next Action)**: Contextual primary recommendation card in `src/App.tsx` highlights the single highest-priority next action.
- **Article 14 (Domain Terminology Standard)**: UI chrome strictly uses standardized domain vocabulary ("Screenplay Intake", "Clearance Items", "Department Tasks", "Activity").
- **Article 15 (Responsive Behavior Is Specified)**: Responsive behavior at 375x667 and 375x812 is validated in `tests/repro_live.js` for zero horizontal overflow and sticky header non-intersection.
- **Article 16 (Streamlined Header)**: Secondary token controls and admin settings are offloaded to `SettingsPopover.tsx` to maintain a compact header.

---

## Project Structure

### Documentation (`specs/028-phase5-judge-ready/`)
```text
specs/028-phase5-judge-ready/
├── spec.md                  # Feature specification (User Stories, Requirements, Success Criteria)
├── plan.md                  # Implementation plan (this file)
├── research.md              # Phase 0 technical decisions (D-01 through D-04)
├── data-model.md            # Phase 1 data models & state transition rules
├── quickstart.md            # Phase 1 runnable validation scenarios
├── checklists/
│   └── requirements.md      # Specification quality checklist
└── contracts/
    ├── judge_walkthrough_contract.md       # Baseline & zero-hybrid switching assertions
    ├── virtualization_budget_contract.md   # 1,000-task performance & DOM clamping budget
    ├── mobile_responsive_contract.md       # 375px responsive layout & sticky header clearance
    └── submission_manifest_contract.md     # Hackathon submission compliance schema
```

### Source Code & Test Structure
```text
server/
├── index.ts                 # Express application entrypoint
├── middleware/auth.ts       # Server-side RBAC & judge token authentication
└── repositories/
    ├── ActionNotificationRepo.ts
    ├── TaskCommentRepo.ts
    └── UserNotificationRepo.ts

src/
├── App.tsx                  # Root application, zero-hybrid overlay & routing
├── index.css                # Design tokens & responsive mobile media queries
├── components/
│   ├── ActionListModal.tsx  # Task Center modal & notification deep-link target
│   ├── PortfolioDashboard.tsx # Studio Portfolio, 375px balanced filter tabs
│   ├── DemoTokenModal.tsx   # Existing judge access token input
│   └── VirtualTaskList.tsx  # 1,000-task virtualized list renderer
├── utils/apiClient.ts       # Authenticated apiFetch wrapper & token storage
└── types/collaboration.ts   # Core TypeScript interfaces

tests/
├── repro_local.js           # Local Playwright verification audit
├── repro_live.js            # Live Cloud Run Playwright verification audit
└── local_1000_task_virtualization.js # Authoritative 1,000-task virtualization benchmark
```

---

## Plan Phase & Delivery Slice Mapping

```
+-----------------------------------------------------------------------------------+
| Slice 1 (P1): Judge Demo Path & Baseline State Invariants                        |
| - Verify judge-pass-2026 token authentication via Settings modal                  |
| - Verify Neon Horizon 33.3% / 2 blocked / 3/7/11 baseline                         |
| - Verify Cyberpunk Odyssey 100% / 0 blocked isolation                             |
| - Verify zero-hybrid switching overlay & notification deep-link focus (SC-001)   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Slice 2 (P1): 1,000-Task Virtualization Performance Benchmark                      |
| - Execute authoritative suite: tests/local_1000_task_virtualization.js            |
| - Assert initial render <= 500ms under 1,000 tasks                                |
| - Assert active DOM nodes <= 30                                                   |
| - Assert scroll frame rate >= 60 FPS (SC-002)                                     |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Slice 3 (P2): Mobile 375px Filter-Tab Visual Balance & Header Ergonomics          |
| - Apply balanced flex layout for Portfolio Dashboard filter tabs at <=520px       |
| - Verify single-line project code badges & h2 title                               |
| - Verify zero horizontal overflow (scrollWidth <= 375)                            |
| - Verify sticky header clearance after scrollIntoView (SC-003)                    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Slice 4 (P1): Submission Package Checklist & Documentation Hardening              |
| - Verify README.md contains active Cloud Run live URL                             |
| - Verify PROVENANCE.md documents ADK, gemini-3.6-flash, and parallel-web         |
| - Verify DEMO_SCRIPT.md provides <= 3 min video recording walkthrough            |
| - Verify LICENSE integrity (MIT) (SC-004)                                         |
+-----------------------------------------------------------------------------------+
```

---

## Measurable Performance Budgets & Verification Methods

- **Page Initialization Budget**: Initial workspace load $\le 1.5$s (Measured via Chrome DevTools Performance Trace).
- **1,000-Task Mount Budget**: Virtualized task modal mount $\le 500$ms.
- **DOM Clamping Budget**: Active rendered cards $\le 30$ elements.
- **Scroll Frame Rate Budget**: Virtualized task list scrolling $\ge 60$ FPS ($< 1\%$ frames $> 33$ms).
- **Filter Response Budget**: Multi-parameter filter execution $\le 50$ms.
- **Mobile Viewport Budget**: Zero horizontal overflow at $375\times 667$ and $375\times 812$; card top $\ge$ header bottom after `scrollIntoView`.

---

## Complexity Tracking

| Invariant | Why Needed | Simpler Alternative Rejected Because |
|:---|:---|:---|
| **Zero-Hybrid Switching Overlay** | Prevents confusing transient state where 7 entities show with 0/0/0 tabs | Raw React state update without overlay causes 1-frame visual mismatch |
| **Client-Side Virtualization** | Supports production scale with 1,000+ tasks without browser freezing | Standard map render generates 1,000 DOM trees, causing 10 FPS jank |
| **Demo Access Token Modal** | Allows instant evaluation by judges without GCP IAM login | Requiring OAuth credentials risks evaluator lockout |
