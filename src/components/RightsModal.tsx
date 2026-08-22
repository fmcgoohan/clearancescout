import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient';
import { useModalFocus } from '../hooks/useModalFocus';

export interface RightsItem {
  id: string;
  projectId: string;
  canonicalEntityId: string;
  canonicalEntityName?: string;
  licensorName: string;
  grantType: string;
  territory: string;
  territoryDetails?: string;
  mediaWindow: string;
  effectiveDate: string;
  expirationDate?: string;
  isPerpetual: boolean;
  covenants?: string[];
  feeAmount?: number;
  currency?: string;
  documentReferenceUrl?: string;
  status: string;
  createdAt: string;
}

interface RightsModalProps {
  projectId: string;
  entityId: string | null;
  entityName: string;
  isOpen: boolean;
  onClose: () => void;
  onRightsUpdated?: () => void;
}

export function RightsModal({
  projectId,
  entityId,
  entityName,
  isOpen,
  onClose,
  onRightsUpdated,
}: RightsModalProps) {
  const [rightsList, setRightsList] = useState<RightsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { containerRef } = useModalFocus<HTMLDivElement>({
    isOpen,
    onClose,
  });

  // New License Form State
  const [licensorName, setLicensorName] = useState('');
  const [grantType, setGrantType] = useState('NON_EXCLUSIVE');
  const [territory, setTerritory] = useState('WORLDWIDE');
  const [mediaWindow, setMediaWindow] = useState('ALL_MEDIA_IN_PERPETUITY');
  const [isPerpetual, setIsPerpetual] = useState(true);
  const [expirationDate, setExpirationDate] = useState('');
  const [covenantsText, setCovenantsText] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [documentRef, setDocumentRef] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchRights = async () => {
    if (!projectId || !entityId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/entities/${entityId}/rights`);
      if (res.ok) {
        const data = await res.json();
        setRightsList(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load rights records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && entityId) {
      fetchRights();
      setLicensorName('');
      setGrantType('NON_EXCLUSIVE');
      setTerritory('WORLDWIDE');
      setMediaWindow('ALL_MEDIA_IN_PERPETUITY');
      setIsPerpetual(true);
      setExpirationDate('');
      setCovenantsText('');
      setFeeAmount('');
      setDocumentRef('');
    }
  }, [isOpen, entityId, projectId]);

  if (!isOpen || !entityId) return null;

  const handleCreateRights = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensorName.trim()) {
      setError('Licensor name is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const covenants = covenantsText
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    try {
      const res = await apiFetch(`/api/projects/${projectId}/rights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canonicalEntityId: entityId,
          canonicalEntityName: entityName,
          licensorName: licensorName.trim(),
          grantType,
          territory,
          mediaWindow,
          isPerpetual,
          expirationDate: isPerpetual ? undefined : expirationDate || undefined,
          covenants,
          feeAmount: feeAmount ? Number(feeAmount) : undefined,
          documentReferenceUrl: documentRef.trim() || undefined,
          status: 'ACTIVE',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create rights record.');
      }

      await fetchRights();
      if (onRightsUpdated) onRightsUpdated();

      // Reset form
      setLicensorName('');
      setCovenantsText('');
      setFeeAmount('');
      setDocumentRef('');
    } catch (err: any) {
      setError(err.message || 'Failed to create rights license.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRights = async (rightsId: string) => {
    if (!confirm('Revoke and delete this rights license record?')) return;
    try {
      const res = await apiFetch(`/api/projects/${projectId}/rights/${rightsId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchRights();
        if (onRightsUpdated) onRightsUpdated();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete rights record.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rights-modal-title"
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
        ref={containerRef}
        tabIndex={-1}
        className="glass-panel modal-responsive"
        style={{
          width: '780px',
          maxWidth: '94vw',
          maxHeight: '88vh',
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
            <h2 id="rights-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              📜 Rights & License Agreements: {entityName}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Record territorial rights grants, distribution windows, expiration dates, and restrictive covenants.
            </p>
          </div>
          <button
            className="btn-secondary touch-target"
            onClick={onClose}
            aria-label="Close rights modal"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Active Rights List */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: 'var(--accent-cyan)' }}>
              Active Contractual Rights & Releases ({rightsList.length})
            </h3>
            {isLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading rights records...</div>
            ) : rightsList.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                No rights or clearance license agreements attached yet. Register a license below.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rightsList.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {r.licensorName}
                        </strong>
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
                          {r.grantType}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                          }}
                        >
                          🌍 {r.territory}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(192, 132, 252, 0.15)',
                            color: '#c084fc',
                          }}
                        >
                          📺 {r.mediaWindow}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Effective: {r.effectiveDate} · {r.isPerpetual ? 'In Perpetuity' : `Expires: ${r.expirationDate || 'N/A'}`}
                        {r.feeAmount ? ` · Fee: $${r.feeAmount.toLocaleString()}` : ''}
                      </div>
                      {r.covenants && r.covenants.length > 0 && (
                        <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#fbbf24' }}>
                          <strong>Covenants:</strong> {r.covenants.join('; ')}
                        </div>
                      )}
                    </div>
                    <button
                      className="btn-secondary touch-target"
                      style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#f87171' }}
                      onClick={() => handleDeleteRights(r.id)}
                    >
                      🗑️ Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Rights Form */}
          <form
            onSubmit={handleCreateRights}
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px', margin: '0 0 14px' }}>
              ➕ Attach New Rights / License Agreement
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                  Licensor / Rights Holder *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Sony Music, Summit Beverage Corp"
                  value={licensorName}
                  onChange={(e) => setLicensorName(e.target.value)}
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                  Grant Type
                </label>
                <select
                  className="input-field"
                  value={grantType}
                  onChange={(e) => setGrantType(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="NON_EXCLUSIVE">Non-Exclusive License</option>
                  <option value="EXCLUSIVE">Exclusive License</option>
                  <option value="FAIR_USE">Fair Use / Incidental</option>
                  <option value="PUBLIC_DOMAIN">Public Domain</option>
                  <option value="PROD_MADE">Production-Made (Work For Hire)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                  Territory
                </label>
                <select
                  className="input-field"
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="WORLDWIDE">Worldwide</option>
                  <option value="NORTH_AMERICA">North America</option>
                  <option value="EUROPE">Europe</option>
                  <option value="US_ONLY">United States Only</option>
                  <option value="SPECIFIED_COUNTRIES">Specified Countries</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                  Media Window
                </label>
                <select
                  className="input-field"
                  value={mediaWindow}
                  onChange={(e) => setMediaWindow(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="ALL_MEDIA_IN_PERPETUITY">All Media in Perpetuity</option>
                  <option value="THEATRICAL_SVOD">Theatrical & SVOD</option>
                  <option value="THEATRICAL_ONLY">Theatrical Only</option>
                  <option value="LINEAR_TV">Linear Television</option>
                  <option value="FESTIVAL_ONLY">Festival Exhibition Only</option>
                  <option value="DIGITAL_PROMO">Digital Promotional Use</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    checked={isPerpetual}
                    onChange={(e) => setIsPerpetual(e.target.checked)}
                  />
                  <span>In Perpetuity (No Expiration)</span>
                </label>
              </div>

              {!isPerpetual && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    required={!isPerpetual}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                Contractual Covenants & Restrictions (one per line)
              </label>
              <textarea
                className="input-field"
                placeholder="e.g. End credit required: Courtesy of Sony Music&#10;Must not be depicted alongside violent acts"
                value={covenantsText}
                onChange={(e) => setCovenantsText(e.target.value)}
                rows={2}
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="submit"
                className="btn-primary touch-target"
                disabled={isSaving}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                {isSaving ? 'Attaching...' : 'Attach Rights License'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
