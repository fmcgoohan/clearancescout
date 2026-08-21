import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import { EntityCategory } from '../repositories/EntityRepo.js';
import zlib from 'zlib';

export function extractTextFromPdfBuffer(buffer: Buffer): string {
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

  const extractedLines: string[] = [];

  const parseContentStream = (stream: string) => {
    // Match text blocks (BT ... ET)
    const btMatches = stream.match(/BT[\s\S]*?ET/g) || [];
    for (const block of btMatches) {
      // Matches (text) Tj
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

      // Matches [(t1) ... (t2)] TJ
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

  // Search for stream blocks
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
        } catch {
          // Not flate compressed or raw stream
        }
      }
    } catch {
      // Ignore
    }
  }

  // If no streams contained text operators, check uncontained BT/ET operators across the raw file
  if (!streamFound || extractedLines.length === 0) {
    parseContentStream(raw);
  }

  const fullText = extractedLines.join('\n').trim();

  // Validate that meaningful screenplay content was extracted
  const hasSceneHeading = fullText.includes('INT.') || fullText.includes('EXT.') || fullText.includes('SCENE');
  if (!fullText || (!hasSceneHeading && fullText.length < 20)) {
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
    if (config.geminiApiKey) {
      this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
  }

  /**
    * Parse screenplay text across Plaintext, Fountain, or extracted PDF format.
    */
  async parseScriptText(
    scriptText: string,
    format: 'PLAINTEXT' | 'FOUNTAIN' | 'PDF' = 'PLAINTEXT'
  ): Promise<ParsedScene[]> {
    // Normalize Fountain or raw text comments
    const normalizedText = this.preprocessScript(scriptText, format);

    const isCloudRuntime = config.executionMode === 'CLOUD_MODE';

    if (isCloudRuntime && !this.ai && config.geminiApiKey) {
      this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }

    if (isCloudRuntime && !this.ai) {
      const parseErr: any = new Error('Live AI screenplay parser unavailable in CLOUD_MODE: GEMINI_API_KEY is not configured.');
      parseErr.code = 'PARSING_FAILED';
      parseErr.status = 502;
      throw parseErr;
    }

    // If server is in TEST_MODE or DEMO_MODE, use deterministic parsing engine
    if (!isCloudRuntime) {
      return this.parseScriptFallback(normalizedText);
    }

    // In CLOUD_MODE: Execute authentic Gemini extraction with windowed chunking for large scripts
    const rawScenes = this.splitIntoRawScenes(normalizedText);
    const CHUNK_SIZE = 12;
    const OVERLAP = 1;

    if (rawScenes.length <= CHUNK_SIZE) {
      return await this.parseChunkWithGemini(normalizedText, 1);
    }

    // Build chunk specifications
    const chunkSpecs: Array<{ chunkScenes: string[]; startSceneNum: number }> = [];
    const step = Math.max(1, CHUNK_SIZE - OVERLAP);
    for (let i = 0; i < rawScenes.length; i += step) {
      const chunkEnd = Math.min(i + CHUNK_SIZE, rawScenes.length);
      chunkSpecs.push({
        chunkScenes: rawScenes.slice(i, chunkEnd),
        startSceneNum: i + 1,
      });
      if (chunkEnd >= rawScenes.length) {
        break;
      }
    }

    // Process chunks in bounded parallel batches of 3 for fast throughput
    const allParsedScenes: ParsedScene[] = [];
    const processedSceneNumbers = new Set<number>();
    const BATCH_CONCURRENCY = 3;

    for (let b = 0; b < chunkSpecs.length; b += BATCH_CONCURRENCY) {
      const batch = chunkSpecs.slice(b, b + BATCH_CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((item, idx) =>
          this.parseChunkWithGemini(item.chunkScenes.join('\n\n'), item.startSceneNum).catch((err: any) => {
            const chunkIdx = b + idx + 1;
            console.error(`[ScriptParserAgent Error] Failed parsing scene chunk ${chunkIdx}:`, err);
            const parseErr: any = new Error(
              `Live AI screenplay parsing failed during scene extraction chunk ${chunkIdx}: ${err.message || 'Model rate limit or network error'}`
            );
            parseErr.code = 'PARSING_FAILED';
            parseErr.status = 502;
            throw parseErr;
          })
        )
      );

      for (const parsedChunk of batchResults) {
        for (const scene of parsedChunk) {
          if (!processedSceneNumbers.has(scene.sceneNumber)) {
            processedSceneNumbers.add(scene.sceneNumber);
            allParsedScenes.push(scene);
          }
        }
      }
    }

    allParsedScenes.sort((a, b) => a.sceneNumber - b.sceneNumber);
    return allParsedScenes;
  }

  private async parseChunkWithGemini(
    chunkText: string,
    startSceneNumber: number,
    retryCount = 0
  ): Promise<ParsedScene[]> {
    if (!this.ai && config.geminiApiKey) {
      this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }

    if (!this.ai) {
      const err: any = new Error('Gemini AI client not initialized in CLOUD_MODE');
      err.code = 'PARSING_FAILED';
      err.status = 500;
      throw err;
    }

    try {
      // Set bounded timeout on individual chunk generation call
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out after 35 seconds')), 35000)
      );

      const callPromise = this.ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are an expert script clearance parser agent for ClearanceScout. Parse the following screenplay text into structured scenes, starting with scene number ${startSceneNumber}.
Extract all candidate clearance items across these 5 core clearance categories:
1. "BRAND": Trademarks, consumer products, logos, automotive, electronics
2. "ART_MUSIC": Copyrighted songs, music lyrics, paintings, sculpture, literature
3. "PUBLIC_FIGURE": Living real-world celebrities, political figures, public figures
4. "PROPRIETARY_LOCATION": Trademarked landmarks, private venues, stadiums, amusement parks
5. "GRAPHIC_PROP": Branded props, warning labels, t-shirt slogans, graphic signs

Return a valid JSON array of scenes matching this schema:
[
  {
    "sceneNumber": ${startSceneNumber},
    "heading": "INT. GARAGE - DAY",
    "locationType": "INT",
    "timeOfDay": "DAY",
    "rawText": "Scene text excerpt...",
    "characterActionSummary": "Alex fixes a vehicle and drinks a soda.",
    "entities": [
      {
        "name": "Exact Brand / Item Name",
        "category": "BRAND",
        "excerptText": "drinks a cold Soda",
        "lineNumber": 2,
        "usageContext": "Character drinks beverage while working"
      }
    ]
  }
]

Screenplay Chunk:
${chunkText}`,
              },
            ],
          },
        ],
      });

      const response: any = await Promise.race([callPromise, timeoutPromise]);
      const responseText = response.text || '[]';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (!Array.isArray(parsed)) {
        throw new Error('Model returned invalid non-array JSON structure');
      }
      return parsed;
    } catch (err: any) {
      const errMsg = err.message || '';
      const isTransient =
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('429') ||
        errMsg.includes('Resource has been exhausted') ||
        errMsg.includes('timed out');

      if (isTransient && retryCount < 2) {
        console.warn(
          `[ScriptParserAgent] Transient error on chunk at scene ${startSceneNumber} (attempt ${retryCount + 1}), retrying in ${(retryCount + 1) * 1500}ms...`
        );
        await new Promise((r) => setTimeout(r, (retryCount + 1) * 1500));
        return this.parseChunkWithGemini(chunkText, startSceneNumber, retryCount + 1);
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
    return raw.length > 0 ? raw : [scriptText];
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

    // 5-category deterministic recognition patterns for demo & test suites
    const candidatePatterns: Array<{ name: string; category: EntityCategory; regex: RegExp }> = [
      // 1. Brands & Trademarks
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
