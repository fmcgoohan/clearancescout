import { describe, it, expect } from 'vitest';
import {
  filterEntities,
  CanonicalEntity,
  RegistryFilterState,
  SceneFilterOption,
} from '../../src/components/EntityRegistryTable.js';

describe('Entity Registry Multi-Dimension Filters (Contract Tests)', () => {
  const mockEntities: CanonicalEntity[] = [
    {
      id: 'ent-1',
      canonicalName: 'Summit Cola',
      entityCategory: 'BRAND',
      description: 'Can of soda on desk',
      overallClearanceStatus: 'ACTION_REQUIRED',
    },
    {
      id: 'ent-2',
      canonicalName: 'Neon City Melody',
      entityCategory: 'ART_MUSIC',
      description: 'Song playing in background',
      overallClearanceStatus: 'REVIEW_RECOMMENDED',
    },
    {
      id: 'ent-3',
      canonicalName: 'Dr. Jane Doe',
      entityCategory: 'PUBLIC_FIGURE',
      description: 'Named character',
      overallClearanceStatus: 'NO_ISSUE_SURFACED',
    },
    {
      id: 'ent-4',
      canonicalName: 'Grand Hotel',
      entityCategory: 'PROPRIETARY_LOCATION',
      description: 'Hotel exterior',
      overallClearanceStatus: 'ACTION_REQUIRED',
    },
    {
      id: 'ent-5',
      canonicalName: 'Unknown Whiskey',
      entityCategory: 'BRAND',
      description: 'Bottle on counter',
      overallClearanceStatus: 'INSUFFICIENT_EVIDENCE',
    },
  ];

  const mockScenes: SceneFilterOption[] = [
    {
      id: 'sc-1',
      sceneNumber: 1,
      heading: 'INT. APARTMENT - DAY',
      occurrences: [
        { canonicalEntityId: 'ent-1' },
        { canonicalEntityId: 'ent-2' },
      ],
    },
    {
      id: 'sc-2',
      sceneNumber: 2,
      heading: 'EXT. STREET - NIGHT',
      occurrences: [
        { canonicalEntityId: 'ent-3' },
        { canonicalEntityId: 'ent-4' },
        { canonicalEntityId: 'ent-5' },
      ],
    },
  ];

  it('T003: returns all entities when all filter dimensions default to ALL', () => {
    const defaultFilter: RegistryFilterState = {
      status: 'ALL',
      category: 'ALL',
      sceneId: 'ALL',
    };

    const results = filterEntities(mockEntities, defaultFilter, mockScenes);
    expect(results).toHaveLength(5);
    expect(results.map((e) => e.id)).toEqual(['ent-1', 'ent-2', 'ent-3', 'ent-4', 'ent-5']);
  });

  it('T003: filters by individual dimensions (status, category, scene)', () => {
    // 1. Status Filter
    const statusFilter: RegistryFilterState = {
      status: 'ACTION_REQUIRED',
      category: 'ALL',
      sceneId: 'ALL',
    };
    const statusResults = filterEntities(mockEntities, statusFilter, mockScenes);
    expect(statusResults).toHaveLength(2);
    expect(statusResults.map((e) => e.id)).toEqual(['ent-1', 'ent-4']);

    // 2. Category Filter
    const categoryFilter: RegistryFilterState = {
      status: 'ALL',
      category: 'BRAND',
      sceneId: 'ALL',
    };
    const categoryResults = filterEntities(mockEntities, categoryFilter, mockScenes);
    expect(categoryResults).toHaveLength(2);
    expect(categoryResults.map((e) => e.id)).toEqual(['ent-1', 'ent-5']);

    // 3. Scene Filter
    const sceneFilter: RegistryFilterState = {
      status: 'ALL',
      category: 'ALL',
      sceneId: 'sc-1',
    };
    const sceneResults = filterEntities(mockEntities, sceneFilter, mockScenes);
    expect(sceneResults).toHaveLength(2);
    expect(sceneResults.map((e) => e.id)).toEqual(['ent-1', 'ent-2']);
  });

  it('T003: computes logical AND intersection when multiple dimensions are active', () => {
    const combinedFilter: RegistryFilterState = {
      status: 'ACTION_REQUIRED',
      category: 'BRAND',
      sceneId: 'sc-1',
    };

    const results = filterEntities(mockEntities, combinedFilter, mockScenes);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('ent-1');
    expect(results[0].canonicalName).toBe('Summit Cola');
  });

  it('T006: returns empty array when filter combination produces zero matches without corrupting state', () => {
    const zeroMatchFilter: RegistryFilterState = {
      status: 'NO_ISSUE_SURFACED',
      category: 'BRAND',
      sceneId: 'sc-1',
    };

    const results = filterEntities(mockEntities, zeroMatchFilter, mockScenes);
    expect(results).toHaveLength(0);

    // Resetting filter restores all entities
    const resetResults = filterEntities(mockEntities, { status: 'ALL', category: 'ALL', sceneId: 'ALL' }, mockScenes);
    expect(resetResults).toHaveLength(5);
  });

  it('T008: strictly preserves read-only non-destructive invariant', () => {
    const originalSnapshot = JSON.parse(JSON.stringify(mockEntities));

    const restrictiveFilter: RegistryFilterState = {
      status: 'INSUFFICIENT_EVIDENCE',
      category: 'BRAND',
      sceneId: 'sc-2',
    };

    const results = filterEntities(mockEntities, restrictiveFilter, mockScenes);
    expect(results).toHaveLength(1);

    // Verify source array and objects are 100% unaltered
    expect(mockEntities).toEqual(originalSnapshot);
    expect(mockEntities).toHaveLength(5);
  });
});
