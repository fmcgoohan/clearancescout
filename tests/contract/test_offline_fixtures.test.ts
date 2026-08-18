import { describe, it, expect } from 'vitest';
import {
  PARALLEL_SEARCH_FIXTURES,
  SCRIPT_PARSER_FIXTURES,
  REPLACEMENT_CONCEPT_FIXTURES,
} from '../../server/fixtures/recordReplayFixtures.js';
import { parallelSearchTool } from '../../server/tools/parallelSearchTool.js';
import { loadConfig } from '../../server/config.js';

describe('Contract: Offline Record Replay Fixtures & Mode Isolation', () => {
  describe('T003: Fixture Schema Completeness & Deterministic Offline Matching', () => {
    it('should maintain comprehensive, valid schema properties across all Parallel Search fixtures', () => {
      const fixtureKeys = Object.keys(PARALLEL_SEARCH_FIXTURES);
      expect(fixtureKeys.length).toBeGreaterThanOrEqual(5);

      for (const [key, fixture] of Object.entries(PARALLEL_SEARCH_FIXTURES)) {
        expect(fixture.queryKey).toBe(key);
        expect(fixture.sourceUrl).toMatch(/^https?:\/\//);
        expect(fixture.excerptSnippet.length).toBeGreaterThan(10);
        expect(['REGISTERED_ACTIVE', 'PENDING', 'EXPIRED', 'UNKNOWN']).toContain(fixture.registrationStatus);
        expect(fixture.corporateOwner.length).toBeGreaterThan(3);
        expect(fixture.disputePrecedents.length).toBeGreaterThan(5);
      }
    });

    it('should maintain valid multi-scene screenplay fixtures and entity extraction benchmarks', () => {
      const scriptFixture = SCRIPT_PARSER_FIXTURES['the neon horizon'];
      expect(scriptFixture).toBeDefined();
      expect(scriptFixture.scenes.length).toBeGreaterThanOrEqual(2);
      expect(scriptFixture.scenes[0].entities.length).toBeGreaterThanOrEqual(1);
      expect(scriptFixture.scenes[0].heading).toContain('INT.');
    });

    it('should maintain valid candidate brand concept fixtures for replacement generation', () => {
      const bevFixture = REPLACEMENT_CONCEPT_FIXTURES['beverage'];
      expect(bevFixture).toBeDefined();
      expect(bevFixture.candidates.length).toBeGreaterThanOrEqual(2);
      expect(bevFixture.candidates[0].candidateName).toBeDefined();
      expect(bevFixture.candidates[0].clearanceStatus).toBe('NO_ISSUE_SURFACED');
    });

    it('should return deterministic fixture citations with DEMO_FIXTURE provenance in DEMO/TEST mode', async () => {
      const result = await parallelSearchTool.searchTrademarkGrounding('Summit Cola');
      expect(result.provenance).toBe('DEMO_FIXTURE');
      expect(result.citations.length).toBeGreaterThanOrEqual(1);
      expect(result.citations[0].provenance).toBe('DEMO_FIXTURE');
      expect(result.citations[0].corporateOwner).toContain('Summit Beverage Group');
    });
  });

  describe('T005: Strict Mode Enforcement & Production Cloud Isolation', () => {
    it('should fail startup visibly when CLOUD_MODE is active but API keys are missing', () => {
      const originalEnv = { ...process.env };
      try {
        process.env.EXECUTION_MODE = 'CLOUD_MODE';
        delete process.env.GEMINI_API_KEY;
        delete process.env.PARALLEL_WEB_API_KEY;

        expect(() => loadConfig()).toThrowError(/\[ClearanceScout Configuration Error\]/);
      } finally {
        process.env = originalEnv;
      }
    });

    it('should load successfully in CLOUD_MODE when valid API keys are supplied', () => {
      const originalEnv = { ...process.env };
      try {
        process.env.EXECUTION_MODE = 'CLOUD_MODE';
        process.env.GEMINI_API_KEY = 'test-gemini-key';
        process.env.PARALLEL_WEB_API_KEY = 'test-parallel-key';

        const config = loadConfig();
        expect(config.executionMode).toBe('CLOUD_MODE');
        expect(config.geminiApiKey).toBe('test-gemini-key');
        expect(config.parallelWebApiKey).toBe('test-parallel-key');
      } finally {
        process.env = originalEnv;
      }
    });
  });

  describe('T007: Visible Provenance Labeling (DEMO_FIXTURE, FALLBACK_FIXTURE, PARALLEL_LIVE)', () => {
    it('should tag all citations in default test mode with DEMO_FIXTURE', async () => {
      const searchRes = await parallelSearchTool.searchTrademarkGrounding('Porsche');
      expect(searchRes.provenance).toBe('DEMO_FIXTURE');
      searchRes.citations.forEach((cit) => {
        expect(cit.provenance).toBe('DEMO_FIXTURE');
      });
    });
  });
});
