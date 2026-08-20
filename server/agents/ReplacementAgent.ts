import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import { ReplacementAttemptRecord } from '../repositories/ReplacementRepo.js';

export interface GeneratedReplacement {
  fictionalBrandName: string;
  designBrief: string;
  eraAesthetic: string;
  nonInfringementRationale: string;
}

export class ReplacementAgent {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (config.geminiApiKey) {
      this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
  }

  async generateFictionalBrand(
    originalEntityName: string,
    category: string,
    eraAesthetic: string = 'Modern Cinematic',
    attemptHistory: ReplacementAttemptRecord[] = [],
    attemptNumber: number = 1
  ): Promise<GeneratedReplacement> {
    if (config.executionMode !== 'CLOUD_MODE' || !this.ai) {
      return this.generateFallback(originalEntityName, category, eraAesthetic, attemptHistory, attemptNumber);
    }

    try {
      const negativeConstraints = attemptHistory.length > 0
        ? `\n\nNEGATIVE CONSTRAINTS (PREVIOUS ATTEMPTS REJECTED - DO NOT USE OR IMITATE):\n` +
          attemptHistory.map(a => `- Candidate "${a.candidateName}" was REJECTED: ${a.collisionRationale || 'Trademark collision'}`).join('\n')
        : '';

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a creative brand clearance specialist for ClearanceScout. Generate an era-authentic, non-infringing fictional replacement brand concept for '${originalEntityName}' (Category: ${category}) in the era aesthetic style: '${eraAesthetic}'. Attempt #${attemptNumber}.${negativeConstraints}
 
Return JSON object matching this schema:
{
  "fictionalBrandName": "Summit Cola",
  "designBrief": "Sleek red aluminum beverage can with bold white serif typography reading Summit Cola in ${eraAesthetic} style.",
  "eraAesthetic": "${eraAesthetic}",
  "nonInfringementRationale": "Summit Cola is visually, phonetically, and conceptually distinct from registered trademarks in Class 032."
}`,
              },
            ],
          },
        ],
      });

      const responseText = response.text || '{}';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        fictionalBrandName: parsed.fictionalBrandName || `Summit ${category}`,
        designBrief: parsed.designBrief || `Era-appropriate packaging brief for ${eraAesthetic}`,
        eraAesthetic: parsed.eraAesthetic || eraAesthetic,
        nonInfringementRationale: parsed.nonInfringementRationale || 'Fictional non-infringing mark.',
      };
    } catch (err) {
      console.warn('Gemini replacement generation error, using creative fallback:', err);
      return this.generateFallback(originalEntityName, category, eraAesthetic, attemptHistory, attemptNumber);
    }
  }

  private generateFallback(
    originalEntityName: string,
    category: string,
    eraAesthetic: string,
    attemptHistory: ReplacementAttemptRecord[] = [],
    attemptNumber: number = 1
  ): GeneratedReplacement {
    const norm = originalEntityName.toLowerCase();

    // Test helper sequences
    if (norm.includes('collision')) {
      const collSeq = [
        {
          name: `[COLLISION] Alpha Cola`,
          brief: `${eraAesthetic} prop design with conflicting branding.`,
          rationale: `Simulated initial collision mark.`,
        },
        {
          name: `[COLLISION] Beta Cola`,
          brief: `${eraAesthetic} prop design with secondary conflicting mark.`,
          rationale: `Simulated second collision mark.`,
        },
        {
          name: `[COLLISION] Gamma Cola`,
          brief: `${eraAesthetic} prop design with final conflicting mark.`,
          rationale: `Simulated third collision mark.`,
        },
      ];
      const chosen = collSeq[Math.min(attemptNumber - 1, collSeq.length - 1)];
      return {
        fictionalBrandName: chosen.name,
        designBrief: chosen.brief,
        eraAesthetic,
        nonInfringementRationale: chosen.rationale,
      };
    }

    if (norm.includes('multi_retry') || norm.includes('retry')) {
      const retrySeq = [
        {
          name: `[COLLISION] Nuka-Cola`,
          brief: `${eraAesthetic} atomic soda design.`,
          rationale: `Conflicted brand.`,
        },
        {
          name: `Summit Sparkle Fizz`,
          brief: `${eraAesthetic} clean retro soda design.`,
          rationale: `Clean fictional brand mark.`,
        },
      ];
      const chosen = retrySeq[Math.min(attemptNumber - 1, retrySeq.length - 1)];
      return {
        fictionalBrandName: chosen.name,
        designBrief: chosen.brief,
        eraAesthetic,
        nonInfringementRationale: chosen.rationale,
      };
    }

    // Sequences of candidate names across attempts for test/demo modes
    const candidateSequences: Record<string, Array<{ name: string; brief: string; rationale: string }>> = {
      'coca-cola': [
        {
          name: 'Summit Cola',
          brief: `High-contrast crimson aluminum can with clean silver typography reading Summit Cola in ${eraAesthetic} aesthetic.`,
          rationale: 'Phonetically distinct from Coca-Cola and Coke. Avoids trademark confusion in Class 32.',
        },
        {
          name: 'Radiant Pop',
          brief: `Gleaming glass soda bottle with golden effervescent bubbles in ${eraAesthetic} styling.`,
          rationale: 'Independent beverage concept avoiding major commercial soda trademarks.',
        },
        {
          name: 'Atomic Cola',
          brief: `Vintage atomic age bottle with retro starburst graphics in ${eraAesthetic} design.`,
          rationale: 'Distinct fictional prop mark for period productions.',
        },
      ],
      porsche: [
        {
          name: 'Veloce GT',
          brief: `Aerodynamic metallic sports coupe with a minimalist golden shield emblem reading Veloce in ${eraAesthetic} aesthetic.`,
          rationale: 'Distinct automotive name avoiding Porsche, 911, or Stuttgart shield similarity.',
        },
        {
          name: 'Monza Sprint',
          brief: `Classic Italian-inspired sports coupe in racing red with silver wire wheels in ${eraAesthetic} styling.`,
          rationale: 'Independent motor racing vehicle moniker avoiding trademarked supercar badges.',
        },
        {
          name: 'Aero Coupe',
          brief: `Streamlined aerodynamic grand tourer in silver metallic finish in ${eraAesthetic} design.`,
          rationale: 'Generic high-performance fictional vehicle mark.',
        },
      ],
      apple: [
        {
          name: 'AeroTech',
          brief: `Minimalist brushed aluminum laptop with an illuminated geometric prism logo in ${eraAesthetic} styling.`,
          rationale: 'Avoids fruit logo and Apple trademark terms while preserving sleek tech aesthetic.',
        },
        {
          name: 'Prism Computer',
          brief: `Futuristic monolithic computing device with holographic interface in ${eraAesthetic} style.`,
          rationale: 'Original electronics brand concept free of commercial computer registrations.',
        },
        {
          name: 'NovaBook',
          brief: `Ultra-slim titanium workstation with ambient status illumination in ${eraAesthetic} styling.`,
          rationale: 'Fictional prop computer mark.',
        },
      ],
      'bohemian rhapsody': [
        {
          name: 'Nocturne of the Wild',
          brief: `Original dramatic orchestral-rock theatrical ballad composed in ${eraAesthetic} vintage production style.`,
          rationale: 'Original melody and lyrics avoiding Queen and Mercury estate copyright infringement.',
        },
        {
          name: 'Symphony of the Night',
          brief: `Sweeping operatic rock anthem with soaring vocal harmonies in ${eraAesthetic} style.`,
          rationale: 'Original musical composition avoiding copyrighted song catalogs.',
        },
        {
          name: 'Rhapsody in Starlight',
          brief: `Theatrical piano and choral progressive piece in ${eraAesthetic} production.`,
          rationale: 'Public domain styling musical theme.',
        },
      ],
      'empire state building': [
        {
          name: 'Midtown Spire Tower',
          brief: `Art deco architectural landmark facade with distinctive geometric step-backs in ${eraAesthetic} style.`,
          rationale: 'Original architectural rendering avoiding proprietary trademarked tower spire claims.',
        },
        {
          name: 'Crown Plaza Spire',
          brief: `Towering skyscraper with illuminated crown and spire in ${eraAesthetic} architectural style.`,
          rationale: 'Fictional metropolitan prop building avoiding architectural rights claims.',
        },
        {
          name: 'Metropolis Tower',
          brief: `Grand neo-gothic skyscraper facade with carved stone gargoyles in ${eraAesthetic} styling.`,
          rationale: 'Generic fictional cinematic skyscraper.',
        },
      ],
      'acme explosives warning': [
        {
          name: 'Titan Industrial Hazard Placard',
          brief: `Distressed hazard warning diamond with diagonal black-and-amber stripes in ${eraAesthetic} style.`,
          rationale: 'Generic hazard iconography avoiding fictional Acme cartoon trademark references.',
        },
        {
          name: 'Apex Munitions Caution Sign',
          brief: `High-voltage industrial danger warning sign in ${eraAesthetic} style.`,
          rationale: 'Generic prop graphic placard.',
        },
        {
          name: 'Standard Hazard Label',
          brief: `Industrial safety placard with international warning glyphs in ${eraAesthetic} design.`,
          rationale: 'Standard prop graphics without proprietary brand marks.',
        },
      ],
    };

    const normKey = Object.keys(candidateSequences).find(k => norm.includes(k));
    const seq = normKey ? candidateSequences[normKey] : [
      {
        name: `Summit ${category}`,
        brief: `${eraAesthetic} cinematic prop design for Summit ${category} with custom period styling.`,
        rationale: `Summit ${category} is a generic fictional prop brand concept that avoids commercial trademark conflict.`,
      },
      {
        name: `Apex ${category}`,
        brief: `${eraAesthetic} prop design for Apex ${category}.`,
        rationale: `Apex ${category} is an alternate prop concept.`,
      },
      {
        name: `Nova ${category}`,
        brief: `${eraAesthetic} prop design for Nova ${category}.`,
        rationale: `Nova ${category} is a secondary prop concept.`,
      }
    ];

    const idx = Math.min(attemptNumber - 1, seq.length - 1);
    const chosen = seq[idx];

    return {
      fictionalBrandName: chosen.name,
      designBrief: chosen.brief,
      eraAesthetic,
      nonInfringementRationale: chosen.rationale,
    };
  }

  async evaluateCollision(
    candidateName: string,
    category: string,
    citations: any[] = []
  ): Promise<{ clearanceStatus: 'NO_ISSUE_SURFACED' | 'ACTION_REQUIRED' | 'REVIEW_RECOMMENDED' | 'INSUFFICIENT_EVIDENCE'; collisionRationale?: string }> {
    // In CLOUD_MODE with Gemini available, use model to reason over live Parallel citations
    if (config.executionMode === 'CLOUD_MODE' && this.ai && citations.length > 0) {
      try {
        const citationContext = citations
          .map((c) => `- [${c.sourceUrl}] ${c.excerptSnippet} (Owner: ${c.corporateOwner || 'Unknown'}, Status: ${c.registrationStatus || 'ACTIVE'})`)
          .join('\n');

        const prompt = `You are a trademark and clearance collision analyst for ClearanceScout.
Candidate Replacement Name: "${candidateName}"
Category: "${category}"

Live Parallel Search Citations:
${citationContext}

Determine if this candidate replacement collides with any real-world active commercial mark, famous brand, registered trademark, or defamatory reference.
Return a JSON object:
{
  "hasCollision": false,
  "status": "NO_ISSUE_SURFACED",
  "rationale": "No commercial trademark or brand conflict identified from search results."
}
If collision detected, set "hasCollision": true, "status": "ACTION_REQUIRED", and state the conflicting mark in "rationale".`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const clean = (response.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);

        if (parsed.hasCollision || parsed.status === 'ACTION_REQUIRED') {
          return {
            clearanceStatus: 'ACTION_REQUIRED',
            collisionRationale: parsed.rationale || `Trademark conflict detected for '${candidateName}'.`,
          };
        }

        return { clearanceStatus: 'NO_ISSUE_SURFACED' };
      } catch (err: any) {
        console.warn('Gemini collision evaluation failed in CLOUD_MODE:', err);
        if (config.executionMode === 'CLOUD_MODE' || process.env.EXECUTION_MODE === 'CLOUD_MODE') {
          return {
            clearanceStatus: 'INSUFFICIENT_EVIDENCE',
            collisionRationale: `Live collision evaluation failed in CLOUD_MODE for '${candidateName}': ${err?.message || 'Model error'}. Failing closed to prevent unverified auto-clearance.`,
          };
        }
      }
    } else if (config.executionMode === 'CLOUD_MODE' || process.env.EXECUTION_MODE === 'CLOUD_MODE') {
      return {
        clearanceStatus: 'INSUFFICIENT_EVIDENCE',
        collisionRationale: `Live collision evaluation unavailable in CLOUD_MODE for '${candidateName}': Gemini client not initialized. Failing closed.`,
      };
    }

    // Deterministic collision checks for test and demo suites
    const knownCollisions = [
      'radiant pop',
      'atomic cola',
      'monza sprint',
      'aero coupe',
      'prism computer',
      'novabook',
      'symphony of the night',
      'rhapsody in starlight',
      'crown plaza spire',
      'metropolis tower',
      'apex munitions caution sign',
      'standard hazard label',
      'nuka-cola',
      'porsche',
      'coca-cola',
      'apple',
      '[collision]',
    ];

    const isCollision = knownCollisions.some((c) => candidateName.toLowerCase().includes(c));

    if (isCollision) {
      return {
        clearanceStatus: 'ACTION_REQUIRED',
        collisionRationale: `Trademark conflict detected: active commercial registration or proprietary mark found for '${candidateName}'.`,
      };
    } else if (candidateName.toLowerCase().includes('insufficient')) {
      return {
        clearanceStatus: 'INSUFFICIENT_EVIDENCE',
        collisionRationale: `Insufficient public trademark registry evidence surfaced for '${candidateName}'.`,
      };
    }

    return { clearanceStatus: 'NO_ISSUE_SURFACED' };
  }
}

export const replacementAgent = new ReplacementAgent();

