// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProjectListModal } from '../../src/components/ProjectListModal';
import * as apiClient from '../../src/utils/apiClient';

vi.mock('../../src/utils/apiClient', () => ({
  apiFetch: vi.fn(),
}));

describe('Contract: User Story 20 - Project Directory & Active Workspace Coherence', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('AC-20.1: renders active project with "Active Workspace" badge when projects list is returned', async () => {
    (apiClient.apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        projects: [
          {
            id: 'proj-active-123',
            title: 'The Neon Horizon',
            productionCompany: 'Entrant Studio',
            scriptVersion: 'v1.0-ShootingDraft',
            projectType: 'Movie',
            executionMode: 'DEMO_MODE',
            clearedCount: 3,
            actionRequiredCount: 2,
            entityCount: 7,
            createdAt: '2026-08-24T00:00:00Z',
          },
          {
            id: 'proj-other-456',
            title: 'Cyberfall',
            productionCompany: 'Apex Entertainment',
            scriptVersion: 'v1.0',
            projectType: 'Movie',
            executionMode: 'DEMO_MODE',
            clearedCount: 1,
            actionRequiredCount: 0,
            entityCount: 2,
            createdAt: '2026-08-24T00:00:00Z',
          },
        ],
      }),
    });

    render(
      <ProjectListModal
        isOpen={true}
        activeProjectId="proj-active-123"
        activeProjectTitle="The Neon Horizon"
        activeProjectType="Movie"
        activeExecutionMode="DEMO_MODE"
        activeProjectSummary={{
          entityCount: 7,
          clearedCount: 3,
          actionRequiredCount: 2,
          reviewRecommendedCount: 2,
        }}
        onSelectProject={vi.fn()}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('The Neon Horizon')).toBeDefined();
      expect(screen.getByText('Cyberfall')).toBeDefined();
      expect(screen.getByText('● Active Workspace')).toBeDefined();
    });
  });

  it('AC-20.2: falls back to displaying active project card when /api/projects returns empty array or error', async () => {
    // Simulate empty array response from API
    (apiClient.apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ projects: [] }),
    });

    render(
      <ProjectListModal
        isOpen={true}
        activeProjectId="proj-active-123"
        activeProjectTitle="The Neon Horizon"
        activeProjectType="Movie"
        activeExecutionMode="DEMO_MODE"
        activeProjectSummary={{
          entityCount: 7,
          clearedCount: 3,
          actionRequiredCount: 2,
          reviewRecommendedCount: 2,
        }}
        onSelectProject={vi.fn()}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('The Neon Horizon')).toBeDefined();
      expect(screen.getByText('● Active Workspace')).toBeDefined();
      expect(screen.queryByText('No production projects found.')).toBeNull();
    });
  });

  it('AC-20.2: renders "No production projects found." when no active project exists and list is empty', async () => {
    (apiClient.apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ projects: [] }),
    });

    render(
      <ProjectListModal
        isOpen={true}
        activeProjectId={null}
        onSelectProject={vi.fn()}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No production projects found.')).toBeDefined();
    });
  });
});
