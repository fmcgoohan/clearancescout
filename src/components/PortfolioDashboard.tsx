import React, { useState, useEffect } from 'react';
import { ProjectPortfolioSummary } from '../types/collaboration';
import { formatProjectCode } from '../utils/formatters';
import { apiFetch } from '../utils/apiClient';

interface PortfolioDashboardProps {
  demoToken?: string;
  onSelectProject?: (projectId: string, title?: string) => void;
}

export const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({
  demoToken,
  onSelectProject,
}) => {
  const [portfolio, setPortfolio] = useState<ProjectPortfolioSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await apiFetch('/api/portfolio');
        if (res.ok) {
          const data = await res.json();
          setPortfolio(data.portfolio || []);
        }
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [demoToken]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'BLOCKED' | 'READY'>('ALL');

  const totalBlocked = portfolio.reduce((sum, p) => sum + (p.blockedSceneCount || 0), 0);
  const totalOverdue = portfolio.reduce((sum, p) => sum + (p.overdueTaskCount || 0), 0);
  const avgReadiness = portfolio.length > 0
    ? Math.round((portfolio.reduce((sum, p) => sum + p.readinessPercentage, 0) / portfolio.length) * 10) / 10
    : 0;

  const isProjectFullyReady = (p: ProjectPortfolioSummary) =>
    p.readinessPercentage >= 100 && (p.totalScenes === undefined || p.totalScenes > 0);

  const filteredPortfolio = portfolio.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.projectId.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterMode === 'BLOCKED') return p.blockedSceneCount > 0 || p.overdueTaskCount > 0;
    if (filterMode === 'READY') return isProjectFullyReady(p);
    return true;
  });

  if (loading) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          color: 'var(--text)',
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Loading Studio Production Portfolio...</p>
      </div>
    );
  }

  return (
    <div
      className="portfolio-container"
      style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
      data-testid="portfolio-dashboard"
    >
      {/* Executive Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'clamp(0.95rem, 3.8vw, 1.35rem)',
              fontWeight: 800,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <span>🎬 Studio Production Portfolio</span>
          </h2>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--muted)',
              marginTop: '4px',
              marginBottom: 0,
            }}
          >
            Cross-project executive oversight, legal risk breakdown, and shooting readiness metrics
          </p>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
          }}
        >
          {portfolio.length} Active Productions
        </span>
      </div>

      {/* Executive Portfolio Summary Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
        data-testid="portfolio-executive-summary"
      >
        <div
          data-stat-tile="active-projects"
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Active Projects
          </span>
          <span
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              lineHeight: 1.1,
              color: 'var(--text)',
            }}
          >
            {portfolio.length}
          </span>
        </div>

        <div
          data-stat-tile="blocked-scenes"
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Blocked Scenes
          </span>
          <span
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              lineHeight: 1.1,
              color: totalBlocked > 0 ? 'var(--warn)' : 'var(--ok)',
            }}
          >
            {totalBlocked}
          </span>
        </div>

        <div
          data-stat-tile="overdue-tasks"
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Overdue Tasks
          </span>
          <span
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              lineHeight: 1.1,
              color: totalOverdue > 0 ? 'var(--crit)' : 'var(--text)',
            }}
          >
            {totalOverdue}
          </span>
        </div>

        <div
          data-stat-tile="avg-readiness"
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Studio Avg Readiness
          </span>
          <span
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              lineHeight: 1.1,
              color: 'var(--accent)',
            }}
          >
            {avgReadiness}%
          </span>
        </div>
      </div>

      {/* Interactive Controls & Filter Bar */}
      <div
        className="portfolio-controls-bar"
        style={{
          background: 'var(--panel2)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '12px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div style={{ flex: '1 1 240px', maxWidth: '360px', width: '100%', boxSizing: 'border-box' }}>
          <input
            type="text"
            placeholder="Filter productions by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter productions by name"
            style={{
              width: '100%',
              padding: '8px 14px',
              fontSize: '0.85rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--panel)',
              color: 'var(--text)',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
        <div
          data-testid="portfolio-filter-tabs"
          className="portfolio-filter-tabs"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            flex: '1 1 auto',
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            data-filter-tab="all"
            onClick={() => setFilterMode('ALL')}
            aria-label={`All (${portfolio.length})`}
            className="portfolio-filter-tab-btn"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              border: '1px solid',
              borderColor: filterMode === 'ALL' ? 'var(--accent)' : 'var(--border)',
              background: filterMode === 'ALL' ? 'var(--accent-dim)' : 'var(--panel)',
              color: filterMode === 'ALL' ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
            }}
          >
            <span className="tab-label-desktop">All</span>
            <span className="tab-label-mobile">All</span> ({portfolio.length})
          </button>
          <button
            type="button"
            data-filter-tab="blocked"
            onClick={() => setFilterMode('BLOCKED')}
            aria-label={`Needs Attention (${portfolio.filter((p) => p.blockedSceneCount > 0 || p.overdueTaskCount > 0).length})`}
            className="portfolio-filter-tab-btn"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              border: '1px solid',
              borderColor: filterMode === 'BLOCKED' ? 'var(--warn)' : 'var(--border)',
              background: filterMode === 'BLOCKED' ? 'var(--warn-bg)' : 'var(--panel)',
              color: filterMode === 'BLOCKED' ? 'var(--warn)' : 'var(--muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
            }}
          >
            <span className="tab-label-desktop">Needs Attention</span>
            <span className="tab-label-mobile">Attention</span> ({portfolio.filter((p) => p.blockedSceneCount > 0 || p.overdueTaskCount > 0).length})
          </button>
          <button
            type="button"
            data-filter-tab="ready"
            onClick={() => setFilterMode('READY')}
            aria-label={`Fully Ready (${portfolio.filter(isProjectFullyReady).length})`}
            className="portfolio-filter-tab-btn"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              border: '1px solid',
              borderColor: filterMode === 'READY' ? 'var(--ok)' : 'var(--border)',
              background: filterMode === 'READY' ? 'var(--ok-bg)' : 'var(--panel)',
              color: filterMode === 'READY' ? 'var(--ok)' : 'var(--muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
            }}
          >
            <span className="tab-label-desktop">Fully Ready</span>
            <span className="tab-label-mobile">Ready</span> ({portfolio.filter(isProjectFullyReady).length})
          </button>
        </div>
      </div>

      {/* Desktop Column Cards Grid */}
      <div className="portfolio-grid">
        {filteredPortfolio.map((p) => {
          const projectCode = formatProjectCode(p.projectId, p.title);
          const isFullReady = isProjectFullyReady(p);
          const isEmpty =
            p.totalScenes === 0 ||
            (p.readinessPercentage === 0 &&
              p.blockedSceneCount === 0 &&
              p.overdueTaskCount === 0 &&
              (p.title.toLowerCase().includes('default') || p.projectId === 'proj-default'));
          return (
            <div
              key={p.projectId}
              data-portfolio-card="true"
              data-project-id={p.projectId}
              role="article"
              aria-label={`Production Project: ${p.title} [${projectCode}] - ${p.owner}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (onSelectProject) onSelectProject(p.projectId, p.title);
                }
              }}
              onClick={() => onSelectProject && onSelectProject(p.projectId, p.title)}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                boxSizing: 'border-box',
                scrollMarginTop: '160px',
                scrollMarginBottom: '24px',
              }}
            >
              {/* Card Header & Identity */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                      {p.title}
                    </h3>
                    <span
                      data-project-code="true"
                      style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--mono)',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'var(--accent-dim)',
                        color: 'var(--accent)',
                        border: '1px solid var(--border)',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    >
                      [{projectCode}]
                    </span>
                    <span
                      data-project-id-badge="true"
                      style={{
                        fontSize: '0.7rem',
                        fontFamily: 'var(--mono)',
                        color: 'var(--muted)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'var(--panel2)',
                        border: '1px solid var(--border)',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    >
                      [{p.projectId}]
                    </span>
                  </div>

                  {/* Readiness Pill */}
                  <span
                    data-readiness-badge="true"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '16px',
                      background: isFullReady
                        ? 'var(--ok-bg)'
                        : p.readinessPercentage === 0
                        ? isEmpty
                          ? 'rgba(148, 163, 184, 0.12)'
                          : 'var(--warn-bg)'
                        : 'var(--warn-bg)',
                      color: isFullReady
                        ? 'var(--ok)'
                        : p.readinessPercentage === 0
                        ? isEmpty
                          ? 'var(--muted)'
                          : 'var(--warn)'
                        : 'var(--warn)',
                      border: `1px solid ${
                        isFullReady
                          ? 'var(--ok)'
                          : p.readinessPercentage === 0
                          ? isEmpty
                            ? 'rgba(148, 163, 184, 0.3)'
                            : 'var(--warn)'
                          : 'var(--warn)'
                      }`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isFullReady
                      ? `${Math.round(p.readinessPercentage * 10) / 10}% Readiness`
                      : p.readinessPercentage === 0
                      ? isEmpty
                        ? '0% • Pending Ingestion'
                        : '0% • Pending Review'
                      : `${Math.round(p.readinessPercentage * 10) / 10}% Readiness`}
                  </span>
                </div>

                {/* Studio & Script Metadata Chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--panel2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontWeight: 600,
                    }}
                  >
                    {p.owner}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--panel2)',
                      border: '1px solid var(--border)',
                      fontFamily: 'var(--mono)',
                      fontSize: '0.75rem',
                      color: 'var(--muted)',
                    }}
                  >
                    {p.scriptVersion}
                  </span>
                </div>
              </div>

              {/* Shooting Readiness Meter Bar */}
              <div style={{ width: '100%', height: '6px', background: 'var(--panel2)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, p.readinessPercentage))}%`,
                    height: '100%',
                    background: isFullReady
                      ? 'var(--ok)'
                      : p.readinessPercentage === 0
                      ? 'rgba(148, 163, 184, 0.2)'
                      : 'var(--warn)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              {/* Scannable 3-Column Metrics Panel */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--panel2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                    {p.blockedSceneCount}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Blocked Scenes
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    borderLeft: '1px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: p.overdueTaskCount > 0 ? 'var(--crit)' : 'var(--text)',
                    }}
                  >
                    {p.overdueTaskCount}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Overdue Tasks
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: p.rightsExpirationWarningsCount > 0 ? 'var(--accent)' : 'var(--text)',
                    }}
                  >
                    {p.rightsExpirationWarningsCount}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Expiring Rights
                  </span>
                </div>
              </div>

              {/* Card Footer Action Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  Last Sync: {new Date(p.lastSyncTimestamp).toLocaleDateString()}
                </span>

                <button
                  type="button"
                  data-open-production="true"
                  data-project-id={p.projectId}
                  aria-label={`Open Production: ${p.title} [${projectCode}] - ${p.owner}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectProject) onSelectProject(p.projectId, p.title);
                  }}
                  className="btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    scrollMarginTop: '160px',
                    scrollMarginBottom: '24px',
                  }}
                >
                  <span>Open Production</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
