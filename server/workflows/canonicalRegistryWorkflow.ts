import { projectRepo } from '../repositories/ProjectRepo.js';
import { sceneRepo, SceneData } from '../repositories/SceneRepo.js';
import { entityRepo, CanonicalEntityData } from '../repositories/EntityRepo.js';
import { scriptParserAgent, ParsedScene } from '../agents/ScriptParserAgent.js';
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

    // Fetch existing canonical entities for deduplication ("Clear once, recognize everywhere")
    const existingEntities = await entityRepo.getEntitiesByProject(projectId);
    const entityMap = new Map<string, CanonicalEntityData>();

    for (const ent of existingEntities) {
      entityMap.set(ent.canonicalName.toLowerCase(), ent);
    }

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
        const normKey = entMention.name.toLowerCase();
        let canonicalEnt: CanonicalEntityData;

        if (entityMap.has(normKey)) {
          canonicalEnt = entityMap.get(normKey)!;
          timelineEmitter.emit(projectId, 'STATE_TRANSITION', `Matched Canonical Entity: ${canonicalEnt.canonicalName}`, {
            entityId: canonicalEnt.id,
            sceneNumber: scene.sceneNumber,
            canonicalName: canonicalEnt.canonicalName,
            category: canonicalEnt.entityCategory,
          });
        } else {
          canonicalEnt = await entityRepo.createCanonicalEntity({
            projectId,
            canonicalName: entMention.name,
            entityCategory: entMention.category,
            description: `Auto-extracted ${entMention.category} item: ${entMention.name}`,
            overallClearanceStatus: 'INSUFFICIENT_EVIDENCE',
          });
          entityMap.set(normKey, canonicalEnt);

          timelineEmitter.emit(projectId, 'STATE_TRANSITION', `Registered New Canonical Entity: ${canonicalEnt.canonicalName}`, {
            entityId: canonicalEnt.id,
            sceneNumber: scene.sceneNumber,
            canonicalName: canonicalEnt.canonicalName,
            category: canonicalEnt.entityCategory,
          });
        }

        await entityRepo.createOccurrence(projectId, {
          sceneId: scene.id,
          canonicalEntityId: canonicalEnt.id,
          scriptLineNumber: entMention.lineNumber,
          excerptText: entMention.excerptText,
          usageContext: entMention.usageContext,
        });
      }
    }

    const finalEntities = Array.from(entityMap.values());

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
