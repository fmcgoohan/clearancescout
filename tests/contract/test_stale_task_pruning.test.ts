import { describe, it, expect } from "vitest";
import { projectRepo } from "../../server/repositories/ProjectRepo.js";
import { entityRepo } from "../../server/repositories/EntityRepo.js";
import { actionNotificationRepo } from "../../server/repositories/ActionNotificationRepo.js";
import { clearanceEvaluator } from "../../server/workflows/clearanceEvaluator.js";

describe("Contract: Stale RETRY_RESEARCH Task Pruning on Entity Evaluation (FR-013)", () => {
  it("automatically marks open RETRY_RESEARCH task as RESOLVED when entity is evaluated", async () => {
    const project = await projectRepo.createProject({
      title: "Task Pruning Test",
      productionCompany: "Integrity Studios",
      scriptVersion: "v1.0",
      projectType: "Movie",
      executionMode: "TEST_MODE",
    });

    const entity = await entityRepo.createCanonicalEntity({
      projectId: project.id,
      canonicalName: "AeroTech Prism Laptop",
      entityCategory: "BRAND",
      description: "Futuristic transparent OLED laptop prop",
      overallClearanceStatus: "INSUFFICIENT_EVIDENCE",
    });

    // Create an initial RETRY_RESEARCH task as spawned during script intake
    const initialAction = await actionNotificationRepo.createActionItem(project.id, {
      canonicalEntityId: entity.id,
      canonicalName: entity.canonicalName,
      actionType: "RETRY_RESEARCH",
      targetDepartment: "CLEARANCE_TEAM",
      title: `Retry Legal Research: ${entity.canonicalName}`,
      description: "Insufficient evidence surfaced during ingestion; retry trademark research.",
      priority: "HIGH",
      status: "OPEN",
    });

    // Verify task is OPEN initially
    const actionsBefore = await actionNotificationRepo.getActionsByProject(project.id, {
      canonicalEntityId: entity.id,
    });
    expect(actionsBefore.some(a => a.id === initialAction.id && a.status === "OPEN")).toBe(true);

    // Evaluate entity clearance
    await clearanceEvaluator.evaluateEntityClearance(project.id, entity.id);

    // Verify entity is evaluated
    const updatedEntity = await entityRepo.getEntityById(project.id, entity.id);
    expect(updatedEntity?.overallClearanceStatus).not.toBe("INSUFFICIENT_EVIDENCE");

    // Invariant (FR-013): Verify RETRY_RESEARCH task is now RESOLVED
    const actionsAfter = await actionNotificationRepo.getActionsByProject(project.id, {
      canonicalEntityId: entity.id,
    });
    const retryTask = actionsAfter.find(a => a.id === initialAction.id);
    expect(retryTask?.status).toBe("RESOLVED");
    expect(retryTask?.resolutionTrigger).toContain("EVALUATION_COMPLETED");
  });
});
