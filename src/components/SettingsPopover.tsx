import React, { useState, useRef, useEffect } from 'react';
import { SettingsIcon, LockIcon, ZapIcon, XIcon } from './icons/Icons';
import { UserRole } from '../types/collaboration.js';
import { RoleWorkspaceSwitcher } from './RoleWorkspaceSwitcher.js';

interface SettingsPopoverProps {
  hasTokenConfigured: boolean;
  onOpenTokenModal: () => void;
  executionMode: 'DEMO_MODE' | 'TEST_MODE' | 'CLOUD_MODE';
  setExecutionMode?: (mode: 'DEMO_MODE' | 'TEST_MODE' | 'CLOUD_MODE') => void;
  liveQuota: { remaining: number; limit: number };
  eventsCount: number;
  onOpenTimeline: () => void;
  servingRevision?: string;
  onNewProduction?: () => void;
  onSwitchProject?: () => void;
  onExportBinder?: () => void;
  onTogglePortfolio?: () => void;
  appViewMode?: 'WORKSPACE' | 'PORTFOLIO';
  isExporting?: boolean;
  currentUserRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

export const SettingsPopover: React.FC<SettingsPopoverProps> = ({
  hasTokenConfigured,
  onOpenTokenModal,
  executionMode,
  setExecutionMode,
  liveQuota,
  eventsCount,
  onOpenTimeline,
  servingRevision = 'unknown',
  onNewProduction,
  onSwitchProject,
  onExportBinder,
  onTogglePortfolio,
  appViewMode = 'WORKSPACE',
  isExporting = false,
  currentUserRole,
  onRoleChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleCopyRevision = async () => {
    if (servingRevision) {
      try {
        await navigator.clipboard.writeText(servingRevision);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy revision:', err);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
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

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={triggerRef}
        id="settings-menu-button"
        className="btn-secondary touch-target"
        aria-label="Settings and Administrative Options"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderColor: isOpen ? 'var(--accent-cyan)' : 'var(--border-color)',
        }}
      >
        <SettingsIcon size={16} />
        <span>Settings</span>
        {hasTokenConfigured && <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>●</span>}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Administrative Settings Menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '280px',
            background: 'var(--bg-panel, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            padding: '16px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Settings & Options
            </span>
            <button
              className="touch-target"
              aria-label="Close Settings Menu"
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            >
              <XIcon size={16} />
            </button>
          </div>

          {/* Workspace Perspective Option */}
          {currentUserRole && onRoleChange && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <RoleWorkspaceSwitcher
                currentRole={currentUserRole}
                onRoleChange={onRoleChange}
                selectId="settings-perspective-select"
                hideLabel={false}
              />
            </div>
          )}

          {/* Demo Token Option */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auth & Tokens</span>
            <button
              id="demo-token-button"
              className="btn-secondary touch-target"
              aria-label="Configure Demo Access Token"
              onClick={() => {
                setIsOpen(false);
                onOpenTokenModal();
              }}
              style={{
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                borderColor: hasTokenConfigured ? 'var(--accent-cyan)' : 'var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LockIcon size={14} />
                <span>Demo Access Token</span>
              </div>
              {hasTokenConfigured && <span style={{ color: 'var(--accent-cyan)', fontSize: '0.7rem' }}>Configured</span>}
            </button>
          </div>

          {/* Authoritative Server Execution Mode (FR-041 Option A) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Server Execution Mode</span>
              <span
                data-testid="authoritative-execution-mode"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid var(--accent-cyan)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {executionMode} (Authoritative)
              </span>
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
              Governed by server configuration. Live CLOUD_MODE uses Vertex AI (GOOGLE_CLOUD_PROJECT) or GEMINI_API_KEY, and PARALLEL_WEB_API_KEY.
            </p>
          </div>

          {/* Quota Counter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>API Quota Usage</span>
            <div
              className="touch-target quota-meter"
              aria-label={`Live Quota Remaining: ${liveQuota.remaining} of ${liveQuota.limit}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: liveQuota.remaining === 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,0,0,0.3)',
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${liveQuota.remaining === 0 ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-color)'}`,
                fontSize: '0.75rem',
                color: liveQuota.remaining === 0 ? '#f87171' : 'var(--text-main)',
              }}
            >
              <span>Quota Remaining:</span>
              <span className="quota-meter-number" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: liveQuota.remaining === 0 ? '#f87171' : 'var(--accent-cyan)' }}>
                {liveQuota.remaining} / {liveQuota.limit}
              </span>
            </div>
          </div>

          {/* Serving Revision & Provenance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Serving Revision</span>
            <div
              data-testid="serving-revision"
              id="serving-revision-display"
              aria-label={`Serving Cloud Run revision: ${servingRevision}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(0,0,0,0.3)',
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                color: 'var(--accent-cyan)',
                userSelect: 'all',
                wordBreak: 'break-all',
              }}
            >
              <span style={{ fontWeight: 600 }}>{servingRevision}</span>
              <button
                type="button"
                className="touch-target"
                aria-label="Copy Serving Revision"
                onClick={handleCopyRevision}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? 'var(--ok, #34d399)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '2px 4px',
                  borderRadius: '4px',
                }}
                title={copied ? 'Copied!' : 'Copy Revision'}
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>
          </div>

          {/* Workspace Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Workspace Actions</span>
            {onNewProduction && (
              <button
                className="btn-primary touch-target"
                onClick={() => {
                  setIsOpen(false);
                  onNewProduction();
                }}
                style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                + New Production
              </button>
            )}
            {onExportBinder && (
              <button
                className="btn-secondary touch-target"
                aria-label="Export Legal Clearance Binder"
                onClick={() => {
                  setIsOpen(false);
                  onExportBinder();
                }}
                disabled={isExporting}
                style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isExporting ? 'Compiling Binder...' : 'Export Clearance Binder'}
              </button>
            )}
            {onTogglePortfolio && (
              <button
                data-testid="portfolio-view-toggle"
                className="btn-secondary touch-target"
                onClick={() => {
                  setIsOpen(false);
                  onTogglePortfolio();
                }}
                style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {appViewMode === 'WORKSPACE' ? '📊 Portfolio Dashboard' : '🎬 Studio Workspace'}
              </button>
            )}
          </div>

          {/* Activity / Event Log Trigger */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="btn-secondary touch-target"
              aria-label="Open Activity Timeline"
              onClick={() => {
                setIsOpen(false);
                onOpenTimeline();
              }}
              style={{
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ZapIcon size={14} />
                <span>Activity ({eventsCount})</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
