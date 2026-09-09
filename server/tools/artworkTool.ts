import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import { createGeminiClient } from '../integrations/geminiClient.js';

export class ArtworkTool {
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.ai = createGeminiClient();
  }

  async generateArtworkCard(fictionalBrandName: string, designBrief: string): Promise<string> {
    if (!this.ai) {
      this.ai = createGeminiClient();
    }
    if (config.executionMode === 'CLOUD_MODE' && this.ai) {
      try {
        const response = await this.ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: `Commercial prop packaging card for fictional replacement brand ${fictionalBrandName}. ${designBrief}, photorealistic studio lighting, product design portfolio card.`,
          config: {
            numberOfImages: 1,
            aspectRatio: '1:1',
            outputMimeType: 'image/jpeg',
          },
        });

        const image = response.generatedImages?.[0]?.image;
        if (image?.imageBytes) {
          return `data:image/jpeg;base64,${image.imageBytes}`;
        }
      } catch (err) {
        console.warn('Imagen 3 generation fallback to SVG concept card:', err);
      }
    }

    // High-quality SVG Concept Card Data URL fallback for DEMO_MODE / offline dev
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#bg)" rx="16" />
      <rect x="20" y="20" width="360" height="360" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" rx="12" />
      <text x="200" y="160" font-family="Inter, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">${fictionalBrandName}</text>
      <text x="200" y="200" font-family="Inter, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">FICTIONAL REPLACEMENT BRAND</text>
      <rect x="80" y="230" width="240" height="80" fill="rgba(255,255,255,0.08)" rx="8" />
      <text x="200" y="275" font-family="JetBrains Mono, monospace" font-size="12" fill="#06b6d4" text-anchor="middle">APPROVED PROP ARTWORK</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
  }
}

export const artworkTool = new ArtworkTool();
