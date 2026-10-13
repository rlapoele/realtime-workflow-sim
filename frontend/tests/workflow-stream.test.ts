import { describe, expect, it } from "vitest";

import type { ExecutionEvent, WorkflowExecution } from "../../shared/types";
import { reconcileExecutionEvent } from "@/lib/workflow-stream";

const execution: WorkflowExecution = {
  id: "execution-1",
  workflowId: "employee-onboarding",
  request: {
    subject: { id: "person-alex", name: "Alex Chen", initials: "AC" },
    source: "Simulation",
    priority: "normal",
    details: {},
  },
  status: "running",
  steps: [
    {
      stepId: "load-requirements",
      status: "running",
      logs: "",
      startedAt: "2026-10-12T08:00:00.000Z",
    },
  ],
  latestSequence: 1,
  createdAt: "2026-10-12T08:00:00.000Z",
  startedAt: "2026-10-12T08:00:00.000Z",
};

function event<T extends ExecutionEvent>(value: T): T {
  return value;
}

describe("execution event reconciliation", () => {
  it("applies the next log delta exactly once and ignores duplicate or older events", () => {
    const delta = event({
      type: "log.delta",
      executionId: execution.id,
      sequence: 2,
      occurredAt: "2026-10-12T08:00:01.000Z",
      stepId: "load-requirements",
      delta: "Loaded fictional requirements.",
    });

    const applied = reconcileExecutionEvent(execution, delta);
    expect(applied.kind).toBe("applied");
    expect(applied.execution?.steps[0]?.logs).toBe("Loaded fictional requirements.");
    expect(applied.execution?.latestSequence).toBe(2);

    const duplicate = reconcileExecutionEvent(applied.execution, delta);
    expect(duplicate).toEqual({ kind: "ignored", execution: applied.execution });

    const older = reconcileExecutionEvent(
      applied.execution,
      event({ ...delta, sequence: 1, delta: "Should not appear" }),
    );
    expect(older).toEqual({ kind: "ignored", execution: applied.execution });
  });

  it("reports a sequence gap without applying the newer event", () => {
    const result = reconcileExecutionEvent(
      execution,
      event({
        type: "log.delta",
        executionId: execution.id,
        sequence: 3,
        occurredAt: "2026-10-12T08:00:02.000Z",
        stepId: "load-requirements",
        delta: "Out of order",
      }),
    );

    expect(result).toEqual({ kind: "gap", execution });
  });

  it("accepts an equally current or newer snapshot and rejects stale snapshots", () => {
    const current = { ...execution, latestSequence: 4 };
    const authoritative = {
      ...execution,
      latestSequence: 6,
      steps: [{ ...execution.steps[0]!, logs: "Authoritative complete log" }],
    };

    const applied = reconcileExecutionEvent(
      current,
      event({
        type: "execution.snapshot",
        executionId: execution.id,
        sequence: 6,
        occurredAt: "2026-10-12T08:00:03.000Z",
        execution: authoritative,
      }),
    );
    expect(applied).toEqual({ kind: "applied", execution: authoritative });

    const stale = reconcileExecutionEvent(
      authoritative,
      event({
        type: "execution.snapshot",
        executionId: execution.id,
        sequence: 4,
        occurredAt: "2026-10-12T08:00:02.000Z",
        execution: current,
      }),
    );
    expect(stale).toEqual({ kind: "ignored", execution: authoritative });
  });

  it("applies step and execution statuses without losing accumulated logs", () => {
    const withLog = {
      ...execution,
      steps: [{ ...execution.steps[0]!, logs: "Already streamed" }],
    };
    const stepResult = reconcileExecutionEvent(
      withLog,
      event({
        type: "step.status",
        executionId: execution.id,
        sequence: 2,
        occurredAt: "2026-10-12T08:00:03.000Z",
        stepId: "load-requirements",
        status: "success",
        completedAt: "2026-10-12T08:00:03.000Z",
        resultSummary: "Requirements loaded.",
      }),
    );
    expect(stepResult.execution?.steps[0]).toMatchObject({
      status: "success",
      logs: "Already streamed",
      resultSummary: "Requirements loaded.",
    });

    const executionResult = reconcileExecutionEvent(
      stepResult.execution,
      event({
        type: "execution.status",
        executionId: execution.id,
        sequence: 3,
        occurredAt: "2026-10-12T08:00:03.000Z",
        status: "success",
        completedAt: "2026-10-12T08:00:03.000Z",
      }),
    );
    expect(executionResult.execution).toMatchObject({
      status: "success",
      latestSequence: 3,
      steps: [{ logs: "Already streamed" }],
    });
  });
});
