import React, { useState, useEffect } from 'react';
import { TaskAttachment } from '../types/collaboration';

interface TaskAttachmentListProps {
  taskId: string;
  projectId?: string;
  demoToken?: string;
}

export const TaskAttachmentList: React.FC<TaskAttachmentListProps> = ({
  taskId,
  projectId = 'proj-default',
  demoToken,
}) => {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttachments = async () => {
    try {
      const headers: Record<string, string> = {};
      if (demoToken) headers['x-demo-token'] = demoToken;
      const res = await fetch(`/api/tasks/${taskId}/attachments`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAttachments(data.attachments || []);
      }
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [taskId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 26214400) {
      setError('File size exceeds 25 MB limit.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (demoToken) headers['x-demo-token'] = demoToken;

      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type || 'application/pdf',
          uploaderId: 'usr-current',
          uploaderName: 'Legal Counsel',
          projectId,
        }),
      });

      if (res.ok) {
        fetchAttachments();
      } else {
        const data = await res.json();
        setError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (attachmentId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (demoToken) headers['x-demo-token'] = demoToken;
      const res = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        fetchAttachments();
      }
    } catch (err) {
      console.error('Failed to remove attachment:', err);
    }
  };

  return (
    <div className="space-y-3 border-t pt-3 mt-3" data-testid="attachment-list">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Attachments & Proof ({attachments.length})
        </h4>
        <label className="cursor-pointer text-xs font-medium px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 hover:bg-indigo-100">
          {uploading ? 'Uploading...' : '+ Attach File'}
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            aria-label="Attach clearance evidence file"
          />
        </label>
      </div>

      {error && <div className="text-xs text-red-600 dark:text-red-400">{error}</div>}

      <div className="space-y-2">
        {attachments.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No attachments present.</p>
        ) : (
          attachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between p-2 rounded bg-white dark:bg-gray-900 border text-xs">
              <div className="truncate max-w-xs">
                <span className="font-medium text-gray-900 dark:text-gray-100 block truncate">{att.fileName}</span>
                <span className="text-gray-500 text-[10px]">
                  {Math.round(att.fileSizeBytes / 1024)} KB · v{att.versionNumber} · {att.uploaderName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={att.downloadUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Download
                </a>
                <button
                  onClick={() => handleRemove(att.id)}
                  className="text-xs text-red-600 hover:text-red-700"
                  aria-label={`Remove ${att.fileName}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
