import { describe, it, expect } from 'vitest';

describe('Contract & Logic: In-Script Visual Entity Highlighter', () => {
  it('should match and tokenize entities accurately within screenplay text', () => {
    const rawScript = 'Alex sips a cold Coca-Cola while checking his Rolex watch near Empire State Building.';
    const mockEntities = [
      { id: 'ent-1', canonicalName: 'Coca-Cola', overallClearanceStatus: 'ACTION_REQUIRED' as const },
      { id: 'ent-2', canonicalName: 'Rolex', overallClearanceStatus: 'REVIEW_RECOMMENDED' as const },
      { id: 'ent-3', canonicalName: 'Empire State Building', overallClearanceStatus: 'NO_ISSUE_SURFACED' as const },
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
});
