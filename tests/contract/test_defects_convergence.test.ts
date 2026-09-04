import { describe, it, expect } from "vitest";
import { formatOccurrenceCount } from "../../src/utils/formatters.js";
import { sceneReadinessEngine } from "../../server/workflows/sceneReadinessEngine.js";
import { sceneRepo } from "../../server/repositories/SceneRepo.js";
import { entityRepo } from "../../server/repositories/EntityRepo.js";

describe("Convergence Unit Tests (FR-025 - FR-029)", () => {
  describe("FR-026: Occurrence Count Formatting", () => {
    it("handles zero occurrences", () => {
      expect(formatOccurrenceCount(0)).toBe("0 occurrences");
      expect(formatOccurrenceCount(0, 0)).toBe("0 occurrences");
    });

    it("handles single occurrence in single scene (1/1)", () => {
      expect(formatOccurrenceCount(1)).toBe("1 scene occurrence");
      expect(formatOccurrenceCount(1, 1)).toBe("1 scene occurrence");
    });

    it("handles multiple occurrences in single scene (many/1)", () => {
      expect(formatOccurrenceCount(4, 1)).toBe("4 occurrences in 1 scene");
    });

    it("handles multiple occurrences across multiple scenes (many/many)", () => {
      expect(formatOccurrenceCount(6, 3)).toBe("6 occurrences across 3 scenes");
    });
  });

  describe("FR-027: Blocker Deduplication (One Blocker, Many Occurrences)", () => {
    it("deduplicates multiple occurrences of the same canonical entity within a scene", async () => {
      const projectId = "proj-test-dedup-" + Date.now();

      const scene = await sceneRepo.createScene({
        projectId,
        sceneNumber: 1,
        heading: "EXT. STREET - NIGHT",
        locationType: "EXT",
        timeOfDay: "NIGHT",
        rawText: "Car drives past a billboard and neon sign.",
        characterActionSummary: "Street scene",
      });

      const ent = await entityRepo.createCanonicalEntity({
        projectId,
        canonicalName: "Coors Light",
        entityCategory: "BRAND",
        overallClearanceStatus: "ACTION_REQUIRED",
        description: "Alcoholic beverage brand",
      });

      // 3 occurrences of Coors Light in Scene 1
      await entityRepo.createOccurrence(projectId, {
        canonicalEntityId: ent.id,
        sceneId: scene.id,
        scriptLineNumber: 10,
        excerptText: "Drinking a Coors Light can.",
        usageContext: "Foreground character drinking",
      });
      await entityRepo.createOccurrence(projectId, {
        canonicalEntityId: ent.id,
        sceneId: scene.id,
        scriptLineNumber: 20,
        excerptText: "A Coors Light billboard shines overhead.",
        usageContext: "Background billboard",
      });
      await entityRepo.createOccurrence(projectId, {
        canonicalEntityId: ent.id,
        sceneId: scene.id,
        scriptLineNumber: 30,
        excerptText: "A neon Coors Light sign flickers.",
        usageContext: "Neon sign on bar window",
      });

      const readiness = await sceneReadinessEngine.evaluateSceneReadiness(projectId, scene.id);
      expect(readiness.status).toBe("RED");
      // Unique blocker count must be 1, NOT 3
      expect(readiness.blockersCount).toBe(1);
      expect(readiness.totalOccurrences).toBe(3);
      expect(readiness.blockingRationale).toContain("1 clearance blocker prevents shooting Scene 1");
      expect(readiness.blockingRationale).toContain('"Coors Light" (ACTION_REQUIRED, appears 3 times)');
    });
  });

  describe("FR-029: Zero-Item Scene Review & Status Contract", () => {
    it("marks unreviewed zero-item scenes as PENDING_REVIEW instead of FINAL_CLEAR", async () => {
      const projectId = "proj-test-zero-" + Date.now();

      const scene = await sceneRepo.createScene({
        projectId,
        sceneNumber: 2,
        heading: "INT. EMPTY ROOM - DAY",
        locationType: "INT",
        timeOfDay: "DAY",
        rawText: "An empty room with bare white walls.",
        characterActionSummary: "Empty room",
      });

      const readiness = await sceneReadinessEngine.evaluateSceneReadiness(projectId, scene.id);
      expect(readiness.status).toBe("PENDING_REVIEW");
      expect(readiness.blockersCount).toBe(0);
      expect(readiness.finalClearCount).toBe(0);
      expect(readiness.summaryText).toContain("pending human confirmation");

      const projectSummary = await sceneReadinessEngine.evaluateAllScenesReadiness(projectId);
      expect(projectSummary.finalClearScenesCount).toBe(0);
      expect(projectSummary.pendingReviewScenesCount).toBe(1);
      expect(projectSummary.redScenesCount).toBe(0);
    });

    it("marks human-confirmed zero-item scenes as FINAL_CLEAR", async () => {
      const projectId = "proj-test-confirmed-" + Date.now();

      const scene = await sceneRepo.createScene({
        projectId,
        sceneNumber: 3,
        heading: "INT. EMPTY ROOM - NIGHT",
        locationType: "INT",
        timeOfDay: "NIGHT",
        rawText: "Bare room.",
        characterActionSummary: "Bare room",
        readinessStatus: "FINAL_CLEAR",
        humanConfirmed: true,
      } as any);

      const readiness = await sceneReadinessEngine.evaluateSceneReadiness(projectId, scene.id);
      expect(readiness.status).toBe("FINAL_CLEAR");
      expect(readiness.finalClearCount).toBe(1);
      expect(readiness.summaryText).toContain("Human-confirmed");
    });
  });
});
