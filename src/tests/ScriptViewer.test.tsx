// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScriptViewer } from '../components/ScriptViewer';

describe('Monospace Screenplay Panel & Dotted Underlines (User Story 3)', () => {
  it('renders screenplay scenes with dotted underline entity highlights', () => {
    const mockScenes = [
      {
        id: 'scene-1',
        sceneNumber: 1,
        heading: 'INT. LAB - DAY',
        locationType: 'INT',
        timeOfDay: 'DAY',
        rawText: 'Dr. Vance holds a Titan Industrial Placard.',
        characterActionSummary: 'Vance holds placard.',
        readinessStatus: 'RED' as const,
      },
    ];

    const mockEntities = [
      {
        id: 'ent-1',
        canonicalName: 'Titan Industrial Placard',
        entityCategory: 'GRAPHIC_PROP',
        description: 'Hazard placard artwork.',
        overallClearanceStatus: 'ACTION_REQUIRED' as const,
      },
    ];

    render(
      <ScriptViewer
        scenes={mockScenes}
        entities={mockEntities}
        selectedSceneId="scene-1"
        onSelectScene={() => {}}
      />
    );

    // Verify scene heading is rendered
    expect(screen.getByText(/SCENE 1: INT. LAB - DAY/i)).toBeDefined();

    // Verify highlight text element exists
    const highlightedSpan = screen.getByText('Titan Industrial Placard');
    expect(highlightedSpan).toBeDefined();
    expect(highlightedSpan.style.textDecoration).toContain('underline dotted');
    expect(highlightedSpan.style.backgroundColor).toBe('transparent');
  });
});
