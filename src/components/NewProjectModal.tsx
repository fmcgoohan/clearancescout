import React, { useState } from 'react';
import { apiFetch } from '../utils/apiClient';
import { useModalFocus } from '../hooks/useModalFocus';
import { FilmIcon, TvIcon, MegaphoneIcon, BuildingIcon, FileTextIcon } from './icons/Icons';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectId: string) => void | Promise<void>;
  defaultExecutionMode?: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
  defaultExecutionMode = 'DEMO_MODE',
}) => {
  const [title, setTitle] = useState('');
  const [productionCompany, setProductionCompany] = useState('');
  const [scriptVersion, setScriptVersion] = useState('v1.0-ShootingDraft');
  const [projectType, setProjectType] = useState<'Movie' | 'TV Show' | 'Commercial'>('Movie');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { containerRef } = useModalFocus<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !productionCompany.trim()) {
      setError('Production title and studio name are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          productionCompany: productionCompany.trim(),
          scriptVersion: scriptVersion.trim() || 'v1.0-Draft',
          projectType,
          executionMode: defaultExecutionMode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Clear fields
        setTitle('');
        setProductionCompany('');
        setScriptVersion('v1.0-ShootingDraft');
        setProjectType('Movie');
        await onProjectCreated(data.id);
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `Failed to create production (Server HTTP ${res.status}).`);
      }
    } catch (err: any) {
      console.error('Error creating production:', err);
      setError('Network error while creating production.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-modal-title"
        className="modal-content"
        style={{
          backgroundColor: 'var(--bg-panel, #151b23)',
          border: '1px solid var(--border-color, #30363d)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, #30363d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 id="new-project-modal-title" style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Create New Production
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Set up a clean production clearance workspace without sample data.
            </p>
          </div>
          <button
            type="button"
            className="touch-target"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div
              role="alert"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#f87171',
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="new-prod-title"
              style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}
            >
              Production Title *
            </label>
            <input
              id="new-prod-title"
              type="text"
              required
              placeholder="e.g. Solaris Dawn"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #30363d)',
                backgroundColor: 'var(--bg-main, #0d1117)',
                color: 'var(--text-main, #e6edf3)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="new-prod-studio"
              style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}
            >
              Studio / Production Company *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="new-prod-studio"
                type="text"
                required
                placeholder="e.g. Apex Entertainment / A24"
                value={productionCompany}
                onChange={(e) => setProductionCompany(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #30363d)',
                  backgroundColor: 'var(--bg-main, #0d1117)',
                  color: 'var(--text-main, #e6edf3)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label
                htmlFor="new-prod-type"
                style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}
              >
                Project Format
              </label>
              <select
                id="new-prod-type"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #30363d)',
                  backgroundColor: 'var(--bg-main, #0d1117)',
                  color: 'var(--text-main, #e6edf3)',
                  fontSize: '0.9rem',
                }}
              >
                <option value="Movie">Feature Film</option>
                <option value="TV Show">Television Series</option>
                <option value="Commercial">Commercial / Short</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="new-prod-version"
                style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}
              >
                Script Version
              </label>
              <input
                id="new-prod-version"
                type="text"
                value={scriptVersion}
                onChange={(e) => setScriptVersion(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #30363d)',
                  backgroundColor: 'var(--bg-main, #0d1117)',
                  color: 'var(--text-main, #e6edf3)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn-secondary touch-target"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="create-production-submit-btn"
              className="btn-primary touch-target"
              disabled={isSubmitting}
              style={{ padding: '8px 20px', fontWeight: 700 }}
            >
              {isSubmitting ? 'Creating...' : 'Create Production'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
