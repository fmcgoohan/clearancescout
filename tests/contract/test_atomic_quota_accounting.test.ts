import { describe, it, expect, beforeEach } from 'vitest';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';

describe('Feature 019: Atomic Quota Accounting (25-Call Bounding)', () => {
  let projectId: string;

  beforeEach(async () => {
    const proj = await projectRepo.createProject({
      title: 'Quota Transaction Test',
      productionCompany: 'Quota Labs',
      scriptVersion: 'v1.0',
      executionMode: 'TEST_MODE',
      liveQuotaLimit: 25,
      liveQuotaUsed: 0,
    });
    projectId = proj.id;
  });

  it('accurately tracks consumption up to 25 calls without overages', async () => {
    // Consume 20 calls
    const res1 = await projectRepo.consumeLiveQuota(projectId, 20);
    expect(res1.success).toBe(true);
    expect(res1.quota.used).toBe(20);
    expect(res1.quota.remaining).toBe(5);

    // Consume remaining 5 calls
    const res2 = await projectRepo.consumeLiveQuota(projectId, 5);
    expect(res2.success).toBe(true);
    expect(res2.quota.used).toBe(25);
    expect(res2.quota.remaining).toBe(0);

    // Attempt 1 additional call after exhaustion
    const res3 = await projectRepo.consumeLiveQuota(projectId, 1);
    expect(res3.success).toBe(false);
    expect(res3.quota.used).toBe(25);
    expect(res3.quota.remaining).toBe(0);
  });

  it('handles concurrent deduction requests atomically', async () => {
    // Launch 30 concurrent 1-unit deduction requests
    const promises = Array.from({ length: 30 }, () =>
      projectRepo.consumeLiveQuota(projectId, 1)
    );

    const results = await Promise.all(promises);
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    expect(successful.length).toBe(25);
    expect(failed.length).toBe(5);

    const finalQuota = await projectRepo.getLiveQuota(projectId);
    expect(finalQuota.used).toBe(25);
    expect(finalQuota.remaining).toBe(0);
  });
});
