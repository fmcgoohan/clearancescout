import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

export interface ParsedScene {
  sceneNumber: number;
  heading: string;
  locationType: 'INT' | 'EXT' | 'INT/EXT';
  timeOfDay: string;
  rawText: string;
  characterActionSummary: string;
  entities: Array<{
    name: string;
    category: 'BRAND' | 'TRADEMARK' | 'PRODUCT' | 'LOGO' | 'LOCATION' | 'CHARACTER_NAME';
    excerptText: string;
    lineNumber: number;
    usageContext: string;
  }>;
}

export class ScriptParserAgent {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (config.geminiApiKey) {
      this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
  }

  async parseScriptText(scriptText: string): Promise<ParsedScene[]> {
    // If in TEST_MODE, DEMO_MODE, or if no API key is set, use deterministic parsing engine
    if (config.executionMode !== 'CLOUD_MODE' || !this.ai) {
      return this.parseScriptFallback(scriptText);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a script parser agent for ClearanceScout. Parse the following screenplay text into structured scenes. Extract all mentioned real-world brands, trademarks, products, logos, and locations for clearance analysis.
                
Return JSON array of scenes matching this schema:
[
  {
    "sceneNumber": 1,
    "heading": "INT. COFFEE SHOP - DAY",
    "locationType": "INT",
    "timeOfDay": "DAY",
    "rawText": "full scene text",
    "characterActionSummary": "summary of actions",
    "entities": [
      {
        "name": "Coca-Cola",
        "category": "BRAND",
        "excerptText": "holding a bottle of Coca-Cola",
        "lineNumber": 12,
        "usageContext": "Character drinks soda while discussing heist"
      }
    ]
  }
]

Script Text:
${scriptText}`,
              },
            ],
          },
        ],
      });

      const responseText = response.text || '[]';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson) as ParsedScene[];
    } catch (err) {
      console.warn('Gemini script parsing failed, falling back to deterministic parser:', err);
      return this.parseScriptFallback(scriptText);
    }
  }

  private parseScriptFallback(scriptText: string): ParsedScene[] {
    const rawScenes = scriptText.split(/(?=\n(?:INT\.|EXT\.|INT\/EXT\.)\s)/gi).filter(s => s.trim().length > 0);
    
    // Known brand patterns for deterministic entity recognition
    const brandPatterns = [
      { name: 'Coca-Cola', category: 'BRAND' as const, regex: /Coca-Cola|Coke/gi },
      { name: 'Apple', category: 'BRAND' as const, regex: /MacBook|iPhone|Apple/gi },
      { name: 'Porsche', category: 'BRAND' as const, regex: /Porsche|911/gi },
      { name: 'Starbucks', category: 'BRAND' as const, regex: /Starbucks/gi },
      { name: 'Rolex', category: 'BRAND' as const, regex: /Rolex/gi },
      { name: 'Ray-Ban', category: 'BRAND' as const, regex: /Ray-Ban/gi },
    ];

    return rawScenes.map((sceneStr, index) => {
      const lines = sceneStr.trim().split('\n');
      const heading = lines[0]?.trim() || `SCENE ${index + 1}`;
      const locationType = heading.startsWith('EXT.') ? 'EXT' : heading.startsWith('INT/EXT') ? 'INT/EXT' : 'INT';
      const timeOfDay = heading.includes('NIGHT') ? 'NIGHT' : 'DAY';

      const entities: ParsedScene['entities'] = [];

      lines.forEach((line, lineIdx) => {
        brandPatterns.forEach((b) => {
          if (b.regex.test(line)) {
            entities.push({
              name: b.name,
              category: b.category,
              excerptText: line.trim(),
              lineNumber: lineIdx + 1,
              usageContext: `Mentioned in Scene ${index + 1}: ${line.trim()}`,
            });
          }
        });
      });

      return {
        sceneNumber: index + 1,
        heading,
        locationType,
        timeOfDay,
        rawText: sceneStr.trim(),
        characterActionSummary: lines.slice(1, 4).join(' ').trim(),
        entities,
      };
    });
  }
}

export const scriptParserAgent = new ScriptParserAgent();
