import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient';
import { useModalFocus } from '../hooks/useModalFocus';
import { AlertTriangleIcon, BuildingIcon, FileTextIcon, ZapIcon, PlusIcon, FilmIcon, TvIcon, MegaphoneIcon } from './icons/Icons';

export interface ProjectListItem {
  id: string;
  title: string;
  productionCompany: string;
  scriptVersion: string;
  projectType: 'Movie' | 'TV Show' | 'Commercial';
  executionMode: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
  liveQuotaLimit?: number;
  liveQuotaUsed?: number;
  liveQuotaRemaining?: number;
  entityCount?: number;
  clearedCount?: number;
  actionRequiredCount?: number;
  reviewRecommendedCount?: number;
  createdAt: string;
}

interface ProjectListModalProps {
  isOpen: boolean;
  activeProjectId: string | null;
  activeProjectTitle?: string;
  activeProjectType?: 'Movie' | 'TV Show' | 'Commercial';
  activeExecutionMode?: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
  activeProjectSummary?: {
    entityCount: number;
    clearedCount: number;
    actionRequiredCount: number;
    reviewRecommendedCount: number;
    researchRequiredCount?: number;
  };
  onSelectProject: (projectId: string) => void;
  onClose: () => void;
}

export function ProjectListModal({
  isOpen,
  activeProjectId,
  activeProjectTitle,
  activeProjectType,
  activeExecutionMode,
  activeProjectSummary,
  onSelectProject,
  onClose,
}: ProjectListModalProps) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { containerRef } = useModalFocus<HTMLDivElement>({
    isOpen,
    onClose,
  });

  // New Project Form State
  const [title, setTitle] = useState('');
  const [productionCompany, setProductionCompany] = useState('');
  const [scriptVersion, setScriptVersion] = useState('v1.0-Draft');
  const [projectType, setProjectType] = useState<'Movie' | 'TV Show' | 'Commercial'>('Movie');
  const [executionMode, setExecutionMode] = useState<'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE'>('DEMO_MODE');

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else if (res.status === 401) {
        setError('Authentication Required: Configure Demo Access Token to access CLOUD_MODE.');
      } else {
        setError('Failed to fetch projects list.');
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Network error loading projects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      setIsCreating(false);
    }
  }, [isOpen]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !productionCompany.trim()) {
      setError('Title and production company are required.');
      return;
    }

    try {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          productionCompany: productionCompany.trim(),
          scriptVersion: scriptVersion.trim() || 'v1.0',
          projectType,
          executionMode,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setTitle('');
        setProductionCompany('');
        setScriptVersion('v1.0-Draft');
        setIsCreating(false);
        onSelectProject(created.id);
        onClose();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to create project.');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Network error creating project.');
    }
  };

  if (!isOpen) return null;

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'TV Show':
        return { label: 'TV Show', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
      case 'Commercial':
        return { label: 'Commercial', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' };
      case 'Movie':
      default:
        return { label: 'Movie', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)' };
    }
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1400,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel modal-responsive"
        style={{
          width: '720px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          borderRadius: '12px',
          outline: 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 id="project-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {isCreating ? 'Create Production Project' : 'Production Projects Directory'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isCreating
                ? 'Configure title, format, and execution mode'
                : 'Select an existing studio production or create a new workspace'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isCreating && (
              <button
                className="btn-primary touch-target"
                onClick={() => setIsCreating(true)}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                + New Project
              </button>
            )}
            <button
              className="btn-secondary touch-target"
              onClick={onClose}
              aria-label="Close project modal"
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              role="alert"
              style={{
                padding: '10px 16px',
                marginBottom: '16px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.85rem',
              }}
            >
              <AlertTriangleIcon size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
              {error}
            </div>
          )}

          {isCreating ? (
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyberfall"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Production Company *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Entertainment"
                    value={productionCompany}
                    onChange={(e) => setProductionCompany(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Script Version
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. v1.0-ShootingDraft"
                    value={scriptVersion}
                    onChange={(e) => setScriptVersion(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Project Type (Production Format)
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#121824',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="Movie">Feature Film (Movie)</option>
                    <option value="TV Show">Episodic Series (TV Show)</option>
                    <option value="Commercial">Commercial Spot</option>
                  </select>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Server Execution Mode
                  </span>
                  <div
                    data-testid="project-creation-execution-mode"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#121824',
                      border: '1px solid var(--border-color)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      boxSizing: 'border-box',
                    }}
                  >
                    {executionMode} (Authoritative)
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    New productions inherit the server's authoritative execution mode.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary touch-target"
                  onClick={() => setIsCreating(false)}
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary touch-target"
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                >
                  Create & Open Workspace
                </button>
              </div>
            </form>
          ) : (
            <div>
              {(() => {
                let effectiveProjects = [...projects];
                if (activeProjectId && !effectiveProjects.some((p) => p.id === activeProjectId)) {
                  const fallbackActiveItem: ProjectListItem = {
                    id: activeProjectId,
                    title: activeProjectTitle || 'Active Workspace',
                    productionCompany: 'Current Workspace',
                    scriptVersion: 'v1.0-Active',
                    projectType: activeProjectType || 'Movie',
                    executionMode: activeExecutionMode || 'DEMO_MODE',
                    entityCount: activeProjectSummary?.entityCount || 0,
                    clearedCount: activeProjectSummary?.clearedCount || 0,
                    actionRequiredCount: activeProjectSummary?.actionRequiredCount || 0,
                    reviewRecommendedCount: activeProjectSummary?.reviewRecommendedCount || 0,
                    createdAt: new Date().toISOString(),
                  };
                  effectiveProjects = [fallbackActiveItem, ...effectiveProjects];
                }

                if (isLoading) {
                  return (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading studio projects...
                    </div>
                  );
                }

                if (effectiveProjects.length === 0) {
                  return (
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No production projects found.</p>
                      <button className="btn-primary" onClick={() => setIsCreating(true)}>
                        Create First Project
                      </button>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {effectiveProjects.map((proj) => {
                      const badge = getTypeBadge(proj.projectType);
                      const isActive = proj.id === activeProjectId;
                      return (
                        <button
                          type="button"
                          aria-current={isActive ? 'true' : undefined}
                          aria-pressed={isActive}
                          aria-label={`${proj.title}${isActive ? ' (Active Workspace)' : ''}${proj.createdAt ? ` — Created ${new Date(proj.createdAt).toISOString().replace('T', ' ').slice(0, 16)} UTC` : ''}`}
                          key={proj.id}
                          data-project-id={proj.id}
                          data-active-workspace={isActive ? 'true' : 'false'}
                          onClick={() => {
                            onSelectProject(proj.id);
                            onClose();
                            setTimeout(() => {
                              const heading = document.getElementById('workspace-production-heading') ||
                                              document.querySelector('[data-testid="workspace-project-title"]') ||
                                              document.querySelector('h1, h2');
                              if (heading instanceof HTMLElement) {
                                heading.focus();
                              }
                            }, 50);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onSelectProject(proj.id);
                              onClose();
                              setTimeout(() => {
                                const heading = document.getElementById('workspace-production-heading') ||
                                                document.querySelector('[data-testid="workspace-project-title"]') ||
                                                document.querySelector('h1, h2');
                                if (heading instanceof HTMLElement) {
                                  heading.focus();
                                }
                              }, 50);
                            }
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '16px 20px',
                            borderRadius: '10px',
                            background: isActive ? 'rgba(56, 189, 248, 0.1)' : 'rgba(0,0,0,0.25)',
                            border: `1px solid ${isActive ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                            gap: '16px',
                            color: 'inherit',
                            fontFamily: 'inherit',
                          }}
                          className="touch-target project-select-card"
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{proj.title}</h3>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  background: badge.bg,
                                  color: badge.color,
                                  fontWeight: 600,
                                }}
                              >
                                {badge.label}
                              </span>
                              {isActive && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                                  ● Active Workspace
                                </span>
                              )}
                            </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><BuildingIcon size={12} /> {proj.productionCompany}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FileTextIcon size={12} /> {proj.scriptVersion}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ZapIcon size={12} /> {proj.executionMode}</span>
                            {proj.createdAt && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                [{new Date(proj.createdAt).toISOString().replace('T', ' ').slice(0, 16)} UTC]
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Clearance Summary Stats */}
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
                            <span style={{ color: '#34d399', fontWeight: 600 }}>{proj.clearedCount || 0} Cleared</span>
                            {' · '}
                            <span style={{ color: '#f87171', fontWeight: 600 }}>{proj.actionRequiredCount || 0} Action</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {proj.entityCount || 0} Total Entities
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
