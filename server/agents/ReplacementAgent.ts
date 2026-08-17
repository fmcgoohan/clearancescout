import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

export interface GeneratedReplacement {
  fictionalBrandName: string;
  designBrief: string;
  nonInfringementRationale: string;
}

export class ReplacementAgent {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (config.geminiApiKey) {
      this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
  }

  async generateFictionalBrand(originalEntityName: string, category: string): Promise<GeneratedReplacement> {
    if (config.executionMode !== 'CLOUD_MODE' || !this.ai) {
      return this.generateFallback(originalEntityName, category);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a creative brand clearance specialist for ClearanceScout. Generate a fictional, non-infringing replacement brand name for '${originalEntityName}' (Category: ${category}).

Return JSON object matching this schema:
{
  "fictionalBrandName": "Summit Cola",
  "designBrief": "Sleek red aluminum beverage can with bold white serif typography reading Summit Cola.",
  "nonInfringementRationale": "Summit Cola is visually, phonetically, and conceptually distinct from registered trademarks in Class 032."
}`,
              },
            ],
          },
        ],
      });

      const responseText = response.text || '{}';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson) as GeneratedReplacement;
    } catch (err) {
      console.warn('Gemini replacement generation error, using creative fallback:', err);
      return this.generateFallback(originalEntityName, category);
    }
  }

  private generateFallback(originalEntityName: string, category: string): GeneratedReplacement {
    const replacements: Record<string, GeneratedReplacement> = {
      'Coca-Cola': {
        fictionalBrandName: 'Summit Cola',
        designBrief: 'High-contrast crimson aluminum can with clean silver typography reading Summit Cola.',
        nonInfringementRationale: 'Phonetically distinct from Coca-Cola and Coke. Avoids trademark confusion in Class 32.',
      },
      Porsche: {
        fictionalBrandName: 'Veloce GT',
        designBrief: 'Aerodynamic metallic silver sports coupe with a minimalist golden shield emblem reading Veloce.',
        nonInfringementRationale: 'Distinct automotive name avoiding Porsche, 911, or Stuttgart shield similarity.',
      },
      Apple: {
        fictionalBrandName: 'AeroTech',
        designBrief: 'Minimalist brushed aluminum laptop with a illuminated geometric prism logo on top cover.',
        nonInfringementRationale: 'Avoids fruit logo and Apple trademark terms while preserving sleek tech aesthetic.',
      },
      Rolex: {
        fictionalBrandName: 'Chronos Sovereign',
        designBrief: 'Luxury gold wristwatch with a deep navy dial and sunburst motif hour markers.',
        nonInfringementRationale: 'Distinct luxury horology name avoiding Rolex crown logo and model trademarks.',
      },
    };

    return (
      replacements[originalEntityName] || {
        fictionalBrandName: `Apex ${category}`,
        designBrief: `Modern cinematic prop design for Apex ${category} with bold modern styling.`,
        nonInfringementRationale: `Apex ${category} is a generic fictional prop brand name that avoids commercial trademark conflict.`,
      }
    );
  }
}

export const replacementAgent = new ReplacementAgent();
