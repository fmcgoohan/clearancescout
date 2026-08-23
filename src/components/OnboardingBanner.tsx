import React, { useState, useEffect } from 'react';
import { Icon } from './icons/Icon';

export interface OnboardingBannerProps {
  onDismiss?: () => void;
  onOpenDemo?: () => void;
}

export const OnboardingBanner: React.FC<OnboardingBannerProps> = ({ onDismiss, onOpenDemo }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('clearancescout_onboarding_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('clearancescout_onboarding_dismissed', 'true');
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="How Clearance Scout Works"
      className="card-surface"
      style={{
        padding: '1.25rem 1.5rem',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle, #232d42)',
        backgroundColor: 'var(--bg-surface, #121824)',
        marginBottom: '1.5rem',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--brand-accent, #7c9cff)',
              }}
            >
              HOW CLEARANCE WORKS
            </span>
          </div>
          <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main, #f3f4f6)', fontWeight: 600 }}>
            Automated Screenplay Clearance & Production Readiness in 3 Steps
          </h4>
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss clearance guide"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #9ca3af)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="x" size={18} />
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle, #232d42)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main, #f3f4f6)', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--brand-accent, #7c9cff)', fontWeight: 700 }}>1.</span> Screenplay Intake
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #9ca3af)', lineHeight: 1.4 }}>
            Ingest screenplay formatted text. ClearanceScout extracts canonical entities and maps scene appearances.
          </p>
        </div>

        <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle, #232d42)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main, #f3f4f6)', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--brand-accent, #7c9cff)', fontWeight: 700 }}>2.</span> Research & Rights
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #9ca3af)', lineHeight: 1.4 }}>
            Verify live web trademark evidence, record signed agreements, or generate fictional replacement graphics.
          </p>
        </div>

        <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle, #232d42)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main, #f3f4f6)', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--brand-accent, #7c9cff)', fontWeight: 700 }}>3.</span> Shooting Readiness
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #9ca3af)', lineHeight: 1.4 }}>
            Resolve scene blockers, track department tasks, and export a SHA-256 verified legal clearance binder.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        {onOpenDemo && (
          <button
            className="btn btn-secondary"
            onClick={onOpenDemo}
            style={{
              fontSize: '0.8rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Icon name="sparkles" size={14} />
            <span>Load 1-Click Bundled Demo</span>
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={handleDismiss}
          style={{
            fontSize: '0.8rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '6px',
            backgroundColor: 'var(--brand-accent, #7c9cff)',
            borderColor: 'var(--brand-accent, #7c9cff)',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          Got it, dismiss
        </button>
      </div>
    </div>
  );
};
