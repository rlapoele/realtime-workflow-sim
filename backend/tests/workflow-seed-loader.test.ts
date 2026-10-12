import { describe, expect, it } from "vitest";

import {
  MAX_STEP_DURATION_MS,
  loadWorkflowSeeds,
  validateWorkflowSeedDocuments,
} from "../src/workflows/workflow-seed-loader.js";

function validSeed(id = "test-workflow", scenario: "success" | "failure" = "success") {
  const failed = scenario === "failure";

  return {
    schemaVersion: 1,
    definition: {
      id,
      name: "Test workflow",
      description: "A fictional workflow used by the validation suite.",
      category: "Test support",
      triggerDescription: "Manual test request",
      systemIds: ["request-intake", "identity"],
      expectedScenario: scenario,
      request: {
        subject: {
          id: "person-test-user",
          name: "Test User",
          initials: "TU",
          role: "Tester",
          department: "Quality",
          manager: "Review Owner",
        },
        source: "Simulated request",
        priority: "normal",
        details: { requestedAccess: "Example access" },
      },
      steps: [
        {
          id: "qualify",
          name: "Qualify request",
          description: "Review the fictional request context.",
          systemId: "request-intake",
          actionLabel: "Review context",
        },
        {
          id: "apply",
          name: "Apply change",
          description: "Apply a simulated change.",
          systemId: "identity",
          actionLabel: "Simulate change",
        },
      ],
    },
    simulation: {
      steps: [
        {
          stepId: "qualify",
          durationMs: 3_000,
          logs: ["Request context loaded.", "Policy context checked."],
          outcome: "success",
          resultSummary: "Request qualified.",
        },
        {
          stepId: "apply",
          durationMs: 3_000,
          logs: ["Simulated change started.", "Simulated change finished."],
          outcome: failed ? "failed" : "success",
          ...(failed
            ? { failureReason: "The fictional capacity limit was reached." }
            : { resultSummary: "Simulated change applied." }),
        },
      ],
    },
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("workflow seed validation", () => {
  it("loads the four required authored JSON files", () => {
    const seeds = loadWorkflowSeeds();

    expect([...seeds.keys()]).toEqual([
      "app-access",
      "employee-offboarding",
      "employee-onboarding",
      "password-reset",
    ]);
    expect(seeds.get("app-access")?.definition.expectedScenario).toBe("failure");
    expect(seeds.get("employee-onboarding")?.simulation.steps).toHaveLength(5);
  });

  it.each([
    ["unsupported schema version", (seed: any) => (seed.schemaVersion = 2), "schemaVersion"],
    ["missing required field", (seed: any) => delete seed.definition.name, "definition.name"],
    ["invalid public field", (seed: any) => (seed.definition.request.priority = "urgent"), "priority"],
    ["duplicate step IDs", (seed: any) => (seed.definition.steps[1].id = "qualify"), "duplicate step id"],
    ["unknown script reference", (seed: any) => (seed.simulation.steps[1].stepId = "unknown"), "unknown step"],
    ["non-bijective script set", (seed: any) => seed.simulation.steps.pop(), "script entry"],
    ["zero duration", (seed: any) => (seed.simulation.steps[0].durationMs = 0), "durationMs"],
    ["duration above bound", (seed: any) => (seed.simulation.steps[0].durationMs = MAX_STEP_DURATION_MS + 1), "durationMs"],
    ["empty logs", (seed: any) => (seed.simulation.steps[0].logs = []), "logs"],
    ["blank log chunk", (seed: any) => (seed.simulation.steps[0].logs = [" "]), "logs[0]"],
    ["missing failure reason", (seed: any) => {
      seed.definition.expectedScenario = "failure";
      seed.simulation.steps[1].outcome = "failed";
    }, "failureReason"],
    ["success scenario with failure", (seed: any) => {
      seed.simulation.steps[1].outcome = "failed";
      seed.simulation.steps[1].failureReason = "Expected test failure.";
    }, "expectedScenario"],
    ["failure scenario without failure", (seed: any) => (seed.definition.expectedScenario = "failure"), "expectedScenario"],
  ])("rejects %s with a filename and actionable detail", (_name, mutate, detail) => {
    const seed = validSeed();
    mutate(seed);

    expect(() =>
      validateWorkflowSeedDocuments([{ filename: "broken-workflow.json", value: seed }]),
    ).toThrow(new RegExp(`broken-workflow\\.json.*${escapeRegExp(detail)}`, "is"));
  });

  it("rejects duplicate workflow IDs across files", () => {
    expect(() =>
      validateWorkflowSeedDocuments([
        { filename: "first.json", value: validSeed("duplicate") },
        { filename: "second.json", value: validSeed("duplicate") },
      ]),
    ).toThrow(/second\.json.*duplicate workflow id.*first\.json/is);
  });
});
