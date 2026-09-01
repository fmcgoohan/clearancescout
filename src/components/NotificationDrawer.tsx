import React, { useState, useEffect } from 'react';
import { UserNotification, UserRole } from '../types/collaboration';

interface NotificationDrawerProps {
  currentUserRole?: UserRole;
  demoToken?: string;
  onSelectTask?: (taskId: string, activityType?: string, activityId?: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  currentUserRole = 'LEGAL_COUNSEL',
  demoToken,
  onSelectTask,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const headers: Record<string, string> = {};
      if (demoToken) headers['x-demo-token'] = demoToken;
      const res = await fetch(`/api/notifications?userId=${currentUserRole}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUserRole]);

  const handleMarkRead = async (id: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (demoToken) headers['x-demo-token'] = demoToken;
      await fetch(`/api/notifications/${id}/read`, { method: 'POST', headers });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (demoToken) headers['x-demo-token'] = demoToken;
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: currentUserRole }),
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  return (
    <div className="relative inline-block" data-notification-drawer="true">
      <button
        id="notification-drawer-button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative px-2.5 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center gap-1.5"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <span>🔔 Alerts</span>
        {unreadCount > 0 && (
          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-600 text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Accessible Live Region */}
      <div role="status" aria-live="polite" className="sr-only">
        {unreadCount > 0 ? `${unreadCount} unread in-product notifications` : 'No unread notifications'}
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 z-50 p-3 space-y-3"
        >
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">In-Product Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-2">No notifications found.</p>
            ) : (
              notifications.map((n) => {
                const taskId = n.targetTaskId || (n as any).taskId || (n as any).actionId || 'TASK-101';
                // Extract clean human task title from notification title
                const cleanTaskTitle = n.title
                  .replace(/^Mentioned on Task (?:[A-Za-z0-9_-]+:\s*)?/i, '')
                  .replace(/^Mentioned on Task:\s*/i, '')
                  .trim();
                const effectiveTitle = `Mentioned on Task ${taskId}: ${cleanTaskTitle}`;
                const effectiveMessage = n.message;

                return (
                  <button
                    key={n.id}
                    type="button"
                    data-notification-item="true"
                    data-notification-target-task={taskId}
                    aria-label={
                      n.targetCommentDeleted
                        ? `Referenced comment was deleted — link disabled for ${effectiveTitle}`
                        : `Jump to task ${taskId}: ${cleanTaskTitle} - ${effectiveMessage}`
                    }
                    onClick={() => {
                      handleMarkRead(n.id);
                      if (n.targetCommentDeleted) {
                        return;
                      }
                      const activityType = n.targetActivityType || 'COMMENT';
                      if (taskId && onSelectTask) {
                        onSelectTask(taskId, activityType, n.targetActivityId || 'cmt-seed-01');
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full text-left p-2 rounded border text-xs cursor-pointer transition ${
                      !n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200' : 'bg-gray-50 dark:bg-gray-800'
                    } ${n.targetCommentDeleted ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 block truncate">{effectiveTitle}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" />}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-[11px] mt-0.5">{effectiveMessage}</p>
                  {n.targetCommentDeleted && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                      Link Disabled: Referenced comment was deleted
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 block mt-1">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
