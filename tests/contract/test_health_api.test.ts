import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Health & Readiness Endpoint', () => {
  it('GET /api/health - should report healthy status, execution mode, and mask secret keys', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(['HEALTHY', 'DEGRADED']).toContain(res.body.status);
    expect(res.body).toHaveProperty('executionMode');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(typeof res.body.uptimeSeconds).toBe('number');
    expect(res.body).toHaveProperty('credentials');
    expect(res.body.credentials).toHaveProperty('geminiConfigured');
    expect(res.body.credentials).toHaveProperty('parallelWebConfigured');

    // Security invariant: Ensure raw API key values are never returned
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('AIzaSy');
    expect(bodyStr).not.toContain('sk-');
  });

  it('GET /api/health - includes firestoreConnected in CLOUD_MODE', async () => {
    const { config } = await import('../../server/config.js');
    const origMode = config.executionMode;
    const origKey = config.geminiApiKey;
    const origParallel = config.parallelWebApiKey;
    try {
      config.executionMode = 'CLOUD_MODE';
      config.geminiApiKey = 'test-gemini-key';
      config.parallelWebApiKey = 'test-parallel-key';

      const res = await request(app).get('/api/health');
      expect(res.body).toHaveProperty('executionMode', 'CLOUD_MODE');
      expect(res.body).toHaveProperty('firestoreConnected');
      expect(typeof res.body.firestoreConnected).toBe('boolean');
    } finally {
      config.executionMode = origMode;
      config.geminiApiKey = origKey;
      config.parallelWebApiKey = origParallel;
    }
  });
});
