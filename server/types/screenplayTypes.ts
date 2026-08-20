export type ScreenplayFormat = 'FOUNTAIN' | 'TEXT' | 'PLAINTEXT' | 'PDF';

export interface ScreenplayUploadInput {
  fileBuffer: Buffer;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface IngestionChunkJob {
  chunkIndex: number;
  totalChunks: number;
  sceneStartNumber: number;
  sceneEndNumber: number;
  rawTextLength: number;
  tokenEstimate: number;
  extractedCandidateCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
}

export interface ScreenplayDraftMetadata {
  draftVersion: number;
  filename: string;
  format: ScreenplayFormat;
  uploadedAt: string;
  characterCount: number;
  sceneCount: number;
  totalEntitiesDetected: number;
  checksumSha256: string;
}

export interface ScreenplayUploadResult {
  success: boolean;
  projectId: string;
  filename: string;
  format: ScreenplayFormat;
  draftVersion: number;
  characterCount: number;
  scenesIngested: number;
  entitiesDetected: number;
  occurrencesCreated: number;
  chunkCount: number;
  uploadedAt: string;
  checksumSha256: string;
}
