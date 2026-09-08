import React, { useState, useEffect } from 'react';
import { CanonicalEntity } from './EntityRegistryTable';
import { useModalFocus } from '../hooks/useModalFocus';

export type EntityCategory =
  | 'BRAND'
  | 'ART_MUSIC'
  | 'PUBLIC_FIGURE'
  | 'PROPRIETARY_LOCATION'
  | 'GRAPHIC_PROP';

export type EntityRelationshipType =
  | 'BRAND_PRODUCT'
  | 'SUBSIDIARY'
  | 'PARENT_COMPANY'
  | 'PRODUCT_LINE'
  | 'VARIATION';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    canonicalName: string;
    entityCategory: EntityCategory;
    description: string;
    aliases?: string[];
    parentEntityId?: string;
    relationshipType?: EntityRelationshipType;
    sceneId?: string;
  }) => Promise<void>;
  entityToEdit?: CanonicalEntity | null;
  scenes?: Array<{ id: string; sceneNumber: number; heading: string }>;
  existingEntities?: CanonicalEntity[];
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  entityToEdit,
  scenes = [],
  existingEntities = [],
}) => {
  const isEditing = !!entityToEdit;
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EntityCategory>('BRAND');
  const [description, setDescription] = useState('');
  const [aliasesText, setAliasesText] = useState('');
  const [parentEntityId, setParentEntityId] = useState('');
  const [relationshipType, setRelationshipType] = useState<EntityRelationshipType>('BRAND_PRODUCT');
  const [sceneId, setSceneId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { containerRef } = useModalFocus<HTMLDivElement>({
    isOpen,
    onClose,
  });

  useEffect(() => {
    if (entityToEdit) {
      setName(entityToEdit.canonicalName || '');
      setCategory((entityToEdit.entityCategory as EntityCategory) || 'BRAND');
      setDescription(entityToEdit.description || '');
      setAliasesText((entityToEdit.aliases || []).join(', '));
      setParentEntityId(entityToEdit.parentEntityId || '');
      setRelationshipType((entityToEdit.relationshipType as EntityRelationshipType) || 'BRAND_PRODUCT');
      setSceneId('');
    } else {
      setName('');
      setCategory('BRAND');
      setDescription('');
      setAliasesText('');
      setParentEntityId('');
      setRelationshipType('BRAND_PRODUCT');
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

    const aliases = aliasesText
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    try {
      await onSave({
        canonicalName: name.trim(),
        entityCategory: category,
        description: description.trim(),
        aliases,
        parentEntityId: parentEntityId || undefined,
        relationshipType: parentEntityId ? relationshipType : undefined,
        sceneId: sceneId || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save clearance item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const potentialParents = existingEntities.filter((e) => !entityToEdit || e.id !== entityToEdit.id);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-edit-modal-title"
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
          width: '560px',
          maxWidth: '92vw',
          maxHeight: '90vh',
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
            <h2 id="item-edit-modal-title" style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              {isEditing ? `Edit Clearance Item: ${entityToEdit?.canonicalName}` : 'Add New Clearance Item'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isEditing
                ? 'Updating details invalidates automated baseline risk assessment (unless overridden by counsel).'
                : 'Manually register a brand, prop, music track, or public figure.'}
            </p>
          </div>
          <button
            className="btn-secondary touch-target"
            onClick={onClose}
            aria-label="Close edit modal"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Canonical Name */}
            <div>
              <label htmlFor="item-canonical-name" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                Canonical Item Name *
              </label>
              <input
                id="item-canonical-name"
                type="text"
                className="input-field"
                placeholder="e.g. Summit Cola, Porsche 911"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="item-category" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                Clearance Category *
              </label>
              <select
                id="item-category"
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value as EntityCategory)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="BRAND">BRAND (Commercial Trademark, Product, Automotive, Tech)</option>
                <option value="ART_MUSIC">ART_MUSIC (Song, Melody, Painting, Literature)</option>
                <option value="PUBLIC_FIGURE">PUBLIC_FIGURE (Living Celebrity, Athlete, Official)</option>
                <option value="PROPRIETARY_LOCATION">PROPRIETARY_LOCATION (Landmark, Stadium, Private Venue)</option>
                <option value="GRAPHIC_PROP">GRAPHIC_PROP (Graphic Sign, Warning Placard, Branded Prop)</option>
              </select>
            </div>

            {/* Aliases (Phase 3) */}
            <div>
              <label htmlFor="item-aliases" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                Aliases & Multi-Surface Forms (comma separated)
              </label>
              <input
                id="item-aliases"
                type="text"
                className="input-field"
                placeholder="e.g. Coke, Coke Zero, Diet Coke"
                value={aliasesText}
                onChange={(e) => setAliasesText(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Recognized variations automatically map to this canonical item during script parsing.
              </p>
            </div>

            {/* Brand / Product Hierarchy (Phase 3) */}
            {potentialParents.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="item-parent-entity" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Parent Brand / Entity (Optional)
                  </label>
                  <select
                    id="item-parent-entity"
                    className="input-field"
                    value={parentEntityId}
                    onChange={(e) => setParentEntityId(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="">-- None (Standalone Mark) --</option>
                    {potentialParents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.canonicalName} ({p.entityCategory})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="item-relationship-type" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Relationship Type
                  </label>
                  <select
                    id="item-relationship-type"
                    className="input-field"
                    value={relationshipType}
                    onChange={(e) => setRelationshipType(e.target.value as EntityRelationshipType)}
                    disabled={!parentEntityId}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="BRAND_PRODUCT">Brand Product</option>
                    <option value="PRODUCT_LINE">Product Line</option>
                    <option value="SUBSIDIARY">Subsidiary</option>
                    <option value="PARENT_COMPANY">Parent Company</option>
                    <option value="VARIATION">Variation</option>
                  </select>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="item-description" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                Description / Context Notes
              </label>
              <textarea
                id="item-description"
                className="input-field"
                placeholder="Details regarding context, depicted packaging, or clearance notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            {/* Scene placement for new item */}
            {!isEditing && scenes.length > 0 && (
              <div>
                <label htmlFor="item-scene-placement" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Assign Initial Scene Placement
                </label>
                <select
                  id="item-scene-placement"
                  className="input-field"
                  value={sceneId}
                  onChange={(e) => setSceneId(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  {scenes.map((s) => (
                    <option key={s.id} value={s.id}>
                      Scene #{s.sceneNumber}: {s.heading}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              className="btn-secondary touch-target"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary touch-target"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
