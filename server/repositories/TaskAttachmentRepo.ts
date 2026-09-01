import { TaskAttachment } from '../../src/types/collaboration.js';

class TaskAttachmentRepository {
  private attachments: Map<string, TaskAttachment> = new Map();

  constructor() {
    // Seed initial demo attachment
    const seedAttachment: TaskAttachment = {
      id: 'att-seed-001',
      taskId: 'task-104',
      projectId: 'proj-default',
      fileName: 'Nocturne_Sync_License_Signed.pdf',
      fileSizeBytes: 1258291, // ~1.2 MB
      mimeType: 'application/pdf',
      gcsStorageUri: 'gs://clearance-scout-attachments/proj-default/Nocturne_Sync_License_Signed.pdf',
      downloadUrl: '/api/attachments/att-seed-001/download',
      uploaderId: 'usr-legal-1',
      uploaderName: 'Legal Counsel',
      uploadedAt: new Date(Date.now() - 7200000).toISOString(),
      versionNumber: 1,
      isDeleted: false,
    };
    this.attachments.set(seedAttachment.id, seedAttachment);
  }

  public getByTaskId(taskId: string): TaskAttachment[] {
    return Array.from(this.attachments.values())
      .filter((a) => a.taskId === taskId && !a.isDeleted)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  public getById(id: string): TaskAttachment | undefined {
    const a = this.attachments.get(id);
    return a && !a.isDeleted ? a : undefined;
  }

  public addAttachment(params: {
    taskId: string;
    projectId: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    uploaderId: string;
    uploaderName: string;
  }): TaskAttachment {
    const existing = this.getByTaskId(params.taskId);
    const versionNumber = existing.length + 1;

    const attachment: TaskAttachment = {
      id: `att-${Math.random().toString(36).substring(2, 9)}`,
      taskId: params.taskId,
      projectId: params.projectId || 'proj-default',
      fileName: params.fileName,
      fileSizeBytes: params.fileSizeBytes,
      mimeType: params.mimeType,
      gcsStorageUri: `gs://clearance-scout-attachments/${params.projectId || 'proj-default'}/${params.fileName}`,
      downloadUrl: `/api/attachments/temp-download/${params.fileName}`,
      uploaderId: params.uploaderId,
      uploaderName: params.uploaderName,
      uploadedAt: new Date().toISOString(),
      versionNumber,
      isDeleted: false,
    };

    this.attachments.set(attachment.id, attachment);
    return attachment;
  }

  public removeAttachment(id: string): boolean {
    const attachment = this.attachments.get(id);
    if (!attachment || attachment.isDeleted) return false;
    attachment.isDeleted = true;
    this.attachments.set(id, attachment);
    return true;
  }
}

export const taskAttachmentRepo = new TaskAttachmentRepository();
