import { Router, Request, Response } from 'express';
import { taskAttachmentRepo } from '../repositories/TaskAttachmentRepo.js';
import { generateSignedUploadUrl } from '../integrations/storage/gcsStorage.js';
import { actionNotificationRepo } from '../repositories/ActionNotificationRepo.js';

export const attachmentRouter = Router();

// GET attachments for task
attachmentRouter.get('/tasks/:taskId/attachments', (req: Request, res: Response) => {
  const { taskId } = req.params;
  const attachments = taskAttachmentRepo.getByTaskId(taskId);
  res.json({ attachments });
});

// POST request signed upload URL & register attachment
attachmentRouter.post('/tasks/:taskId/attachments', async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { fileName, fileSizeBytes, mimeType, uploaderId, uploaderName, projectId } = req.body;

  if (!fileName) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  if (fileSizeBytes && fileSizeBytes > 26214400) { // 25 MB
    return res.status(400).json({ error: 'File size exceeds maximum 25 MB limit' });
  }

  const attachment = taskAttachmentRepo.addAttachment({
    taskId,
    projectId: projectId || 'proj-default',
    fileName,
    fileSizeBytes: fileSizeBytes || 102400,
    mimeType: mimeType || 'application/pdf',
    uploaderId: uploaderId || 'usr-legal-1',
    uploaderName: uploaderName || 'Legal Counsel',
  });

  const signedData = await generateSignedUploadUrl(fileName, mimeType, projectId);

  // Record audit log event
  actionNotificationRepo.recordAuditEvent({
    taskId,
    actorName: attachment.uploaderName,
    actorRole: 'LEGAL_COUNSEL',
    actionType: 'ATTACHMENT_ADDED',
    details: `Attached file: ${fileName} (${Math.round(attachment.fileSizeBytes / 1024)} KB)`,
    previousValue: undefined,
    newValue: fileName,
  });

  res.status(201).json({
    attachment,
    uploadUrl: signedData.uploadUrl,
    expiresInMinutes: signedData.expiresInMinutes,
  });
});

// DELETE attachment
attachmentRouter.delete('/attachments/:attachmentId', (req: Request, res: Response) => {
  const { attachmentId } = req.params;
  const attachment = taskAttachmentRepo.getById(attachmentId);
  if (!attachment) {
    return res.status(404).json({ error: 'Attachment not found' });
  }

  taskAttachmentRepo.removeAttachment(attachmentId);

  actionNotificationRepo.recordAuditEvent({
    taskId: attachment.taskId,
    actorName: 'Legal Counsel',
    actorRole: 'LEGAL_COUNSEL',
    actionType: 'ATTACHMENT_REMOVED',
    details: `Removed attachment: ${attachment.fileName}`,
    previousValue: attachment.fileName,
    newValue: undefined,
  });

  res.json({ success: true, message: 'Attachment removed' });
});
