import { entityRepo, CanonicalEntityData, EntityCategory, EntityRelationshipType } from '../repositories/EntityRepo.js';

export type MatchRule =
  | 'EXACT_CANONICAL'
  | 'ALIAS_MATCH'
  | 'NORMALIZED_EQUIVALENCE'
  | 'HIERARCHY_PARENT_MATCH'
  | 'NONE';

export interface EntityResolutionResult {
  matched: boolean;
  canonicalEntityId?: string;
  canonicalName?: string;
  entityCategory?: EntityCategory;
  confidence: number;
  matchRule: MatchRule;
  matchedAlias?: string;
  parentEntity?: {
    id: string;
    name: string;
    relationshipType: EntityRelationshipType;
  };
}

export class EntityResolutionEngine {
  private normalize(str: string): string {
    return str
      .toLowerCase()
      .replace(/[\.,\-_'"`()\[\]\{\}\/\\!@#$%^&*+=:;?<>~]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async resolveEntityMention(
    projectId: string,
    mention: string,
    category?: EntityCategory
  ): Promise<EntityResolutionResult> {
    const rawClean = mention.trim();
    if (!rawClean) {
      return { matched: false, confidence: 0.0, matchRule: 'NONE' };
    }

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const normMention = this.normalize(rawClean);

    // 1. Stage 1: Exact Canonical Match (Case-Insensitive)
    for (const ent of entities) {
      if (category && ent.entityCategory !== category) continue;
      if (ent.canonicalName.toLowerCase() === rawClean.toLowerCase()) {
        return {
          matched: true,
          canonicalEntityId: ent.id,
          canonicalName: ent.canonicalName,
          entityCategory: ent.entityCategory,
          confidence: 1.0,
          matchRule: 'EXACT_CANONICAL',
          parentEntity: ent.parentEntityId
            ? {
                id: ent.parentEntityId,
                name: ent.parentEntityName || '',
                relationshipType: ent.relationshipType || 'BRAND_PRODUCT',
              }
            : undefined,
        };
      }
    }

    // 2. Stage 2: Exact Alias Match
    for (const ent of entities) {
      if (category && ent.entityCategory !== category) continue;
      const aliases = ent.aliases || [];
      for (const alias of aliases) {
        if (alias.toLowerCase() === rawClean.toLowerCase()) {
          return {
            matched: true,
            canonicalEntityId: ent.id,
            canonicalName: ent.canonicalName,
            entityCategory: ent.entityCategory,
            confidence: 0.95,
            matchRule: 'ALIAS_MATCH',
            matchedAlias: alias,
            parentEntity: ent.parentEntityId
              ? {
                  id: ent.parentEntityId,
                  name: ent.parentEntityName || '',
                  relationshipType: ent.relationshipType || 'BRAND_PRODUCT',
                }
              : undefined,
          };
        }
      }
    }

    // 3. Stage 3: Normalized Lexical Equivalence
    for (const ent of entities) {
      if (category && ent.entityCategory !== category) continue;
      const normCanonical = this.normalize(ent.canonicalName);
      if (normCanonical === normMention) {
        return {
          matched: true,
          canonicalEntityId: ent.id,
          canonicalName: ent.canonicalName,
          entityCategory: ent.entityCategory,
          confidence: 0.90,
          matchRule: 'NORMALIZED_EQUIVALENCE',
          parentEntity: ent.parentEntityId
            ? {
                id: ent.parentEntityId,
                name: ent.parentEntityName || '',
                relationshipType: ent.relationshipType || 'BRAND_PRODUCT',
              }
            : undefined,
        };
      }

      for (const alias of ent.aliases || []) {
        if (this.normalize(alias) === normMention) {
          return {
            matched: true,
            canonicalEntityId: ent.id,
            canonicalName: ent.canonicalName,
            entityCategory: ent.entityCategory,
            confidence: 0.90,
            matchRule: 'NORMALIZED_EQUIVALENCE',
            matchedAlias: alias,
            parentEntity: ent.parentEntityId
              ? {
                  id: ent.parentEntityId,
                  name: ent.parentEntityName || '',
                  relationshipType: ent.relationshipType || 'BRAND_PRODUCT',
                }
              : undefined,
          };
        }
      }
    }

    // 4. Stage 4: Parent Brand Prefix / Product Hierarchy Match
    for (const ent of entities) {
      if (category && ent.entityCategory !== category) continue;
      const normCanonical = this.normalize(ent.canonicalName);
      // If mention starts with canonical brand name (e.g. "Porsche 911" matches "Porsche")
      if (normMention.startsWith(`${normCanonical} `) || normCanonical.startsWith(`${normMention} `)) {
        return {
          matched: true,
          canonicalEntityId: ent.id,
          canonicalName: ent.canonicalName,
          entityCategory: ent.entityCategory,
          confidence: 0.85,
          matchRule: 'HIERARCHY_PARENT_MATCH',
          parentEntity: ent.parentEntityId
            ? {
                id: ent.parentEntityId,
                name: ent.parentEntityName || '',
                relationshipType: ent.relationshipType || 'BRAND_PRODUCT',
              }
            : undefined,
        };
      }
    }

    return {
      matched: false,
      confidence: 0.0,
      matchRule: 'NONE',
    };
  }
}

export const entityResolutionEngine = new EntityResolutionEngine();
