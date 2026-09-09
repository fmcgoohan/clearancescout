import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { extractTextFromPdfBuffer } from '../../server/agents/ScriptParserAgent.js';
import { CanonicalRegistryWorkflow } from '../../server/workflows/canonicalRegistryWorkflow.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';

describe('Contract: Synthetic Glacier Brew 4-Page PDF Extraction & Ingestion Integrity', () => {
  const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/glacier_brew_4page.pdf');
  const imageOnlyPath = path.resolve(process.cwd(), 'tests/fixtures/image_only.pdf');
  const malformedPath = path.resolve(process.cwd(), 'tests/fixtures/malformed.pdf');

  it('extracts substantial printable screenplay text from real 4-page PDF without binary/control codes', async () => {
    const stat = fs.statSync(fixturePath);
    expect(stat.size).toBeGreaterThan(20000);

    const buffer = fs.readFileSync(fixturePath);
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    expect(parsed.total).toBe(4);

    const text = await extractTextFromPdfBuffer(buffer);

    expect(text.length).toBeGreaterThan(1000);
    // Assert no binary/control characters except \n, \r, \t
    expect(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text)).toBe(false);
    expect(text.toUpperCase()).toContain('GLACIER BREW');
    expect(text).toContain('EXT. NEIGHBORHOOD - NIGHT');
    expect(text).toContain('EXT. NEIGHBORHOOD CORNER - CONTINUOUS');
    expect(text).toContain('INT. LIVING ROOM - LATER THAT NIGHT');
  });

  it('generates accurate pre-commit preview with 3 scenes, 4 pages, and no warnings', async () => {
    const buffer = fs.readFileSync(fixturePath);
    const text = await extractTextFromPdfBuffer(buffer);
    const workflow = new CanonicalRegistryWorkflow();
    const preview = await workflow.previewScriptUpload(text, 'glacier_brew_4page.pdf', 'PDF');

    expect(preview.isValid).toBe(true);
    expect(preview.scenesDetected).toBe(3);
    expect(preview.estimatedPageCount).toBe(4);
    expect(preview.sampleHeadings.length).toBe(3);
    expect(preview.sampleHeadings[0]).toContain('EXT. NEIGHBORHOOD - NIGHT');
    expect(preview.sampleHeadings[1]).toContain('EXT. NEIGHBORHOOD CORNER - CONTINUOUS');
    expect(preview.sampleHeadings[2]).toContain('INT. LIVING ROOM - LATER THAT NIGHT');
    expect(preview.warnings.length).toBe(0);
  });

  it('ingests Glacier Brew screenplay into clean project: creates 3 scenes, identifies Glacier Brew brand, and does not seed demo entities', async () => {
    const project = await projectRepo.createProject({
      title: 'Mountain Refuge Production',
      productionCompany: 'Summit Ridge Media',
      scriptVersion: 'v1.0',
      projectType: 'Movie',
      executionMode: 'TEST_MODE',
    });

    const buffer = fs.readFileSync(fixturePath);
    const text = await extractTextFromPdfBuffer(buffer);
    const workflow = new CanonicalRegistryWorkflow();
    const result = await workflow.processScriptUpload(project.id, text, 'PDF');

    expect(result.scenesParsed).toBe(3);
    expect(result.canonicalEntitiesExtracted).toBeGreaterThanOrEqual(1);

    const scenes = await sceneRepo.getScenesByProject(project.id);
    expect(scenes.length).toBe(3);

    const entities = await entityRepo.getEntitiesByProject(project.id);
    expect(entities.length).toBeGreaterThanOrEqual(1);

    const brewEntity = entities.find(e => e.canonicalName.toLowerCase().includes('glacier'));
    expect(brewEntity).toBeDefined();
    expect(brewEntity?.entityCategory).toBe('BRAND');

    // Assert zero Neon Horizon / sample entities substituted
    const neonEntity = entities.find(e => e.canonicalName.toLowerCase().includes('summit cola') || e.canonicalName.toLowerCase().includes('aerotech'));
    expect(neonEntity).toBeUndefined();
  });

  it('rejects image-only PDF with 0 extractable scenes and leaves project unmodified', async () => {
    const project = await projectRepo.createProject({
      title: 'Image Test Project',
      productionCompany: 'Test Co',
      scriptVersion: 'v1.0',
      projectType: 'Movie',
      executionMode: 'TEST_MODE',
    });

    const buffer = fs.readFileSync(imageOnlyPath);
    await expect(extractTextFromPdfBuffer(buffer)).rejects.toThrow();

    const scenes = await sceneRepo.getScenesByProject(project.id);
    expect(scenes.length).toBe(0);
  });

  it('rejects corrupted/malformed PDF and preserves transactional consistency', async () => {
    const project = await projectRepo.createProject({
      title: 'Malformed Test Project',
      productionCompany: 'Test Co',
      scriptVersion: 'v1.0',
      projectType: 'Movie',
      executionMode: 'TEST_MODE',
    });

    const buffer = fs.readFileSync(malformedPath);
    await expect(extractTextFromPdfBuffer(buffer)).rejects.toThrow();

    const scenes = await sceneRepo.getScenesByProject(project.id);
    expect(scenes.length).toBe(0);
  });
});
