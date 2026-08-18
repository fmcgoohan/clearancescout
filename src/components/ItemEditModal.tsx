import React, { useState, useEffect } from 'react';
import { CanonicalEntity } from './EntityRegistryTable';

export type EntityCategory =
  | 'BRAND'
  | 'ART_MUSIC'
  | 'PUBLIC_FIGURE'
  | 'PROPRIETARY_LOCATION'
  | 'GRAPHIC_PROP';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    canonicalName: string;
    entityCategory: EntityCategory;
    description: string;
    sceneId?: string;
  }) => Promise<void>;
  entityToEdit?: CanonicalEntity | null;
  scenes?: Array<{ id: string; sceneNumber: number; heading: string }>;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  entityToEdit,
  scenes = [],
}) => {
  const isEditing = !!entityToEdit;
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EntityCategory>('BRAND');
  const [description, setDescription] = useState('');
  const [sceneId, setSceneId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entityToEdit) {
      setName(entityToEdit.canonicalName || '');
      setCategory((entityToEdit.entityCategory as EntityCategory) || 'BRAND');
      setDescription(entityToEdit.description || '');
      setSceneId('');
    } else {
      setName('');
      setCategory('BRAND');
      setDescription('');
      setSceneId(scenes[0]?.id || '');
    }
    setError(null);
  }, [entityToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        canonicalName: name.trim(),
        entityCategory: category,
        description: description.trim(),
        sceneId: sceneId || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save clearance item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '520px',
          maxWidth: '90vw',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 600 }}>
            {isEditing ? '✏️ Edit Clearance Item' : '➕ Add Clearance Item'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.2rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isEditing
            ? 'Correcting name or category resets automated research while preserving signed counsel overrides.'
            : 'Manually add an unscripted prop, music track, brand, or background element for clearance.'}
        </p>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--danger-color)',
              color: 'var(--danger-color)',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Item / Trademark Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summit Cola, AeroTech Laptop"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Clearance Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EntityCategory)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            >
              <option value="BRAND">🏷️ BRAND (Trademarks, Consumer Products, Autos)</option>
              <option value="ART_MUSIC">🎵 ART_MUSIC (Songs, Lyrics, Paintings)</option>
              <option value="PUBLIC_FIGURE">👤 PUBLIC_FIGURE (Living Celebrities, Figures)</option>
              <option value="PROPRIETARY_LOCATION">🏛️ PROPRIETARY_LOCATION (Landmarks, Private Venues)</option>
              <option value="GRAPHIC_PROP">⚠️ GRAPHIC_PROP (Signs, Placards, Labels)</option>
            </select>
          </div>

          {!isEditing && scenes.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Associate with Scene (Optional)
              </label>
              <select
                value={sceneId}
                onChange={(e) => setSceneId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">-- No Specific Scene --</option>
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    Scene {s.sceneNumber}: {s.heading}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Usage Notes / Placement Context
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe physical placement, prominent exposure, or character interaction..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
