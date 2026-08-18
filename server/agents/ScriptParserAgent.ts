import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import { EntityCategory } from '../repositories/EntityRepo.js';

export interface ParsedEntityOccurrence {
  name: string;
  category: EntityCategory;
  excerptText: string;
  lineNumber: number;
  usageContext: string;
}

export interface ParsedScene {
  sceneNumber: number;
  heading: string;
  locationType: 'INT' | 'EXT' | 'INT/EXT';
  timeOfDay: string;
  rawText: string;
  characterActionSummary: string;
  entities: ParsedEntityOccurrence[];
}

export class ScriptParserAgent {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (config.geminiApiKey) {
      this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
  }

  /**
   * Parse screenplay text across Plaintext, Fountain, or extracted PDF format.
   */
  async parseScriptText(scriptText: string, format: 'PLAINTEXT' | 'FOUNTAIN' | 'PDF' = 'PLAINTEXT'): Promise<ParsedScene[]> {
    // Normalize Fountain or raw text comments
    const normalizedText = this.preprocessScript(scriptText, format);

    // If in TEST_MODE, DEMO_MODE, or if no API key is set, use deterministic parsing engine
    if (config.executionMode !== 'CLOUD_MODE' || !this.ai) {
      return this.parseScriptFallback(normalizedText);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a script parser agent for ClearanceScout. Parse the following screenplay text into structured scenes. 
Extract all candidate items across these 5 core clearance categories:
1. "BRAND": Trademarks, consumer products, logos, automotive, electronics
2. "ART_MUSIC": Copyrighted songs, music lyrics, paintings, sculpture, literature
3. "PUBLIC_FIGURE": Living real-world celebrities, political figures, public figures
4. "PROPRIETARY_LOCATION": Trademarked landmarks, private venues, stadiums, amusement parks
5. "GRAPHIC_PROP": Branded props, warning labels, t-shirt slogans, graphic signs

Return JSON array of scenes matching this schema:
[
  {
    "sceneNumber": 1,
    "heading": "INT. GARAGE - DAY",
    "locationType": "INT",
    "timeOfDay": "DAY",
    "rawText": "Scene text excerpt...",
    "characterActionSummary": "Alex fixes a Porsche and drinks Coca-Cola.",
    "entities": [
      {
        "name": "Coca-Cola",
        "category": "BRAND",
        "excerptText": "drinks a cold Coca-Cola",
        "lineNumber": 2,
        "usageContext": "Character drinks beverage while working"
      }
    ]
  }
]

Script:
${normalizedText}`,
              },
            ],
          },
        ],
      });

      const responseText = response.text || '[]';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Gemini parsing error, falling back to deterministic parser:', err);
      return this.parseScriptFallback(normalizedText);
    }
  }

  private preprocessScript(rawText: string, format: 'PLAINTEXT' | 'FOUNTAIN' | 'PDF'): string {
    let text = rawText;
    if (format === 'FOUNTAIN') {
      // Remove Fountain boneyard comments /* ... */
      text = text.replace(/\/\*[\s\S]*?\*\//g, '');
    }
    return text.trim();
  }

  private parseScriptFallback(scriptText: string): ParsedScene[] {
    // Regex splits on standard and Fountain sluglines (INT., EXT., INT/EXT., .LOCATION)
    const rawScenes = scriptText.split(/(?=\n(?:\.?INT\b|\.?EXT\b|\.?INT\/EXT\b)\.?\s)/gi).filter(s => s.trim().length > 0);

    // 5-category deterministic recognition patterns for demo & test suites
    const candidatePatterns: Array<{ name: string; category: EntityCategory; regex: RegExp }> = [
      // 1. Brands & Trademarks
      { name: 'Summit Cola', category: 'BRAND', regex: /\b(?:Summit Cola)\b/gi },
      { name: 'AeroTech Prism Laptop', category: 'BRAND', regex: /\b(?:AeroTech Prism Laptop|AeroTech Prism|AeroTech)\b/gi },
      { name: 'Veloce GT', category: 'BRAND', regex: /\b(?:Veloce GT|Veloce)\b/gi },
      { name: 'Coca-Cola', category: 'BRAND', regex: /\b(?:Coca-Cola|Coke|can of Coke)\b/gi },
      { name: 'Apple', category: 'BRAND', regex: /\b(?:MacBook|iPhone|Apple iPad|Apple)\b/gi },
      { name: 'Porsche', category: 'BRAND', regex: /\b(?:Porsche|Porsche 911)\b/gi },
      { name: 'Starbucks', category: 'BRAND', regex: /\b(?:Starbucks|Frappuccino)\b/gi },
      { name: 'Rolex', category: 'BRAND', regex: /\b(?:Rolex|Submariner)\b/gi },
      { name: 'Ray-Ban', category: 'BRAND', regex: /\b(?:Ray-Ban|Wayfarer)\b/gi },
      { name: '[COLLISION] Trademark Item', category: 'BRAND', regex: /\[COLLISION\]/gi },
      { name: '[MULTI_RETRY] Brand', category: 'BRAND', regex: /\[MULTI_RETRY\]/gi },

      // 2. Copyrighted Art & Music
      { name: 'Nocturne of the Wild', category: 'ART_MUSIC', regex: /\b(?:Nocturne of the Wild)\b/gi },
      { name: 'Bohemian Rhapsody', category: 'ART_MUSIC', regex: /\b(?:Bohemian Rhapsody|Queen song)\b/gi },
      { name: 'Hotel California', category: 'ART_MUSIC', regex: /\b(?:Hotel California)\b/gi },
      { name: 'Starry Night', category: 'ART_MUSIC', regex: /\b(?:Starry Night|Van Gogh painting)\b/gi },

      // 3. Living Public Figures
      { name: 'Elena Vance', category: 'PUBLIC_FIGURE', regex: /\b(?:Elena Vance)\b/gi },
      { name: 'Elon Musk', category: 'PUBLIC_FIGURE', regex: /\b(?:Elon Musk)\b/gi },
      { name: 'Taylor Swift', category: 'PUBLIC_FIGURE', regex: /\b(?:Taylor Swift)\b/gi },

      // 4. Proprietary Locations
      { name: 'Midtown Spire Tower', category: 'PROPRIETARY_LOCATION', regex: /\b(?:Midtown Spire Tower)\b/gi },
      { name: 'Empire State Building', category: 'PROPRIETARY_LOCATION', regex: /\b(?:Empire State Building)\b/gi },
      { name: 'Disneyland', category: 'PROPRIETARY_LOCATION', regex: /\b(?:Disneyland|Magic Kingdom)\b/gi },
      { name: 'Madison Square Garden', category: 'PROPRIETARY_LOCATION', regex: /\b(?:Madison Square Garden)\b/gi },

      // 5. Graphic Text / Props
      { name: 'Titan Industrial Hazard Placard', category: 'GRAPHIC_PROP', regex: /\b(?:Titan Industrial Hazard Placard|Titan Industrial Placard)\b/gi },
      { name: 'Acme Explosives Warning', category: 'GRAPHIC_PROP', regex: /\b(?:Acme Explosives|Acme Warning Label)\b/gi },
      { name: 'Biohazard Warning Sign', category: 'GRAPHIC_PROP', regex: /\b(?:Biohazard Warning Sign|Biohazard Label)\b/gi },
    ];

    const scenesToProcess = rawScenes.length > 0 ? rawScenes : [scriptText];

    return scenesToProcess.map((sceneStr, index) => {
      const lines = sceneStr.trim().split('\n');
      let heading = lines[0]?.trim() || `SCENE ${index + 1}`;
      if (heading.startsWith('.')) heading = heading.slice(1).trim();

      const upperHeading = heading.toUpperCase();
      const locationType = upperHeading.startsWith('EXT') ? 'EXT' : upperHeading.startsWith('INT/EXT') ? 'INT/EXT' : 'INT';
      const timeOfDay = upperHeading.includes('NIGHT') ? 'NIGHT' : upperHeading.includes('DUSK') ? 'DUSK' : 'DAY';

      const entities: ParsedEntityOccurrence[] = [];

      lines.forEach((line, lineIdx) => {
        candidatePatterns.forEach((p) => {
          // Reset regex state for global regexes
          p.regex.lastIndex = 0;
          if (p.regex.test(line)) {
            // Check if already extracted in this line
            const exists = entities.some(e => e.name === p.name && e.lineNumber === lineIdx + 1);
            if (!exists) {
              entities.push({
                name: p.name,
                category: p.category,
                excerptText: line.trim(),
                lineNumber: lineIdx + 1,
                usageContext: `Scene ${index + 1} action/dialogue: "${line.trim()}"`,
              });
            }
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
