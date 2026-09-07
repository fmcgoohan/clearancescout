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
    <div
      data-testid="attachment-list"
      style={{
        borderTop: '1px solid var(--border-color)',
        paddingTop: '14px',
        marginTop: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
          Attachments & Proof ({attachments.length})
        </h4>
        <label
          className="btn-secondary touch-target"
          style={{
            fontSize: '0.72rem',
            padding: '4px 10px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            borderColor: 'var(--border-color)',
            background: 'var(--bg-secondary, rgba(255, 255, 255, 0.05))',
            color: 'var(--text-main)',
            borderRadius: '6px',
          }}
        >
          {uploading ? 'Uploading...' : '+ Attach File'}
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
            aria-label="Attach clearance evidence file"
          />
        </label>
      </div>

      {error && (
        <div style={{ fontSize: '0.72rem', color: 'var(--crit, #ef4444)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {attachments.length === 0 ? (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, padding: '4px 0' }}>
            No attachments present.
          </p>
        ) : (
          attachments.map((att) => (
            <div
              key={att.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                gap: '8px',
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {att.fileName}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                  {Math.round(att.fileSizeBytes / 1024)} KB · v{att.versionNumber} · {att.uploaderName}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <a
                  href={att.downloadUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.72rem', color: 'var(--accent-cyan, #38bdf8)', textDecoration: 'underline' }}
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(att.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px 4px',
                    fontSize: '0.72rem',
                    color: 'var(--crit, #ef4444)',
                    cursor: 'pointer',
                  }}
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
