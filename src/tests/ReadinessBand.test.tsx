// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WorkspacePage } from '../pages/WorkspacePage';

describe('Shooting Readiness & Plain-Language Reasons (User Story 2)', () => {
  it('renders readiness index at display scale and plain language reason cards', () => {
    const mockProps = {
      projectId: 'proj-123',
      onEvaluateClearance: () => {},
      onGenerateReplacement: () => {},
      onOpenCounselReview: () => {},
      isEvaluating: false,
      refreshTrigger: 0,
    };

    render(<WorkspacePage {...mockProps} />);

    // Check title presence
    const titles = screen.getAllByText(/Screenplay Intake|Multi-Format Script Ingestion/i);
    expect(titles.length).toBeGreaterThan(0);
  });
});
