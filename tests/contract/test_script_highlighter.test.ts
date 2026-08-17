import { describe, it, expect } from 'vitest';
import { resolveEffectiveStatus } from '../../src/components/ScriptViewer.js';

describe('Contract & Logic: In-Script Visual Entity Highlighter & Scene Resolution', () => {
  it('should match and tokenize entities accurately within screenplay text', () => {
    const rawScript = 'Alex sips a cold Coca-Cola while checking his Rolex watch near Empire State Building.';
    const mockEntities = [
      { id: 'ent-1', canonicalName: 'Coca-Cola', overallClearanceStatus: 'ACTION_REQUIRED' as const, entityCategory: 'BRAND' as const, description: '', isOverridden: false, projectId: 'p1', createdAt: '', updatedAt: '' },
      { id: 'ent-2', canonicalName: 'Rolex', overallClearanceStatus: 'REVIEW_RECOMMENDED' as const, entityCategory: 'BRAND' as const, description: '', isOverridden: false, projectId: 'p1', createdAt: '', updatedAt: '' },
      { id: 'ent-3', canonicalName: 'Empire State Building', overallClearanceStatus: 'NO_ISSUE_SURFACED' as const, entityCategory: 'PROPRIETARY_LOCATION' as const, description: '', isOverridden: false, projectId: 'p1', createdAt: '', updatedAt: '' },
    ];

    const sortedEntities = [...mockEntities].sort((a, b) => b.canonicalName.length - a.canonicalName.length);
    const escapedNames = sortedEntities.map(e => e.canonicalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escapedNames.join('|')})\\b`, 'gi');

    const matches = [];
    let match;
    while ((match = regex.exec(rawScript)) !== null) {
      matches.push({
        term: match[0],
        index: match.index,
      });
    }

    expect(matches.length).toBe(3);
    expect(matches[0].term).toBe('Coca-Cola');
    expect(matches[1].term).toBe('Rolex');
    expect(matches[2].term).toBe('Empire State Building');
  });

  it('should resolve scene-specific effective clearance status for in-script badges', () => {
    const entity = {
      id: 'ent-coke',
      projectId: 'p1',
      canonicalName: 'Coca-Cola',
      entityCategory: 'BRAND' as const,
      description: 'Beverage',
      overallClearanceStatus: 'ACTION_REQUIRED' as const,
      isOverridden: false,
      createdAt: '',
      updatedAt: '',
    };

    const overrides = [
      {
        id: 'ovr-1',
        canonicalEntityId: 'ent-coke',
        sceneId: 'scene-1',
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Scene 1 clearance agreement',
        counselName: 'Jane Doe, Esq.',
        timestamp: new Date().toISOString(),
      },
    ];

    // Scene 1 has scene-specific override to NO_ISSUE_SURFACED
    const scene1Status = resolveEffectiveStatus(entity, overrides, 'scene-1');
    expect(scene1Status).toBe('NO_ISSUE_SURFACED');

    // Scene 2 has NO scene override, retains automated ACTION_REQUIRED
    const scene2Status = resolveEffectiveStatus(entity, overrides, 'scene-2');
    expect(scene2Status).toBe('ACTION_REQUIRED');
  });
});
