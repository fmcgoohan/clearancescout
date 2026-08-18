import { config } from '../config.js';
import { ClearanceCitation, ProvenanceType } from '../repositories/AssessmentRepo.js';
import { PARALLEL_SEARCH_FIXTURES } from '../fixtures/recordReplayFixtures.js';
import { v4 as uuidv4 } from 'uuid';

export interface SearchResult {
  query: string;
  citations: ClearanceCitation[];
  provenance: ProvenanceType;
}

export class ParallelSearchTool {
  async searchTrademarkGrounding(entityName: string): Promise<SearchResult> {
    const query = `${entityName} registered trademark status ownership classification dispute precedents`;
    const now = new Date().toISOString();

    const normKey = entityName.toLowerCase();
    const fixtureEntry = Object.entries(PARALLEL_SEARCH_FIXTURES).find(([k]) => normKey.includes(k))?.[1];

    const ownerInfo = fixtureEntry
      ? { owner: fixtureEntry.corporateOwner, precedents: fixtureEntry.disputePrecedents }
      : {
          owner: `${entityName} Holdings / Corporate Registrant`,
          precedents: 'Standard trademark protections apply under Nice Classification.',
        };

    // If in CLOUD_MODE, attempt live parallel-web SDK search
    if (config.executionMode === 'CLOUD_MODE') {
      if (config.parallelWebApiKey) {
        try {
          // @ts-ignore
          const ParallelClient = (await import('@parallel-web/sdk')).default;
          const parallel = new ParallelClient({ apiKey: config.parallelWebApiKey });
          const res = await (parallel as any).search({ query, limit: 3 });

          const citations: ClearanceCitation[] = (res.results || []).map((r: any) => ({
            id: `cit-${uuidv4().slice(0, 8)}`,
            sourceUrl: r.url || 'https://parallel.ai/search',
            query,
            retrievedAt: now,
            excerptSnippet: r.snippet || r.title || `Trademark search result for ${entityName}`,
            registrationStatus: 'REGISTERED_ACTIVE' as const,
            corporateOwner: ownerInfo.owner,
            disputePrecedents: ownerInfo.precedents,
            provenance: 'PARALLEL_LIVE' as const,
          }));

          return { query, citations, provenance: 'PARALLEL_LIVE' };
        } catch (err) {
          console.warn('[ParallelSearchTool] Live search failed, using visible FALLBACK_FIXTURE:', err);
        }
      } else {
        console.warn('[ParallelSearchTool] CLOUD_MODE active but PARALLEL_WEB_API_KEY missing, using visible FALLBACK_FIXTURE');
      }

      // CLOUD_MODE Fallback Fixtures (Explicitly marked as FALLBACK_FIXTURE)
      return {
        query,
        provenance: 'FALLBACK_FIXTURE',
        citations: [
          {
            id: `cit-${uuidv4().slice(0, 8)}`,
            sourceUrl: fixtureEntry?.sourceUrl || `https://uspto.gov/trademarks/search?q=${encodeURIComponent(entityName)}`,
            query,
            retrievedAt: now,
            excerptSnippet: `[FALLBACK FIXTURE] ${fixtureEntry?.excerptSnippet || `USPTO Registry benchmark entry for ${entityName}.`}`,
            registrationStatus: fixtureEntry?.registrationStatus || 'REGISTERED_ACTIVE',
            corporateOwner: ownerInfo.owner,
            disputePrecedents: ownerInfo.precedents,
            provenance: 'FALLBACK_FIXTURE',
          },
        ],
      };
    }

    // DEMO_MODE / TEST_MODE Synthetic Benchmark Dataset from recordReplayFixtures
    if (fixtureEntry) {
      return {
        query,
        provenance: 'DEMO_FIXTURE',
        citations: [
          {
            id: `cit-${uuidv4().slice(0, 8)}`,
            sourceUrl: fixtureEntry.sourceUrl,
            query,
            retrievedAt: now,
            excerptSnippet: fixtureEntry.excerptSnippet,
            registrationStatus: fixtureEntry.registrationStatus,
            corporateOwner: fixtureEntry.corporateOwner,
            disputePrecedents: fixtureEntry.disputePrecedents,
            provenance: 'DEMO_FIXTURE',
          },
          {
            id: `cit-${uuidv4().slice(0, 8)}`,
            sourceUrl: `https://branddirectory.com/brands/${encodeURIComponent(fixtureEntry.queryKey)}`,
            query,
            retrievedAt: now,
            excerptSnippet: `${fixtureEntry.corporateOwner} portfolio details and public trademark licensing guidelines for ${entityName}.`,
            registrationStatus: fixtureEntry.registrationStatus,
            corporateOwner: fixtureEntry.corporateOwner,
            disputePrecedents: fixtureEntry.disputePrecedents,
            provenance: 'DEMO_FIXTURE',
          },
        ],
      };
    }

    return {
      query,
      provenance: 'DEMO_FIXTURE',
      citations: [
        {
          id: `cit-${uuidv4().slice(0, 8)}`,
          sourceUrl: `https://uspto.gov/trademarks/search?q=${encodeURIComponent(entityName)}`,
          query,
          retrievedAt: now,
          excerptSnippet: `Official USPTO Registry entry for ${entityName}: Active Registered Trademark under International Classes.`,
          registrationStatus: 'REGISTERED_ACTIVE',
          corporateOwner: ownerInfo.owner,
          disputePrecedents: ownerInfo.precedents,
          provenance: 'DEMO_FIXTURE',
        },
        {
          id: `cit-${uuidv4().slice(0, 8)}`,
          sourceUrl: `https://branddirectory.com/brands/${encodeURIComponent(entityName.toLowerCase())}`,
          query,
          retrievedAt: now,
          excerptSnippet: `${entityName} global brand portfolio details, corporate owner trademark rights, and public licensing guidelines.`,
          registrationStatus: 'REGISTERED_ACTIVE',
          corporateOwner: ownerInfo.owner,
          disputePrecedents: ownerInfo.precedents,
          provenance: 'DEMO_FIXTURE',
        },
      ],
    };
  }
}

export const parallelSearchTool = new ParallelSearchTool();
