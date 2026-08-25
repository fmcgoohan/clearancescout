import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient.js';
import { pluralize, formatStatus, formatDepartment, formatPriority } from '../utils/formatters.js';
import { TERMINOLOGY } from '../constants/terminology.js';
import { useModalFocus } from '../hooks/useModalFocus.js';
import {
  FileTextIcon,
  RefreshCwIcon,
  XIcon,
} from './icons/Icons';

export interface ActionAssignee {
  id: string;
  name: string;
  role: string;
}

export interface ActionAuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  eventType: 'CREATED' | 'ASSIGNED' | 'REASSIGNED' | 'DUE_DATE_CHANGED' | 'STATUS_CHANGED' | 'RESOLVED' | 'REOPENED';
  beforeState?: string;
  afterState?: string;
  description: string;
}

export interface ClearanceActionItem {
  id: string;
  projectId: string;
  sceneId?: string;
  sceneNumber?: number;
  canonicalEntityId?: string;
  canonicalName?: string;
  occurrenceId?: string;
  actionType: string;
  targetDepartment: 'ART_DEPT' | 'LEGAL_COUNSEL' | 'LOCATIONS' | 'PRODUCTION_MGMT' | 'CLEARANCE_TEAM';
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
  assignee?: ActionAssignee;
  dueDate?: string;
  isOverdue?: boolean;
  activityHistory?: ActionAuditEvent[];
  resolutionTrigger?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface ClearanceNotification {
  id: string;
  projectId: string;
  sceneId?: string;
  sceneNumber?: number;
  targetDepartment: string;
  headline: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';
  isRead: boolean;
  createdAt: string;
}

interface ActionListModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onActionUpdated?: () => void;
}

export const ActionListModal: React.FC<ActionListModalProps> = ({
  isOpen,
  projectId,
  onClose,
  onActionUpdated,
}) => {
  const [actions, setActions] = useState<ClearanceActionItem[]>([]);
  const [notifications, setNotifications] = useState<ClearanceNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ART_DEPT' | 'LEGAL_COUNSEL' | 'LOCATIONS' | 'PRODUCTION_MGMT' | 'NOTIFICATIONS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('OPEN');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});
  const [assigneeDrafts, setAssigneeDrafts] = useState<Record<string, string>>({});

  const { containerRef } = useModalFocus<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const fetchActionsAndNotifications = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [actionsRes, notifsRes] = await Promise.all([
        apiFetch(`/api/projects/${projectId}/actions`),
        apiFetch(`/api/projects/${projectId}/notifications`),
      ]);

      if (actionsRes.ok) {
        const data = await actionsRes.json();
        setActions(data);
      }
      if (notifsRes.ok) {
        const data = await notifsRes.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load actions/notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActionsAndNotifications();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleHistory = (actionId: string) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [actionId]: !prev[actionId],
    }));
  };

  const getAssigneeValue = (act: ClearanceActionItem) => {
    if (assigneeDrafts[act.id] !== undefined) {
      return assigneeDrafts[act.id];
    }
    return act.assignee?.name || '';
  };

  const handleAssigneeChange = (actionId: string, value: string) => {
    setAssigneeDrafts((prev) => ({
      ...prev,
      [actionId]: value,
    }));
  };

  const handleAssigneeCommit = (act: ClearanceActionItem) => {
    const draftVal = assigneeDrafts[act.id];
    if (draftVal === undefined) return;

    const currentVal = act.assignee?.name || '';
    if (draftVal.trim() === currentVal.trim()) {
      setAssigneeDrafts((prev) => {
        const next = { ...prev };
        delete next[act.id];
        return next;
      });
      return;
    }

    handleUpdateAssignee(act.id, draftVal, act.assignee?.role || 'Coordinator');
  };

  const handleUpdateAssignee = async (actionId: string, name: string, role: string = 'Coordinator') => {
    const trimmed = name.trim();
    const assigneeObj = trimmed ? { id: `usr-${trimmed.toLowerCase().replace(/\s+/g, '-')}`, name: trimmed, role } : null;

    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, assignee: assigneeObj || undefined } : a))
    );
    setAssigneeDrafts((prev) => {
      const next = { ...prev };
      delete next[actionId];
      return next;
    });

    try {
      const res = await apiFetch(`/api/projects/${projectId}/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignee: assigneeObj,
          actor: 'Legal Coordinator',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActions((prev) => prev.map((a) => (a.id === actionId ? updated : a)));
        onActionUpdated?.();
      }
    } catch (err) {
      console.error('Failed to update assignee:', err);
    }
  };

  const handleUpdateDueDate = async (actionId: string, dueDateStr: string) => {
    const isOverdueCalc = Boolean(
      dueDateStr &&
      new Date(dueDateStr).getTime() < Date.now()
    );
    setActions((prev) =>
      prev.map((a) =>
        a.id === actionId
          ? {
              ...a,
              dueDate: dueDateStr || undefined,
              isOverdue: isOverdueCalc && a.status !== 'RESOLVED' && a.status !== 'DISMISSED',
            }
          : a
      )
    );

    try {
      const res = await apiFetch(`/api/projects/${projectId}/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDate: dueDateStr || null,
          actor: 'Legal Coordinator',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActions((prev) => prev.map((a) => (a.id === actionId ? updated : a)));
        onActionUpdated?.();
      }
    } catch (err) {
      console.error('Failed to update due date:', err);
    }
  };

  const handleUpdateStatus = async (actionId: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED') => {
    // Optimistic in-place update without layout shift
    setActions((prev) =>
      prev.map((a) =>
        a.id === actionId
          ? {
              ...a,
              status: newStatus,
              resolutionTrigger: newStatus === 'RESOLVED' ? 'MANUAL_COORDINATOR_SIGN_OFF' : a.resolutionTrigger,
              resolvedAt: newStatus === 'RESOLVED' ? new Date().toISOString() : undefined,
            }
          : a
      )
    );

    try {
      const res = await apiFetch(`/api/projects/${projectId}/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolutionTrigger: newStatus === 'RESOLVED' ? 'MANUAL_COORDINATOR_SIGN_OFF' : undefined,
          actor: 'Legal Coordinator',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActions((prev) => prev.map((a) => (a.id === actionId ? updated : a)));
        onActionUpdated?.();
      }
    } catch (err) {
      console.error('Failed to update action status:', err);
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      const res = await apiFetch(`/api/projects/${projectId}/notifications/${notifId}/read`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)));
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleSyncActions = async () => {
    setIsSyncing(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/actions/sync`, { method: 'POST' });
      if (res.ok) {
        await fetchActionsAndNotifications();
        onActionUpdated?.();
      }
    } catch (err) {
      console.error('Failed to sync actions:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredActions = actions.filter((act) => {
    if (activeTab !== 'ALL' && act.targetDepartment !== activeTab) return false;
    if (statusFilter === 'RESOLVED' && act.status !== 'RESOLVED') return false;
    return true;
  });

  const openCount = actions.filter((a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS').length;
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;
  const artCount = actions.filter((a) => (a.status === 'OPEN' || a.status === 'IN_PROGRESS') && a.targetDepartment === 'ART_DEPT').length;
  const legalCount = actions.filter((a) => (a.status === 'OPEN' || a.status === 'IN_PROGRESS') && a.targetDepartment === 'LEGAL_COUNSEL').length;
  const locCount = actions.filter((a) => (a.status === 'OPEN' || a.status === 'IN_PROGRESS') && a.targetDepartment === 'LOCATIONS').length;
  const prodCount = actions.filter((a) => (a.status === 'OPEN' || a.status === 'IN_PROGRESS') && a.targetDepartment === 'PRODUCTION_MGMT').length;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1400,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 id="action-modal-title" style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileTextIcon size={20} className="text-cyan-400" />
              <span>Production Clearance Action & Notification Center</span>
            </h2>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: openCount > 0 ? 'var(--status-action-bg)' : 'var(--status-no-issue-bg)',
                color: openCount > 0 ? 'var(--status-action)' : 'var(--status-no-issue)',
                border: openCount > 0 ? '1px solid var(--status-action-border)' : '1px solid var(--status-no-issue-border)',
                fontWeight: 600,
              }}
            >
              {filteredActions.length} of {actions.length} {pluralize(actions.length, 'Task', 'Tasks')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={handleSyncActions}
              disabled={isSyncing}
              style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCwIcon size={14} />
              <span>{isSyncing ? 'Syncing...' : 'Re-Sync'}</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close action modal"
            >
              <XIcon size={18} />
            </button>
          </div>
        </div>

        {/* Department Tabs & Filter Controls */}
        <div
          style={{
            padding: '12px 24px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: `All Actions (${openCount})` },
              { key: 'ART_DEPT', label: `Art Dept (${artCount})` },
              { key: 'LEGAL_COUNSEL', label: `Legal Counsel (${legalCount})` },
              { key: 'LOCATIONS', label: `Locations (${locCount})` },
              { key: 'PRODUCTION_MGMT', label: `Production (${prodCount})` },
              { key: 'NOTIFICATIONS', label: `Alerts (${unreadNotifsCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: activeTab === tab.key ? 'var(--accent-cyan)' : 'var(--border-color)',
                  background: activeTab === tab.key ? 'rgba(0, 240, 255, 0.15)' : 'var(--bg-card)',
                  color: activeTab === tab.key ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab !== 'NOTIFICATIONS' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                aria-label="Filter actions by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                }}
              >
                <option value="ALL">All</option>
                <option value="OPEN">Open Only</option>
                <option value="RESOLVED">Resolved Only</option>
              </select>
            </div>
          )}
        </div>

        {/* Accessible Live Announcement Region for Screen Readers */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {isLoading
            ? 'Loading action items...'
            : activeTab === 'NOTIFICATIONS'
            ? `Showing ${notifications.length} notifications`
            : `Showing ${filteredActions.length} of ${actions.length} department tasks`}
        </div>

        {/* Modal Body with Explicit ARIA List Semantics */}
        <div
          role="list"
          aria-label={`Department Tasks List (${filteredActions.length} items)`}
          aria-setsize={filteredActions.length}
          style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {isLoading ? (
            <div role="status" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Loading action items...
            </div>
          ) : activeTab === 'NOTIFICATIONS' ? (
            notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No active notifications or shoot blocker alerts.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '8px',
                    background: notif.isRead ? 'var(--bg-card)' : 'rgba(239, 68, 68, 0.08)',
                    border: notif.isRead ? '1px solid var(--border-color)' : '1px solid rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: notif.isRead ? 'var(--text-main)' : '#f87171', marginBottom: '4px' }}>
                      {notif.headline}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{notif.message}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {new Date(notif.createdAt).toLocaleTimeString()} • Target: {notif.targetDepartment}
                    </div>
                  </div>
                  {!notif.isRead && (
                    <button
                      className="btn-secondary"
                      onClick={() => handleMarkNotificationRead(notif.id)}
                      style={{ fontSize: '0.75rem', padding: '4px 8px', whiteSpace: 'nowrap' }}
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))
            )
          ) : filteredActions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No action items found matching current filters.
            </div>
          ) : (
            filteredActions.map((act, idx) => (
              <div
                key={act.id}
                role="listitem"
                aria-posinset={idx + 1}
                aria-setsize={filteredActions.length}
                aria-label={`Task ${idx + 1} of ${filteredActions.length}: ${act.title}`}
                style={{
                  padding: '14px 18px',
                  borderRadius: '8px',
                  background: act.status === 'RESOLVED' ? 'rgba(52, 211, 153, 0.05)' : 'var(--bg-card)',
                  border: act.status === 'RESOLVED' ? '1px solid rgba(52, 211, 153, 0.25)' : '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  borderLeft:
                    act.status === 'RESOLVED'
                      ? '4px solid #34d399'
                      : act.priority === 'CRITICAL'
                      ? '4px solid #ef4444'
                      : act.priority === 'HIGH'
                      ? '4px solid #f97316'
                      : '4px solid #38bdf8',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background:
                          act.priority === 'CRITICAL'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : act.priority === 'HIGH'
                            ? 'rgba(249, 115, 22, 0.2)'
                            : 'rgba(56, 189, 248, 0.2)',
                        color:
                          act.priority === 'CRITICAL'
                            ? '#f87171'
                            : act.priority === 'HIGH'
                            ? '#fb923c'
                            : '#38bdf8',
                      }}
                    >
                      {formatPriority(act.priority)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {formatDepartment(act.targetDepartment)}
                    </span>
                    {act.status === 'RESOLVED' && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(52, 211, 153, 0.15)',
                          color: '#34d399',
                          fontWeight: 600,
                        }}
                      >
                        {formatStatus(act.status)}
                      </span>
                    )}
                    {act.status === 'IN_PROGRESS' && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(251, 191, 36, 0.15)',
                          color: '#fbbf24',
                          fontWeight: 600,
                        }}
                      >
                        {formatStatus(act.status)}
                      </span>
                    )}
                    {act.status === 'OPEN' && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          fontWeight: 600,
                        }}
                      >
                        {formatStatus(act.status)}
                      </span>
                    )}
                    {act.isOverdue && (
                      <span
                        data-overdue="true"
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.25)',
                          color: '#f87171',
                          border: '1px solid #ef4444',
                        }}
                      >
                        OVERDUE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {act.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {act.description}
                  </div>
                  {TERMINOLOGY.DEPARTMENT_ROUTING_REASONS[act.targetDepartment] && (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '4px' }}>
                      {TERMINOLOGY.DEPARTMENT_ROUTING_REASONS[act.targetDepartment]}
                    </div>
                  )}
                  {act.resolutionTrigger && (
                    <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '4px' }}>
                      Resolved via: {formatStatus(act.resolutionTrigger)}
                    </div>
                  )}

                  {/* Task Ownership & Due Date Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Assignee:</span>
                      <input
                        type="text"
                        aria-label={`Assignee Name for ${act.title}`}
                        placeholder="Assignee Name"
                        value={getAssigneeValue(act)}
                        onChange={(e) => handleAssigneeChange(act.id, e.target.value)}
                        onBlur={() => handleAssigneeCommit(act)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          color: 'var(--text-main)',
                          fontSize: '0.75rem',
                          width: '140px',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Due:</span>
                      <input
                        type="date"
                        aria-label={`Due Date for ${act.title}`}
                        value={act.dueDate ? act.dueDate.slice(0, 10) : ''}
                        onChange={(e) => handleUpdateDueDate(act.id, e.target.value)}
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          color: 'var(--text-main)',
                          fontSize: '0.75rem',
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => toggleHistory(act.id)}
                      style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    >
                      {expandedHistory[act.id] ? 'Hide Audit History' : `Audit History (${act.activityHistory?.length || 0})`}
                    </button>
                  </div>

                  {/* Expandable Activity History Timeline */}
                  {expandedHistory[act.id] && (
                    <div
                      data-audit-history="true"
                      style={{
                        marginTop: '10px',
                        padding: '10px 12px',
                        background: 'rgba(0,0,0,0.25)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.73rem',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                        Audit Trail ({act.activityHistory?.length || 0} events)
                      </div>
                      {(!act.activityHistory || act.activityHistory.length === 0) ? (
                        <div style={{ color: 'var(--text-muted)' }}>No audit history recorded.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {act.activityHistory.map((evt) => (
                            <div key={evt.id} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                                {new Date(evt.timestamp).toLocaleString()}
                              </span>
                              <span style={{ fontWeight: 600, color: '#38bdf8' }}>[{evt.eventType}]</span>
                              <span style={{ color: 'var(--text-muted)' }}>{evt.actor}:</span>
                              <span style={{ color: 'var(--text-main)' }}>{evt.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Status Update Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '110px' }}>
                  {act.status !== 'RESOLVED' ? (
                    <>
                      <button
                        className="btn-primary"
                        onClick={() => handleUpdateStatus(act.id, 'RESOLVED')}
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        Resolve
                      </button>
                      {act.status === 'OPEN' && (
                        <button
                          className="btn-secondary"
                          onClick={() => handleUpdateStatus(act.id, 'IN_PROGRESS')}
                          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                        >
                          In Progress
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      className="btn-secondary"
                      onClick={() => handleUpdateStatus(act.id, 'OPEN')}
                      style={{ fontSize: '0.72rem', padding: '4px 8px', color: 'var(--text-muted)' }}
                    >
                      Re-open
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
