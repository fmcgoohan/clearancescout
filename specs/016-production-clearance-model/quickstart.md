# Quickstart Validation Guide: Production Clearance Operating Model (Phase 1)

**Feature**: `specs/016-production-clearance-model` | **Date**: 2026-08-19

---

## Scenario 1: Create and Inspect Movie, TV Show, and Commercial Projects

1. Start application:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:5173`.
3. Click "Switch Project" or "New Production".
4. Create three projects:
   - **Movie**: "Cyberfall", Type: `Movie`
   - **TV Show**: "The Silicon Detective", Type: `TV Show`
   - **Commercial**: "Glow Energy Drink Spot", Type: `Commercial`
5. Verify that each project displays its designated type badge (`🎬 Movie`, `📺 TV Show`, `📢 Commercial`) in the projects list and workspace header.

---

## Scenario 2: Project Listing API Verification

1. Execute `GET /api/projects`:
   ```bash
   curl -s http://localhost:3000/api/projects
   ```
2. Verify all created projects are returned with `projectType` and clearance summaries.
