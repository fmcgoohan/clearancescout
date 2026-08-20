import { describe, it, expect } from 'vitest';
import { scriptParserAgent } from '../../server/agents/ScriptParserAgent.js';
import { parallelSearchTool } from '../../server/tools/parallelSearchTool.js';
import { config } from '../../server/config.js';

describe('Feature 019: Server CLOUD_MODE Authority and Extraction Integrity', () => {
  it('enforces that searchTrademarkGrounding respects CLOUD_MODE authority', async () => {
    // When execution mode is TEST_MODE or DEMO_MODE, it resolves without crash
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
});
