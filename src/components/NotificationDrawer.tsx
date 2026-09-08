import React, { useState, useEffect, useRef } from 'react';
import { UserNotification, UserRole } from '../types/collaboration';

interface NotificationDrawerProps {
  currentUserRole?: UserRole;
  projectId?: string | null;
  demoToken?: string;
  onSelectTask?: (taskId: string, activityType?: string, activityId?: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  currentUserRole = 'LEGAL_COUNSEL',
  projectId = 'proj-default',
  demoToken,
  onSelectTask,
}) => {
  const effectiveProjectId = projectId || 'proj-default';
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [validTaskMap, setValidTaskMap] = useState<Map<string, string>>(new Map());
  const [announcement, setAnnouncement] = useState<string>('');

  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const fetchNotificationsAndTasks = async () => {
    try {
      const headers: Record<string, string> = {};
      if (demoToken) headers['x-demo-token'] = demoToken;
      const [notifsRes, actionsRes] = await Promise.all([
        fetch(`/api/notifications?userId=${currentUserRole}`, { headers }),
        fetch(`/api/projects/${effectiveProjectId}/actions`, { headers }),
      ]);

      if (notifsRes.ok) {
        const data = await notifsRes.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }

      if (actionsRes.ok) {
        const actionsData = await actionsRes.json();
        const actionList = Array.isArray(actionsData) ? actionsData : actionsData.actions || [];
        const taskMap = new Map<string, string>();
        actionList.forEach((a: any) => {
          if (a.id) taskMap.set(a.id, a.title || a.id);
        });
        setValidTaskMap(taskMap);
      }
    } catch (err) {
      console.error('Failed to fetch notifications or actions:', err);
    }
  };

  useEffect(() => {
    fetchNotificationsAndTasks();
    const interval = setInterval(fetchNotificationsAndTasks, 15000);
    return () => clearInterval(interval);
  }, [currentUserRole, projectId]);

  // Keyboard Escape and Click-Outside Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkRead = async (id: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (demoToken) headers['x-demo-token'] = demoToken;
      await fetch(`/api/notifications/${id}/read`, { method: 'POST', headers });
      fetchNotificationsAndTasks();
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
      fetchNotificationsAndTasks();
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} data-notification-drawer="true">
      <button
        ref={triggerRef}
        id="notification-drawer-button"
        className="btn-secondary touch-target"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setAnnouncement('');
            fetchNotificationsAndTasks();
          }
        }}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        style={{
          fontSize: '0.8rem',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderColor: isOpen ? 'var(--accent-cyan)' : 'var(--border-color)',
        }}
      >
        <span>🔔 Alerts</span>
        {unreadCount > 0 && (
          <span
            style={{
              padding: '1px 6px',
              fontSize: '0.65rem',
              fontWeight: 700,
              borderRadius: '10px',
              background: 'var(--crit, #ef4444)',
              color: '#ffffff',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Accessible Live Region */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        data-testid="notification-live-announcement"
      >
        {announcement || (unreadCount > 0 ? `${unreadCount} unread in-product notifications` : 'No unread notifications')}
      </div>

      {isOpen && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-label="In-Product Notifications"
          style={{
            position: 'fixed',
            top: '64px',
            right: '12px',
            width: 'min(340px, calc(100vw - 24px))',
            maxWidth: 'calc(100vw - 24px)',
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            background: 'var(--bg-panel, #151B23)',
            border: '1px solid var(--border-color, #242E3A)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
            padding: '14px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
              In-Product Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan, #38bdf8)',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 4px',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto', paddingRight: '2px' }}>
            {notifications.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px' }}>
                No notifications found.
              </p>
            ) : (
              notifications.map((n) => {
                const taskId = n.targetTaskId || (n as any).taskId || (n as any).actionId || '';
                const isTaskMissing = Boolean(taskId && validTaskMap.size > 0 && !validTaskMap.has(taskId));
                const isLinkDisabled = Boolean(n.targetCommentDeleted || isTaskMissing);

                // Extract clean human task title from notification title
                const cleanTaskTitle = n.title
                  ? n.title.replace(/^Mentioned on Task (?:[A-Za-z0-9_-]+:\s*)?/i, '').replace(/^Mentioned on Task:\s*/i, '').trim()
                  : '';
                const effectiveTitle = taskId
                  ? `Mentioned on Task ${taskId}: ${cleanTaskTitle}`
                  : (n.title || 'Notification');
                const effectiveMessage = n.message;

                const accessibleLabel = n.targetCommentDeleted
                  ? `Referenced comment was deleted — link disabled for ${effectiveTitle}`
                  : isTaskMissing
                  ? `Referenced task was deleted or not found — link disabled for ${effectiveTitle}`
                  : taskId
                  ? `Jump to task ${taskId}: ${cleanTaskTitle} - ${effectiveMessage}`
                  : `${effectiveTitle} - ${effectiveMessage}`;

                return (
                  <button
                    key={n.id}
                    type="button"
                    data-notification-item="true"
                    data-notification-target-task={taskId}
                    data-notification-disabled={isLinkDisabled ? 'true' : 'false'}
                    aria-disabled={isLinkDisabled ? 'true' : undefined}
                    aria-label={accessibleLabel}
                    onClick={() => {
                      handleMarkRead(n.id);
                      if (isLinkDisabled || isTaskMissing || !taskId) {
                        setAnnouncement('This task is no longer available.');
                        setIsOpen(true);
                        return;
                      }
                      const activityType = n.targetActivityType || 'COMMENT';
                      if (onSelectTask) {
                        onSelectTask(taskId, activityType, n.targetActivityId || 'cmt-seed-01');
                        setIsOpen(false);
                      }
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${!n.isRead ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                      background: isLinkDisabled
                        ? 'rgba(255, 255, 255, 0.02)'
                        : !n.isRead
                        ? 'rgba(56, 189, 248, 0.08)'
                        : 'rgba(255, 255, 255, 0.04)',
                      opacity: isLinkDisabled ? 0.6 : 1,
                      cursor: isLinkDisabled ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'background 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {effectiveTitle}
                      </span>
                      {!n.isRead && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0, lineHeight: 1.3 }}>
                      {effectiveMessage}
                    </p>
                    {n.targetCommentDeleted ? (
                      <span
                        data-testid="tombstone-badge"
                        style={{
                          display: 'inline-block',
                          marginTop: '2px',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          color: 'var(--crit, #ef4444)',
                          background: 'rgba(239, 68, 68, 0.15)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          width: 'fit-content',
                        }}
                      >
                        Link Disabled: Referenced comment was deleted
                      </span>
                    ) : isTaskMissing ? (
                      <span
                        data-testid="tombstone-badge"
                        style={{
                          display: 'inline-block',
                          marginTop: '2px',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          color: 'var(--warn, #f59e0b)',
                          background: 'rgba(245, 158, 11, 0.15)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          width: 'fit-content',
                        }}
                      >
                        Link Disabled: Referenced task not found
                      </span>
                    ) : null}
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
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
