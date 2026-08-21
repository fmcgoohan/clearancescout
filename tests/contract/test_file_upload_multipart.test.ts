import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';

describe('Feature 019: Multipart Screenplay File Upload & Validation Contract', () => {
  let projectId: string;

  beforeEach(async () => {
    const proj = await projectRepo.createProject({
      title: 'Upload Contract Test Project',
      productionCompany: 'Integrity Films',
      scriptVersion: 'v1.0',
      executionMode: 'TEST_MODE',
    });
    projectId = proj.id;
  });

  it('rejects empty files with HTTP 400 and EMPTY_FILE error code', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .attach('file', Buffer.from(''), 'empty_script.fountain');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('EMPTY_FILE');
    expect(res.body.error).toMatch(/empty/i);
  });

  it('rejects unsupported file formats with HTTP 400 and UNSUPPORTED_FORMAT code', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .attach('file', Buffer.from('console.log("bad format");'), 'malicious_script.js');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UNSUPPORTED_FORMAT');
    expect(res.body.error).toMatch(/unsupported file format/i);
  });

  it('successfully ingests genuine .fountain screenplay file via multipart upload', async () => {
    const fountainContent = `INT. COFFEE SHOP - DAY\n\nALEX sits at a table drinking Coca-Cola.\n\nEXT. PARKING LOT - DAY\n\nAlex gets into a Porsche 911.`;
    const res = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .attach('file', Buffer.from(fountainContent), 'sample_screenplay.fountain');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.projectId).toBe(projectId);
    expect(res.body.format).toBe('FOUNTAIN');
    expect(res.body.scenesParsed).toBeGreaterThanOrEqual(2);
    expect(res.body.canonicalEntitiesExtracted).toBeGreaterThanOrEqual(1);
    expect(res.body.checksumSha256).toBeDefined();
  });

  it('successfully accepts file uploaded under "script" field name for backwards compatibility', async () => {
    const txtContent = `INT. OFFICE - DAY\n\nSarah types on an Apple MacBook.`;
    const res = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .attach('script', Buffer.from(txtContent), 'script.txt');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.scenesParsed).toBeGreaterThanOrEqual(1);
  });

  it('rejects corrupted non-text PDF with PDF_EXTRACTION_FAILED error code', async () => {
    const corruptedPdf = Buffer.from('%PDF-1.4\ncorrupted content without font or text operators');
    const res = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .attach('file', corruptedPdf, 'scanned_doc.pdf');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PDF_EXTRACTION_FAILED');
  });

  it('correctly identifies compound .fountain.txt files as FOUNTAIN format', async () => {
    const compoundFountain = `INT. RIVER - NIGHT\n\nEDWARD swims while drinking Coca-Cola.`;
    const res = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .attach('file', Buffer.from(compoundFountain), 'Big-Fish.fountain.txt');

    expect(res.status).toBe(200);
    expect(res.body.format).toBe('FOUNTAIN');
    expect(res.body.scenesParsed).toBeGreaterThanOrEqual(1);
  });
});
