import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Feature 018 PDF Extraction Integrity & CLOUD_MODE Demo Boundaries', () => {
  it('should return visible 400 Bad Request with PDF_EXTRACTION_FAILED on unparseable/scanned PDF content', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'PDF Integrity Project',
        productionCompany: 'Studio Legal',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // 1. Upload unparseable binary string pretending to be a scanned PDF
    const badPdfRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: '%PDF-1.4 binary garbage with zero printable screenplay dialogue %EOF',
        format: 'PDF',
      });

    expect(badPdfRes.status).toBe(400);
    expect(badPdfRes.body.code).toBe('PDF_EXTRACTION_FAILED');
    expect(badPdfRes.body.error).toContain('Unable to extract text from PDF');

    // 2. Upload valid text-extracted PDF screenplay
    const validPdfRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: 'INT. COFFEE SHOP - DAY\nJordan sips a cool Summit Cola while reading a book.',
        format: 'PDF',
      });

    expect(validPdfRes.status).toBe(200);
    expect(validPdfRes.body.scenesCount).toBeGreaterThanOrEqual(1);
    expect(validPdfRes.body.entitiesCount).toBeGreaterThanOrEqual(1);

    // 3. Upload authentic binary PDF file fixture via multipart/form-data to a dedicated project
    const pdfProjRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Binary PDF Ingestion Project',
        productionCompany: 'Studio Legal',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const pdfProjId = pdfProjRes.body.id;

    const binaryUploadRes = await request(app)
      .post(`/api/projects/${pdfProjId}/script`)
      .attach('script', 'tests/fixtures/sample_script.pdf');

    expect(binaryUploadRes.status).toBe(200);
    expect(binaryUploadRes.body.scenesCount).toBe(2);
    expect(binaryUploadRes.body.entitiesCount).toBeGreaterThanOrEqual(2);
  });

  it('should isolate CLOUD_MODE demo ingestion from synthetic fixture assessments', async () => {
    // 1. Create project in CLOUD_MODE
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Cloud Mode Demo Project',
        productionCompany: 'Cloud Studio',
        projectType: 'Movie',
        executionMode: 'CLOUD_MODE',
      });
    const projectId = projRes.body.id;

    // 2. Load demo sample in CLOUD_MODE
    const demoRes = await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({
        autoEvaluate: false,
      });

    expect(demoRes.status).toBe(200);
    expect(demoRes.body.projectId).toBe(projectId);
    // In CLOUD_MODE with autoEvaluate: false, no synthetic fixtures should be seeded
    expect(demoRes.body.evaluationsCount).toBe(0);
    expect(demoRes.body.activeRightsCount).toBe(0);
    expect(demoRes.body.activePlaceholdersCount).toBe(0);
    expect(demoRes.body.readinessSummary.workingClearScenesCount).toBe(0);
    expect(demoRes.body.readinessSummary.finalClearScenesCount).toBe(0);
    expect(demoRes.body.readinessSummary.overallReadinessPercentage).toBe(0);
  });
});
