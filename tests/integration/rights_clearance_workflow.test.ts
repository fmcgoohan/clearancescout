import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { rightsRepo } from '../../server/repositories/RightsRepo.js';

describe('Integration: Rights & Restrictions Clearance Workflow (Feature 016 Phase 4)', () => {
  it('clears clearance risk when active license is attached, enforces contractual covenants, and handles expiration fallback', async () => {
    // 1. Create a TV Show Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Project CyberCity Chronicle',
        productionCompany: 'StreamWorks Studios',
        scriptVersion: 'v1.4-Production',
        projectType: 'TV Show',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest screenplay with a copyrighted song (normally ACTION_REQUIRED)
    const scriptText = `
INT. NIGHTCLUB - NIGHT
The pulsing synthwave rhythm of Nocturne of the Wild echoes across the crowded dance floor.

INT. VIP LOUNGE - NIGHT
Elena Vance sips a cocktail while Nocturne of the Wild plays in the background.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const musicEntity = entities.find((e) => e.entityCategory === 'ART_MUSIC');
    expect(musicEntity).toBeDefined();
    const musicEntityId = musicEntity!.id;

    // 3. Baseline evaluation before license: Should be ACTION_REQUIRED for copyrighted musical work
    const evalBeforeRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [musicEntityId] });
    expect(evalBeforeRes.status).toBe(200);

    const occurrencesBefore = await entityRepo.getOccurrencesByEntity(projectId, musicEntityId);
    expect(occurrencesBefore[0].clearanceStatus).toBe('ACTION_REQUIRED');

    // 4. Attach an active worldwide synchronization license with restrictive covenants
    const attachRightsRes = await request(app)
      .post(`/api/projects/${projectId}/rights`)
      .send({
        canonicalEntityId: musicEntityId,
        licensorName: 'Atlas Music Publishing & Masters Ltd',
        grantType: 'EXCLUSIVE',
        territory: 'WORLDWIDE',
        mediaWindow: 'ALL_MEDIA_IN_PERPETUITY',
        effectiveDate: '2026-01-01',
        isPerpetual: true,
        covenants: [
          'Master recording sync fee paid in full',
          'End credits mandatory: "Nocturne of the Wild courtesy of Atlas Music"',
        ],
        feeAmount: 25000,
        currency: 'USD',
        status: 'ACTIVE',
      });
    expect(attachRightsRes.status).toBe(201);
    const rightsId = attachRightsRes.body.id;

    // 5. Re-evaluate clearance after attaching license: Should resolve to NO_ISSUE_SURFACED with covenants noted
    const evalAfterRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [musicEntityId] });
    expect(evalAfterRes.status).toBe(200);

    const occurrencesAfter = await entityRepo.getOccurrencesByEntity(projectId, musicEntityId);
    expect(occurrencesAfter[0].clearanceStatus).toBe('NO_ISSUE_SURFACED');
    expect(occurrencesAfter[0].contextFlags).toContain('CONTRACTUAL_RIGHTS_ACTIVE');
    expect(occurrencesAfter[0].contextFlags?.some((f) => f.includes('End credits mandatory'))).toBe(true);

    const canonicalAfter = await entityRepo.getEntityById(projectId, musicEntityId);
    expect(canonicalAfter?.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');

    // 6. Test Expiration Fallback: Expire the license and re-evaluate
    await request(app)
      .patch(`/api/projects/${projectId}/rights/${rightsId}`)
      .send({
        status: 'EXPIRED',
        isPerpetual: false,
        expirationDate: '2020-01-01',
      });

    const evalExpiredRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [musicEntityId] });
    expect(evalExpiredRes.status).toBe(200);

    const occurrencesExpired = await entityRepo.getOccurrencesByEntity(projectId, musicEntityId);
    expect(occurrencesExpired[0].clearanceStatus).toBe('ACTION_REQUIRED');
  });
});
