# Quickstart Verification Guide: Feature 024 UX Redesign

**Feature**: `024-ux-redesign` | **Spec**: [`spec.md`](spec.md) | **Plan**: [`plan.md`](plan.md)

---

## 1. Run Automated Tests

To run the full suite of unit, contract, and accessibility tests:

```bash
npm test
```

Expected result: All 91 test files and 224+ tests pass.

---

## 2. Run Static Design System & Constitution Gate

To run the static verification script enforcing Constitution compliance (tokens, iconography, font confinement, HTML entities):

```bash
./scripts/spec-check.sh
```

Expected result:
```text
=== ClearanceScout Spec-Check Static Gate ===
[1/5] Checking raw hex colors in src/ components... PASS
[2/5] Checking raw emojis in src/ components... PASS
[3/5] Checking font-family confinement... PASS
[4/5] Checking non-ASCII typographic characters... PASS
[5/5] Checking modal body scroll lock implementation... PASS
🎉 ALL SPEC-CHECK STATIC GAUNTLET CHECKS PASSED PERFECTLY!
```

---

## 3. Run Playwright E2E Live Browser Validation

To launch E2E browser audit testing against local preview or live Cloud Run environment:

```bash
# Local preview validation
npx vite build && npx vite preview --port 3000 &
TARGET_URL=http://localhost:3000 node tests/live_design_system_validation.js

# Production Cloud Run validation
TARGET_URL=https://clearancescout-415588196771.us-central1.run.app node tests/live_design_system_validation.js
```

Expected output:
```text
✓ App loaded successfully
✓ Chrome Font Family: Archivo, system-ui, -apple-system, sans-serif
✓ Contextual Recommended Action Card rendered
✓ Clicked 1-Click Demo button
✓ Clicked "Load Bundled Demo Screenplay" inside modal
✓ Hero Readiness Index Card visible: true
✓ Zero legacy chrome emojis found in page text!
✓ Rendered SVG Icons count: 12
✓ Modal open body overflow style: "hidden"
✓ Modal closed body overflow style restored: ""
🎉 ALL LIVE DESIGN SYSTEM VALIDATIONS PASSED PERFECTLY!
```
