// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OnboardingBanner } from '../components/OnboardingBanner';

describe('OnboardingBanner Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders onboarding 3 steps banner when not dismissed', () => {
    render(<OnboardingBanner />);
    expect(screen.getByRole('region', { name: /How Clearance Scout Works/i })).toBeDefined();
    expect(screen.getByText(/Automated Screenplay Clearance & Production Readiness in 3 Steps/i)).toBeDefined();
    expect(screen.getByText(/Screenplay Intake/i)).toBeDefined();
    expect(screen.getByText(/Research & Rights/i)).toBeDefined();
    expect(screen.getByText(/Shooting Readiness/i)).toBeDefined();
  });

  it('dismisses banner on click "Got it, dismiss"', () => {
    const handleDismiss = vi.fn();
    const { getAllByRole } = render(<OnboardingBanner onDismiss={handleDismiss} />);
    
    const dismissBtns = getAllByRole('button', { name: /Got it, dismiss/i });
    fireEvent.click(dismissBtns[0]);

    expect(handleDismiss).toHaveBeenCalled();
    expect(localStorage.getItem('clearancescout:onboarding:v1:default')).toBe('true');
    expect(screen.queryByRole('region', { name: /How Clearance Scout Works/i })).toBeNull();
  });
});
