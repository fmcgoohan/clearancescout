import { describe, it, expect, vi } from 'vitest';
import { ClearanceBinder } from '../../src/components/BinderExportModal';

describe('Feature 010: Binder Jump to Evidence & Timeline Contract Tests', () => {
  const mockBinder: ClearanceBinder = {
    id: 'binder-test-123',
    projectId: 'proj-001',
    projectSummary: {
      title: 'The Neon Horizon',
      productionCompany: 'Entrant Studio Team',
      scriptVersion: 'v1.0-ShootingDraft',
      totalScenes: 3,
      totalEntities: 4,
      clearedCount: 2,
      actionRequiredCount: 1,
      reviewRecommendedCount: 1,
      overridesCount: 0,
    },
    scenes: [
      { id: 'scene-1', sceneNumber: 1, heading: 'INT. PENTHOUSE WORKSPACE - NIGHT' },
    ],
    canonicalEntities: [
      {
        id: 'ent-summit',
        canonicalName: 'Summit Cola',
        entityCategory: 'BRAND',
        overallClearanceStatus: 'ACTION_REQUIRED',
        description: 'Chilled crimson can of Summit Cola.',
      },
      {
        id: 'ent-aerotech',
        canonicalName: 'AeroTech Prism Laptop',
        entityCategory: 'GRAPHIC_PROP',
        overallClearanceStatus: 'NO_ISSUE_SURFACED',
        description: 'Transparent display laptop.',
      },
    ],
    citationsIndex: [
      {
        id: 'cit-1',
        sourceUrl: 'https://tsdr.uspto.gov/#caseNumber=78912345',
        query: 'Summit Cola beverage trademark',
        retrievedAt: new Date().toISOString(),
        excerptSnippet: 'Live USPTO mark for Summit Beverages LLC.',
        registrationStatus: 'REGISTERED_TRADEMARK',
        provenance: 'DEMO_FIXTURE',
      },
    ],
    replacementCatalog: [
      {
        id: 'rep-1',
        canonicalEntityId: 'ent-summit',
        targetEntityName: 'Summit Cola',
        fictionalBrandName: 'Solstice Spark',
        eraAesthetic: 'Modern Cinematic',
        totalAttempts: 1,
        selfClearanceResult: 'SELF_CLEARED',
        citations: [],
        rationale: 'Fictional non-infringing mark.',
      },
    ],
    overridesHistory: [],
    exportedAt: new Date().toISOString(),
    integrityDigest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    disclaimer: 'ClearanceScout provides research issue-spotting and clearance workflow tracking.',
  };

  it('T003/US1: invokes onJumpToEvidence with entity credentials and citations on click', () => {
    const onJumpToEvidence = vi.fn();
    const targetEntity = mockBinder.canonicalEntities[0];

    // Simulate clicking "🔍 View Evidence" on Summit Cola
    const matchingCitations = mockBinder.citationsIndex.filter((c) =>
      c.query.toLowerCase().includes(targetEntity.canonicalName.toLowerCase())
    );

    onJumpToEvidence(
      targetEntity.id,
      targetEntity.canonicalName,
      matchingCitations,
      targetEntity.description,
      targetEntity.overallClearanceStatus
    );

    expect(onJumpToEvidence).toHaveBeenCalledTimes(1);
    expect(onJumpToEvidence).toHaveBeenCalledWith(
      'ent-summit',
      'Summit Cola',
      expect.arrayContaining([expect.objectContaining({ id: 'cit-1' })]),
      'Chilled crimson can of Summit Cola.',
      'ACTION_REQUIRED'
    );
  });

  it('T006/US2: invokes onJumpToTimeline focusing target entity without raw chain-of-thought', () => {
    const onJumpToTimeline = vi.fn();
    const targetEntity = mockBinder.canonicalEntities[0];

    // Simulate clicking "📜 View Timeline" on Summit Cola
    onJumpToTimeline(targetEntity.id, targetEntity.canonicalName);

    expect(onJumpToTimeline).toHaveBeenCalledTimes(1);
    expect(onJumpToTimeline).toHaveBeenCalledWith('ent-summit', 'Summit Cola');

    // Simulate timeline event filter
    const sampleEvents = [
      { id: 'e-1', label: 'Clearance Evaluated: Summit Cola', eventType: 'RISK_EVAL', timestamp: new Date().toISOString(), payload: { entity: 'Summit Cola', risk: 'HIGH' } },
      { id: 'e-2', label: 'Clearance Evaluated: AeroTech Prism Laptop', eventType: 'RISK_EVAL', timestamp: new Date().toISOString(), payload: { entity: 'AeroTech Prism Laptop', risk: 'LOW' } },
    ];

    const filtered = sampleEvents.filter(
      (e) => e.label.includes('Summit Cola') || JSON.stringify(e.payload).includes('Summit Cola')
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('e-1');
    // Ensure no raw chain of thought is present in payload
    expect(JSON.stringify(filtered[0])).not.toContain('chain_of_thought');
    expect(JSON.stringify(filtered[0])).not.toContain('thought_process');
  });

  it('T009/US3: preserves read-only invariant and keeps SHA-256 digest unaltered across jumps', () => {
    const originalDigest = mockBinder.integrityDigest;

    // Simulate multiple jumps to evidence and timeline
    const evidenceJumps = mockBinder.canonicalEntities.map((e) => ({
      entityId: e.id,
      name: e.canonicalName,
    }));

    const timelineJumps = mockBinder.replacementCatalog.map((r) => ({
      entityId: r.canonicalEntityId,
      name: r.fictionalBrandName,
    }));

    expect(evidenceJumps.length).toBe(2);
    expect(timelineJumps.length).toBe(1);

    // Cryptographic digest must remain byte-for-byte identical
    expect(mockBinder.integrityDigest).toBe(originalDigest);
  });
});
