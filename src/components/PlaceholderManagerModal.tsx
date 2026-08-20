import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient.js';

export interface CategoryDetails {
  trademarkSearchNotes?: string;
  packagingDimensions?: string;
  fictionalTagline?: string;
  bpm?: number;
  key?: string;
  musicalStyle?: string;
  licenseType?: string;
  artistPrompt?: string;
  visualStyle?: string;
  dimensions?: string;
  imageUrl?: string;
  alternativeLines?: string[];
  subtextRationale?: string;
  physicalSpecs?: string;
  safetyClearanceNotes?: string;
  graphicLabelUrl?: string;
}

export interface ReplacementPlaceholderData {
  id: string;
  projectId: string;
  canonicalEntityId: string;
  canonicalName: string;
  assetCategory: 'BRAND' | 'ART_MUSIC' | 'ARTWORK' | 'DIALOGUE' | 'GRAPHIC_PROP';
  fictionalName: string;
  description: string;
  clearanceTier: 'TEMP_APPROVED' | 'FINAL_CLEARED';
  creativeRationale: string;
  approvedBy: string;
  approvedRole?: string;
  approvalDate: string;
  categoryDetails?: CategoryDetails;
  createdAt: string;
  updatedAt: string;
}

interface PlaceholderManagerModalProps {
  isOpen: boolean;
  projectId: string;
  entityId: string | null;
  entityName: string;
  entityCategory?: string;
  onClose: () => void;
  onPlaceholderUpdated?: () => void;
}

export const PlaceholderManagerModal: React.FC<PlaceholderManagerModalProps> = ({
  isOpen,
  projectId,
  entityId,
  entityName,
  entityCategory,
  onClose,
  onPlaceholderUpdated,
}) => {
  const [existingPlaceholder, setExistingPlaceholder] = useState<ReplacementPlaceholderData | null>(null);
  const [assetCategory, setAssetCategory] = useState<'BRAND' | 'ART_MUSIC' | 'ARTWORK' | 'DIALOGUE' | 'GRAPHIC_PROP'>('BRAND');
  const [fictionalName, setFictionalName] = useState('');
  const [description, setDescription] = useState('');
  const [clearanceTier, setClearanceTier] = useState<'TEMP_APPROVED' | 'FINAL_CLEARED'>('TEMP_APPROVED');
  const [creativeRationale, setCreativeRationale] = useState('');
  const [approvedBy, setApprovedBy] = useState('Clearance Coordinator');
  const [approvedRole, setApprovedRole] = useState('Production Clearance Lead');

  const [scopeType, setScopeType] = useState<'SELECTED_SCENES' | 'SINGLE_OCCURRENCE' | 'PROJECT_WIDE'>('SELECTED_SCENES');
  const [sceneNumbersInput, setSceneNumbersInput] = useState<string>('1');

  // Category specific fields
  const [bpm, setBpm] = useState<string>('');
  const [musicalKey, setMusicalKey] = useState<string>('');
  const [musicalStyle, setMusicalStyle] = useState<string>('');
  const [dialogueLines, setDialogueLines] = useState<string>('');
  const [dialogueSubtext, setDialogueSubtext] = useState<string>('');
  const [artistPrompt, setArtistPrompt] = useState<string>('');
  const [visualStyle, setVisualStyle] = useState<string>('');
  const [physicalSpecs, setPhysicalSpecs] = useState<string>('');
  const [packagingDimensions, setPackagingDimensions] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && entityId && projectId) {
      fetchExisting();
    }
  }, [isOpen, entityId, projectId]);

  const fetchExisting = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/entities/${entityId}/placeholder`);
      if (res.ok) {
        const ph: any = await res.json();
        setExistingPlaceholder(ph);
        setAssetCategory(ph.assetCategory);
        setFictionalName(ph.fictionalName);
        setDescription(ph.description || '');
        setClearanceTier(ph.clearanceTier);
        setCreativeRationale(ph.creativeRationale || '');
        setApprovedBy(ph.approvedBy || '');
        setApprovedRole(ph.approvedRole || '');
        setScopeType(ph.isProjectWide ? 'PROJECT_WIDE' : ph.scopeType || 'SELECTED_SCENES');
        if (ph.sceneIds && ph.sceneIds.length > 0) {
          setSceneNumbersInput(ph.sceneIds.join(', '));
        }

        if (ph.categoryDetails) {
          setBpm(ph.categoryDetails.bpm ? String(ph.categoryDetails.bpm) : '');
          setMusicalKey(ph.categoryDetails.key || '');
          setMusicalStyle(ph.categoryDetails.musicalStyle || '');
          setDialogueLines(ph.categoryDetails.alternativeLines ? ph.categoryDetails.alternativeLines.join('\n') : '');
          setDialogueSubtext(ph.categoryDetails.subtextRationale || '');
          setArtistPrompt(ph.categoryDetails.artistPrompt || '');
          setVisualStyle(ph.categoryDetails.visualStyle || '');
          setPhysicalSpecs(ph.categoryDetails.physicalSpecs || '');
          setPackagingDimensions(ph.categoryDetails.packagingDimensions || '');
        }
      } else {
        // Reset defaults
        setExistingPlaceholder(null);
        const mappedCat = entityCategory === 'ART_MUSIC' ? 'ART_MUSIC' : entityCategory === 'GRAPHIC_PROP' ? 'GRAPHIC_PROP' : 'BRAND';
        setAssetCategory(mappedCat);
        setFictionalName('');
        setDescription('');
        setClearanceTier('TEMP_APPROVED');
        setCreativeRationale('');
        setScopeType('SELECTED_SCENES');
        setSceneNumbersInput('1');
        setBpm('');
        setMusicalKey('');
        setMusicalStyle('');
        setDialogueLines('');
        setDialogueSubtext('');
        setArtistPrompt('');
        setVisualStyle('');
        setPhysicalSpecs('');
        setPackagingDimensions('');
      }
    } catch (err) {
      console.error('Failed to fetch existing placeholder:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fictionalName.trim() || !entityId) return;

    setIsSaving(true);
    try {
      const categoryDetails: CategoryDetails = {};
      if (assetCategory === 'ART_MUSIC') {
        if (bpm) categoryDetails.bpm = parseInt(bpm, 10);
        if (musicalKey) categoryDetails.key = musicalKey;
        if (musicalStyle) categoryDetails.musicalStyle = musicalStyle;
      } else if (assetCategory === 'DIALOGUE') {
        if (dialogueLines) categoryDetails.alternativeLines = dialogueLines.split('\n').map((s) => s.trim()).filter(Boolean);
        if (dialogueSubtext) categoryDetails.subtextRationale = dialogueSubtext;
      } else if (assetCategory === 'ARTWORK') {
        if (artistPrompt) categoryDetails.artistPrompt = artistPrompt;
        if (visualStyle) categoryDetails.visualStyle = visualStyle;
      } else if (assetCategory === 'GRAPHIC_PROP') {
        if (physicalSpecs) categoryDetails.physicalSpecs = physicalSpecs;
      } else if (assetCategory === 'BRAND') {
        if (packagingDimensions) categoryDetails.packagingDimensions = packagingDimensions;
      }

      const sceneIds =
        scopeType === 'SELECTED_SCENES' && sceneNumbersInput
          ? sceneNumbersInput.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined;
      const isProjectWide = scopeType === 'PROJECT_WIDE';

      const payload = {
        canonicalEntityId: entityId,
        assetCategory,
        fictionalName: fictionalName.trim(),
        description: description.trim(),
        clearanceTier,
        creativeRationale: creativeRationale.trim() || 'Fictional replacement asset',
        approvedBy: approvedBy.trim() || 'Clearance Team',
        approvedRole: approvedRole.trim(),
        scopeType,
        sceneIds,
        isProjectWide,
        categoryDetails,
      };

      const res = await apiFetch(`/api/projects/${projectId}/placeholders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onPlaceholderUpdated?.();
        onClose();
      }
    } catch (err) {
      console.error('Failed to save placeholder:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTier = async (newTier: 'TEMP_APPROVED' | 'FINAL_CLEARED') => {
    if (!existingPlaceholder) return;
    try {
      const res = await apiFetch(`/api/projects/${projectId}/placeholders/${existingPlaceholder.id}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clearanceTier: newTier,
          approvedBy: 'Jane Sterling, Production Counsel',
          approvedRole: 'Lead Legal Counsel',
        }),
      });
      if (res.ok) {
        await fetchExisting();
        onPlaceholderUpdated?.();
      }
    } catch (err) {
      console.error('Failed to update placeholder tier:', err);
    }
  };

  const handleDelete = async () => {
    if (!existingPlaceholder) return;
    try {
      const res = await apiFetch(`/api/projects/${projectId}/placeholders/${existingPlaceholder.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onPlaceholderUpdated?.();
        onClose();
      }
    } catch (err) {
      console.error('Failed to delete placeholder:', err);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="placeholder-modal-title"
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
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '700px',
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
          <div>
            <h2 id="placeholder-modal-title" style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              🎨 Fictional Replacement & Placeholder Manager
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Target Entity: <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{entityName}</span>
            </div>
          </div>
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
            aria-label="Close placeholder modal"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading placeholder data...</div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Existing Status & Promotion Bar */}
              {existingPlaceholder && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background:
                      existingPlaceholder.clearanceTier === 'FINAL_CLEARED'
                        ? 'rgba(52, 211, 153, 0.12)'
                        : 'rgba(251, 191, 36, 0.12)',
                    border:
                      existingPlaceholder.clearanceTier === 'FINAL_CLEARED'
                        ? '1px solid rgba(52, 211, 153, 0.4)'
                        : '1px solid rgba(251, 191, 36, 0.4)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: existingPlaceholder.clearanceTier === 'FINAL_CLEARED' ? '#34d399' : '#fbbf24' }}>
                      Current Clearance Tier: {existingPlaceholder.clearanceTier === 'FINAL_CLEARED' ? '🟢 FINAL CLEARED (Locked)' : '🟡 TEMP APPROVED (On-Set Shoot)'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Approved by {existingPlaceholder.approvedBy} on {new Date(existingPlaceholder.approvalDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {existingPlaceholder.clearanceTier === 'TEMP_APPROVED' ? (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleToggleTier('FINAL_CLEARED')}
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      >
                        ✓ Promote to Final Clear
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleToggleTier('TEMP_APPROVED')}
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      >
                        Demote to Temp Approved
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Asset Category & Tier Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Asset Category
                  </label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <option value="BRAND">Brand / Commercial Packaging</option>
                    <option value="ART_MUSIC">Music Track / Score Cue</option>
                    <option value="ARTWORK">Artwork / Set Dressing</option>
                    <option value="DIALOGUE">Dialogue / Script Alternative</option>
                    <option value="GRAPHIC_PROP">Graphic Text / Prop Placard</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Clearance Tier
                  </label>
                  <select
                    value={clearanceTier}
                    onChange={(e) => setClearanceTier(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <option value="TEMP_APPROVED">🟡 TEMP_APPROVED (On-Set Shooting)</option>
                    <option value="FINAL_CLEARED">🟢 FINAL_CLEARED (Picture Lock & Distribution)</option>
                  </select>
                </div>
              </div>

              {/* Placeholder Scope Configuration (Scoped by default) */}
              <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: scopeType === 'SELECTED_SCENES' ? '1fr 1fr' : '1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Mitigation Scope *
                    </label>
                    <select
                      value={scopeType}
                      onChange={(e) => setScopeType(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <option value="SELECTED_SCENES">🎯 Selected Scene(s) Scope (Default)</option>
                      <option value="SINGLE_OCCURRENCE">📍 Single Occurrence Scope</option>
                      <option value="PROJECT_WIDE">🌐 Project-Wide Scope (All Scenes)</option>
                    </select>
                  </div>

                  {scopeType === 'SELECTED_SCENES' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Target Scene Numbers (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={sceneNumbersInput}
                        onChange={(e) => setSceneNumbersInput(e.target.value)}
                        placeholder="e.g. 1, 2"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.82rem',
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Fictional Asset Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Fictional Replacement Name / Title *
                </label>
                <input
                  type="text"
                  value={fictionalName}
                  onChange={(e) => setFictionalName(e.target.value)}
                  placeholder="e.g. Echoes of the Horizon / Summit Soda / Titan Caution Sign"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              {/* Category-Specific Detailed Inputs */}
              {assetCategory === 'ART_MUSIC' && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Tempo (BPM)</label>
                    <input
                      type="number"
                      value={bpm}
                      onChange={(e) => setBpm(e.target.value)}
                      placeholder="110"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Musical Key</label>
                    <input
                      type="text"
                      value={musicalKey}
                      onChange={(e) => setMusicalKey(e.target.value)}
                      placeholder="D Minor"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Style / Genre</label>
                    <input
                      type="text"
                      value={musicalStyle}
                      onChange={(e) => setMusicalStyle(e.target.value)}
                      placeholder="Synthwave Rock"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              )}

              {assetCategory === 'DIALOGUE' && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Scripted Alternative Lines (One per line)</label>
                    <textarea
                      rows={2}
                      value={dialogueLines}
                      onChange={(e) => setDialogueLines(e.target.value)}
                      placeholder="Line 1: Hand me that generic soda can.\nLine 2: Pass the cold drink."
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Subtext & Intent Rationale</label>
                    <input
                      type="text"
                      value={dialogueSubtext}
                      onChange={(e) => setDialogueSubtext(e.target.value)}
                      placeholder="Preserves character tension without proprietary mention"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              )}

              {assetCategory === 'ARTWORK' && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Artist Generation Prompt</label>
                    <input
                      type="text"
                      value={artistPrompt}
                      onChange={(e) => setArtistPrompt(e.target.value)}
                      placeholder="Original oil painting depicting abstract neon horizon in impressionist style"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Visual Style</label>
                    <input
                      type="text"
                      value={visualStyle}
                      onChange={(e) => setVisualStyle(e.target.value)}
                      placeholder="Oil on Canvas"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              )}

              {assetCategory === 'GRAPHIC_PROP' && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Prop Physical Specifications & Packaging</label>
                  <input
                    type="text"
                    value={physicalSpecs}
                    onChange={(e) => setPhysicalSpecs(e.target.value)}
                    placeholder="Yellow/black hazard warning sign, 24x36 inches on matte aluminum"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                  />
                </div>
              )}

              {/* Creative Rationale & Approver */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Approved By
                  </label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    placeholder="Marcus Vance / Jane Sterling"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Approver Role
                  </label>
                  <input
                    type="text"
                    value={approvedRole}
                    onChange={(e) => setApprovedRole(e.target.value)}
                    placeholder="Music Supervisor / Lead Counsel / Prop Master"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                {existingPlaceholder ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    style={{
                      background: 'transparent',
                      border: '1px solid #ef4444',
                      color: '#f87171',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Delete Placeholder
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={onClose}
                    style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSaving}
                    style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  >
                    {isSaving ? 'Saving...' : existingPlaceholder ? 'Update Placeholder' : 'Save & Attach Placeholder'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
