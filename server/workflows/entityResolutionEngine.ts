import { entityRepo, CanonicalEntityData, EntityCategory, EntityRelationshipType } from '../repositories/EntityRepo.js';

export type MatchRule =
  | 'EXACT_CANONICAL'
  | 'ALIAS_MATCH'
  | 'NORMALIZED_EQUIVALENCE'
  | 'PARENTHETICAL_EXPANSION'
  | 'DELIMITER_EXPANSION'
  | 'ACRONYM_EQUIVALENCE'
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

  private extractAcronym(str: string): string {
    // Generates acronym from uppercase initials or first letters of words: e.g. "Associated Press" -> "AP", "A.P." -> "AP"
    const cleaned = str.replace(/[\.,\-_'"`()\[\]\{\}\/\\!@#$%^&*+=:;?<>~]/g, ' ').trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      return words.map((w) => w[0]).join('').toLowerCase();
    }
    // If single word like "AP", just return lowercase letters without dots
    return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  private extractCandidateTokens(mention: string): string[] {
    const tokens = new Set<string>();
    tokens.add(mention.trim());

    // 1. Check for parenthetical forms: "A.P. (Associated Press)" -> ["A.P.", "Associated Press"]
    const parentheticalMatch = mention.match(/^(.+?)\s*\((.+?)\)$/);
    if (parentheticalMatch) {
      tokens.add(parentheticalMatch[1].trim());
      tokens.add(parentheticalMatch[2].trim());
    }

    // 2. Check for delimiter splits: "Associated Press / A.P." -> ["Associated Press", "A.P."]
    if (mention.includes('/') || mention.includes('|') || mention.toLowerCase().includes(' aka ')) {
      const parts = mention.split(/\/|\||\baka\b/i).map((s) => s.trim()).filter(Boolean);
      parts.forEach((p) => tokens.add(p));
    }

    return Array.from(tokens);
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

    const entities = await entityRepo.getEntitiesByProject(projectId, { includeArchived: true });
    const normMention = this.normalize(rawClean);
    const mentionAcronym = this.extractAcronym(rawClean);
    const candidateTokens = this.extractCandidateTokens(rawClean);

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

    // 4. Stage 4: Parenthetical & Composite Delimiter Token Matching
    if (candidateTokens.length > 1) {
      for (const token of candidateTokens) {
        if (token.toLowerCase() === rawClean.toLowerCase()) continue;
        const normToken = this.normalize(token);
        for (const ent of entities) {
          if (category && ent.entityCategory !== category) continue;
          if (
            ent.canonicalName.toLowerCase() === token.toLowerCase() ||
            this.normalize(ent.canonicalName) === normToken ||
            (ent.aliases || []).some((a) => a.toLowerCase() === token.toLowerCase() || this.normalize(a) === normToken)
          ) {
            const rule: MatchRule = rawClean.includes('(') ? 'PARENTHETICAL_EXPANSION' : 'DELIMITER_EXPANSION';
            return {
              matched: true,
              canonicalEntityId: ent.id,
              canonicalName: ent.canonicalName,
              entityCategory: ent.entityCategory,
              confidence: 0.90,
              matchRule: rule,
              matchedAlias: token,
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
    }

    // 5. Stage 5: Generic Acronym / Initialism Equivalence (e.g., "Associated Press" <-> "AP" / "A.P.")
    for (const ent of entities) {
      if (category && ent.entityCategory !== category) continue;
      const canonicalAcronym = this.extractAcronym(ent.canonicalName);
      const isMultiWordCanonical = ent.canonicalName.trim().split(/\s+/).length > 1;
      const isMultiWordMention = rawClean.trim().split(/\s+/).length > 1;

      // Case A: Mention is acronym (e.g., "A.P.", "AP") and Canonical is multi-word ("Associated Press")
      if (!isMultiWordMention && isMultiWordCanonical && mentionAcronym.length >= 2 && mentionAcronym === canonicalAcronym) {
        return {
          matched: true,
          canonicalEntityId: ent.id,
          canonicalName: ent.canonicalName,
          entityCategory: ent.entityCategory,
          confidence: 0.88,
          matchRule: 'ACRONYM_EQUIVALENCE',
          matchedAlias: rawClean,
          parentEntity: ent.parentEntityId
            ? {
                id: ent.parentEntityId,
                name: ent.parentEntityName || '',
                relationshipType: ent.relationshipType || 'BRAND_PRODUCT',
              }
            : undefined,
        };
      }

      // Case B: Mention is multi-word ("Associated Press") and Canonical was registered as acronym ("A.P.", "AP")
      if (isMultiWordMention && !isMultiWordCanonical && mentionAcronym.length >= 2 && mentionAcronym === canonicalAcronym) {
        return {
          matched: true,
          canonicalEntityId: ent.id,
          canonicalName: ent.canonicalName,
          entityCategory: ent.entityCategory,
          confidence: 0.88,
          matchRule: 'ACRONYM_EQUIVALENCE',
          matchedAlias: rawClean,
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

    // 6. Stage 6: Parent Brand Prefix / Product Hierarchy Match
    for (const ent of entities) {
      if (category && ent.entityCategory !== category) continue;
      const normCanonical = this.normalize(ent.canonicalName);
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

  isGenericMatch(name1: string, name2: string): boolean {
    const n1 = this.normalize(name1);
    const n2 = this.normalize(name2);
    if (n1 === n2) return true;

    const t1 = this.extractCandidateTokens(name1);
    const t2 = this.extractCandidateTokens(name2);
    for (const token1 of t1) {
      for (const token2 of t2) {
        if (this.normalize(token1) === this.normalize(token2)) return true;
      }
    }

    const a1 = this.extractAcronym(name1);
    const a2 = this.extractAcronym(name2);
    const words1 = name1.trim().split(/\s+/).length;
    const words2 = name2.trim().split(/\s+/).length;
    if (a1.length >= 2 && a1 === a2 && (words1 > 1 || words2 > 1)) {
      return true;
    }

    return false;
  }
}

export const entityResolutionEngine = new EntityResolutionEngine();
