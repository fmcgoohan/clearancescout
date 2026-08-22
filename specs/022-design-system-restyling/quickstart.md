# Quickstart Validation Guide: Design System Restyling (Constitution v1.1.0)

This guide documents the verification commands and rendered browser test sequence to prove compliance with Constitution v1.1.0 Articles 1 through 8.

## 1. Automated Contract & Static Verification

Run static checks and unit contract test suite:

```bash
# 1. Audit codebase for raw hex strings in src/ (must return 0 component matches)
grep -rn "#[0-9a-fA-F]\{3,6\}" src/components src/pages

# 2. Run automated test suite
npm test

# 3. Verify clean production build
npm run build
```

## 2. Rendered Live Browser QA Validation

Execute live Playwright validation verifying visual hierarchy, SVG icons, body scroll locking, and status text pairing:

```bash
# Run live design system validation script against Cloud Run
node tests/live_design_system_validation.js
```

### Verification Criteria
1. **Shooting Readiness Hero**: Verified visible at top of workspace with primary metric styling and status label.
2. **SVG Iconography**: Verified 100% of chrome icons render as inline `<svg>` elements with zero emoji characters in headers, buttons, or modal titles.
3. **Modal Body Scroll Lock**: Verified `document.body` receives `overflow: hidden` when `ProductionDashboardModal`, `ScriptUploadModal`, or `ActionListModal` opens, and restores to default on close.
4. **Status Text Pairing**: Verified all green/amber/red status badges contain explicit text labels alongside color.
5. **Design Log Audit**: Verified [`DESIGN_LOG.md`](../../DESIGN_LOG.md) contains an append-only entry recording changes, rationale, and test results.
