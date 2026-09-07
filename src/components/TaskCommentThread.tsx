import React, { useState, useEffect } from 'react';
import { TaskComment, UserRole, Department } from '../types/collaboration';

interface TaskCommentThreadProps {
  taskId: string;
  projectId?: string;
  currentUserRole?: UserRole;
  currentDepartment?: Department;
  demoToken?: string;
}

export const TaskCommentThread: React.FC<TaskCommentThreadProps> = ({
  taskId,
  projectId = 'proj-default',
  currentUserRole = 'CLEARANCE_COORDINATOR',
  currentDepartment = 'LEGAL_COUNSEL',
  demoToken,
}) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const headers: Record<string, string> = {};
      if (demoToken) headers['x-demo-token'] = demoToken;
      const res = await fetch(`/api/tasks/${taskId}/comments`, { headers });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (demoToken) headers['x-demo-token'] = demoToken;

      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: newCommentText,
          authorId: 'usr-current',
          authorName: currentUserRole === 'LEGAL_COUNSEL' ? 'Sarah Jenkins' : 'Clearance Coordinator',
          authorRole: currentUserRole,
          authorDepartment: currentDepartment,
          projectId,
        }),
      });

      if (res.ok) {
        setNewCommentText('');
        fetchComments();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to post comment');
      }
    } catch (err: any) {
      setError(err.message || 'Error posting comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="comment-thread"
      style={{
        borderTop: '1px solid var(--border-color)',
        paddingTop: '14px',
        marginTop: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
          Activity & Discussion ({comments.length})
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Tip: use @LegalCounsel or @SarahJenkins to mention
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '2px' }}>
        {comments.length === 0 ? (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
            No comments yet. Start the discussion below.
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {c.authorName} ({c.authorRole})
                </span>
                <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p style={{ color: 'var(--text-main)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>{c.content}</p>
            </div>
          ))
        )}
      </div>

      {error && (
        <div style={{ fontSize: '0.72rem', color: 'var(--crit, #ef4444)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment or @mention..."
          aria-label="Add a task comment"
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '0.75rem',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'rgba(0, 0, 0, 0.3)',
            color: 'var(--text-main)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !newCommentText.trim()}
          className="btn-primary touch-target"
          style={{
            fontSize: '0.75rem',
            padding: '6px 14px',
            opacity: loading || !newCommentText.trim() ? 0.5 : 1,
            cursor: loading || !newCommentText.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Posting...' : 'Comment'}
        </button>
      </form>
    </div>
  );
};
