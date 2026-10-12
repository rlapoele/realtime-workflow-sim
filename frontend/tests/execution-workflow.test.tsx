import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardApp } from "../src/components/DashboardApp";
import type {
  ExecutionEvent,
  WorkflowDefinition,
  WorkflowExecution,
} from "../../shared/types";

class ControllableEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  static instances: ControllableEventSource[] = [];
  readonly url: string;
  readyState = ControllableEventSource.CONNECTING;
  closed = false;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  private readonly listeners = new Map<string, Set<EventListener>>();

  constructor(url: string | URL) {
    this.url = String(url);
    ControllableEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  close(): void {
    this.closed = true;
    this.readyState = ControllableEventSource.CLOSED;
  }

  emit(event: ExecutionEvent): void {
    const message = new MessageEvent(event.type, { data: JSON.stringify(event) });
    for (const listener of this.listeners.get(event.type) ?? []) listener(message);
  }
}

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
} satisfies WorkflowDefinition;

const pendingExecution = {
  id: "execution-1",
  workflowId: workflow.id,
  request: workflow.request,
  status: "pending",
  steps: [{ stepId: "load-requirements", status: "pending", logs: "" }],
  latestSequence: 0,
  createdAt: "2026-10-12T08:00:00.000Z",
} satisfies WorkflowExecution;

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
} satisfies WorkflowExecution;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("workflow execution UI", () => {
  it("triggers a run, locks active controls, and streams authoritative state to completion", async () => {
    ControllableEventSource.instances = [];
    vi.stubGlobal("EventSource", ControllableEventSource as unknown as typeof EventSource);
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/workflows") && init?.method === undefined) {
          return Promise.resolve(json([workflow]));
        }
        if (url.endsWith("/trigger")) return Promise.resolve(json(pendingExecution, 202));
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

    await waitFor(() => expect(ControllableEventSource.instances).toHaveLength(1));
    act(() => {
      ControllableEventSource.instances[0]!.emit({
        type: "execution.snapshot",
        executionId: completedExecution.id,
        sequence: completedExecution.latestSequence,
        occurredAt: completedExecution.completedAt,
        execution: completedExecution,
      });
    });

    expect(await screen.findByText("Execution succeeded")).toBeVisible();
    expect(screen.getByText("Loaded fictional requirements.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Run again" })).toBeEnabled();
    expect(ControllableEventSource.instances[0]?.closed).toBe(true);
  });

  it("does not let an older HTTP response replace newer streamed state", async () => {
    ControllableEventSource.instances = [];
    vi.stubGlobal("EventSource", ControllableEventSource as unknown as typeof EventSource);
    window.history.replaceState(null, "", "/?executionId=execution-1");
    let resolveLookup!: (response: Response) => void;
    const lookup = new Promise<Response>((resolve) => {
      resolveLookup = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input);
        if (url.endsWith("/workflows")) return Promise.resolve(json([workflow]));
        if (url.endsWith("/executions/execution-1")) return lookup;
        throw new Error(`Unexpected request: ${url}`);
      }),
    );
    render(<DashboardApp apiUrl="http://localhost:3000" />);

    await waitFor(() => expect(ControllableEventSource.instances).toHaveLength(1));
    const streamed = {
      ...pendingExecution,
      status: "running" as const,
      latestSequence: 1,
      startedAt: "2026-10-12T08:00:00.000Z",
      steps: [
        {
          ...pendingExecution.steps[0]!,
          status: "running" as const,
          startedAt: "2026-10-12T08:00:00.000Z",
          logs: "Streamed exactly once.",
        },
      ],
    } satisfies WorkflowExecution;
    act(() => {
      ControllableEventSource.instances[0]!.emit({
        type: "execution.snapshot",
        executionId: streamed.id,
        sequence: streamed.latestSequence,
        occurredAt: streamed.startedAt,
        execution: streamed,
      });
    });
    expect(await screen.findByText("Streamed exactly once.")).toBeVisible();

    resolveLookup(json(pendingExecution));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Streamed exactly once.")).toBeVisible();
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
