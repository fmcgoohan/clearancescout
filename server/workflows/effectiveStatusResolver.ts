import { CanonicalEntityData, ClearanceStatus } from '../repositories/EntityRepo.js';
import { CounselOverride } from '../repositories/OverrideRepo.js';

/**
 * Resolves the authoritative effective clearance status of an entity occurrence in a scene.
 * Hierarchy:
 *   1. Scene-specific Counsel Override (if override exists matching entity & sceneId)
 *   2. Canonical Entity Counsel Override (if entity is marked isOverridden / has latestOverride)
 *   3. Automated Risk Assessment Baseline (entity.overallClearanceStatus)
 */
export function resolveEffectiveClearanceStatus(
  entity: CanonicalEntityData,
  overrides: CounselOverride[] = [],
  sceneId?: string
): ClearanceStatus {
  // 1. Scene-Specific Override
  if (sceneId) {
    const sceneOverrides = overrides
      .filter((o) => o.canonicalEntityId === entity.id && o.sceneId === sceneId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (sceneOverrides.length > 0) {
      return sceneOverrides[0].overrideStatus;
    }
  }

  // 2. Canonical Entity Override (Project-wide)
  const canonicalOverrides = overrides
    .filter((o) => o.canonicalEntityId === entity.id && !o.sceneId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (canonicalOverrides.length > 0) {
    return canonicalOverrides[0].overrideStatus;
  }

  if (entity.isOverridden && entity.latestOverride) {
    return entity.latestOverride.overrideStatus;
  }

  // 3. Automated Risk Assessment Baseline
  return entity.overallClearanceStatus;
}
