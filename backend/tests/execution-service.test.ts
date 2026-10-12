import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ExecutionService,
  type ExecutionLimits,
  type ExecutionRuntime,
} from "../src/executions/execution.service.js";
import { WorkflowCatalogueService } from "../src/workflows/workflow-catalogue.service.js";
import type { WorkflowExecution } from "../../shared/types.js";

function createRuntime(): ExecutionRuntime {
  let nextId = 0;
  return {
    createId: () => `execution-${++nextId}`,
    now: () => new Date(),
    schedule: (callback, delayMs) => setTimeout(callback, delayMs),
    cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };
}

function trigger(service: ExecutionService, workflowId: string): WorkflowExecution {
  const execution = service.trigger(workflowId);
  if (execution === undefined) throw new Error(`Expected workflow ${workflowId} to exist`);
  return execution;
}

function createService(limits?: Partial<ExecutionLimits>) {
  return new ExecutionService(new WorkflowCatalogueService(), createRuntime(), {
    maxCompletedExecutions: limits?.maxCompletedExecutions ?? 50,
    maxLogCharacters: limits?.maxLogCharacters ?? 64_000,
  });
}

describe("ExecutionService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T08:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(["employee-onboarding", "employee-offboarding", "password-reset"])(
    "completes the %s script sequentially",
    async (workflowId) => {
      const service = createService();
      const created = trigger(service, workflowId);

      expect(created).toMatchObject({
        id: "execution-1",
        workflowId,
        status: "pending",
        latestSequence: 0,
      });
      expect(created.steps.every((step) => step.status === "pending")).toBe(true);

      await vi.runAllTimersAsync();

      const completed = service.get(created.id);
      expect(completed).toMatchObject({ status: "success" });
      expect(completed?.steps.every((step) => step.status === "success")).toBe(true);
      expect(completed?.steps.every((step) => step.logs.length > 0)).toBe(true);
      expect(completed?.completedAt).toBeDefined();
    },
  );

  it("fails app access at step four and skips the final step", async () => {
    const service = createService();
    const created = trigger(service, "app-access");

    await vi.runAllTimersAsync();

    const completed = service.get(created.id);
    expect(completed).toMatchObject({
      status: "failed",
      failureReason: "No simulated Figma Editor licenses remain; manual follow-up is required.",
    });
    expect(completed?.steps.map((step) => step.status)).toEqual([
      "success",
      "success",
      "success",
      "failed",
      "skipped",
    ]);
    expect(completed?.steps[4]?.logs).toBe("");
  });

  it("creates fresh isolated state and runs executions concurrently", async () => {
    const service = createService();
    const first = trigger(service, "employee-onboarding");
    const second = trigger(service, "employee-onboarding");

    expect(first.id).not.toBe(second.id);
    expect(first.request).not.toBe(second.request);
    expect(first.steps).not.toBe(second.steps);
    expect(first.steps[0]).not.toBe(second.steps[0]);

    await vi.advanceTimersByTimeAsync(1_500);

    expect(service.get(first.id)?.status).toBe("running");
    expect(service.get(second.id)?.status).toBe("running");
    expect(service.get(first.id)?.steps[0]?.logs).not.toBe("");
    expect(service.get(second.id)?.steps[0]?.logs).not.toBe("");

    const mutableSnapshot = service.get(first.id) as unknown as {
      request: { source: string };
      steps: Array<{ logs: string }>;
    };
    mutableSnapshot.request.source = "Consumer mutation";
    mutableSnapshot.steps[0]!.logs = "Consumer mutation";
    expect(service.get(first.id)?.request.source).not.toBe("Consumer mutation");
    expect(service.get(first.id)?.steps[0]?.logs).not.toBe("Consumer mutation");

    await vi.runAllTimersAsync();
    expect(service.get(first.id)?.status).toBe("success");
    expect(service.get(second.id)?.status).toBe("success");
  });

  it("caps accumulated logs and evicts only the oldest completed runs", async () => {
    const service = createService({ maxCompletedExecutions: 2, maxLogCharacters: 32 });
    const oldest = trigger(service, "employee-onboarding");
    const firstCompleted = trigger(service, "password-reset");
    const secondCompleted = trigger(service, "employee-offboarding");
    await vi.advanceTimersByTimeAsync(0);

    expect(service.get(oldest.id)).toBeDefined();
    expect(service.get(firstCompleted.id)).toBeDefined();
    expect(service.get(secondCompleted.id)).toBeDefined();

    await vi.runAllTimersAsync();

    expect(service.get(oldest.id)).toBeUndefined();
    expect(service.get(firstCompleted.id)).toBeDefined();
    expect(service.get(secondCompleted.id)).toBeDefined();

    const newest = trigger(service, "password-reset");
    await vi.runAllTimersAsync();

    expect(service.get(firstCompleted.id)).toBeUndefined();
    expect(service.get(secondCompleted.id)).toBeDefined();
    expect(service.get(newest.id)).toBeDefined();
    expect(
      service
        .get(newest.id)
        ?.steps.reduce((length, step) => length + step.logs.length, 0),
    ).toBeLessThanOrEqual(32);
  });

  it("cancels scheduled work during application shutdown", async () => {
    const service = createService();
    const created = trigger(service, "employee-onboarding");
    await vi.advanceTimersByTimeAsync(0);

    expect(vi.getTimerCount()).toBeGreaterThan(0);
    service.onApplicationShutdown();

    expect(vi.getTimerCount()).toBe(0);
    await vi.runAllTimersAsync();
    expect(service.get(created.id)?.status).toBe("running");
  });

  it("returns undefined for unknown workflows and executions", () => {
    const service = createService();

    expect(service.trigger("missing-workflow")).toBeUndefined();
    expect(service.get("missing-execution")).toBeUndefined();
  });
});
