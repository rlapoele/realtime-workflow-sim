import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardApp } from "../src/components/DashboardApp";

const workflow = {
  id: "employee-onboarding",
  name: "Employee onboarding",
  description: "Prepare a fictional new starter.",
  category: "Employee lifecycle",
  triggerDescription: "Simulated HRIS start-date event",
  systemIds: ["hris"],
  expectedScenario: "success",
  request: {
    subject: {
      id: "person-alex-chen",
      name: "Alex Chen",
      initials: "AC",
      role: "Frontend Engineer",
      department: "Engineering",
    },
    source: "HRIS event (simulated)",
    priority: "normal",
    details: { startDate: "2026-11-03" },
  },
  steps: [
    {
      id: "load-requirements",
      name: "Load requirements",
      description: "Load the standard starter profile.",
      systemId: "hris",
      actionLabel: "Load profile",
    },
  ],
};

const pendingExecution = {
  id: "execution-1",
  workflowId: workflow.id,
  request: workflow.request,
  status: "pending",
  steps: [{ stepId: "load-requirements", status: "pending", logs: "" }],
  latestSequence: 0,
  createdAt: "2026-10-12T08:00:00.000Z",
};

const completedExecution = {
  ...pendingExecution,
  status: "success",
  steps: [
    {
      stepId: "load-requirements",
      status: "success",
      logs: "Loaded fictional requirements.",
      startedAt: "2026-10-12T08:00:00.000Z",
      completedAt: "2026-10-12T08:00:03.000Z",
      resultSummary: "Requirements loaded.",
    },
  ],
  latestSequence: 5,
  startedAt: "2026-10-12T08:00:00.000Z",
  completedAt: "2026-10-12T08:00:03.000Z",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("workflow execution UI", () => {
  it("triggers a run, locks active controls, and polls authoritative state to completion", async () => {
    let resolveLookup!: (response: Response) => void;
    const lookup = new Promise<Response>((resolve) => {
      resolveLookup = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/workflows") && init?.method === undefined) {
          return Promise.resolve(json([workflow]));
        }
        if (url.endsWith("/trigger")) return Promise.resolve(json(pendingExecution, 202));
        if (url.endsWith("/executions/execution-1")) return lookup;
        throw new Error(`Unexpected request: ${url}`);
      }),
    );
    render(<DashboardApp apiUrl="http://localhost:3000" />);

    fireEvent.click(await screen.findByRole("button", { name: "Run workflow" }));

    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Workflow" })).toBeDisabled(),
    );
    expect(screen.getByRole("button", { name: "Workflow running" })).toBeDisabled();
    expect(window.location.search).toBe("?executionId=execution-1");

    resolveLookup(json(completedExecution));

    expect(await screen.findByText("Execution succeeded")).toBeVisible();
    expect(screen.getByText("Loaded fictional requirements.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Run again" })).toBeEnabled();
  });

  it("restores retained execution state from the URL", async () => {
    window.history.replaceState(null, "", "/?executionId=execution-1");
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input);
        if (url.endsWith("/workflows")) return Promise.resolve(json([workflow]));
        if (url.endsWith("/executions/execution-1")) {
          return Promise.resolve(json(completedExecution));
        }
        throw new Error(`Unexpected request: ${url}`);
      }),
    );

    render(<DashboardApp apiUrl="http://localhost:3000" />);

    expect(await screen.findByText("Execution succeeded")).toBeVisible();
    expect(screen.getByText("Execution execution-1")).toBeVisible();
  });

  it("offers a clear recovery action for expired or restarted state", async () => {
    window.history.replaceState(null, "", "/?executionId=expired-execution");
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input);
        if (url.endsWith("/workflows")) return Promise.resolve(json([workflow]));
        if (url.endsWith("/executions/expired-execution")) {
          return Promise.resolve(
            json({ error: { code: "not_found", message: "Execution was not found." } }, 404),
          );
        }
        throw new Error(`Unexpected request: ${url}`);
      }),
    );

    render(<DashboardApp apiUrl="http://localhost:3000" />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("This execution is no longer available");
    fireEvent.click(screen.getByRole("button", { name: "Start a new run" }));

    expect(window.location.search).toBe("");
    expect(screen.getByRole("button", { name: "Run workflow" })).toBeEnabled();
  });
});
