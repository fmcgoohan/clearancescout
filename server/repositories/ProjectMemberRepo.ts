import { ProjectMember, UserRole } from '../../src/types/collaboration.js';

class ProjectMemberRepository {
  private members: Map<string, ProjectMember> = new Map();

  constructor() {
    const seedMembers: ProjectMember[] = [
      {
        id: 'pm-001',
        projectId: 'proj-default',
        userId: 'usr-coord-1',
        userName: 'Clearance Coordinator',
        userEmail: 'coordinator@studio.com',
        projectRole: 'CLEARANCE_COORDINATOR',
        assignedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'pm-002',
        projectId: 'proj-default',
        userId: 'usr-legal-1',
        userName: 'Sarah Jenkins',
        userEmail: 's.jenkins@studio.com',
        projectRole: 'LEGAL_COUNSEL',
        assignedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'pm-003',
        projectId: 'proj-default',
        userId: 'usr-art-1',
        userName: 'Art Department Lead',
        userEmail: 'art@studio.com',
        projectRole: 'ART_DEPT',
        assignedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'pm-004',
        projectId: 'proj-default',
        userId: 'usr-admin-1',
        userName: 'System Administrator',
        userEmail: 'admin@studio.com',
        projectRole: 'ADMINISTRATOR',
        assignedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    seedMembers.forEach((m) => this.members.set(m.id, m));
  }

  public getByProjectId(projectId: string): ProjectMember[] {
    return Array.from(this.members.values()).filter((m) => m.projectId === projectId || m.projectId === 'proj-default');
  }

  public getByUserId(userId: string): ProjectMember | undefined {
    return Array.from(this.members.values()).find((m) => m.userId === userId || m.projectRole === userId);
  }

  public assignRole(params: { projectId: string; userId: string; userName: string; userEmail: string; projectRole: UserRole }): ProjectMember {
    const existing = Array.from(this.members.values()).find((m) => m.projectId === params.projectId && m.userId === params.userId);
    if (existing) {
      existing.projectRole = params.projectRole;
      this.members.set(existing.id, existing);
      return existing;
    }
    const newMember: ProjectMember = {
      id: `pm-${Math.random().toString(36).substring(2, 9)}`,
      projectId: params.projectId,
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      projectRole: params.projectRole,
      assignedAt: new Date().toISOString(),
    };
    this.members.set(newMember.id, newMember);
    return newMember;
  }
}

export const projectMemberRepo = new ProjectMemberRepository();
