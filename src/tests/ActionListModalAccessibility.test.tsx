// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActionListModal, ClearanceActionItem } from '../components/ActionListModal';

vi.mock('../utils/apiClient.js', () => ({
  apiFetch: vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  }),
}));

const mockActions: ClearanceActionItem[] = [
  { id: 'act-1', projectId: 'proj-1', targetDepartment: 'ART_DEPT', actionType: 'DEPARTMENT_TASK', title: 'Art Task 1', description: 'Desc 1', priority: 'HIGH', status: 'OPEN', createdAt: '2026-08-25T00:00:00Z' },
  { id: 'act-2', projectId: 'proj-1', targetDepartment: 'LEGAL_COUNSEL', actionType: 'DEPARTMENT_TASK', title: 'Legal Task 1', description: 'Desc 2', priority: 'HIGH', status: 'OPEN', createdAt: '2026-08-25T00:00:00Z' },
  { id: 'act-3', projectId: 'proj-1', targetDepartment: 'LEGAL_COUNSEL', actionType: 'DEPARTMENT_TASK', title: 'Legal Task 2', description: 'Desc 3', priority: 'MEDIUM', status: 'OPEN', createdAt: '2026-08-25T00:00:00Z' },
  { id: 'act-4', projectId: 'proj-1', targetDepartment: 'LEGAL_COUNSEL', actionType: 'DEPARTMENT_TASK', title: 'Legal Task 3', description: 'Desc 4', priority: 'HIGH', status: 'OPEN', createdAt: '2026-08-25T00:00:00Z' },
  { id: 'act-5', projectId: 'proj-1', targetDepartment: 'LEGAL_COUNSEL', actionType: 'DEPARTMENT_TASK', title: 'Legal Task 4', description: 'Desc 5', priority: 'HIGH', status: 'OPEN', createdAt: '2026-08-25T00:00:00Z' },
  { id: 'act-6', projectId: 'proj-1', targetDepartment: 'LEGAL_COUNSEL', actionType: 'DEPARTMENT_TASK', title: 'Legal Task 5', description: 'Desc 6', priority: 'HIGH', status: 'OPEN', createdAt: '2026-08-25T00:00:00Z' },
  { id: 'act-7', projectId: 'proj-1', targetDepartment: 'LEGAL_COUNSEL', actionType: 'DEPARTMENT_TASK', title: 'Legal Task 6', description: 'Desc 7', priority: 'HIGH', status: 'OPEN', createdAt: '2026-08-25T00:00:00Z' },
  { id: 'act-8', projectId: 'proj-1', targetDepartment: 'LEGAL_COUNSEL', actionType: 'DEPARTMENT_TASK', title: 'Legal Task 7', description: 'Desc 8', priority: 'HIGH', status: 'OPEN', createdAt: '2026-08-25T00:00:00Z' },
  { id: 'act-9', projectId: 'proj-1', targetDepartment: 'LEGAL_COUNSEL', actionType: 'DEPARTMENT_TASK', title: 'Legal Task 8', description: 'Desc 9', priority: 'HIGH', status: 'OPEN', createdAt: '2026-08-25T00:00:00Z' },
  { id: 'act-10', projectId: 'proj-1', targetDepartment: 'LEGAL_COUNSEL', actionType: 'DEPARTMENT_TASK', title: 'Legal Task 9', description: 'Desc 10', priority: 'HIGH', status: 'OPEN', createdAt: '2026-08-25T00:00:00Z' },
  { id: 'act-11', projectId: 'proj-1', targetDepartment: 'LOCATIONS', actionType: 'DEPARTMENT_TASK', title: 'Locations Task 1', description: 'Desc 11', priority: 'MEDIUM', status: 'OPEN', createdAt: '2026-08-25T00:00:00Z' },
];

describe('ActionListModal Accessibility Count Semantics', () => {
  it('renders explicit ARIA list semantics and polite status region matching total 11 tasks', async () => {
    const { apiFetch } = await import('../utils/apiClient.js');
    (apiFetch as any).mockImplementation((url: string) => {
      if (url.includes('/actions')) {
        return Promise.resolve({ ok: true, json: async () => mockActions });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(<ActionListModal isOpen={true} projectId="proj-1" onClose={() => {}} />);

    const statusRegion = await screen.findByRole('status');
    expect(statusRegion).not.toBeNull();
    expect(statusRegion.textContent).toBe('Showing 11 of 11 department tasks');

    const list = screen.getByRole('list', { name: /Department Tasks List/i });
    expect(list).not.toBeNull();
    expect(list.getAttribute('aria-setsize')).toBe('11');

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(11);
    expect(items[0].getAttribute('aria-posinset')).toBe('1');
    expect(items[0].getAttribute('aria-setsize')).toBe('11');
  });

  it('updates ARIA list semantics and status announcement under department filter', async () => {
    const { apiFetch } = await import('../utils/apiClient.js');
    (apiFetch as any).mockImplementation((url: string) => {
      if (url.includes('/actions')) {
        return Promise.resolve({ ok: true, json: async () => mockActions });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(<ActionListModal isOpen={true} projectId="proj-1" onClose={() => {}} />);

    const legalTab = await screen.findByRole('button', { name: /Legal Counsel/i });
    fireEvent.click(legalTab);

    const statusRegion = screen.getByRole('status');
    expect(statusRegion.textContent).toBe('Showing 9 of 11 department tasks');

    const list = screen.getByRole('list', { name: /Department Tasks List \(9 items\)/i });
    expect(list.getAttribute('aria-setsize')).toBe('9');

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(9);
    expect(items[0].getAttribute('aria-setsize')).toBe('9');
  });
});
