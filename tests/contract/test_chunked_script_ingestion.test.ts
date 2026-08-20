import { describe, it, expect, beforeEach } from 'vitest';
import { scriptParserAgent } from '../../server/agents/ScriptParserAgent.js';
import { canonicalRegistryWorkflow } from '../../server/workflows/canonicalRegistryWorkflow.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';

describe('Feature 019: Windowed Chunk Ingestion for Long Screenplays', () => {
  let projectId: string;

  beforeEach(async () => {
    const proj = await projectRepo.createProject({
      title: 'Long Screenplay Chunking Test',
      productionCompany: 'Epic Productions',
      scriptVersion: 'v1.0',
      executionMode: 'TEST_MODE',
    });
    projectId = proj.id;
  });

  it('correctly partitions and parses multi-scene screenplay without truncating scenes', async () => {
    // Generate a 20-scene script
    const sceneBlocks: string[] = [];
    for (let i = 1; i <= 20; i++) {
      sceneBlocks.push(
        `INT. LOCATION ${i} - ${i % 2 === 0 ? 'NIGHT' : 'DAY'}\n\nCharacter ${i} discusses Summit Cola and drives a Porsche.`
      );
    }
    const longScript = sceneBlocks.join('\n\n');

    const parsedScenes = await scriptParserAgent.parseScriptText(longScript, 'PLAINTEXT');
    expect(parsedScenes.length).toBe(20);
    expect(parsedScenes[0].sceneNumber).toBe(1);
    expect(parsedScenes[19].sceneNumber).toBe(20);

    const workflowResult = await canonicalRegistryWorkflow.processScriptUpload(projectId, longScript, 'PLAINTEXT');
    expect(workflowResult.scenesParsed).toBe(20);

    const persistedScenes = await sceneRepo.getScenesByProject(projectId);
    expect(persistedScenes.length).toBe(20);
    expect(persistedScenes[0].sceneNumber).toBe(1);
    expect(persistedScenes[19].sceneNumber).toBe(20);
  });
});
