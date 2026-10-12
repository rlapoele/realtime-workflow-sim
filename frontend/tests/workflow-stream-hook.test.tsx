import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ExecutionEvent, WorkflowExecution } from "../../shared/types";
import {
  executionQueryKey,
  useWorkflowStream,
} from "../src/hooks/useWorkflowStream";

const apiUrl = "http://localhost:3000";
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

class FakeEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  static instances: FakeEventSource[] = [];

  readonly url: string;
  readyState = FakeEventSource.CONNECTING;
  closed = false;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  private readonly listeners = new Map<string, Set<EventListener>>();

  constructor(url: string | URL) {
    this.url = String(url);
    FakeEventSource.instances.push(this);
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
    this.readyState = FakeEventSource.CLOSED;
  }

  open(): void {
    this.readyState = FakeEventSource.OPEN;
    this.onopen?.(new Event("open"));
  }

  fail(reconnecting = true): void {
    this.readyState = reconnecting ? FakeEventSource.CONNECTING : FakeEventSource.CLOSED;
    this.onerror?.(new Event("error"));
  }

  emit(event: ExecutionEvent): void {
    const message = new MessageEvent(event.type, { data: JSON.stringify(event) });
    for (const listener of this.listeners.get(event.type) ?? []) listener(message);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function Harness({ executionId }: { readonly executionId: string }) {
  const query = useQuery({
    queryKey: executionQueryKey(apiUrl, executionId),
    queryFn: () => Promise.resolve(execution),
    enabled: false,
  });
  const connection = useWorkflowStream({
    apiUrl,
    executionId,
    executionStatus: query.data?.status,
  });
  return (
    <>
      <p>{connection}</p>
      <p>{query.data?.steps[0]?.logs ?? "no logs"}</p>
    </>
  );
}

function renderHarness(
  queryClient: QueryClient,
  child: ReactNode = <Harness executionId={execution.id} />,
) {
  return render(<QueryClientProvider client={queryClient}>{child}</QueryClientProvider>);
}

function createQueryClient(): QueryClient {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(executionQueryKey(apiUrl, execution.id), execution);
  return queryClient;
}

describe("useWorkflowStream", () => {
  it("keeps the same connection when an execution moves from pending to running", async () => {
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource as unknown as typeof EventSource);
    const queryClient = createQueryClient();
    queryClient.setQueryData(executionQueryKey(apiUrl, execution.id), {
      ...execution,
      status: "pending",
      latestSequence: 0,
      startedAt: undefined,
      steps: [{ ...execution.steps[0]!, status: "pending", startedAt: undefined }],
    });
    vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    renderHarness(queryClient);
    const source = FakeEventSource.instances[0]!;

    source.emit({
      type: "execution.status",
      executionId: execution.id,
      sequence: 1,
      occurredAt: "2026-10-12T08:00:00.000Z",
      status: "running",
      startedAt: "2026-10-12T08:00:00.000Z",
    });

    await waitFor(() =>
      expect(
        queryClient.getQueryData<WorkflowExecution>(executionQueryKey(apiUrl, execution.id))?.status,
      ).toBe("running"),
    );
    expect(FakeEventSource.instances).toHaveLength(1);
    expect(source.closed).toBe(false);
  });

  it("applies log deltas without refetching, ignores heartbeats, and closes after completion", async () => {
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource as unknown as typeof EventSource);
    const queryClient = createQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    renderHarness(queryClient);

    const source = FakeEventSource.instances[0]!;
    expect(source.url).toBe(`${apiUrl}/workflows/stream?executionId=execution-1`);
    source.open();
    expect(await screen.findByText("connected")).toBeVisible();

    source.emit({
      type: "heartbeat",
      executionId: execution.id,
      occurredAt: "2026-10-12T08:00:05.000Z",
    });
    source.emit({
      type: "log.delta",
      executionId: execution.id,
      sequence: 2,
      occurredAt: "2026-10-12T08:00:01.000Z",
      stepId: "load-requirements",
      delta: "Loaded fictional requirements.",
    });

    expect(await screen.findByText("Loaded fictional requirements.")).toBeVisible();
    expect(invalidate).not.toHaveBeenCalled();

    source.emit({
      type: "execution.status",
      executionId: execution.id,
      sequence: 3,
      occurredAt: "2026-10-12T08:00:03.000Z",
      status: "success",
      completedAt: "2026-10-12T08:00:03.000Z",
    });

    expect(await screen.findByText("completed")).toBeVisible();
    expect(source.closed).toBe(true);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: executionQueryKey(apiUrl, execution.id),
      exact: true,
    });
  });

  it("recovers a sequence gap from an authoritative snapshot before applying newer events", async () => {
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource as unknown as typeof EventSource);
    const recovered: WorkflowExecution = {
      ...execution,
      latestSequence: 3,
      steps: [{ ...execution.steps[0]!, logs: "Recovered authoritative log" }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(recovered)));
    const queryClient = createQueryClient();
    renderHarness(queryClient);

    const source = FakeEventSource.instances[0]!;
    source.open();
    source.emit({
      type: "log.delta",
      executionId: execution.id,
      sequence: 3,
      occurredAt: "2026-10-12T08:00:02.000Z",
      stepId: "load-requirements",
      delta: "Must not be duplicated",
    });

    expect(await screen.findByText("Recovered authoritative log")).toBeVisible();
    expect(screen.queryByText(/Must not be duplicated/)).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${apiUrl}/executions/execution-1`);
  });

  it("reports reconnecting errors and mirrors setup with cleanup under Strict Mode", async () => {
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource as unknown as typeof EventSource);
    const queryClient = createQueryClient();
    const view = renderHarness(
      queryClient,
      <StrictMode>
        <Harness executionId={execution.id} />
      </StrictMode>,
    );

    expect(FakeEventSource.instances.filter((instance) => !instance.closed)).toHaveLength(1);
    const source = FakeEventSource.instances.find((instance) => !instance.closed)!;
    source.open();
    source.fail(true);
    expect(await screen.findByText("reconnecting")).toBeVisible();

    view.unmount();
    expect(FakeEventSource.instances.every((instance) => instance.closed)).toBe(true);
  });

  it("closes the old source and opens a scoped source when the execution ID changes", async () => {
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource as unknown as typeof EventSource);
    const queryClient = createQueryClient();
    const view = renderHarness(queryClient);
    const first = FakeEventSource.instances[0]!;

    const secondExecution = { ...execution, id: "execution-2" };
    queryClient.setQueryData(executionQueryKey(apiUrl, secondExecution.id), secondExecution);
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <Harness executionId={secondExecution.id} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(2));
    expect(first.closed).toBe(true);
    expect(FakeEventSource.instances[1]?.url).toContain("executionId=execution-2");
  });
});
