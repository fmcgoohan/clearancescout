import { projectRepo } from '../repositories/ProjectRepo.js';
import { sceneRepo, SceneData } from '../repositories/SceneRepo.js';
import { entityRepo, CanonicalEntityData } from '../repositories/EntityRepo.js';
import { scriptParserAgent, ParsedScene } from '../agents/ScriptParserAgent.js';
import { entityResolutionEngine } from './entityResolutionEngine.js';
import { timelineEmitter } from '../events/timelineEmitter.js';

export interface WorkflowResult {
  projectId: string;
  scenesParsed: number;
  canonicalEntitiesExtracted: number;
  entities: CanonicalEntityData[];
}

export class CanonicalRegistryWorkflow {
  async processScriptUpload(
    projectId: string,
    scriptText: string,
    format: 'PLAINTEXT' | 'FOUNTAIN' | 'PDF' = 'PLAINTEXT'
  ): Promise<WorkflowResult> {
    timelineEmitter.emit(projectId, 'DOCUMENT_QUERY', `Parsing Script Content (${format})`, {
      scriptLength: scriptText.length,
      format,
      status: 'PARSING_SCENES',
    });

    const parsedScenes: ParsedScene[] = await scriptParserAgent.parseScriptText(scriptText, format);

    timelineEmitter.emit(projectId, 'DOCUMENT_QUERY', 'Scenes Extracted', {
      count: parsedScenes.length,
    });

    const createdScenes: SceneData[] = [];

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

        await entityRepo.createOccurrence(projectId, {
          sceneId: scene.id,
          canonicalEntityId: canonicalEnt.id,
          scriptLineNumber: entMention.lineNumber,
          excerptText: entMention.excerptText,
          usageContext: entMention.usageContext,
          surfaceMention: entMention.name,
          matchedVia: resolution.matched ? (resolution.matchRule as any) : 'EXACT_CANONICAL',
        });
      }
    }

    const finalEntities = await entityRepo.getEntitiesByProject(projectId);

    timelineEmitter.emit(projectId, 'STATE_TRANSITION', 'Script Parsing & Entity Registry Complete', {
      scenesParsed: createdScenes.length,
      canonicalEntitiesTotal: finalEntities.length,
      format,
    });

    return {
      projectId,
      scenesParsed: createdScenes.length,
      canonicalEntitiesExtracted: finalEntities.length,
      entities: finalEntities,
    };
  }
}

export const canonicalRegistryWorkflow = new CanonicalRegistryWorkflow();
