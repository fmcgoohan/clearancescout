import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Workspace execution mode follows GET /api/health', () => {
  it('GET /api/health returns a canonical executionMode', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(['TEST_MODE', 'DEMO_MODE', 'CLOUD_MODE']).toContain(res.body.executionMode);
  });

  it('App.tsx bootstraps header mode from GET /api/health before project init', () => {
    const appCode = fs.readFileSync(path.resolve(__dirname, '../../src/App.tsx'), 'utf-8');
    expect(appCode).toContain("apiFetch('/api/health')");
    expect(appCode).toContain('bootstrapFromHealth');
    expect(appCode).toContain('serverExecutionModeRef');
    expect(appCode).toContain('Server execution mode from health endpoint');
  });

  it('WorkspacePage does not auto-evaluate DEMO_FIXTURE when executionMode is CLOUD_MODE', () => {
    const pageCode = fs.readFileSync(
      path.resolve(__dirname, '../../src/pages/WorkspacePage.tsx'),
      'utf-8'
    );
    expect(pageCode).toContain('autoEvaluate: executionMode !== \'CLOUD_MODE\'');
  });
});
