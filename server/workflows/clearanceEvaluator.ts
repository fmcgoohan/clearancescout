import { entityRepo, ClearanceStatus, CanonicalEntityData, SceneEntityOccurrenceData } from '../repositories/EntityRepo.js';
import { assessmentRepo, ClearanceRiskAssessmentData, OccurrenceContextInterpretation } from '../repositories/AssessmentRepo.js';
import { actionNotificationRepo } from '../repositories/ActionNotificationRepo.js';
import { projectRepo } from '../repositories/ProjectRepo.js';
import { rightsRepo } from '../repositories/RightsRepo.js';
import { actionDispatcher } from './actionDispatcher.js';
import { parallelSearchTool, SearchResult } from '../tools/parallelSearchTool.js';
import { timelineEmitter } from '../events/timelineEmitter.js';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

export interface ResearchRetryResult {
  entity: CanonicalEntityData;
  assessment: ClearanceRiskAssessmentData;
  retriedAt: string;
}

export interface OccurrenceEvaluationResult {
  occurrence: SceneEntityOccurrenceData;
  assessment: ClearanceRiskAssessmentData;
  derivedCanonicalStatus: ClearanceStatus;
  evaluatedAt: string;
}

export class ClearanceEvaluator {
  private ai: GoogleGenAI | null = null;
  private groundingCache: Map<string, SearchResult> = new Map();

  constructor() {
    if (config.geminiApiKey) {
      this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
  }

  invalidateGroundingCache(projectId: string, canonicalEntityId?: string): void {
    if (canonicalEntityId) {
      this.groundingCache.delete(`${projectId}:${canonicalEntityId}`);
    } else {
      this.groundingCache.clear();
    }
  }

  async getOrFetchGroundingSearch(
    projectId: string,
    entity: CanonicalEntityData,
    activeMode: string,
    bypassCache: boolean = false
  ): Promise<SearchResult> {
    const cacheKey = `${projectId}:${entity.id}`;
    if (!bypassCache) {
      if (this.groundingCache.has(cacheKey)) {
        return this.groundingCache.get(cacheKey)!;
      }

      const existingAssessments = await assessmentRepo.getAssessmentsByEntity(projectId, entity.id);
      if (existingAssessments.length > 0 && existingAssessments[0].citations?.length > 0) {
        const first = existingAssessments[0];
        const isZero = first.contextFlags?.includes('ZERO_TRADEMARK_CONFLICTS_SURFACED');
        const outcome = first.provenance === 'FALLBACK_FIXTURE'
          ? 'SERVICE_FALLBACK'
          : isZero
          ? 'ZERO_RESULTS'
          : 'MATCHES_FOUND';

        const result: SearchResult = {
          query: first.citations[0]?.query || entity.canonicalName,
          citations: first.citations,
          provenance: first.provenance || (activeMode === 'CLOUD_MODE' ? 'PARALLEL_LIVE' : 'DEMO_FIXTURE'),
          searchOutcome: outcome,
        };
        this.groundingCache.set(cacheKey, result);
        return result;
      }
    }

    // First time researching this entity (or forced fresh retry): consume 1 live quota point in CLOUD_MODE
    if (activeMode === 'CLOUD_MODE') {
      const quotaResult = await projectRepo.consumeLiveQuota(projectId, 1);
      if (!quotaResult.success) {
        const err: any = new Error(
          `Live research quota exceeded for this project (${quotaResult.quota.remaining}/${quotaResult.quota.limit} remaining).`
        );
        err.status = 429;
        err.quota = quotaResult.quota;
        throw err;
      }
    }

    const searchResult = await parallelSearchTool.searchTrademarkGrounding(entity.canonicalName, activeMode);
    this.groundingCache.set(cacheKey, searchResult);
    return searchResult;
  }

  async retryEntityResearch(projectId: string, canonicalEntityId: string): Promise<ResearchRetryResult> {
    const entity = await entityRepo.getEntityById(projectId, canonicalEntityId);
    if (!entity) {
      throw new Error(`Canonical entity ${canonicalEntityId} not found in project ${projectId}`);
    }

    // Invalidate in-memory cache for retry
    this.invalidateGroundingCache(projectId, canonicalEntityId);

    // Eligibility Gating: Retry is permitted only for INSUFFICIENT_EVIDENCE, un-evaluated items, or overridden entities needing evidence refresh
    if (!entity.isOverridden && entity.overallClearanceStatus !== 'INSUFFICIENT_EVIDENCE') {
      const err: any = new Error(
        `Entity is already evaluated with status ${entity.overallClearanceStatus}. Retry is permitted only for INSUFFICIENT_EVIDENCE or failed research.`
      );
      err.status = 400;
      throw err;
    }

    // Emit RESEARCH_RETRY_STARTED observable timeline event
    timelineEmitter.emit(projectId, 'RESEARCH_RETRY_STARTED', `Research Retry Initiated: ${entity.canonicalName}`, {
      entityId: entity.id,
      canonicalName: entity.canonicalName,
      previousStatus: entity.overallClearanceStatus,
      timestamp: new Date().toISOString(),
    });

    // Execute targeted research evaluation bypassing existing grounding
    const assessment = await this.evaluateEntityClearance(projectId, canonicalEntityId, true);
    const updatedEntity = (await entityRepo.getEntityById(projectId, canonicalEntityId)) || entity;

    // Auto-resolve open RETRY_RESEARCH action items for this entity upon retry
    try {
      const openActions = await actionNotificationRepo.getActionsByProject(projectId, {
        canonicalEntityId,
      });
      for (const act of openActions) {
        if (act.actionType === 'RETRY_RESEARCH' && (act.status === 'OPEN' || act.status === 'IN_PROGRESS')) {
          await actionNotificationRepo.updateActionStatus(projectId, act.id, 'RESOLVED', 'RESEARCH_RETRY_COMPLETED');
        }
      }
    } catch (err) {
      console.warn('Failed to resolve retry actions:', err);
    }

    return {
      entity: updatedEntity,
      assessment,
      retriedAt: new Date().toISOString(),
    };
  }

  async evaluateOccurrenceClearance(
    projectId: string,
    occurrenceId: string,
    bypassCache: boolean = false
  ): Promise<OccurrenceEvaluationResult> {
    const occLookup = await entityRepo.getOccurrenceById(projectId, occurrenceId);
    if (!occLookup) {
      throw new Error(`Occurrence ${occurrenceId} not found`);
    }

    const { occurrence, sceneId } = occLookup;
    const entity = await entityRepo.getEntityById(projectId, occurrence.canonicalEntityId);
    if (!entity) {
      throw new Error(`Canonical entity ${occurrence.canonicalEntityId} not found`);
    }

    const project = await projectRepo.getProject(projectId);
    const activeMode = project?.executionMode || config.executionMode;

    // Step 1: Grounding Search (reused & cached per canonical entity, unless bypassing)
    const searchResult = await this.getOrFetchGroundingSearch(projectId, entity, activeMode, bypassCache);

    timelineEmitter.emit(projectId, 'TOOL_CALL', `Grounding Research for Scene Occurrence: ${entity.canonicalName}`, {
      occurrenceId,
      sceneId,
      canonicalEntityId: entity.id,
      provenance: searchResult.provenance,
    });

    // Step 2: Contractual Rights & Restrictions Evaluation (Phase 4)
    const rightsCoverage = await rightsRepo.evaluateRightsCoverage(projectId, entity.id, occurrenceId);

    // Step 3: Structured Occurrence Context Interpretation (Gemini / Deterministic)
    const defamatoryKeywords = ['dangerous', 'toxic', 'poisonous', 'faulty', 'exploded', 'stole', 'illegal', 'scam', 'killed', 'disaster', 'counterfeit', 'weapon'];
    const sceneContextText = `${occurrence.excerptText || ''} ${occurrence.usageContext || ''}`.toLowerCase();

    let isDefamatory = false;
    defamatoryKeywords.forEach((kw) => {
      if (sceneContextText.includes(kw)) {
        isDefamatory = true;
      }
    });

    const isForeground = sceneContextText.includes('hero') || sceneContextText.includes('foreground') || sceneContextText.includes('holds') || sceneContextText.includes('sips');
    const isDialogue = sceneContextText.includes('dialogue') || sceneContextText.includes('says') || sceneContextText.includes('speaks');

    let occurrenceContext: OccurrenceContextInterpretation = {
      prominence: isForeground ? 'HERO_FOREGROUND' : 'BACKGROUND_INCIDENTAL',
      modality: isDialogue ? 'DIALOGUE_MENTION' : 'VISUAL_PROP',
      tone: isDefamatory ? 'DISPARAGING' : 'NEUTRAL',
      endorsementImplication: isForeground,
      safetyHazardDepiction: isDefamatory,
      defamationRisk: isDefamatory,
      extractedContextSnippet: occurrence.excerptText || occurrence.usageContext || '',
    };

    let isGeminiFallback = false;
    if (this.ai) {
      try {
        const prompt = `You are an expert entertainment clearance supervisor. Analyze this screenplay entity occurrence for clearance risks:
Entity: ${entity.canonicalName}
Category: ${entity.entityCategory}
Scene Excerpt: "${occurrence.excerptText || ''}"
Usage Description: "${occurrence.usageContext || ''}"

Return valid JSON with these fields:
- prominence: "HERO_FOREGROUND" or "BACKGROUND_INCIDENTAL"
- modality: "VISUAL_PROP", "DIALOGUE_MENTION", or "BOTH"
- tone: "FAVORABLE", "NEUTRAL", or "DISPARAGING"
- endorsementImplication: boolean
- safetyHazardDepiction: boolean
- defamationRisk: boolean
- extractedContextSnippet: string`;

        const geminiRes = await this.ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse(geminiRes.text || '{}');
        if (parsed.prominence && parsed.tone) {
          occurrenceContext = {
            prominence: parsed.prominence === 'HERO_FOREGROUND' ? 'HERO_FOREGROUND' : 'BACKGROUND_INCIDENTAL',
            modality: parsed.modality || occurrenceContext.modality,
            tone: parsed.tone === 'DISPARAGING' ? 'DISPARAGING' : parsed.tone === 'FAVORABLE' ? 'FAVORABLE' : 'NEUTRAL',
            endorsementImplication: Boolean(parsed.endorsementImplication),
            safetyHazardDepiction: Boolean(parsed.safetyHazardDepiction),
            defamationRisk: Boolean(parsed.defamationRisk),
            extractedContextSnippet: parsed.extractedContextSnippet || occurrence.excerptText || '',
          };
          if (occurrenceContext.defamationRisk || occurrenceContext.tone === 'DISPARAGING') {
            isDefamatory = true;
          }
        } else {
          isGeminiFallback = true;
        }
      } catch (err) {
        isGeminiFallback = true;
        console.warn('[ClearanceEvaluator] Gemini occurrence interpretation fallback:', err);
      }
    } else {
      isGeminiFallback = true;
    }

    // Step 4: Deterministic Occurrence Verdict Calculation
    const primaryCitation = searchResult.citations[0];
    const isRegisteredActive = primaryCitation?.registrationStatus === 'REGISTERED_ACTIVE';
    // Structured search outcome evaluation (primary) with legacy citation-prose compatibility fallback
    const isZeroHit =
      searchResult.searchOutcome !== undefined
        ? searchResult.searchOutcome === 'ZERO_RESULTS'
        : Boolean(
            primaryCitation?.excerptSnippet?.includes('zero conflicting marks surfaced') ||
            primaryCitation?.excerptSnippet?.includes('zero conflicting trademark') ||
            (searchResult.provenance === 'PARALLEL_LIVE' && primaryCitation?.sourceUrl === 'https://parallel.ai/search' && primaryCitation?.excerptSnippet?.startsWith('Completed live search'))
          );
    const isLiveMatchUnknown =
      !isZeroHit && (primaryCitation?.registrationStatus === 'UNKNOWN' || !primaryCitation?.registrationStatus);

    let status: ClearanceStatus = 'REVIEW_RECOMMENDED';
    let riskScore = 45;
    let rationale = isRegisteredActive
      ? `Grounding search confirmed active registration for ${entity.canonicalName}. Category: ${entity.entityCategory}. Usage in ${sceneId} is neutral to moderate risk.`
      : isZeroHit
      ? `Completed live search surfaced zero conflicting trademark registrations for ${entity.canonicalName}. Category: ${entity.entityCategory}. Review recommended to confirm unregistered common law rights.`
      : `Live search surfaced public reference(s) for ${entity.canonicalName}, but registration status is unconfirmed. Category: ${entity.entityCategory}. Review recommended to confirm active trademark protections.`;

    const contextFlags: string[] = isRegisteredActive
      ? ['TRADEMARK_ACTIVE']
      : isZeroHit
      ? ['ZERO_TRADEMARK_CONFLICTS_SURFACED', 'UNREGISTERED_HERO_REVIEW']
      : ['LIVE_MATCH_STATUS_UNKNOWN', 'TRADEMARK_STATUS_UNKNOWN'];

    if (isGeminiFallback) {
      contextFlags.push('CONTEXT_DETERMINISTIC_FALLBACK');
    }

    // CLOUD_MODE Fail-Closed Invariant: Unmitigated fallback fixtures fail closed to INSUFFICIENT_EVIDENCE
    if (activeMode === 'CLOUD_MODE' && searchResult.provenance === 'FALLBACK_FIXTURE' && !rightsCoverage.isCovered) {
      status = 'INSUFFICIENT_EVIDENCE';
      riskScore = 95;
      rationale = `Live Parallel Search unavailable in CLOUD_MODE for "${entity.canonicalName}". Evaluated as INSUFFICIENT_EVIDENCE under fail-closed production policy.`;
      contextFlags.length = 0;
      contextFlags.push('EVIDENCE_INSUFFICIENT', 'FALLBACK_RESEARCH_ACTIVE');
      if (isGeminiFallback) {
        contextFlags.push('CONTEXT_DETERMINISTIC_FALLBACK');
      }
    } else if (rightsCoverage.isCovered) {
      // Contractual Rights cover this usage
      status = 'NO_ISSUE_SURFACED';
      riskScore = 5;
      rationale = `${rightsCoverage.summaryText} Scene usage in ${sceneId} is cleared under executed agreement.`;
      contextFlags.length = 0;
      contextFlags.push('CONTRACTUAL_RIGHTS_ACTIVE');
      if (rightsCoverage.covenants.length > 0) {
        rightsCoverage.covenants.forEach((c) => contextFlags.push(`COVENANT: ${c}`));
      }
      if (rightsCoverage.hasExpiringSoon && rightsCoverage.expirationWarning) {
        contextFlags.push('LICENSE_EXPIRING_SOON');
      }
      if (isGeminiFallback) {
        contextFlags.push('CONTEXT_DETERMINISTIC_FALLBACK');
      }
    } else if (isDefamatory || occurrenceContext.tone === 'DISPARAGING' || occurrenceContext.defamationRisk) {
      status = 'ACTION_REQUIRED';
      riskScore = 90;
      rationale = `High tarnishment / disparagement risk in ${sceneId}: "${entity.canonicalName}" is depicted in negative scene context ("${occurrence.excerptText}"). Replacement or counsel release required.`;
      contextFlags.length = 0;
      contextFlags.push('DEFAMATION_RISK', 'UNAUTHORIZED_USAGE');
      if (isGeminiFallback) {
        contextFlags.push('CONTEXT_DETERMINISTIC_FALLBACK');
      }
    } else if (occurrenceContext.safetyHazardDepiction && occurrenceContext.prominence === 'HERO_FOREGROUND') {
      status = 'ACTION_REQUIRED';
      riskScore = 85;
      rationale = `Safety hazard depiction risk in ${sceneId}: "${entity.canonicalName}" is featured in an unsafe product context. Replacement recommended.`;
      contextFlags.length = 0;
      contextFlags.push('SAFETY_HAZARD_RISK', 'UNAUTHORIZED_USAGE');
      if (isGeminiFallback) {
        contextFlags.push('CONTEXT_DETERMINISTIC_FALLBACK');
      }
    } else if (entity.entityCategory === 'ART_MUSIC') {
      status = 'ACTION_REQUIRED';
      riskScore = 85;
      rationale = `Copyrighted musical work in ${sceneId}: "${entity.canonicalName}". Synchronization license required prior to broadcast/distribution.`;
      contextFlags.length = 0;
      contextFlags.push('MUSIC_SYNC_LICENSE_REQUIRED', 'COPYRIGHT_PROTECTION');
      if (isGeminiFallback) {
        contextFlags.push('CONTEXT_DETERMINISTIC_FALLBACK');
      }
    } else if (entity.entityCategory === 'PUBLIC_FIGURE') {
      status = 'REVIEW_RECOMMENDED';
      riskScore = 65;
      rationale = `Living public figure depicted in ${sceneId}: "${entity.canonicalName}". Right of publicity review recommended.`;
      contextFlags.length = 0;
      contextFlags.push('RIGHT_OF_PUBLICITY_REVIEW');
      if (isGeminiFallback) {
        contextFlags.push('CONTEXT_DETERMINISTIC_FALLBACK');
      }
    } else if (entity.entityCategory === 'PROPRIETARY_LOCATION') {
      status = 'REVIEW_RECOMMENDED';
      riskScore = 55;
      rationale = `Proprietary location in ${sceneId}: "${entity.canonicalName}". Location release / filming permit required.`;
      contextFlags.length = 0;
      contextFlags.push('LOCATION_RELEASE_REQUIRED');
      if (isGeminiFallback) {
        contextFlags.push('CONTEXT_DETERMINISTIC_FALLBACK');
      }
    } else if (entity.entityCategory === 'GRAPHIC_PROP') {
      status = 'ACTION_REQUIRED';
      riskScore = 75;
      rationale = `Proprietary graphic text in ${sceneId}: "${entity.canonicalName}". Fictionalized non-infringing prop packaging card recommended.`;
      contextFlags.length = 0;
      contextFlags.push('GRAPHIC_CLEARANCE_REQUIRED');
      if (isGeminiFallback) {
        contextFlags.push('CONTEXT_DETERMINISTIC_FALLBACK');
      }
    } else if (entity.canonicalName.toLowerCase().includes('coca-cola') || entity.canonicalName.toLowerCase().includes('porsche')) {
      status = 'ACTION_REQUIRED';
      riskScore = 80;
      rationale = `High brand protection enforcement mark in ${sceneId}: ${entity.canonicalName}. Written clearance release required.`;
      contextFlags.length = 0;
      contextFlags.push('FAMOUS_MARK_PROTECTION', 'CLEARANCE_RELEASE_REQUIRED');
      if (isGeminiFallback) {
        contextFlags.push('CONTEXT_DETERMINISTIC_FALLBACK');
      }
    } else if (isZeroHit) {
      if (occurrenceContext.prominence === 'HERO_FOREGROUND' || occurrenceContext.endorsementImplication) {
        status = 'REVIEW_RECOMMENDED';
        riskScore = 45;
        rationale = `Completed live search surfaced zero conflicting trademark registrations for "${entity.canonicalName}". Review recommended to confirm unregistered usage in hero context before shooting.`;
        contextFlags.length = 0;
        contextFlags.push('ZERO_TRADEMARK_CONFLICTS_SURFACED', 'UNREGISTERED_HERO_REVIEW');
      } else {
        status = 'NO_ISSUE_SURFACED';
        riskScore = 15;
        rationale = `Completed live search surfaced zero conflicting trademark registrations for "${entity.canonicalName}". Incidental background usage in ${sceneId} is clear.`;
        contextFlags.length = 0;
        contextFlags.push('ZERO_TRADEMARK_CONFLICTS_SURFACED', 'INCIDENTAL_USAGE_CLEAR');
      }
      if (isGeminiFallback) {
        contextFlags.push('CONTEXT_DETERMINISTIC_FALLBACK');
      }
    } else if (isLiveMatchUnknown) {
      if (occurrenceContext.prominence === 'HERO_FOREGROUND' || occurrenceContext.endorsementImplication) {
        status = 'REVIEW_RECOMMENDED';
        riskScore = 55;
        rationale = `Live search surfaced public reference(s) for "${entity.canonicalName}", but registration status is unconfirmed. Review recommended to confirm active trademark protections.`;
        contextFlags.length = 0;
        contextFlags.push('LIVE_MATCH_STATUS_UNKNOWN', 'TRADEMARK_STATUS_UNKNOWN', 'UNREGISTERED_HERO_REVIEW');
      } else {
        status = 'NO_ISSUE_SURFACED';
        riskScore = 20;
        rationale = `Live search surfaced public reference(s) for "${entity.canonicalName}" with unconfirmed registration status. Incidental background usage in ${sceneId} presents low exposure.`;
        contextFlags.length = 0;
        contextFlags.push('LIVE_MATCH_STATUS_UNKNOWN', 'TRADEMARK_STATUS_UNKNOWN', 'INCIDENTAL_USAGE_CLEAR');
      }
      if (isGeminiFallback) {
        contextFlags.push('CONTEXT_DETERMINISTIC_FALLBACK');
      }
    } else {
      status = 'NO_ISSUE_SURFACED';
      riskScore = 15;
      rationale = `No infringement or tarnishment issues surfaced for ${entity.canonicalName} in ${sceneId} context.`;
      if (!isRegisteredActive) {
        contextFlags.length = 0;
        contextFlags.push('TRADEMARK_STATUS_UNKNOWN', 'INCIDENTAL_USAGE_CLEAR');
      }
      if (isGeminiFallback) {
        contextFlags.push('CONTEXT_DETERMINISTIC_FALLBACK');
      }
    }

    // Step 5: Persist Occurrence Evaluation
    const updatedOcc = await entityRepo.updateOccurrenceEvaluation(projectId, sceneId, occurrenceId, {
      clearanceStatus: status,
      riskScore,
      riskRationale: rationale,
      contextFlags,
      citations: searchResult.citations,
      evaluatedAt: new Date().toISOString(),
    });

    // Step 6: Persist Assessment Record
    const assessment = await assessmentRepo.createAssessment({
      occurrenceId,
      canonicalEntityId: entity.id,
      sceneId,
      riskStatus: status,
      riskScore,
      legalRationale: rationale,
      contextFlags,
      citations: searchResult.citations,
      occurrenceContext,
      provenance: searchResult.provenance,
    });

    // Step 7: Compute Derived Canonical Status
    const derivedCanonicalStatus = await entityRepo.computeDerivedCanonicalStatus(projectId, entity.id);

    // Step 8: Dispatch Department Action Items (Phase 6)
    if (status === 'ACTION_REQUIRED' || status === 'REVIEW_RECOMMENDED' || status === 'INSUFFICIENT_EVIDENCE') {
      try {
        await actionDispatcher.dispatchOccurrenceAction(projectId, updatedOcc || occurrence, entity);
      } catch (err) {
        console.error('Failed to dispatch occurrence action:', err);
      }
    }

    timelineEmitter.emit(projectId, 'RISK_EVAL', `Occurrence Risk Verdict (${sceneId}): ${status}`, {
      occurrenceId,
      sceneId,
      canonicalEntityId: entity.id,
      canonicalName: entity.canonicalName,
      riskStatus: status,
      riskScore,
      derivedCanonicalStatus,
      rightsCovered: rightsCoverage.isCovered,
    });

    return {
      occurrence: updatedOcc || occurrence,
      assessment,
      derivedCanonicalStatus,
      evaluatedAt: new Date().toISOString(),
    };
  }

  async evaluateEntityClearance(
    projectId: string,
    canonicalEntityId: string,
    bypassCache: boolean = false
  ): Promise<ClearanceRiskAssessmentData> {
    const project = await projectRepo.getProject(projectId);
    const activeMode = project?.executionMode || config.executionMode;

    const entity = await entityRepo.getEntityById(projectId, canonicalEntityId);
    if (!entity) {
      throw new Error(`Canonical entity ${canonicalEntityId} not found`);
    }

    const occurrences = await entityRepo.getOccurrencesByEntity(projectId, canonicalEntityId);

    // If occurrences exist, evaluate each occurrence in its actual scene context
    let latestAssessment: ClearanceRiskAssessmentData | null = null;

    if (occurrences.length > 0) {
      let isFirst = true;
      for (const occ of occurrences) {
        // If bypassCache is true, force fresh search on the first occurrence only; subsequent occurrences reuse the freshly cached search
        const forceFresh = bypassCache && isFirst;
        const res = await this.evaluateOccurrenceClearance(projectId, occ.id, forceFresh);
        latestAssessment = res.assessment;
        isFirst = false;
      }
    } else {
      // Baseline evaluation when no specific scene occurrences exist
      const rightsCoverage = await rightsRepo.evaluateRightsCoverage(projectId, canonicalEntityId);
      const searchResult = await this.getOrFetchGroundingSearch(projectId, entity, activeMode, bypassCache);

      const primaryCitation = searchResult.citations[0];
      const isRegisteredActive = primaryCitation?.registrationStatus === 'REGISTERED_ACTIVE';
      // Structured search outcome evaluation (primary) with legacy citation-prose compatibility fallback
      const isZeroHit =
        searchResult.searchOutcome !== undefined
          ? searchResult.searchOutcome === 'ZERO_RESULTS'
          : Boolean(
              primaryCitation?.excerptSnippet?.includes('zero conflicting marks surfaced') ||
              primaryCitation?.excerptSnippet?.includes('zero conflicting trademark') ||
              (searchResult.provenance === 'PARALLEL_LIVE' && primaryCitation?.sourceUrl === 'https://parallel.ai/search' && primaryCitation?.excerptSnippet?.startsWith('Completed live search'))
            );
      const isLiveMatchUnknown =
        !isZeroHit && (primaryCitation?.registrationStatus === 'UNKNOWN' || !primaryCitation?.registrationStatus);

      let status: ClearanceStatus = 'REVIEW_RECOMMENDED';
      let riskScore = 45;
      let rationale = isRegisteredActive
        ? `Grounding search confirmed active registration for ${entity.canonicalName}. Baseline category risk for ${entity.entityCategory}.`
        : isZeroHit
        ? `Completed live search surfaced zero conflicting trademark registrations for ${entity.canonicalName}. Baseline category risk for ${entity.entityCategory}. Review recommended to confirm unregistered common law rights.`
        : `Live search surfaced public reference(s) for ${entity.canonicalName} with unconfirmed registration status. Baseline category risk for ${entity.entityCategory}. Review recommended to confirm active trademark protections.`;

      const contextFlags: string[] = isRegisteredActive
        ? ['TRADEMARK_ACTIVE']
        : isZeroHit
        ? ['ZERO_TRADEMARK_CONFLICTS_SURFACED']
        : ['LIVE_MATCH_STATUS_UNKNOWN', 'TRADEMARK_STATUS_UNKNOWN'];

      if (activeMode === 'CLOUD_MODE' && searchResult.provenance === 'FALLBACK_FIXTURE' && !rightsCoverage.isCovered) {
        status = 'INSUFFICIENT_EVIDENCE';
        riskScore = 95;
        rationale = `Live Parallel Search unavailable in CLOUD_MODE for "${entity.canonicalName}". Evaluated as INSUFFICIENT_EVIDENCE under fail-closed production policy.`;
        contextFlags.length = 0;
        contextFlags.push('EVIDENCE_INSUFFICIENT', 'FALLBACK_RESEARCH_ACTIVE');
      } else if (rightsCoverage.isCovered) {
        status = 'NO_ISSUE_SURFACED';
        riskScore = 5;
        rationale = `${rightsCoverage.summaryText} Item is covered under active executed agreement.`;
        contextFlags.length = 0;
        contextFlags.push('CONTRACTUAL_RIGHTS_ACTIVE');
        if (rightsCoverage.covenants.length > 0) {
          rightsCoverage.covenants.forEach((c) => contextFlags.push(`COVENANT: ${c}`));
        }
      } else if (entity.entityCategory === 'ART_MUSIC' || entity.entityCategory === 'GRAPHIC_PROP') {
        status = 'ACTION_REQUIRED';
        riskScore = 80;
      } else if (entity.entityCategory === 'BRAND') {
        // Invariant (FR-003): Baseline BRAND evaluation with zero-hit or unknown registration MUST NOT independently assign NO_ISSUE_SURFACED!
        // It must evaluate as REVIEW_RECOMMENDED unless affirmatively covered by contractual rights.
        if (isRegisteredActive) {
          status = 'ACTION_REQUIRED';
          riskScore = 80;
          rationale = `Grounding search confirmed active registration for ${entity.canonicalName}. Clearance license or replacement required.`;
        } else {
          status = 'REVIEW_RECOMMENDED';
          riskScore = 45;
          rationale = isZeroHit
            ? `Completed live search surfaced zero conflicting trademark registrations for ${entity.canonicalName}. Review recommended to confirm unregistered common law rights.`
            : `Live search surfaced public reference(s) for ${entity.canonicalName} with unconfirmed registration status. Review recommended to confirm active trademark protections.`;
        }
      }

      latestAssessment = await assessmentRepo.createAssessment({
        occurrenceId: `occ-${canonicalEntityId}`,
        canonicalEntityId,
        sceneId: 'scene-general',
        riskStatus: status,
        riskScore,
        legalRationale: rationale,
        contextFlags,
        citations: searchResult.citations,
        provenance: searchResult.provenance,
      });

      await entityRepo.updateCanonicalEntityStatus(projectId, canonicalEntityId, status);
    }

    return latestAssessment!;
  }
}

export const clearanceEvaluator = new ClearanceEvaluator();
