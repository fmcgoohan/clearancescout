import { projectRepo } from '../repositories/ProjectRepo.js';
import { sceneRepo, SceneData } from '../repositories/SceneRepo.js';
import { entityRepo, CanonicalEntityData } from '../repositories/EntityRepo.js';
import { actionNotificationRepo } from '../repositories/ActionNotificationRepo.js';
import { scriptParserAgent, ParsedScene } from '../agents/ScriptParserAgent.js';
import { entityResolutionEngine } from './entityResolutionEngine.js';
import { clearanceEvaluator } from './clearanceEvaluator.js';
import { timelineEmitter } from '../events/timelineEmitter.js';

export interface WorkflowResult {
  projectId: string;
  scenesParsed: number;
  canonicalEntitiesExtracted: number;
  entities: CanonicalEntityData[];
  snapshot?: any;
}

export class CanonicalRegistryWorkflow {
  async processScriptUpload(
    projectId: string,
    scriptText: string,
    format: 'PLAINTEXT' | 'FOUNTAIN' | 'PDF' = 'PLAINTEXT',
    options?: { isBundledDemo?: boolean }
  ): Promise<WorkflowResult> {
    const project = await projectRepo.getProject(projectId);
    const executionMode = project?.executionMode;

    timelineEmitter.emit(projectId, 'DOCUMENT_QUERY', `Parsing Script Content (${format})`, {
      scriptLength: scriptText.length,
      format,
      status: 'PARSING_SCENES',
    });

    const parsedScenes: ParsedScene[] = await scriptParserAgent.parseScriptText(scriptText, format);
    if (!parsedScenes || parsedScenes.length === 0) {
      const err: any = new Error('No scenes could be parsed from the provided screenplay text.');
      err.code = 'PARSING_FAILED';
      throw err;
    }

    timelineEmitter.emit(projectId, 'DOCUMENT_QUERY', 'Scenes Extracted', {
      count: parsedScenes.length,
    });

    // Capture previous active state before staging new draft
    const previousScenes = await sceneRepo.getScenesByProject(projectId);
    const isReplacement = previousScenes.length > 0;

    const createdScenes: SceneData[] = [];
    const createdOccurrences: any[] = [];
    const newlyCreatedEntityIds: string[] = [];

    try {
      // --- Phase 1: Staged Building ---
      for (const pScene of parsedScenes) {
        const scene = await sceneRepo.createScene({
          projectId,
          sceneNumber: pScene.sceneNumber,
          heading: pScene.heading,
          locationType: pScene.locationType,
          timeOfDay: pScene.timeOfDay,
          rawText: pScene.rawText,
          characterActionSummary: pScene.characterActionSummary,
        });
        createdScenes.push(scene);

        for (const entMention of pScene.entities) {
          // Multi-stage Entity Resolution (Phase 3)
          const resolution = await entityResolutionEngine.resolveEntityMention(
            projectId,
            entMention.name,
            entMention.category
          );

          let canonicalEnt: CanonicalEntityData;

          if (resolution.matched && resolution.canonicalEntityId) {
            const matched = await entityRepo.getEntityById(projectId, resolution.canonicalEntityId);
            canonicalEnt = matched!;
            if (entMention.name.toLowerCase() !== canonicalEnt.canonicalName.toLowerCase()) {
              await entityRepo.addAlias(projectId, canonicalEnt.id, entMention.name);
            }
            timelineEmitter.emit(
              projectId,
              'STATE_TRANSITION',
              `Resolved Entity Mention "${entMention.name}" -> ${canonicalEnt.canonicalName} (${resolution.matchRule})`,
              {
                entityId: canonicalEnt.id,
                sceneNumber: scene.sceneNumber,
                canonicalName: canonicalEnt.canonicalName,
                matchRule: resolution.matchRule,
                confidence: resolution.confidence,
                matchedAlias: resolution.matchedAlias,
              }
            );
          } else {
            canonicalEnt = await entityRepo.createCanonicalEntity({
              projectId,
              canonicalName: entMention.name,
              entityCategory: entMention.category,
              description: `Auto-extracted ${entMention.category} item: ${entMention.name}`,
              overallClearanceStatus: 'INSUFFICIENT_EVIDENCE',
              aliases: [],
            });
            newlyCreatedEntityIds.push(canonicalEnt.id);

            timelineEmitter.emit(
              projectId,
              'STATE_TRANSITION',
              `Registered New Canonical Entity: ${canonicalEnt.canonicalName}`,
              {
                entityId: canonicalEnt.id,
                sceneNumber: scene.sceneNumber,
                canonicalName: canonicalEnt.canonicalName,
                category: canonicalEnt.entityCategory,
              }
            );
          }

          const occ = await entityRepo.createOccurrence(projectId, {
            sceneId: scene.id,
            canonicalEntityId: canonicalEnt.id,
            scriptLineNumber: entMention.lineNumber,
            excerptText: entMention.excerptText,
            usageContext: entMention.usageContext,
            surfaceMention: entMention.name,
            matchedVia: resolution.matched ? (resolution.matchRule as any) : 'EXACT_CANONICAL',
          });
          createdOccurrences.push(occ);
        }
      }

      // Automatically reconcile any duplicate generic canonical variants
      await entityRepo.reconcileDuplicateCanonicalEntities(projectId);

      // --- Phase 2: Pre-Activation Invariant Checks ---
      // Check 1: activeSceneCount == parsedSceneCount
      if (createdScenes.length !== parsedScenes.length) {
        throw new Error(`[VALIDATION_FAILED] Staged scenes count (${createdScenes.length}) does not match parsed scenes (${parsedScenes.length})`);
      }

      // Check 2: Every new occurrence references an existing new scene AND an existing canonical entity
      const newSceneIds = new Set(createdScenes.map((s) => s.id));
      const allEntitiesInProject = await entityRepo.getEntitiesByProject(projectId, { includeArchived: true });
      const entityMap = new Map(allEntitiesInProject.map((e) => [e.id, e]));

      for (const occ of createdOccurrences) {
        if (!newSceneIds.has(occ.sceneId)) {
          throw new Error(`[VALIDATION_FAILED] Occurrence ${occ.id} references invalid scene ${occ.sceneId}`);
        }
        if (!entityMap.has(occ.canonicalEntityId)) {
          throw new Error(`[VALIDATION_FAILED] Occurrence ${occ.id} references invalid entity ${occ.canonicalEntityId}`);
        }
      }

      // Check 3: Check bundled demo expected entities count (7 items)
      if (options?.isBundledDemo) {
        const activeEntitiesBeforeCommit = await entityRepo.getEntitiesByProject(projectId);
        if (activeEntitiesBeforeCommit.length < 7) {
          throw new Error(`[VALIDATION_FAILED] Bundled demo expected 7 clearance entities, but found ${activeEntitiesBeforeCommit.length}`);
        }
      }

      // --- Phase 3: Activation & Atomic Commit ---
      if (isReplacement) {
        const previousSceneIds = new Set(previousScenes.map((s) => s.id));
        for (const prevScene of previousScenes) {
          await sceneRepo.deleteScene(projectId, prevScene.id);
        }

        // Cancel orphaned action items from previous draft
        try {
          const openActions = await actionNotificationRepo.getActionsByProject(projectId);
          for (const act of openActions) {
            if (act.status === 'OPEN' || act.status === 'IN_PROGRESS') {
              if (!act.sceneId || previousSceneIds.has(act.sceneId)) {
                await actionNotificationRepo.updateActionStatus(projectId, act.id, 'RESOLVED', 'SCRIPT_REVISION_SUPERSEDED');
              }
            }
          }
        } catch (err) {
          console.warn('Draft replacement action cleanup warning:', err);
        }

        // Invalidate grounding caches
        clearanceEvaluator.invalidateGroundingCache(projectId);
      }

      // Action Invariant (T060): Dispatch required OPEN actions for all current ACTION_REQUIRED / REVIEW_RECOMMENDED items
      const { actionDispatcher } = await import('./actionDispatcher.js');
      const latestActiveEntities = await entityRepo.getEntitiesByProject(projectId);
      const latestOccurrences = await entityRepo.getAllOccurrences(projectId);

      for (const ent of latestActiveEntities) {
        if (ent.overallClearanceStatus === 'ACTION_REQUIRED' || ent.overallClearanceStatus === 'REVIEW_RECOMMENDED') {
          const entOccs = latestOccurrences.filter((o) => o.canonicalEntityId === ent.id);
          for (const occ of entOccs) {
            await actionDispatcher.dispatchOccurrenceAction(projectId, occ, ent);
          }
        }
      }

      // Re-evaluate Scene Shooting Readiness
      const { sceneReadinessEngine } = await import('./sceneReadinessEngine.js');
      await sceneReadinessEngine.evaluateAllScenesReadiness(projectId);

      const finalEntities = await entityRepo.getEntitiesByProject(projectId);
      const snapshot = await projectRepo.getProjectSnapshot(projectId);

      timelineEmitter.emit(projectId, 'STATE_TRANSITION', isReplacement ? 'Screenplay Draft Replaced & Activated' : 'Script Parsing & Entity Registry Complete', {
        scenesParsed: createdScenes.length,
        canonicalEntitiesTotal: finalEntities.length,
        format,
        isReplacement,
      });

      return {
        projectId,
        scenesParsed: createdScenes.length,
        canonicalEntitiesExtracted: finalEntities.length,
        entities: finalEntities,
        snapshot: snapshot || undefined,
      };
    } catch (err) {
      // Rollback staged draft on failure: previous active snapshot remains untouched
      console.error('[CanonicalRegistryWorkflow] Draft replacement validation failed. Rolling back staged draft:', err);
      for (const sc of createdScenes) {
        try {
          await sceneRepo.deleteScene(projectId, sc.id);
        } catch {}
      }
      for (const entId of newlyCreatedEntityIds) {
        try {
          await entityRepo.deleteCanonicalEntity(projectId, entId);
        } catch {}
      }
      throw err;
    }
  }
}

export const canonicalRegistryWorkflow = new CanonicalRegistryWorkflow();
