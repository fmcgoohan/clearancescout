import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { projectRepo } from '../repositories/ProjectRepo.js';
import { entityRepo } from '../repositories/EntityRepo.js';
import { rightsRepo } from '../repositories/RightsRepo.js';
import { placeholderRepo } from '../repositories/PlaceholderRepo.js';
import { sceneReadinessEngine } from './sceneReadinessEngine.js';
import { canonicalRegistryWorkflow } from './canonicalRegistryWorkflow.js';
import { clearanceEvaluator } from './clearanceEvaluator.js';
import { actionNotificationRepo } from '../repositories/ActionNotificationRepo.js';
import { timelineEmitter } from '../events/timelineEmitter.js';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DemoScriptLoadOptions {
  autoEvaluate?: boolean;
  includeSampleRights?: boolean;
  includeSamplePlaceholders?: boolean;
}

export class DemoAutomationWorkflow {
  /**
   * 1-Click Demo Ingestion & Auto-Evaluation Workflow.
   * Loads "The Neon Horizon", auto-evaluates entities using deterministic DEMO_FIXTURE data,
   * attaches sample rights & placeholders, and computes scene readiness.
   */
  async loadDemoScreenplay(projectId: string, options: DemoScriptLoadOptions = {}) {
    const project = await projectRepo.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const liveCloud = config.executionMode === 'CLOUD_MODE' || project.executionMode === 'CLOUD_MODE';
    const autoEvaluate = liveCloud ? false : options.autoEvaluate !== false;
    const includeSampleRights = liveCloud ? false : options.includeSampleRights !== false;
    const includeSamplePlaceholders = liveCloud ? false : options.includeSamplePlaceholders !== false;

    // 1. Read demo screenplay text
    let scriptText = '';
    const fixturePath = path.resolve(__dirname, '../../fixtures/demo_screenplay.txt');
    if (fs.existsSync(fixturePath)) {
      scriptText = fs.readFileSync(fixturePath, 'utf-8');
    } else {
      scriptText = `TITLE: THE NEON HORIZON
AUTHOR: Entrant Studio Team
FORMAT: Feature Screenplay Excerpt (Fully Fictional Assets)

INT. PENTHOUSE WORKSPACE - NIGHT
Rain lashes against floor-to-ceiling glass overlooking the neon cityscape.
ALEX (30s) sits at a curved glass desk. He taps the illuminated keyboard of his AeroTech Prism Laptop. Data streams across the transparent display.
On the desk rests a chilled crimson can of Summit Cola. Alex pops the tab and takes a drink.
Across the room, an ambient holo-screen broadcasts an archival profile of Elena Vance delivering her landmark keynote on orbital power grids.
From the spatial audio system, the atmospheric synth-rock melody of Nocturne of the Wild plays softly in the background.

EXT. MIDTOWN SPIRE TOWER - NIGHT
Down on the wet asphalt, streetlights reflect in glistening puddles.
JORDAN (20s) steers a sleek metallic silver Veloce GT sports coupe into the private circular driveway directly beneath the soaring art-deco arches of the Midtown Spire Tower.
Jordan steps out, locking the car with a subtle chime.

INT. INDUSTRIAL SUB-LEVEL - NIGHT
Jordan walks through the reinforced maintenance corridor.
Along the heavy steel bulkhead, a weathered warning sign is bolted to the wall: a bold yellow-and-black Titan Industrial Hazard Placard flashing an active circuit warning.
Jordan inputs the security code. The hydraulic lock hisses open.`;
    }

    // 2. Parse & Ingest Screenplay
    const ingestResult = await canonicalRegistryWorkflow.processScriptUpload(projectId, scriptText, 'PLAINTEXT');

    let evaluationsCount = 0;
    let activeRightsCount = 0;
    let activePlaceholdersCount = 0;

    // 3. Auto-Evaluate Entities in DEMO_MODE
    if (autoEvaluate) {
      const entities = await entityRepo.getEntitiesByProject(projectId);
      
      // Batch evaluate each entity using DEMO_FIXTURE records
      for (const ent of entities) {
        try {
          await clearanceEvaluator.evaluateEntityClearance(projectId, ent.id);
          evaluationsCount++;
        } catch (err) {
          console.warn(`[DemoAutomationWorkflow] Evaluation warning for ${ent.canonicalName}:`, err);
        }
      }

      // 4. Attach Sample Rights Agreement (Summit Cola)
      if (includeSampleRights) {
        const summitEntity = entities.find(
          (e) => e.canonicalName.toLowerCase().includes('summit') || e.canonicalName.toLowerCase().includes('coca')
        );
        if (summitEntity) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 60);
          const expirationDate = futureDate.toISOString().split('T')[0];

          await rightsRepo.createRightsRecord(projectId, {
            canonicalEntityId: summitEntity.id,
            licensorName: 'Summit Beverage Group LLC',
            grantType: 'NON_EXCLUSIVE',
            territory: 'WORLDWIDE',
            mediaWindow: 'THEATRICAL_SVOD',
            effectiveDate: '2026-01-01',
            expirationDate,
            isPerpetual: false,
            status: 'ACTIVE',
            covenants: ['Permitted in foreground hero consumption for principal photography.'],
          });
          activeRightsCount++;
          await clearanceEvaluator.evaluateEntityClearance(projectId, summitEntity.id);
        }
      }

      // 5. Attach Sample Fictional Placeholder (AeroTech Prism Laptop)
      if (includeSamplePlaceholders) {
        const laptopEntity = entities.find(
          (e) => e.canonicalName.toLowerCase().includes('aerotech') || e.canonicalName.toLowerCase().includes('laptop')
        );
        if (laptopEntity) {
          await placeholderRepo.createPlaceholder(projectId, {
            canonicalEntityId: laptopEntity.id,
            canonicalName: laptopEntity.canonicalName,
            assetCategory: 'BRAND',
            fictionalName: 'NovaTech Zenith',
            description: 'Futuristic transparent OLED fictional laptop prop',
            clearanceTier: 'TEMP_APPROVED',
            creativeRationale: 'Cyberpunk art department prop replacement for principal photography',
            approvedBy: 'Alex Chen (Lead Designer)',
            approvedRole: 'ART_DEPARTMENT',
            approvalDate: new Date().toISOString().split('T')[0],
            isProjectWide: true,
            scopeType: 'PROJECT_WIDE',
          });
          activePlaceholdersCount++;
        }
      }

      // 6. Attach Sample Location Permit Override (Midtown Spire Tower)
      const locationEntity = entities.find(
        (e) => e.canonicalName.toLowerCase().includes('midtown') || e.canonicalName.toLowerCase().includes('spire')
      );
      if (locationEntity) {
        const { overrideRepo } = await import('../repositories/OverrideRepo.js');
        await overrideRepo.createOverride(projectId, {
          canonicalEntityId: locationEntity.id,
          status: 'NO_ISSUE_SURFACED',
          rationale: 'Commercial location filming permit and architectural exterior release executed on file.',
          counselName: 'Sarah Jenkins, Lead Production Counsel',
        });
      }

      // 6. Re-evaluate Scene Shooting Readiness
      const readinessSummary = await sceneReadinessEngine.evaluateAllScenesReadiness(projectId);

      timelineEmitter.emit(projectId, 'TOOL_CALL', `Judge-Ready Demo Screenplay Initialized: "The Neon Horizon"`, {
        projectId,
        scenesCount: ingestResult.scenesParsed,
        entitiesCount: ingestResult.canonicalEntitiesExtracted,
        evaluationsCount,
        provenance: 'DEMO_FIXTURE',
        timestamp: new Date().toISOString(),
      });

      const openActions = await actionNotificationRepo.getActionsByProject(projectId, { status: 'OPEN' });

      return {
        projectId,
        projectTitle: project.title,
        projectType: project.projectType || 'Movie',
        scenesCount: ingestResult.scenesParsed,
        entitiesCount: ingestResult.canonicalEntitiesExtracted,
        evaluationsCount,
        activeRightsCount,
        activePlaceholdersCount,
        openActionsCount: openActions.length,
        readinessSummary: {
          totalScenes: readinessSummary.totalScenes,
          overallReadinessPercentage: readinessSummary.overallReadinessPercentage,
          finalClearScenesCount: readinessSummary.finalClearScenesCount,
          workingClearScenesCount: readinessSummary.workingClearScenesCount,
          redScenesCount: readinessSummary.redScenesCount,
        },
        provenance: 'DEMO_FIXTURE' as const,
        message: 'Demo screenplay ingested and evaluated successfully with DEMO_FIXTURE provenance.',
      };
    }

    const [readinessSummary, openActions] = await Promise.all([
      sceneReadinessEngine.evaluateAllScenesReadiness(projectId),
      actionNotificationRepo.getActionsByProject(projectId, { status: 'OPEN' }),
    ]);

    return {
      projectId,
      projectTitle: project.title,
      projectType: project.projectType || 'Movie',
      scenesCount: ingestResult.scenesParsed,
      entitiesCount: ingestResult.canonicalEntitiesExtracted,
      evaluationsCount,
      activeRightsCount,
      activePlaceholdersCount,
      openActionsCount: openActions.length,
      readinessSummary: {
        totalScenes: readinessSummary.totalScenes,
        overallReadinessPercentage: readinessSummary.overallReadinessPercentage,
        finalClearScenesCount: readinessSummary.finalClearScenesCount,
        workingClearScenesCount: readinessSummary.workingClearScenesCount,
        redScenesCount: readinessSummary.redScenesCount,
      },
      provenance: 'DEMO_FIXTURE' as const,
      message: 'Demo screenplay ingested successfully.',
    };
  }
}

export const demoAutomationWorkflow = new DemoAutomationWorkflow();
