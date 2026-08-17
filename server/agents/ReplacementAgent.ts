import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

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
    eraAesthetic: string = 'Modern Cinematic'
  ): Promise<GeneratedReplacement> {
    if (config.executionMode !== 'CLOUD_MODE' || !this.ai) {
      return this.generateFallback(originalEntityName, category, eraAesthetic);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a creative brand clearance specialist for ClearanceScout. Generate a fictional, non-infringing replacement brand concept for '${originalEntityName}' (Category: ${category}) in the era aesthetic style: '${eraAesthetic}'.

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
      return this.generateFallback(originalEntityName, category, eraAesthetic);
    }
  }

  private generateFallback(originalEntityName: string, category: string, eraAesthetic: string): GeneratedReplacement {
    const replacements: Record<string, Omit<GeneratedReplacement, 'eraAesthetic'>> = {
      'Coca-Cola': {
        fictionalBrandName: 'Summit Cola',
        designBrief: `High-contrast crimson aluminum can with clean silver typography reading Summit Cola in ${eraAesthetic} aesthetic.`,
        nonInfringementRationale: 'Phonetically distinct from Coca-Cola and Coke. Avoids trademark confusion in Class 32.',
      },
      Porsche: {
        fictionalBrandName: 'Veloce GT',
        designBrief: `Aerodynamic metallic sports coupe with a minimalist golden shield emblem reading Veloce in ${eraAesthetic} aesthetic.`,
        nonInfringementRationale: 'Distinct automotive name avoiding Porsche, 911, or Stuttgart shield similarity.',
      },
      Apple: {
        fictionalBrandName: 'AeroTech',
        designBrief: `Minimalist brushed aluminum laptop with an illuminated geometric prism logo in ${eraAesthetic} styling.`,
        nonInfringementRationale: 'Avoids fruit logo and Apple trademark terms while preserving sleek tech aesthetic.',
      },
      'Bohemian Rhapsody': {
        fictionalBrandName: 'Nocturne of the Wild',
        designBrief: `Original dramatic orchestral-rock theatrical ballad composed in ${eraAesthetic} vintage production style.`,
        nonInfringementRationale: 'Original melody and lyrics avoiding Queen and Mercury estate copyright infringement.',
      },
      'Empire State Building': {
        fictionalBrandName: 'Midtown Spire Tower',
        designBrief: `Art deco architectural landmark facade with distinctive geometric step-backs in ${eraAesthetic} style.`,
        nonInfringementRationale: 'Original architectural rendering avoiding proprietary trademarked tower spire claims.',
      },
      'Acme Explosives Warning': {
        fictionalBrandName: 'Titan Industrial Hazard Placard',
        designBrief: `Distressed hazard warning diamond with diagonal black-and-amber stripes in ${eraAesthetic} style.`,
        nonInfringementRationale: 'Generic hazard iconography avoiding fictional Acme cartoon trademark references.',
      },
    };

    const normKey = Object.keys(replacements).find(k => originalEntityName.toLowerCase().includes(k.toLowerCase()));
    if (normKey) {
      const base = replacements[normKey];
      return {
        ...base,
        eraAesthetic,
      };
    }

    return {
      fictionalBrandName: `Apex ${category}`,
      designBrief: `${eraAesthetic} cinematic prop design for Apex ${category} with custom period styling.`,
      eraAesthetic,
      nonInfringementRationale: `Apex ${category} is a generic fictional prop brand concept that avoids commercial trademark conflict.`,
    };
  }
}

export const replacementAgent = new ReplacementAgent();
