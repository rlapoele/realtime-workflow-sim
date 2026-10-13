import { describe, expect, it, vi } from "vitest";

import {
  ExecutionApiError,
  fetchExecution,
  triggerWorkflow,
} from "@/lib/executions";
import { parseExecutionEvent } from "../../shared/execution-schema";

const execution = {
  id: "execution-1",
  workflowId: "employee-onboarding",
  request: {
    subject: { id: "person-alex", name: "Alex Chen", initials: "AC" },
    source: "Simulation",
    priority: "normal",
    details: {},
  },
  status: "pending",
  steps: [{ stepId: "load-requirements", status: "pending", logs: "" }],
  latestSequence: 0,
  createdAt: "2026-10-12T08:00:00.000Z",
};

describe("execution API client", () => {
  it("triggers and parses a workflow execution", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(execution), {
          status: 202,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(triggerWorkflow("http://localhost:3000", "employee-onboarding")).resolves.toEqual(
      execution,
    );
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/workflows/employee-onboarding/trigger",
      { method: "POST" },
    );
  });

  it("rejects malformed execution data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ...execution, latestSequence: -1 }), {
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(fetchExecution("http://localhost:3000", "execution-1")).rejects.toThrow(
      "latestSequence",
    );
  });

  it("keeps the shared error code and HTTP status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: "not_found", message: "Execution was not found." } }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const error = await fetchExecution("http://localhost:3000", "missing").catch(
      (cause: unknown) => cause,
    );
    expect(error).toBeInstanceOf(ExecutionApiError);
    expect(error).toMatchObject({ status: 404, code: "not_found" });
  });
});

describe("execution event contract", () => {
  it("parses named snapshot, status, log, and heartbeat events", () => {
    expect(
      parseExecutionEvent({
        type: "execution.snapshot",
        executionId: execution.id,
        sequence: 0,
        occurredAt: "2026-10-12T08:00:00.000Z",
        execution,
      }),
    ).toMatchObject({ type: "execution.snapshot", sequence: 0 });
    expect(
      parseExecutionEvent({
        type: "execution.status",
        executionId: execution.id,
        sequence: 1,
        occurredAt: "2026-10-12T08:00:00.000Z",
        status: "running",
        startedAt: "2026-10-12T08:00:00.000Z",
      }),
    ).toMatchObject({ type: "execution.status", status: "running" });
    expect(
      parseExecutionEvent({
        type: "log.delta",
        executionId: execution.id,
        sequence: 2,
        occurredAt: "2026-10-12T08:00:01.000Z",
        stepId: "load-requirements",
        delta: "Loaded.",
      }),
    ).toMatchObject({ type: "log.delta", delta: "Loaded." });
    expect(
      parseExecutionEvent({
        type: "heartbeat",
        executionId: execution.id,
        occurredAt: "2026-10-12T08:00:05.000Z",
      }),
    ).toMatchObject({ type: "heartbeat" });
  });

  it("rejects malformed and mismatched snapshot events", () => {
    expect(() =>
      parseExecutionEvent({
        type: "log.delta",
        executionId: execution.id,
        sequence: 2.5,
        occurredAt: "2026-10-12T08:00:01.000Z",
        stepId: "load-requirements",
        delta: "Loaded.",
      }),
    ).toThrow("sequence");
    expect(() =>
      parseExecutionEvent({
        type: "execution.snapshot",
        executionId: "different-execution",
        sequence: 0,
        occurredAt: "2026-10-12T08:00:00.000Z",
        execution,
      }),
    ).toThrow("executionId");
  });
});
