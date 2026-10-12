import { describe, expect, it, vi } from "vitest";

import {
  ExecutionApiError,
  fetchExecution,
  triggerWorkflow,
} from "../src/lib/executions";

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
