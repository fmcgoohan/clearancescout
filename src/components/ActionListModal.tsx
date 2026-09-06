import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient.js';
import { pluralize, formatStatus, formatDepartment, formatPriority } from '../utils/formatters.js';
import { TERMINOLOGY } from '../constants/terminology.js';
import { useModalFocus } from '../hooks/useModalFocus.js';
import { FileTextIcon, RefreshCwIcon, XIcon } from './icons/Icons';
import { TaskCommentThread } from './TaskCommentThread';
import { TaskAttachmentList } from './TaskAttachmentList';
import { BulkActionBar } from './BulkActionBar';
import { SavedViewSelector } from './SavedViewSelector';
import { FilterParams } from '../types/collaboration';
import { getDemoToken } from '../utils/apiClient.js';

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
  resolutionReason?: string;
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
  targetTaskId?: string;
  targetActivityType?: string;
  targetActivityId?: string;
  embedded?: boolean;
}

export const ActionListModal: React.FC<ActionListModalProps> = ({
  isOpen,
  projectId,
  onClose,
  onActionUpdated,
  targetTaskId,
  targetActivityType,
  targetActivityId,
  embedded = false,
}) => {
  const [actions, setActions] = useState<ClearanceActionItem[]>([]);
  const [notifications, setNotifications] = useState<ClearanceNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ART_DEPT' | 'LEGAL_COUNSEL' | 'LOCATIONS' | 'PRODUCTION_MGMT' | 'NOTIFICATIONS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('OPEN');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [expandedAttachments, setExpandedAttachments] = useState<Record<string, boolean>>({});
  const [densityMode, setDensityMode] = useState<'COMFORTABLE' | 'COMPACT'>('COMFORTABLE');
  const [assigneeDrafts, setAssigneeDrafts] = useState<Record<string, string>>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [activeFilterState, setActiveFilterState] = useState<FilterParams>({});

  const [navAnnouncement, setNavAnnouncement] = useState<string>('');
  const focusedTaskIdRef = React.useRef<string | null>(null);
  const targetTaskHeadingRef = React.useRef<HTMLHeadingElement | null>(null);

  const { containerRef } = useModalFocus<HTMLDivElement>({
    isOpen: !embedded && isOpen,
    onClose,
    initialFocusRef: targetTaskId ? targetTaskHeadingRef : undefined,
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
        setActions(Array.isArray(data) ? data : data.actions || []);
      }
      if (notifsRes.ok) {
        const data = await notifsRes.json();
        setNotifications(Array.isArray(data) ? data : data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch actions or notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActionsAndNotifications();
    } else {
      setIsLoading(true);
    }
  }, [isOpen, projectId]);

  // Deep-link handling for notifications
  useEffect(() => {
    if (isOpen && targetTaskId) {
      setActiveTab('ALL');
      setStatusFilter('ALL');

      const matchedTask = actions.find((a) => a.id === targetTaskId);

      if (matchedTask) {
        const effectiveTaskId = matchedTask.id;
        const taskTitle = matchedTask.title;

        if (targetActivityType === 'ATTACHMENT') {
          setExpandedAttachments((prev) => ({ ...prev, [effectiveTaskId]: true }));
        } else if (targetActivityType === 'ASSIGNMENT' || targetActivityType === 'STATUS') {
          setExpandedHistory((prev) => ({ ...prev, [effectiveTaskId]: true }));
        } else {
          setExpandedComments((prev) => ({ ...prev, [effectiveTaskId]: true }));
        }

        setNavAnnouncement(`Navigated to task: ${taskTitle}`);

        if (!isLoading && actions.length > 0) {
          const timer = setTimeout(() => {
            const headingEl =
              document.getElementById(`task-heading-${effectiveTaskId}`) ||
              document.getElementById(`task-card-${effectiveTaskId}`);
            if (headingEl) {
              headingEl.scrollIntoView({ behavior: 'auto', block: 'center' });
              headingEl.setAttribute('tabindex', '-1');
              requestAnimationFrame(() => {
                headingEl.focus();
                focusedTaskIdRef.current = effectiveTaskId;
              });
            }
          }, 50);
          return () => clearTimeout(timer);
        }
      } else if (!isLoading && actions.length > 0) {
        // Missing / orphan task target: do NOT announce false success and do NOT focus unrelated task
        setNavAnnouncement('This task is no longer available.');
        focusedTaskIdRef.current = null;
      }
    } else if (!isOpen) {
      focusedTaskIdRef.current = null;
      setNavAnnouncement('');
    }
  }, [isOpen, targetTaskId, targetActivityType, actions, isLoading]);

  const handleSyncActions = async () => {
    if (!projectId) return;
    setIsSyncing(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/actions/sync`, { method: 'POST' });
      if (res.ok) {
        await fetchActionsAndNotifications();
        if (onActionUpdated) onActionUpdated();
      }
    } catch (err) {
      console.error('Failed to sync actions:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateStatus = async (actionId: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    try {
      const res = await apiFetch(`/api/projects/${projectId}/actions/${actionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          actor: 'User',
          reason: `Status changed to ${newStatus}`,
        }),
      });

      if (res.ok) {
        await fetchActionsAndNotifications();
        if (onActionUpdated) onActionUpdated();
      }
    } catch (err) {
      console.error('Failed to update action status:', err);
    }
  };

  const handleUpdateDueDate = async (actionId: string, newDueDate: string) => {
    try {
      const res = await apiFetch(`/api/projects/${projectId}/actions/${actionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          dueDate: newDueDate,
          actor: 'User',
          reason: `Due date changed to ${newDueDate}`,
        }),
      });

      if (res.ok) {
        await fetchActionsAndNotifications();
        if (onActionUpdated) onActionUpdated();
      }
    } catch (err) {
      console.error('Failed to update due date:', err);
    }
  };

  const handleAssigneeChange = (actionId: string, value: string) => {
    setAssigneeDrafts((prev) => ({ ...prev, [actionId]: value }));
  };

  const handleAssigneeCommit = async (act: ClearanceActionItem) => {
    const draftName = assigneeDrafts[act.id];
    if (draftName === undefined) return;

    const currentName = act.assignee?.name || '';
    if (draftName.trim() === currentName) return;

    try {
      const assigneeObj = draftName.trim()
        ? { id: `usr-${draftName.toLowerCase().replace(/\s+/g, '-')}`, name: draftName.trim(), role: 'Assignee' }
        : null;

      const res = await apiFetch(`/api/projects/${projectId}/actions/${act.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          assignee: assigneeObj,
          actor: 'User',
          reason: assigneeObj ? `Assigned to ${assigneeObj.name}` : 'Unassigned action item',
        }),
      });

      if (res.ok) {
        await fetchActionsAndNotifications();
        if (onActionUpdated) onActionUpdated();
      }
    } catch (err) {
      console.error('Failed to update assignee:', err);
    }
  };

  const getAssigneeValue = (act: ClearanceActionItem) => {
    if (assigneeDrafts[act.id] !== undefined) {
      return assigneeDrafts[act.id];
    }
    return act.assignee?.name || '';
  };

  const toggleHistory = (actionId: string) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [actionId]: !prev[actionId],
    }));
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  if (!isOpen && !embedded) return null;

  const isSuperseded = (act: ClearanceActionItem) =>
    act.resolutionTrigger === 'SCRIPT_REVISION_SUPERSEDED' || act.resolutionReason === 'SCRIPT_REVISION_SUPERSEDED';

  const activeDraftActions = actions.filter((act) => !isSuperseded(act));

  const filteredActions = activeDraftActions.filter((act) => {
    if (activeTab !== 'ALL' && act.targetDepartment !== activeTab) return false;
    if (statusFilter === 'OPEN' && act.status === 'RESOLVED') return false;
    if (statusFilter === 'RESOLVED' && act.status !== 'RESOLVED') return false;
    return true;
  });

  const openActions = activeDraftActions.filter((a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS');
  const openCount = openActions.length;
  const artCount = openActions.filter((a) => a.targetDepartment === 'ART_DEPT').length;
  const legalCount = openActions.filter((a) => a.targetDepartment === 'LEGAL_COUNSEL').length;
  const locCount = openActions.filter((a) => a.targetDepartment === 'LOCATIONS').length;
  const prodCount = openActions.filter((a) => a.targetDepartment === 'PRODUCTION_MGMT').length;
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  const contentBlock = (
    <div
      className="glass-panel"
      data-testid="department-tasks-panel"
      style={{
        width: '100%',
        maxWidth: embedded ? '100%' : '960px',
        maxHeight: embedded ? 'none' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: embedded ? 'none' : '0 20px 40px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        outline: 'none',
        position: 'relative',
      }}
    >
      {/* Polite Live Region for Notification Navigation Announcements */}
      <div role="status" aria-live="polite" className="sr-only" data-testid="nav-announcement">
        {navAnnouncement}
      </div>

      {/* Modal / Panel Header */}
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
            {isLoading || activeDraftActions.length === 0
              ? 'Loading tasks…'
              : `${filteredActions.length} of ${pluralize(activeDraftActions.length, 'Task', 'Tasks')}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={handleSyncActions}
            disabled={isSyncing || isLoading || actions.length === 0}
            style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCwIcon size={14} />
            <span>{isSyncing ? 'Syncing...' : 'Re-Sync'}</span>
          </button>
          {!embedded && (
            <button
              onClick={onClose}
              aria-label="Close action modal"
            >
              <XIcon size={18} />
            </button>
          )}
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
              { key: 'ALL', label: isLoading || actions.length === 0 ? 'All Actions (…)' : `All Actions (${openCount})` },
              { key: 'ART_DEPT', label: isLoading || actions.length === 0 ? 'Art Dept (…)' : `Art Dept (${artCount})` },
              { key: 'LEGAL_COUNSEL', label: isLoading || actions.length === 0 ? 'Legal Counsel (…)' : `Legal Counsel (${legalCount})` },
              { key: 'LOCATIONS', label: isLoading || actions.length === 0 ? 'Locations (…)' : `Locations (${locCount})` },
              { key: 'PRODUCTION_MGMT', label: isLoading || actions.length === 0 ? 'Production (…)' : `Production (${prodCount})` },
              { key: 'NOTIFICATIONS', label: isLoading ? 'Alerts (…)' : `Alerts (${unreadNotifsCount})` },
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <SavedViewSelector
                projectId={projectId}
                demoToken={(typeof getDemoToken === 'function' ? getDemoToken() : undefined) || undefined}
                activeFilterState={activeFilterState}
                onApplySavedView={(filters) => {
                  setActiveFilterState(filters);
                  if (filters.status && filters.status.length > 0) {
                    setStatusFilter(filters.status.includes('RESOLVED') ? 'RESOLVED' : 'OPEN');
                  }
                }}
              />
              <button
                className="btn-secondary text-xs"
                onClick={() => {
                  if (selectedTaskIds.length === filteredActions.length) {
                    setSelectedTaskIds([]);
                  } else {
                    setSelectedTaskIds(filteredActions.map((a) => a.id));
                  }
                }}
                aria-label={`Select all ${filteredActions.length} filtered results`}
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                {selectedTaskIds.length === filteredActions.length ? 'Deselect All Filtered' : `Select All Filtered (${filteredActions.length})`}
              </button>
              <button
                className="btn-secondary text-xs"
                onClick={() => setDensityMode(densityMode === 'COMFORTABLE' ? 'COMPACT' : 'COMFORTABLE')}
                aria-label={`Density Mode: ${densityMode}`}
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                {densityMode === 'COMFORTABLE' ? '📐 Compact' : '📜 Comfortable'}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            </div>
          )}
        </div>

        {/* Accessible Live Announcement Region for Screen Readers */}
        <div
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {isLoading || (actions.length === 0 && activeTab !== 'NOTIFICATIONS')
            ? 'Loading department tasks...'
            : activeTab === 'NOTIFICATIONS'
            ? `Showing ${notifications.length} alerts (${unreadNotifsCount} unread)`
            : `Showing ${filteredActions.length} of ${actions.length} department tasks`}
        </div>

        {/* Modal Content Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading action items...
            </div>
          ) : activeTab === 'NOTIFICATIONS' ? (
            /* Notifications List */
            notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No active notifications for this project.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: n.isRead ? 'var(--bg-card)' : 'rgba(0, 240, 255, 0.05)',
                      border: '1px solid',
                      borderColor: n.isRead ? 'var(--border-color)' : 'var(--accent-cyan)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {n.headline}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Actions Tasks List */
            filteredActions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No department actions match the selected filter.
              </div>
            ) : (
              <div
                role="list"
                aria-label={`Department Tasks List (${filteredActions.length} items)`}
                aria-setsize={filteredActions.length}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                {filteredActions.map((act, idx) => (
                  <div
                    key={act.id}
                    id={`task-card-${act.id}`}
                    role="listitem"
                    aria-posinset={idx + 1}
                    aria-setsize={filteredActions.length}
                    data-task-card="true"
                    style={{
                      padding: densityMode === 'COMPACT' ? '10px 14px' : '16px 20px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: targetTaskId === act.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '16px',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(act.id)}
                        onChange={() => toggleTaskSelection(act.id)}
                        aria-label={`Select task ${act.title}`}
                        style={{ marginTop: '4px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(0, 240, 255, 0.1)',
                              color: 'var(--accent-cyan)',
                              border: '1px solid rgba(0, 240, 255, 0.3)',
                            }}
                          >
                            {formatDepartment(act.targetDepartment)}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {formatPriority(act.priority)}
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
                        <h4
                          id={`task-heading-${act.id}`}
                          tabIndex={-1}
                          ref={act.id === targetTaskId ? targetTaskHeadingRef : undefined}
                          style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px', outline: 'none' }}
                        >
                          {act.title}
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {act.description}
                        </div>

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
                        </div>

                        {/* Disclosure Controls for Collaboration Sections */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            data-testid={`toggle-comments-${act.id}`}
                            className="btn-secondary"
                            aria-expanded={!!expandedComments[act.id]}
                            onClick={() => setExpandedComments((prev) => ({ ...prev, [act.id]: !prev[act.id] }))}
                            style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                          >
                            {expandedComments[act.id] ? 'Hide Comments' : '💬 Comments'}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            aria-expanded={!!expandedAttachments[act.id]}
                            onClick={() => setExpandedAttachments((prev) => ({ ...prev, [act.id]: !prev[act.id] }))}
                            style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                          >
                            {expandedAttachments[act.id] ? 'Hide Attachments' : '📎 Attachments'}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            aria-expanded={!!expandedHistory[act.id]}
                            onClick={() => toggleHistory(act.id)}
                            style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                          >
                            {expandedHistory[act.id] ? 'Hide Audit History' : `Audit History (${act.activityHistory?.length || 0})`}
                          </button>
                        </div>

                        {/* Collapsed/Expanded Collaboration Sections */}
                        {expandedComments[act.id] && (
                          <div style={{ marginTop: '10px' }}>
                            <TaskCommentThread
                              taskId={act.id}
                              projectId={projectId}
                              demoToken={(typeof getDemoToken === 'function' ? getDemoToken() : undefined) || undefined}
                            />
                          </div>
                        )}

                        {expandedAttachments[act.id] && (
                          <div style={{ marginTop: '10px' }}>
                            <TaskAttachmentList
                              taskId={act.id}
                              projectId={projectId}
                              demoToken={(typeof getDemoToken === 'function' ? getDemoToken() : undefined) || undefined}
                            />
                          </div>
                        )}

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
                            <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                              Audit Trail ({act.activityHistory?.length || 0} events):
                            </div>
                            {(act.activityHistory || []).map((evt) => (
                              <div key={evt.id} style={{ display: 'flex', gap: '8px', marginBottom: '4px', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
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
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Contained Sticky Bulk Action Bar */}
        <BulkActionBar
          selectedTaskIds={selectedTaskIds}
          totalTasksCount={filteredActions.length}
          demoToken={(typeof getDemoToken === 'function' ? getDemoToken() : undefined) || undefined}
          onClearSelection={() => setSelectedTaskIds([])}
          onRefreshTasks={() => fetchActionsAndNotifications()}
        />
      </div>
  );

  if (embedded) {
    return contentBlock;
  }

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
      {contentBlock}
    </div>
  );
};
