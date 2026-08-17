import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Integration: ClearanceScout MVP Full Multi-Format Workflow', () => {
  it('should execute end-to-end multi-format ingestion, 5-category extraction, risk evaluation, replacement generation, and binder export', async () => {
    // Step 1: Create Project in DEMO_MODE
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Cyberpunk Odyssey',
        productionCompany: 'Spectacle Pictures',
        scriptVersion: 'v1.0-FountainDraft',
        executionMode: 'DEMO_MODE',
      });

    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // Step 2: Ingest Multi-Category Fountain Script
    const fountainScript = `
.INT. UNDERGROUND CLUB - NIGHT
ALEX drinks a chilled can of Coca-Cola while Bohemian Rhapsody blares from the sound system.

JORDAN
(shouting)
Did you secure the credentials from Elon Musk?

ALEX
(nodding towards the table)
The blueprint is in the case next to the Apple MacBook near the Acme Explosives Warning crate.

.EXT. MIDTOWN STREET - NIGHT
JORDAN escapes past the Empire State Building in a Porsche 911.
`;

    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: fountainScript,
        format: 'FOUNTAIN',
      });

    expect(scriptRes.status).toBe(200);
    expect(scriptRes.body.scenesParsed).toBe(2);
    expect(scriptRes.body.canonicalEntitiesExtracted).toBeGreaterThanOrEqual(5);

    const categories = scriptRes.body.entities.map((e: any) => e.entityCategory);
    expect(categories).toContain('BRAND');
    expect(categories).toContain('ART_MUSIC');
    expect(categories).toContain('PUBLIC_FIGURE');
    expect(categories).toContain('PROPRIETARY_LOCATION');
    expect(categories).toContain('GRAPHIC_PROP');

    const cocaColaEntity = scriptRes.body.entities.find((e: any) => e.canonicalName.toLowerCase().includes('coca-cola'));
    expect(cocaColaEntity).toBeDefined();

    // Step 3: Ground Clearance Risk Evaluation
    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({
        canonicalEntityIds: [cocaColaEntity.id],
      });

    expect(evalRes.status).toBe(200);
    const asm = evalRes.body.assessments[0];
    expect(asm.riskStatus).toBe('ACTION_REQUIRED');
    expect(asm.citations.length).toBeGreaterThan(0);
    expect(asm.citations[0].corporateOwner).toBeDefined();

    // Step 4: Generate Era-Appropriate Visual Replacement Prop Card
    const repRes = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({
        canonicalEntityId: cocaColaEntity.id,
        eraAesthetic: 'Cyberpunk Neon Noir',
      });

    expect(repRes.status).toBe(200);
    expect(repRes.body.fictionalBrandName).toBeDefined();
    expect(repRes.body.eraAesthetic).toBe('Cyberpunk Neon Noir');
    expect(repRes.body.artworkImageUrl).toContain('data:image/');
    expect(repRes.body.nonInfringementRationale).toBeDefined();

    // Step 5: Export Auditable Project Clearance Binder
    const binderRes = await request(app).get(`/api/projects/${projectId}/binder/export`);

    expect(binderRes.status).toBe(200);
    expect(binderRes.body.projectId).toBe(projectId);
    expect(binderRes.body.integrityDigest).toBeDefined();
    expect(binderRes.body.integrityDigest.length).toBe(64);
    expect(binderRes.body.scenes.length).toBe(2);
    expect(binderRes.body.canonicalEntities.length).toBeGreaterThanOrEqual(5);
    expect(binderRes.body.replacementCatalog.length).toBeGreaterThanOrEqual(1);

    // Step 6: Verify Privacy Invariant (No Raw Chain-of-Thought in binder export or payload)
    const rawPayload = JSON.stringify(binderRes.body);
    expect(rawPayload).not.toContain('"thought":');
    expect(rawPayload).not.toContain('"thinking":');
    expect(rawPayload).not.toContain('"chainOfThought":');
  });
});
