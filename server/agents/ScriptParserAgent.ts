import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import { createGeminiClient } from '../integrations/geminiClient.js';
import { EntityCategory } from '../repositories/EntityRepo.js';
import zlib from 'zlib';
import { PDFParse } from 'pdf-parse';

export function toTitleCase(str: string): string {
  const minorWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet']);
  const words = str.toLowerCase().split(/\s+/);
  return words
    .map((word, index) => {
      if (!word) return '';
      if (index > 0 && index < words.length - 1 && minorWords.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function extractTitleFromScriptText(scriptText: string): string | null {
  if (!scriptText) return null;
  const match = scriptText.match(/^TITLE:\s*(.+)$/im) || scriptText.match(/^Title:\s*(.+)$/im);
  if (match && match[1]) {
    let title = match[1].trim().replace(/^["']|["']$/g, '').trim();
    if (title) {
      if (title === title.toUpperCase() && /[A-Z]/.test(title)) {
        title = toTitleCase(title);
      }
      return title;
    }
  }
  return null;
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) {
    const err: any = new Error('PDF buffer is empty');
    err.code = 'PDF_EXTRACTION_FAILED';
    throw err;
  }

  const raw = buffer.toString('latin1');
  if (!raw.startsWith('%PDF-')) {
    const err: any = new Error('Invalid PDF format header');
    err.code = 'PDF_EXTRACTION_FAILED';
    throw err;
  }

  let extractedText = '';

  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    if (result && result.text) {
      extractedText = result.text;
    }
  } catch (pdfErr: any) {
    console.warn('pdf-parse primary extractor failed, falling back to stream parsing:', pdfErr?.message);
  }

  // Strip control codes (preserving standard newlines \n, \r, and \t)
  extractedText = extractedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Secondary stream parser fallback if primary parse was empty
  if (!extractedText || extractedText.trim().length === 0) {
    const extractedLines: string[] = [];

    const parseContentStream = (stream: string) => {
      const btMatches = stream.match(/BT[\s\S]*?ET/g) || [];
      for (const block of btMatches) {
        const tjMatches = block.match(/\((.*?)\)\s*Tj/g) || [];
        for (const tj of tjMatches) {
          const text = tj.replace(/^\(/, '').replace(/\)\s*Tj$/, '');
          const unescaped = text
            .replace(/\\([\\()])/g, '$1')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\t/g, '\t');
          if (unescaped.trim()) {
            extractedLines.push(unescaped);
          }
        }

        const bigTjMatches = block.match(/\[(.*?)\]\s*TJ/g) || [];
        for (const bigTj of bigTjMatches) {
          const parts = bigTj.match(/\((.*?)\)/g) || [];
          const fullLine = parts
            .map((p) => p.slice(1, -1).replace(/\\([\\()])/g, '$1'))
            .join('');
          if (fullLine.trim()) {
            extractedLines.push(fullLine);
          }
        }
      }
    };

    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match: RegExpExecArray | null;
    let streamFound = false;
    while ((match = streamRegex.exec(raw)) !== null) {
      streamFound = true;
      const streamContent = match[1];
      parseContentStream(streamContent);

      try {
        const streamStart = match.index + match[0].indexOf('\n') + 1;
        const streamEnd = match.index + match[0].lastIndexOf('endstream');
        if (streamStart < streamEnd) {
          const compressedChunk = buffer.subarray(streamStart, streamEnd);
          try {
            const decompressed = zlib.inflateSync(compressedChunk).toString('utf-8');
            parseContentStream(decompressed);
          } catch {}
        }
      } catch {}
    }

    if (!streamFound || extractedLines.length === 0) {
      parseContentStream(raw);
    }

    extractedText = extractedLines.join('\n').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  }

  const fullText = extractedText.trim();

  // Validate that genuine printable screenplay scene content was extracted
  const hasSceneHeading = /(?:^|\n)(?:SCENE\s+\d+[:\s\-]*)?(?:\.?INT\b|\.?EXT\b|\.?INT\/EXT\b)\.?\s/i.test(fullText);
  if (!fullText || (!hasSceneHeading && fullText.length < 30)) {
    const err: any = new Error(
      'Unable to extract text from PDF. The document may be a scanned image or encrypted. Please provide a text-based PDF, Fountain, or Plaintext screenplay.'
    );
    err.code = 'PDF_EXTRACTION_FAILED';
    throw err;
  }

  return fullText;
}

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
    this.ai = createGeminiClient();
  }

  /**
    * Parse screenplay text across Plaintext, Fountain, or extracted PDF format.
    */
  async parseScriptText(
    scriptText: string,
    format: 'PLAINTEXT' | 'FOUNTAIN' | 'PDF' = 'PLAINTEXT',
    options?: { isBundledDemo?: boolean }
  ): Promise<ParsedScene[]> {
    // Normalize Fountain or raw text comments
    const normalizedText = this.preprocessScript(scriptText, format);

    const isCloudRuntime = config.executionMode === 'CLOUD_MODE';

    // Bundled demo screenplay (from demo endpoint) or offline runtime uses deterministic fixture parser
    if (options?.isBundledDemo || !isCloudRuntime) {
      return this.parseScriptFallback(normalizedText);
    }

    if (isCloudRuntime && !this.ai) {
      this.ai = createGeminiClient();
    }

    if (isCloudRuntime && !this.ai) {
      const parseErr: any = new Error(
        'Gemini client not configured: set GOOGLE_CLOUD_PROJECT for Vertex AI or GEMINI_API_KEY for the API-key backend.'
      );
      parseErr.code = 'PARSING_FAILED';
      parseErr.status = 502;
      throw parseErr;
    }

    // In CLOUD_MODE:
    // 1. Split scenes locally and construct scene shells instantly (0ms)
    const rawScenes = this.splitIntoRawScenes(normalizedText);
    const scenesToProcess = rawScenes.length > 0 ? rawScenes : [normalizedText];
    const sceneShells: ParsedScene[] = scenesToProcess.map((str, idx) =>
      this.buildSceneShell(str, idx)
    );

    // 2. Chunk scenes for compact entity-only extraction (CHUNK_SIZE = 25 scenes)
    const CHUNK_SIZE = 25;
    const chunkSpecs: Array<{ startSceneNum: number; endSceneNum: number; text: string }> = [];

    for (let i = 0; i < sceneShells.length; i += CHUNK_SIZE) {
      const chunkEnd = Math.min(i + CHUNK_SIZE, sceneShells.length);
      const chunkScenes = sceneShells.slice(i, chunkEnd);
      const formattedChunkText = chunkScenes
        .map((s) => `--- SCENE ${s.sceneNumber}: ${s.heading} ---\n${s.rawText}`)
        .join('\n\n');

      chunkSpecs.push({
        startSceneNum: i + 1,
        endSceneNum: chunkEnd,
        text: formattedChunkText,
      });
    }

    // 3. Bounded parallel entity extraction (concurrency 2, not 3) to prevent 503 rate limits
    const BATCH_CONCURRENCY = 2;
    for (let b = 0; b < chunkSpecs.length; b += BATCH_CONCURRENCY) {
      const batch = chunkSpecs.slice(b, b + BATCH_CONCURRENCY);
      const batchEntities = await Promise.all(
        batch.map((chunk, idx) =>
          this.extractEntitiesWithGemini(chunk.text, chunk.startSceneNum, chunk.endSceneNum).catch((err: any) => {
            const chunkIdx = b + idx + 1;
            console.error(`[ScriptParserAgent Error] Failed extracting entities for chunk ${chunkIdx}:`, err);
            const parseErr: any = new Error(
              `Live AI screenplay parsing failed during scene extraction chunk ${chunkIdx}: ${err.message || 'Model rate limit or network error'}`
            );
            parseErr.code = 'PARSING_FAILED';
            parseErr.status = 502;
            throw parseErr;
          })
        )
      );

      // Attach extracted entities directly onto local scene shells
      for (const entities of batchEntities) {
        for (const ent of entities) {
          const targetScene = sceneShells.find((s) => s.sceneNumber === ent.sceneNumber) || sceneShells[0];
          if (targetScene) {
            const exists = targetScene.entities.some(
              (e) => e.name.toLowerCase() === ent.name.toLowerCase() && e.lineNumber === ent.lineNumber
            );
            if (!exists) {
              targetScene.entities.push({
                name: ent.name,
                category: ent.category,
                excerptText: ent.excerptText || ent.name,
                lineNumber: ent.lineNumber || 1,
                usageContext: ent.usageContext || `Scene ${targetScene.sceneNumber}: ${ent.name}`,
              });
            }
          }
        }
      }
    }

    return sceneShells;
  }

  private buildSceneShell(sceneStr: string, index: number): ParsedScene {
    // Invariant (FR-015): Strip page marker artifacts from scene body text
    const cleanSceneStr = sceneStr
      .replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gim, '')
      .replace(/^\s*\d+\.\s*$/gm, '')
      .trim();

    const lines = cleanSceneStr.split('\n');
    let heading = lines[0]?.trim() || `SCENE ${index + 1}`;
    if (heading.startsWith('.')) heading = heading.slice(1).trim();

    const upperHeading = heading.toUpperCase();
    const locationType: 'INT' | 'EXT' | 'INT/EXT' = upperHeading.startsWith('EXT')
      ? 'EXT'
      : upperHeading.startsWith('INT/EXT')
      ? 'INT/EXT'
      : 'INT';

    // Invariant (FR-014): High-fidelity temporal extraction. Never normalize CONTINUOUS, SAME, DAWN, DUSK, MAGIC HOUR to DAY!
    let timeOfDay = 'DAY';
    if (upperHeading.includes('CONTINUOUS')) {
      timeOfDay = 'CONTINUOUS';
    } else if (upperHeading.includes('SAME')) {
      timeOfDay = 'SAME';
    } else if (upperHeading.includes('MOMENTS LATER')) {
      timeOfDay = 'MOMENTS LATER';
    } else if (upperHeading.includes('DAWN')) {
      timeOfDay = 'DAWN';
    } else if (upperHeading.includes('DUSK')) {
      timeOfDay = 'DUSK';
    } else if (upperHeading.includes('MAGIC HOUR')) {
      timeOfDay = 'MAGIC HOUR';
    } else if (upperHeading.includes('NIGHT')) {
      timeOfDay = 'NIGHT';
    } else if (upperHeading.includes('DAY')) {
      timeOfDay = 'DAY';
    }

    return {
      sceneNumber: index + 1,
      heading,
      locationType,
      timeOfDay,
      rawText: cleanSceneStr,
      characterActionSummary: lines.slice(1, 4).join(' ').trim(),
      entities: [],
    };
  }

  private async extractEntitiesWithGemini(
    chunkText: string,
    startSceneNumber: number,
    endSceneNumber: number,
    retryCount = 0
  ): Promise<Array<ParsedEntityOccurrence & { sceneNumber: number }>> {
    if (!this.ai) {
      this.ai = createGeminiClient();
    }

    if (!this.ai) {
      const err: any = new Error(
        'Gemini client not configured: set GOOGLE_CLOUD_PROJECT for Vertex AI or GEMINI_API_KEY for the API-key backend.'
      );
      err.code = 'PARSING_FAILED';
      err.status = 500;
      throw err;
    }

    try {
      // 40-second timeout per entity extraction chunk
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out after 40 seconds')), 40000)
      );

      const callPromise = this.ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are an expert script clearance parser agent for ClearanceScout.
Extract all candidate clearance items across these 5 categories from the screenplay text below (Scenes ${startSceneNumber} to ${endSceneNumber}):
1. "BRAND": Trademarks, consumer products, logos, automotive, electronics
2. "ART_MUSIC": Copyrighted songs, music lyrics, paintings, sculpture, literature
3. "PUBLIC_FIGURE": Living real-world celebrities, political figures, public figures
4. "PROPRIETARY_LOCATION": Trademarked landmarks, private venues, stadiums, amusement parks
5. "GRAPHIC_PROP": Branded props, warning labels, t-shirt slogans, graphic signs

Return a valid JSON array of extracted entity occurrences with their corresponding sceneNumber:
[
  {
    "sceneNumber": ${startSceneNumber},
    "name": "Exact Brand / Item Name",
    "category": "BRAND",
    "excerptText": "Character drinks a cold Soda",
    "lineNumber": 2,
    "usageContext": "Character drinks beverage while working"
  }
]
If no clearance entities appear in a scene, omit that scene. Return only the JSON array.

Screenplay Text:
${chunkText}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const response: any = await Promise.race([callPromise, timeoutPromise]);
      const responseText = response.text || '[]';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (!Array.isArray(parsed)) {
        throw new Error('Model returned invalid non-array JSON structure');
      }

      const validCategories = ['BRAND', 'ART_MUSIC', 'PUBLIC_FIGURE', 'PROPRIETARY_LOCATION', 'GRAPHIC_PROP'];
      return parsed
        .map((item: any) => ({
          sceneNumber: Number(item.sceneNumber) || startSceneNumber,
          name: String(item.name || '').trim(),
          category: (validCategories.includes(item.category) ? item.category : 'BRAND') as EntityCategory,
          excerptText: String(item.excerptText || item.name || '').trim(),
          lineNumber: Number(item.lineNumber) || 1,
          usageContext: String(item.usageContext || `Scene ${item.sceneNumber || startSceneNumber}: ${item.name}`).trim(),
        }))
        .filter((item: any) => item.name.length > 0);
    } catch (err: any) {
      const errMsg = err.message || '';
      const isTransient =
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('429') ||
        errMsg.includes('Resource has been exhausted') ||
        errMsg.includes('timed out');

      if (isTransient && retryCount < 3) {
        const delayMs = (retryCount + 1) * 2000;
        console.warn(
          `[ScriptParserAgent] Transient error on entity extraction for scenes ${startSceneNumber}-${endSceneNumber} (attempt ${retryCount + 1}), retrying in ${delayMs}ms...`
        );
        await new Promise((r) => setTimeout(r, delayMs));
        return this.extractEntitiesWithGemini(chunkText, startSceneNumber, endSceneNumber, retryCount + 1);
      }

      // In CLOUD_MODE, strictly fail visibly without silent fallback to synthetic demo recognizers (FR-005)
      const parseErr: any = new Error(`Live AI screenplay parsing failed: ${errMsg || 'Gemini 3.6 Flash extraction error'}`);
      parseErr.code = 'PARSING_FAILED';
      parseErr.status = 502;
      throw parseErr;
    }
  }

  private splitIntoRawScenes(scriptText: string): string[] {
    const raw = scriptText
      .split(/(?=\n(?:SCENE\s+\d+[:\s\-]*)?(?:\.?INT\b|\.?EXT\b|\.?INT\/EXT\b)\.?\s)/gi)
      .map((s) => s.trim())
      .filter((s) => {
        if (s.length === 0) return false;
        const upper = s.toUpperCase();
        return (
          upper.startsWith('INT') ||
          upper.startsWith('EXT') ||
          upper.startsWith('SCENE') ||
          upper.startsWith('.')
        );
      });
    return raw;
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
    // Regex splits on standard and Fountain sluglines (INT., EXT., INT/EXT., .LOCATION, SCENE N - INT)
    const rawScenes = scriptText
      .split(/(?:^|\n)(?=(?:SCENE\s+\d+[:\s\-]*)?(?:\.?INT\b|\.?EXT\b|\.?INT\/EXT\b)\.?\s)/gi)
      .map((s) => s.trim())
      .filter((s) => {
        if (s.length === 0) return false;
        const upper = s.toUpperCase();
        return (
          upper.startsWith('INT') ||
          upper.startsWith('EXT') ||
          upper.startsWith('SCENE') ||
          upper.startsWith('.')
        );
      });

    if (rawScenes.length === 0) {
      return [];
    }

    // 5-category deterministic recognition patterns for demo & test suites
    const candidatePatterns: Array<{ name: string; category: EntityCategory; regex: RegExp }> = [
      // 1. Brands & Trademarks
      { name: 'Coors Light', category: 'BRAND', regex: /\b(?:Coors Light|Coors)\b/gi },
      { name: 'Summit Cola', category: 'BRAND', regex: /\b(?:Summit Cola|Summit Pop|Summit Soda|Summit Energy Drink)\b/gi },
      { name: 'AeroTech Prism Laptop', category: 'BRAND', regex: /\b(?:AeroTech Prism Laptop|AeroTech Prism|AeroTech)\b/gi },
      { name: 'Veloce GT', category: 'BRAND', regex: /\b(?:Veloce GT|Veloce Motors|Veloce)\b/gi },
      { name: 'Coca-Cola', category: 'BRAND', regex: /\b(?:Coca-Cola|Coke|can of Coke|Coke Zero)\b/gi },
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
      { name: 'Titan Industrial Hazard Placard', category: 'GRAPHIC_PROP', regex: /\b(?:Titan Industrial Hazard Placard|Titan Industrial Placard|Titan Hazard Placard)\b/gi },
      { name: 'Acme Explosives Warning', category: 'GRAPHIC_PROP', regex: /\b(?:Acme Explosives|Acme Warning Label)\b/gi },
      { name: 'Biohazard Warning Sign', category: 'GRAPHIC_PROP', regex: /\b(?:Biohazard Warning Sign|Biohazard Label)\b/gi },
    ];

    const scenesToProcess = rawScenes;

    return scenesToProcess.map((sceneStr, index) => {
      const cleanSceneStr = sceneStr
        .replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gim, '')
        .replace(/^\s*\d+\.\s*$/gm, '')
        .trim();
      const lines = cleanSceneStr.split('\n');
      let heading = lines[0]?.trim() || `SCENE ${index + 1}`;
      const upperHeading = heading.toUpperCase();
      const locationType = upperHeading.startsWith('EXT') ? 'EXT' : upperHeading.startsWith('INT/EXT') ? 'INT/EXT' : 'INT';

      let timeOfDay = 'DAY';
      if (upperHeading.includes('CONTINUOUS')) {
        timeOfDay = 'CONTINUOUS';
      } else if (upperHeading.includes('SAME')) {
        timeOfDay = 'SAME';
      } else if (upperHeading.includes('MOMENTS LATER')) {
        timeOfDay = 'MOMENTS LATER';
      } else if (upperHeading.includes('DAWN')) {
        timeOfDay = 'DAWN';
      } else if (upperHeading.includes('DUSK')) {
        timeOfDay = 'DUSK';
      } else if (upperHeading.includes('MAGIC HOUR')) {
        timeOfDay = 'MAGIC HOUR';
      } else if (upperHeading.includes('NIGHT')) {
        timeOfDay = 'NIGHT';
      } else if (upperHeading.includes('DAY')) {
        timeOfDay = 'DAY';
      }

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
        rawText: cleanSceneStr,
        characterActionSummary: lines.slice(1, 4).join(' ').trim(),
        entities,
      };
    });
  }
}

export const scriptParserAgent = new ScriptParserAgent();
