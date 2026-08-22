import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient.js';
import { pluralize, formatStatus, formatDepartment, formatPriority } from '../utils/formatters.js';

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

  const handleUpdateStatus = async (actionId: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED') => {
    try {
      const res = await apiFetch(`/api/projects/${projectId}/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolutionTrigger: newStatus === 'RESOLVED' ? 'MANUAL_COORDINATOR_SIGN_OFF' : undefined,
        }),
      });
      if (res.ok) {
        await fetchActionsAndNotifications();
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
    if (statusFilter === 'OPEN' && act.status === 'RESOLVED') return false;
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
            <h2 id="action-modal-title" style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              📋 Production Clearance Action & Notification Center
            </h2>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: openCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                color: openCount > 0 ? '#f87171' : '#34d399',
                fontWeight: 600,
              }}
            >
              {pluralize(openCount, 'Department Task')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={handleSyncActions}
              disabled={isSyncing}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              {isSyncing ? 'Syncing...' : '🔄 Re-Sync'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.4rem',
                cursor: 'pointer',
                lineHeight: 1,
              }}
              aria-label="Close action modal"
            >
              ×
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
              { key: 'ART_DEPT', label: `🎨 Art Dept (${artCount})` },
              { key: 'LEGAL_COUNSEL', label: `⚖️ Legal Counsel (${legalCount})` },
              { key: 'LOCATIONS', label: `📍 Locations (${locCount})` },
              { key: 'PRODUCTION_MGMT', label: `🎬 Production (${prodCount})` },
              { key: 'NOTIFICATIONS', label: `🔔 Alerts (${unreadNotifsCount})` },
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

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
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
            filteredActions.map((act) => (
              <div
                key={act.id}
                style={{
                  padding: '14px 18px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  borderLeft:
                    act.priority === 'CRITICAL'
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
                        ✓ {formatStatus(act.status)}
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
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {act.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {act.description}
                  </div>
                  {act.resolutionTrigger && (
                    <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '4px' }}>
                      Resolved via: {formatStatus(act.resolutionTrigger)}
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
                        ✓ Resolve
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
