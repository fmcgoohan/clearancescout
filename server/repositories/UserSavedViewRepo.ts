import { UserSavedView, FilterParams } from '../../src/types/collaboration.js';

class UserSavedViewRepository {
  private views: Map<string, UserSavedView> = new Map();

  constructor() {
    // Seed default view preset
    const seedView: UserSavedView = {
      id: 'preset-overdue-blockers',
      userId: 'usr-default',
      projectId: 'proj-default',
      name: 'My Overdue Blockers',
      isSharedWithTeam: true,
      isDefaultView: true,
      createdBy: 'Clearance Coordinator',
      filters: {
        status: ['OPEN', 'IN_PROGRESS'],
        overdueOnly: true,
        readinessImpact: ['BLOCKS_SHOOTING'],
      },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    };
    this.views.set(seedView.id, seedView);
  }

  public getByUserId(userId: string, projectId?: string): UserSavedView[] {
    return Array.from(this.views.values()).filter(
      (v) => (v.userId === userId || v.isSharedWithTeam) && (!projectId || v.projectId === projectId || v.projectId === 'proj-default')
    );
  }

  public getById(id: string): UserSavedView | undefined {
    return this.views.get(id);
  }

  public saveView(params: {
    userId: string;
    projectId: string;
    name: string;
    isSharedWithTeam: boolean;
    isDefaultView: boolean;
    filters: FilterParams;
  }): UserSavedView {
    if (params.isDefaultView) {
      // Unset other defaults for this user
      this.getByUserId(params.userId, params.projectId).forEach((v) => {
        v.isDefaultView = false;
        this.views.set(v.id, v);
      });
    }

    const view: UserSavedView = {
      id: `view-${Math.random().toString(36).substring(2, 9)}`,
      userId: params.userId,
      projectId: params.projectId || 'proj-default',
      name: params.name,
      isSharedWithTeam: params.isSharedWithTeam,
      isDefaultView: params.isDefaultView,
      createdBy: params.userId,
      filters: params.filters,
      createdAt: new Date().toISOString(),
    };

    this.views.set(view.id, view);
    return view;
  }

  public deleteView(id: string, _userId: string): boolean {
    const v = this.views.get(id);
    if (!v) return false;
    return this.views.delete(id);
  }
}

export const userSavedViewRepo = new UserSavedViewRepository();
