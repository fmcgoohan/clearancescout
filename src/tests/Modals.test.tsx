// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Modal } from '../components/Modal';
import { ProductionDashboardModal } from '../components/ProductionDashboardModal';
import { ActionListModal } from '../components/ActionListModal';

describe('Operations Dashboard & Department Task Center Modals (User Story 5)', () => {
  it('renders Modal primitive and supports backdrop/title structure', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeDefined();
    expect(screen.getByText('Modal Content')).toBeDefined();
  });

  it('renders ProductionDashboardModal when open', () => {
    render(
      <ProductionDashboardModal isOpen={true} onClose={() => {}} projectId="proj-123" />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('renders ActionListModal when open', () => {
    render(
      <ActionListModal isOpen={true} onClose={() => {}} projectId="proj-123" />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
  });
});
