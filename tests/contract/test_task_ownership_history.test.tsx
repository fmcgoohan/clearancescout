// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { app } from '../../server/index.js';
import { actionNotificationRepo } from '../../server/repositories/ActionNotificationRepo.js';
import { ActionListModal } from '../../src/components/ActionListModal';
import * as apiClient from '../../src/utils/apiClient';

vi.mock('../../src/utils/apiClient', () => ({
  getDemoToken: vi.fn().mockReturnValue('demo-tok'),
  apiFetch: vi.fn(),
}));

describe('Contract & Quality: User Story 22 - Operational Task Ownership & Auditable Activity History', () => {
  it('AC-22.1, AC-22.2, AC-22.3, AC-22.5: Backend persists assignee, due date, isOverdue calculation, and append-only activityHistory', async () => {
    // 1. Create a project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Task Ownership & Audit Test',
        productionCompany: 'Entrant Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Create an action item
    const actionItem = await actionNotificationRepo.createActionItem(projectId, {
      title: 'Review Location Permit',
      targetDepartment: 'LOCATIONS',
      actionType: 'LOCATIONS_PERMIT',
      priority: 'HIGH',
      description: 'Location permit required for Neon Club scene',
      status: 'OPEN',
    });
    expect(actionItem.id).toBeDefined();
    expect(actionItem.activityHistory?.length).toBe(1);
    expect(actionItem.activityHistory?.[0].eventType).toBe('CREATED');

    // 3. Assign task (AC-22.1)
    const assignRes = await request(app)
      .patch(`/api/projects/${projectId}/actions/${actionItem.id}`)
      .send({
        assignee: { id: 'usr-101', name: 'Elena Vance', role: 'Location Manager' },
        actor: 'Legal Coordinator',
      });
    expect(assignRes.status).toBe(200);
    expect(assignRes.body.assignee.name).toBe('Elena Vance');
    expect(assignRes.body.activityHistory.length).toBe(2);
    expect(assignRes.body.activityHistory[1].eventType).toBe('ASSIGNED');

    // 4. Set past due date and verify isOverdue calculation (AC-22.2)
    const pastDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const dueRes = await request(app)
      .patch(`/api/projects/${projectId}/actions/${actionItem.id}`)
      .send({
        dueDate: pastDate,
        actor: 'Legal Coordinator',
      });
    expect(dueRes.status).toBe(200);
    expect(dueRes.body.dueDate).toBe(pastDate);
    expect(dueRes.body.isOverdue).toBe(true);
    expect(dueRes.body.activityHistory.length).toBe(3);
    expect(dueRes.body.activityHistory[2].eventType).toBe('DUE_DATE_CHANGED');

    // 5. Reassign task (AC-22.1, AC-22.5 append-only)
    const reassignRes = await request(app)
      .patch(`/api/projects/${projectId}/actions/${actionItem.id}`)
      .send({
        assignee: { id: 'usr-102', name: 'Marcus Thorne', role: 'Counsel' },
        actor: 'Supervising Attorney',
      });
    expect(reassignRes.status).toBe(200);
    expect(reassignRes.body.assignee.name).toBe('Marcus Thorne');
    expect(reassignRes.body.activityHistory.length).toBe(4);
    expect(reassignRes.body.activityHistory[3].eventType).toBe('REASSIGNED');

    // 6. Resolve task and verify isOverdue is false when RESOLVED (AC-22.2, AC-22.3)
    const resolveRes = await request(app)
      .patch(`/api/projects/${projectId}/actions/${actionItem.id}`)
      .send({
        status: 'RESOLVED',
        resolutionTrigger: 'PERMIT_GRANTED',
        actor: 'Marcus Thorne',
      });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.status).toBe('RESOLVED');
    expect(resolveRes.body.isOverdue).toBe(false);
    expect(resolveRes.body.activityHistory.length).toBe(5);
    expect(resolveRes.body.activityHistory[4].eventType).toBe('RESOLVED');
  });

  it('AC-22.4: ActionListModal renders OVERDUE badge, assignee inputs, due date, and expandable audit history timeline', async () => {
    const mockAction = {
      id: 'act-test-999',
      projectId: 'proj-123',
      actionType: 'LOCATIONS_PERMIT',
      targetDepartment: 'LOCATIONS',
      title: 'Clear Neon Signage',
      description: 'Check trademark clearance for Neon Club facade',
      priority: 'HIGH',
      status: 'OPEN',
      assignee: { id: 'usr-1', name: 'Sarah Jenkins', role: 'Clearance Officer' },
      dueDate: '2026-01-01',
      isOverdue: true,
      activityHistory: [
        {
          id: 'aud-1',
          timestamp: '2026-08-24T10:00:00Z',
          actor: 'System Dispatcher',
          eventType: 'CREATED',
          afterState: 'OPEN',
          description: 'Task created for LOCATIONS: "Clear Neon Signage"',
        },
        {
          id: 'aud-2',
          timestamp: '2026-08-24T11:00:00Z',
          actor: 'Legal Coordinator',
          eventType: 'ASSIGNED',
          beforeState: 'Unassigned',
          afterState: 'Sarah Jenkins (Clearance Officer)',
          description: 'Assigned task to Sarah Jenkins (Clearance Officer)',
        },
      ],
      createdAt: '2026-08-24T10:00:00Z',
    };

    (apiClient.apiFetch as any).mockImplementation((url: string) => {
      if (url.includes('/actions')) {
        return Promise.resolve({ ok: true, json: async () => [mockAction] });
      }
      if (url.includes('/notifications')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ActionListModal
        isOpen={true}
        projectId="proj-123"
        onClose={vi.fn()}
      />
    );

    // 1. Verify OVERDUE badge (AC-22.2)
    await waitFor(() => {
      expect(screen.getByText('OVERDUE')).toBeDefined();
      expect(screen.getByLabelText(/Assignee Name for Clear Neon Signage/i)).toBeDefined();
    });

    // 2. Expand audit history (AC-22.4)
    const historyBtn = screen.getByText(/Audit History \(2\)/i);
    fireEvent.click(historyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Audit Trail \(2 events\)/i)).toBeDefined();
      expect(screen.getByText(/\[CREATED\]/i)).toBeDefined();
      expect(screen.getByText(/\[ASSIGNED\]/i)).toBeDefined();
      expect(screen.getByText(/Assigned task to Sarah Jenkins/i)).toBeDefined();
    });
  });

  it('P3IMPL4FIX Regression: typing assignee name character-by-character only fires ONE PATCH request on blur', async () => {
    vi.clearAllMocks();
    const mockAction = {
      id: 'act-keystroke-1',
      projectId: 'proj-123',
      actionType: 'LOCATIONS_PERMIT',
      targetDepartment: 'LOCATIONS',
      title: 'Clear Neon Signage',
      description: 'Check trademark clearance for Neon Club facade',
      priority: 'HIGH',
      status: 'OPEN',
      assignee: undefined,
      createdAt: '2026-08-24T10:00:00Z',
    };

    (apiClient.apiFetch as any).mockImplementation((url: string, options?: any) => {
      if (options?.method === 'PATCH') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockAction,
            assignee: body.assignee,
            activityHistory: [
              { id: 'aud-1', timestamp: '2026-08-25T00:00:00Z', actor: 'Legal Coordinator', eventType: 'ASSIGNED', description: `Assigned task to ${body.assignee?.name}` }
            ]
          }),
        });
      }
      if (url.includes('/actions')) {
        return Promise.resolve({ ok: true, json: async () => [mockAction] });
      }
      if (url.includes('/notifications')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ActionListModal
        isOpen={true}
        projectId="proj-123"
        onClose={vi.fn()}
      />
    );

    const input = await screen.findByLabelText(/Assignee Name for Clear Neon Signage/i);

    // Simulate incremental typing character by character ("E", "El", "Ele", "Elena", "Elena Vance")
    const keystrokes = ['E', 'El', 'Ele', 'Elen', 'Elena', 'Elena ', 'Elena V', 'Elena Va', 'Elena Van', 'Elena Vanc', 'Elena Vance'];
    for (const text of keystrokes) {
      fireEvent.change(input, { target: { value: text } });
    }

    // Verify 0 PATCH requests fired during active typing
    const patchCallsBeforeBlur = (apiClient.apiFetch as any).mock.calls.filter((c: any[]) => c[1]?.method === 'PATCH');
    expect(patchCallsBeforeBlur.length).toBe(0);

    // Now trigger blur to commit
    fireEvent.blur(input);

    // Verify exactly ONE PATCH call was made
    const patchCallsAfterBlur = (apiClient.apiFetch as any).mock.calls.filter((c: any[]) => c[1]?.method === 'PATCH');
    expect(patchCallsAfterBlur.length).toBe(1);
    expect(JSON.parse(patchCallsAfterBlur[0][1].body).assignee.name).toBe('Elena Vance');
  });
});
