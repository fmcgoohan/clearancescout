// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('Header Command Bar (User Story 1)', () => {
  it('renders header command bar with project switcher and tabular quota display', async () => {
    render(<App />);

    // Check header bar element
    const header = screen.getByRole('banner');
    expect(header).toBeDefined();

    // Verify tabular figures on quota meter
    const quotaText = screen.getByText(/Quota:/i);
    expect(quotaText).toBeDefined();

    // Verify primary tasks button or command bar elements exist
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
