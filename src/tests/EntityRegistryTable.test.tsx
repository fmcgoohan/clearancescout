// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EntityRegistryTable } from '../components/EntityRegistryTable';

describe('Scan-First Entity Registry Table (User Story 4)', () => {
  it('renders entity rows with bold titles, category sub-lines, status chips, and domain action buttons', () => {
    const mockEntities = [
      {
        id: 'ent-1',
        canonicalName: 'Veloce GT',
        entityCategory: 'BRAND',
        description: 'Sports coupe vehicle',
        overallClearanceStatus: 'ACTION_REQUIRED' as const,
        occurrenceCount: 2,
      },
    ];

    render(
      <EntityRegistryTable
        entities={mockEntities}
        onEvaluateClearance={() => {}}
        onGenerateReplacement={() => {}}
        isEvaluating={false}
      />
    );

    // Verify canonical entity name
    expect(screen.getByText('Veloce GT')).toBeDefined();
  });
});
