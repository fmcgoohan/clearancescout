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
    <div className="space-y-4 border-t pt-4 mt-4" data-testid="comment-thread">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Activity & Discussion ({comments.length})
        </h4>
        <span className="text-xs text-gray-500">Tip: use @LegalCounsel or @SarahJenkins to mention</span>
      </div>

      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No comments yet. Start the discussion below.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="p-2.5 rounded bg-gray-50 dark:bg-gray-800 border text-xs space-y-1">
              <div className="flex items-center justify-between text-gray-500">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{c.authorName} ({c.authorRole})</span>
                <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))
        )}
      </div>

      {error && <div className="text-xs text-red-600 dark:text-red-400">{error}</div>}

      <form onSubmit={handlePostComment} className="flex gap-2">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment or @mention..."
          className="flex-1 px-3 py-1.5 text-xs rounded border focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          aria-label="Add a task comment"
        />
        <button
          type="submit"
          disabled={loading || !newCommentText.trim()}
          className="px-3 py-1.5 text-xs font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Comment'}
        </button>
      </form>
    </div>
  );
};
