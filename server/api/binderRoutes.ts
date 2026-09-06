import { Router, Request, Response } from 'express';
import { binderExportWorkflow } from '../workflows/binderExportWorkflow.js';
import { binderRepo } from '../repositories/BinderRepo.js';

import { projectRepo } from '../repositories/ProjectRepo.js';
import { dashboardEngine } from '../workflows/dashboardEngine.js';

export const binderRouter = Router();

// Preflight Readiness Check for Binder Export
binderRouter.get('/projects/:id/binder/preflight', async (req: Request, res: Response, next: any) => {
  try {
    const projectId = req.params.id;

    const proj = await projectRepo.getProject(projectId);
    if (!proj) {
      return res.status(404).json({
        ready: false,
        canExport: false,
        reason: `Project ${projectId} not found.`,
      });
    }

    const dashboard = await dashboardEngine.getDashboardSummary(projectId);
    const totalScenes = dashboard.kpis?.totalScenes || 0;

    if (totalScenes === 0) {
      return res.json({
        ready: false,
        canExport: false,
        totalScenes: 0,
        blockerCount: 0,
        warningCount: 0,
        totalClearanceItems: 0,
        reason: 'No screenplay has been ingested yet for this project. Please upload a script before exporting.',
      });
    }

    const blockerCount = dashboard.kpis?.redScenes || 0;
    const warningCount = dashboard.kpis?.workingClearScenes || 0;
    const totalClearanceItems = dashboard.kpis?.totalEntities || 0;

    return res.json({
      ready: true,
      canExport: true,
      totalScenes,
      blockerCount,
      warningCount,
      totalClearanceItems,
      estimatedSize: `${(totalScenes * 1.5 + totalClearanceItems * 0.8).toFixed(1)} KB`,
    });
  } catch (err) {
    next(err);
  }
});

// Export / Compile Project Clearance Binder (Supports both GET and POST)
const handleBinderExport = async (req: Request, res: Response, next: any) => {
  try {
    const projectId = req.params.id;
    const binder = await binderExportWorkflow.compileAndExportBinder(projectId);
    return res.json(binder);
  } catch (err) {
    next(err);
  }
};

binderRouter.get('/projects/:id/binder/export', handleBinderExport);
binderRouter.post('/projects/:id/binder/export', handleBinderExport);

// Get Latest Exported Binder or compile on-demand
binderRouter.get('/projects/:id/binder', async (req: Request, res: Response, next) => {
  try {
    const projectId = req.params.id;
    let binder = await binderRepo.getLatestBinderExport(projectId);
    if (!binder) {
      binder = await binderExportWorkflow.compileAndExportBinder(projectId);
    }
    return res.json(binder);
  } catch (err) {
    next(err);
  }
});

// Get Latest Exported Binder
binderRouter.get('/projects/:id/binder/latest', async (req: Request, res: Response, next) => {
  try {
    const projectId = req.params.id;
    const binder = await binderRepo.getLatestBinderExport(projectId);
    if (!binder) {
      return res.status(404).json({ error: 'No exported binder found for project' });
    }
    return res.json(binder);
  } catch (err) {
    next(err);
  }
});

// Download Formatted Markdown Clearance Binder
binderRouter.get('/projects/:id/binder/markdown', async (req: Request, res: Response, next) => {
  try {
    const projectId = req.params.id;
    let binder = await binderRepo.getLatestBinderExport(projectId);
    if (!binder) {
      binder = await binderExportWorkflow.compileAndExportBinder(projectId);
    }

    const sanitizedTitle = (binder.projectSummary?.title || 'Untitled_Project').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const md = generateMarkdownBinder(binder);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Clearance_Binder_${sanitizedTitle}_${binder.id}.md"`);
    return res.send(md);
  } catch (err) {
    next(err);
  }
});

function generateMarkdownBinder(binder: any): string {
  const p = binder.projectSummary;
  const now = binder.exportedAt;

  return `# Production Legal Clearance Binder
**Project Title**: ${p.title}
**Project ID**: ${binder.projectId}
**Project Type**: ${p.projectType || 'Movie'}
**Production Company**: ${p.productionCompany}
**Script Version**: ${p.scriptVersion}
**Export Timestamp**: ${now}
**Cryptographic Integrity Digest (SHA-256)**: \`${binder.integrityDigest}\`

---

## 1. Executive Clearance & Shooting Readiness Summary

| Metric | Value |
|:---|:---|
| **Total Scenes** | ${p.totalScenes} |
| **Shoot Readiness Index** | **${p.overallReadinessPercentage}%** |
| **Final Clear Scenes** | ${p.finalClearScenes} |
| **Working Clear Scenes** | ${p.workingClearScenes} |
| **Red / Blocker Scenes** | ${p.redScenes} |
| **Total Canonical Entities** | ${p.totalEntities} |
| **Active Rights Agreements** | ${p.activeRightsCount} |
| **Active Placeholders** | ${p.activePlaceholdersCount} |
| **Unresolved Actions** | ${p.openActionsCount} |
| **Signed Counsel Overrides** | ${p.overridesCount} |

---

## 2. Scene-by-Scene Shooting Readiness Schedule

| Scene # | Heading | Readiness Status | Blockers | Working | Total Items |
|:---|:---|:---:|:---:|:---:|:---:|
${(binder.sceneReadinessSchedule || [])
  .map(
    (s: any) =>
      `| Scene ${s.sceneNumber} | ${s.heading} | **${s.status}** | ${s.blockersCount} | ${s.workingClearCount} | ${s.totalOccurrences} |`
  )
  .join('\n')}

---

## 3. Contractual Rights & Restrictions Catalog

| Licensor | Grant Type | Territory | Media Window | Expiration | Perpetual |
|:---|:---|:---|:---|:---|:---:|
${(binder.rightsAgreements || [])
  .map(
    (r: any) =>
      `| ${r.licensorName} | ${r.grantType} | ${r.territory} | ${r.mediaWindow} | ${r.expirationDate || 'N/A'} | ${r.isPerpetual ? 'Yes' : 'No'} |`
  )
  .join('\n')}

---

## 4. Generalized Replacements & Fictional Placeholders

| Fictional Replacement | Original Entity | Category | Clearance Tier | Approved By |
|:---|:---|:---|:---:|:---|
${(binder.placeholders || [])
  .map(
    (ph: any) =>
      `| **${ph.fictionalName}** | ${ph.canonicalName} | ${ph.assetCategory} | \`${ph.clearanceTier}\` | ${ph.approvedBy} |`
  )
  .join('\n')}

---

## 5. Unresolved Department Actions & Open To-Dos

| Department | Priority | Title | Description | Status |
|:---|:---:|:---|:---|:---:|
${(binder.unresolvedActions || [])
  .map(
    (a: any) =>
      `| ${a.targetDepartment} | **${a.priority}** | ${a.title} | ${a.description} | ${a.status} |`
  )
  .join('\n')}

---

## 6. Canonical Entity & Research Provenance Registry

| Entity | Category | Status | Dominant Provenance | Citations Count |
|:---|:---|:---:|:---:|:---:|
${(binder.canonicalEntities || [])
  .map(
    (e: any) =>
      `| ${e.canonicalName} | ${e.entityCategory} | ${e.overallClearanceStatus} | ${binder.provenanceSummary?.dominantProvenance || 'DEMO_FIXTURE'} | ${(e.citations || []).length} |`
  )
  .join('\n')}

---

## 7. Mandatory Legal Notice
> **Notice**: *${binder.disclaimer}*
`;
}

