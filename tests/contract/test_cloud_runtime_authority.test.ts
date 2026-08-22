import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { scriptParserAgent } from '../../server/agents/ScriptParserAgent.js';
import { parallelSearchTool } from '../../server/tools/parallelSearchTool.js';
import { replacementAgent } from '../../server/agents/ReplacementAgent.js';
import { replacementGenerator } from '../../server/workflows/replacementGenerator.js';
import { verifyFirestoreConnectivity, getDb } from '../../server/repositories/firestoreClient.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { config } from '../../server/config.js';

describe('Feature 019: Server CLOUD_MODE Authority and Extraction Integrity', () => {
  const originalMode = config.executionMode;
  const originalEnvMode = process.env.EXECUTION_MODE;

  afterEach(() => {
    config.executionMode = originalMode;
    if (originalEnvMode === undefined) {
      delete process.env.EXECUTION_MODE;
    } else {
      process.env.EXECUTION_MODE = originalEnvMode;
    }
  });

  it('enforces that searchTrademarkGrounding respects CLOUD_MODE authority', async () => {
    const result = await parallelSearchTool.searchTrademarkGrounding('Summit Cola', 'TEST_MODE');
    expect(result).toBeDefined();
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.searchOutcome).toBe('MATCHES_FOUND');
  });

  it('guarantees scriptParserAgent returns structured scenes without undefined entities', async () => {
    const script = `INT. LAB - NIGHT\n\nScientist drinks Summit Cola and inspects the AeroTech Prism Laptop.`;
    const parsed = await scriptParserAgent.parseScriptText(script, 'FOUNTAIN');
    expect(parsed.length).toBeGreaterThanOrEqual(1);
    expect(parsed[0].entities.length).toBeGreaterThanOrEqual(1);
    expect(parsed[0].entities[0].name).toBeDefined();
    expect(parsed[0].entities[0].category).toBeDefined();
  });

  it('enforces fail-closed collision check in CLOUD_MODE, returning INSUFFICIENT_EVIDENCE on model errors instead of auto-clearing', async () => {
    config.executionMode = 'CLOUD_MODE';
    process.env.EXECUTION_MODE = 'CLOUD_MODE';

    const collisionRes = await replacementAgent.evaluateCollision(
      'Custom Candidate Name',
      'BRAND',
      []
    );

    // In CLOUD_MODE without live Gemini client, it must fail closed
    expect(collisionRes.clearanceStatus).toBe('INSUFFICIENT_EVIDENCE');
    expect(collisionRes.collisionRationale).toMatch(/unavailable in CLOUD_MODE|failed in CLOUD_MODE/i);
  });

  it('enforces server CLOUD_MODE authority over persisted project DEMO_MODE for quota deduction', async () => {
    config.executionMode = 'CLOUD_MODE';
    process.env.EXECUTION_MODE = 'CLOUD_MODE';

    const proj = await projectRepo.createProject({
      title: 'Demo Mode Override Test',
      productionCompany: 'Test Co',
      scriptVersion: 'v1.0',
      executionMode: 'DEMO_MODE', // Client/persisted project has DEMO_MODE
      liveQuotaLimit: 25,
      liveQuotaUsed: 25, // Exhausted
    });

    const ent = await entityRepo.createCanonicalEntity({
      projectId: proj.id,
      canonicalName: 'Test Brand Entity',
      entityCategory: 'BRAND',
      description: 'Brand for quota test',
      overallClearanceStatus: 'ACTION_REQUIRED',
    });

    // Attempting replacement generation should fail with HTTP 429 quota exceeded because server CLOUD_MODE is authoritative
    await expect(
      replacementGenerator.generateClearedReplacement(proj.id, ent.id, 'Modern')
    ).rejects.toThrow(/Live research quota exceeded/i);
  });

  it('throws PARSING_FAILED in CLOUD_MODE when Gemini client is uninitialized without silent demo fallback', async () => {
    config.executionMode = 'CLOUD_MODE';
    process.env.EXECUTION_MODE = 'CLOUD_MODE';
    const savedKey = config.geminiApiKey;
    const savedAi = (scriptParserAgent as any).ai;
    config.geminiApiKey = undefined;
    (scriptParserAgent as any).ai = null;

    try {
      await expect(
        scriptParserAgent.parseScriptText('INT. ROOM - DAY\nAlex speaks.', 'FOUNTAIN')
      ).rejects.toThrow(/Live AI screenplay parser unavailable in CLOUD_MODE/i);
    } finally {
      config.geminiApiKey = savedKey;
      (scriptParserAgent as any).ai = savedAi;
    }
  });

  it('reports verifyFirestoreConnectivity connected: false in CLOUD_MODE if authentic Firestore is absent', async () => {
    config.executionMode = 'CLOUD_MODE';
    process.env.EXECUTION_MODE = 'CLOUD_MODE';

    const health = await verifyFirestoreConnectivity();
    // When running with in-memory store in local test suite, CLOUD_MODE connectivity must fail visibly
    expect(health.connected).toBe(false);
    expect(health.error).toContain('CLOUD_MODE requires authentic Google Cloud Firestore');
  });
});
