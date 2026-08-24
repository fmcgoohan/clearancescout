// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { render, screen, waitFor } from '@testing-library/react';
import { app } from '../../server/index.js';
import { ProductionDashboardModal } from '../../src/components/ProductionDashboardModal';
import * as apiClient from '../../src/utils/apiClient';

vi.mock('../../src/utils/apiClient', () => ({
  apiFetch: vi.fn(),
}));

describe('Contract & Quality: User Story 21 - Reconciled Department Task Totals & Locations Coverage', () => {
  it('AC-21.2 & AC-21.5: API response pendingActionsCount equals sum of 4 department counts (11 baseline)', async () => {
    // 1. Create demo project and load demo screenplay
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Department Totals Test',
        productionCompany: 'Entrant Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    const demoRes = await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({ autoEvaluate: true });
    expect(demoRes.status).toBe(200);

    // 2. Fetch dashboard summary
    const dashRes = await request(app).get(`/api/projects/${projectId}/dashboard`);
    expect(dashRes.status).toBe(200);
    const { kpis, departmentActionsSummary } = dashRes.body;

    const departmentSum =
      departmentActionsSummary.ART_DEPT +
      departmentActionsSummary.LEGAL_COUNSEL +
      departmentActionsSummary.LOCATIONS +
      departmentActionsSummary.PRODUCTION_MGMT;

    expect(kpis.pendingActionsCount).toBe(departmentSum);
    expect(kpis.pendingActionsCount).toBe(11);
    expect(departmentActionsSummary.ART_DEPT).toBe(1);
    expect(departmentActionsSummary.LEGAL_COUNSEL).toBe(9);
    expect(departmentActionsSummary.LOCATIONS).toBe(1);
    expect(departmentActionsSummary.PRODUCTION_MGMT).toBe(0);
  });

  it('AC-21.1 & AC-21.5: ProductionDashboardModal renders 4-department additive breakdown', async () => {
    const sampleData = {
      projectId: 'proj-123',
      projectTitle: 'The Neon Horizon',
      projectType: 'Movie',
      kpis: {
        totalScenes: 3,
        finalClearScenes: 1,
        workingClearScenes: 0,
        redScenes: 2,
        readinessPercentage: 33.3,
        totalEntities: 7,
        criticalBlockersCount: 2,
        activePlaceholdersCount: 1,
        rightsExpiringSoonCount: 1,
        pendingActionsCount: 11,
      },
      sceneReadinessDistribution: [],
      shootBlockers: [],
      expiringRights: [],
      activePlaceholders: [],
      departmentActionsSummary: {
        ART_DEPT: 1,
        LEGAL_COUNSEL: 9,
        LOCATIONS: 1,
        PRODUCTION_MGMT: 0,
      },
      recentActivity: [],
    };

    (apiClient.apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => sampleData,
    });

    render(
      <ProductionDashboardModal
        isOpen={true}
        projectId="proj-123"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      const breakdownText = screen.getByText(/Art: 1 \| Legal: 9 \| Locations: 1 \| Prod: 0/i);
      expect(breakdownText).toBeDefined();
    });
  });
});
