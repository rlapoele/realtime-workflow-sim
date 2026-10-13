import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ExecutionEvent, WorkflowExecution } from "../../shared/types.js";
import {
  ExecutionService,
  type ExecutionLimits,
  type ExecutionRuntime,
  HEARTBEAT_INTERVAL_MS,
} from "../src/executions/execution.service.js";
import { WorkflowCatalogueService } from "../src/workflows/workflow-catalogue.service.js";

function createRuntime(): ExecutionRuntime {
  let nextId = 0;
  return {
    createId: () => `execution-${++nextId}`,
    now: () => new Date(),
    schedule: (callback, delayMs) => setTimeout(callback, delayMs),
    cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };
}

function createService(limits?: Partial<ExecutionLimits>) {
  return new ExecutionService(new WorkflowCatalogueService(), createRuntime(), {
    maxCompletedExecutions: limits?.maxCompletedExecutions ?? 50,
    maxLogCharacters: limits?.maxLogCharacters ?? 64_000,
  });
}

function trigger(service: ExecutionService, workflowId: string): WorkflowExecution {
  const execution = service.trigger(workflowId);
  if (execution === undefined) throw new Error(`Expected workflow ${workflowId} to exist`);
  return execution;
}

describe("ExecutionService event streams", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T08:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with an authoritative snapshot, then emits strictly ordered live events", async () => {
    const service = createService();
    const execution = trigger(service, "password-reset");
    const events: ExecutionEvent[] = [];
    let completed = false;

    service.stream(execution.id)?.subscribe({
      next: (event) => events.push(event),
      complete: () => {
        completed = true;
      },
    });

    expect(events).toEqual([
      expect.objectContaining({
        type: "execution.snapshot",
        executionId: execution.id,
        sequence: 0,
      }),
    ]);

    await vi.runAllTimersAsync();

    const sequenced = events.filter(
      (event): event is Exclude<ExecutionEvent, { type: "heartbeat" }> =>
        event.type !== "heartbeat",
    );
    expect(sequenced.map((event) => event.sequence)).toEqual(
      Array.from({ length: sequenced.length }, (_, index) => index),
    );
    expect(sequenced.some((event) => event.type === "log.delta")).toBe(true);
    expect(sequenced.at(-1)).toMatchObject({
      type: "execution.status",
      status: "success",
    });
    expect(completed).toBe(true);
  });

  it("isolates subscribers by execution and does not replay historical log chunks", async () => {
    const service = createService();
    const first = trigger(service, "employee-onboarding");
    const second = trigger(service, "password-reset");
    await vi.advanceTimersByTimeAsync(2_000);

    const events: ExecutionEvent[] = [];
    service.stream(first.id)?.subscribe((event) => events.push(event));

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "execution.snapshot",
      executionId: first.id,
      execution: expect.objectContaining({ latestSequence: expect.any(Number) }),
    });
    const snapshot = events[0];
    if (snapshot?.type !== "execution.snapshot") throw new Error("Expected snapshot event");
    const historicalChunks = snapshot.execution.steps.reduce(
      (count, step) => count + (step.logs === "" ? 0 : step.logs.split("\n").length),
      0,
    );
    expect(historicalChunks).toBeGreaterThan(0);

    await vi.runAllTimersAsync();

    expect(events.every((event) => event.executionId === first.id)).toBe(true);
    expect(events.some((event) => event.executionId === second.id)).toBe(false);
    const totalChunks = service
      .get(first.id)!
      .steps.reduce((count, step) => count + (step.logs === "" ? 0 : step.logs.split("\n").length), 0);
    expect(events.filter((event) => event.type === "log.delta")).toHaveLength(
      totalChunks - historicalChunks,
    );
  });

  it("emits heartbeats without advancing execution sequence", async () => {
    const service = createService();
    const execution = trigger(service, "employee-onboarding");
    const events: ExecutionEvent[] = [];
    service.stream(execution.id)?.subscribe((event) => events.push(event));

    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);

    const heartbeat = events.find((event) => event.type === "heartbeat");
    expect(heartbeat).toMatchObject({
      type: "heartbeat",
      executionId: execution.id,
    });
    expect(service.get(execution.id)?.latestSequence).toBe(
      Math.max(
        ...events
          .filter(
            (event): event is Exclude<ExecutionEvent, { type: "heartbeat" }> =>
              event.type !== "heartbeat",
          )
          .map((event) => event.sequence),
      ),
    );
  });

  it("releases a disconnected subscriber without cancelling the execution", async () => {
    const service = createService();
    const execution = trigger(service, "password-reset");
    const events: ExecutionEvent[] = [];
    const subscription = service.stream(execution.id)?.subscribe((event) => events.push(event));

    await vi.advanceTimersByTimeAsync(1_100);
    subscription?.unsubscribe();
    const countAtDisconnect = events.length;
    await vi.runAllTimersAsync();

    expect(events).toHaveLength(countAtDisconnect);
    expect(service.get(execution.id)?.status).toBe("success");
  });

  it("completes active streams and clears their heartbeat during shutdown", async () => {
    const service = createService();
    const execution = trigger(service, "employee-onboarding");
    let completed = false;
    service.stream(execution.id)?.subscribe({
      complete: () => {
        completed = true;
      },
    });
    await vi.advanceTimersByTimeAsync(0);

    expect(vi.getTimerCount()).toBeGreaterThan(0);
    service.onApplicationShutdown();

    expect(completed).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("returns no stream for an unknown execution and completes retained terminal snapshots", async () => {
    const service = createService();
    expect(service.stream("missing-execution")).toBeUndefined();

    const execution = trigger(service, "password-reset");
    await vi.runAllTimersAsync();
    const events: ExecutionEvent[] = [];
    let completed = false;
    service.stream(execution.id)?.subscribe({
      next: (event) => events.push(event),
      complete: () => {
        completed = true;
      },
    });

    expect(events).toEqual([
      expect.objectContaining({
        type: "execution.snapshot",
        executionId: execution.id,
        execution: expect.objectContaining({ status: "success" }),
      }),
    ]);
    expect(completed).toBe(true);
  });
});
