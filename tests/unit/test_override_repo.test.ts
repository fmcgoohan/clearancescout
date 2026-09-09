import { describe, it, expect, beforeEach } from 'vitest';
import { overrideRepo } from '../../server/repositories/OverrideRepo.js';
import { resetDb } from '../../server/repositories/firestoreClient.js';

describe('Unit: OverrideRepo counselRole default handling', () => {
  beforeEach(() => {
    resetDb();
  });

  it('should default counselRole to "Clearance Counsel" when counselRole is omitted in create', async () => {
    const projectId = 'test-proj-override-default';
    const entityId = 'ent-test-01';

    // Call create with NO counselRole
    const created = await overrideRepo.create(projectId, {
      canonicalEntityId: entityId,
      sceneId: 'scene-1',
      status: 'NO_ISSUE_SURFACED',
      rationale: 'Location permit executed on file',
      counselName: 'Sarah Jenkins',
    });

    expect(created).toBeDefined();
    expect(created.counselRole).toBe('Clearance Counsel');

    // Fetch stored document from database and assert stored counselRole === 'Clearance Counsel'
    const storedOverrides = await overrideRepo.getOverridesByEntity(projectId, entityId);
    expect(storedOverrides.length).toBe(1);
    const storedDoc = storedOverrides[0];
    expect(storedDoc.counselRole).toBe('Clearance Counsel');
    expect(storedDoc.counselName).toBe('Sarah Jenkins');
    expect(storedDoc.rationale).toBe('Location permit executed on file');
  });

  it('should preserve provided counselRole when specified', async () => {
    const projectId = 'test-proj-override-specified';
    const entityId = 'ent-test-02';

    const created = await overrideRepo.create(projectId, {
      canonicalEntityId: entityId,
      status: 'NO_ISSUE_SURFACED',
      rationale: 'Partner review signoff',
      counselName: 'Jane Doe',
      counselRole: 'Senior Vice President, Legal',
    });

    expect(created.counselRole).toBe('Senior Vice President, Legal');

    const storedOverrides = await overrideRepo.getOverridesByEntity(projectId, entityId);
    expect(storedOverrides[0].counselRole).toBe('Senior Vice President, Legal');
  });
});
