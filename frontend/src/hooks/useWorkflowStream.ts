import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { parseExecutionEvent } from "../../../shared/execution-schema";
import type {
  ExecutionEvent,
  ExecutionStatus,
  WorkflowExecution,
} from "../../../shared/types";
import { fetchExecution } from "../lib/executions";
import { reconcileExecutionEvent } from "../lib/workflow-stream";

export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "completed";

const eventTypes = [
  "execution.snapshot",
  "execution.status",
  "step.status",
  "log.delta",
  "heartbeat",
] as const;

export function executionQueryKey(apiUrl: string, executionId: string): QueryKey {
  return ["execution", apiUrl, executionId] as const;
}

export function preferNewerExecution(
  current: WorkflowExecution | undefined,
  incoming: WorkflowExecution,
): WorkflowExecution {
  return current !== undefined && current.latestSequence > incoming.latestSequence
    ? current
    : incoming;
}

function isTerminal(status: ExecutionStatus | undefined): boolean {
  return status === "success" || status === "failed";
}

export function useWorkflowStream({
  apiUrl,
  executionId,
  executionStatus,
}: {
  readonly apiUrl: string;
  readonly executionId: string | null;
  readonly executionStatus: ExecutionStatus | undefined;
}): ConnectionState {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const terminal = isTerminal(executionStatus);

  useEffect(() => {
    if (executionId === null) {
      setConnectionState("disconnected");
      return undefined;
    }
    if (terminal) {
      setConnectionState("completed");
      return undefined;
    }

    const queryKey = executionQueryKey(apiUrl, executionId);
    const source = new EventSource(
      `${apiUrl}/workflows/stream?executionId=${encodeURIComponent(executionId)}`,
    );
    const queuedEvents: ExecutionEvent[] = [];
    let disposed = false;
    let recovering = false;

    setConnectionState("connecting");

    const updateCache = (event: ExecutionEvent): "applied" | "gap" | "ignored" => {
      const current = queryClient.getQueryData<WorkflowExecution>(queryKey);
      const result = reconcileExecutionEvent(current, event);
      if (result.kind === "applied" && result.execution !== undefined) {
        queryClient.setQueryData<WorkflowExecution>(queryKey, result.execution);
      }
      return result.kind;
    };

    const recover = async (): Promise<void> => {
      if (recovering || disposed) return;
      recovering = true;
      setConnectionState("reconnecting");
      try {
        const snapshot = await fetchExecution(apiUrl, executionId);
        if (disposed) return;
        queryClient.setQueryData<WorkflowExecution>(queryKey, (current) =>
          preferNewerExecution(current, snapshot),
        );

        queuedEvents.sort((left, right) => {
          const leftSequence = left.type === "heartbeat" ? Number.MAX_SAFE_INTEGER : left.sequence;
          const rightSequence = right.type === "heartbeat" ? Number.MAX_SAFE_INTEGER : right.sequence;
          return leftSequence - rightSequence;
        });
        while (queuedEvents.length > 0) {
          const queued = queuedEvents.shift()!;
          const result = updateCache(queued);
          if (result === "gap") {
            queuedEvents.unshift(queued);
            break;
          }
        }
        setConnectionState("connected");
      } catch {
        if (!disposed) setConnectionState("disconnected");
      } finally {
        recovering = false;
      }
    };

    const handleEvent = (event: ExecutionEvent): void => {
      if (event.executionId !== executionId || disposed) return;
      if (event.type === "heartbeat") {
        setConnectionState("connected");
        return;
      }
      if (recovering) {
        queuedEvents.push(event);
        return;
      }

      const result = updateCache(event);
      if (result === "gap") {
        queuedEvents.push(event);
        void recover();
        return;
      }
      if (result === "applied") {
        setConnectionState("connected");
        if (event.type === "execution.status" || event.type === "step.status") {
          void queryClient.invalidateQueries({ queryKey, exact: true });
        }
      }
    };

    const messageListener: EventListener = (message) => {
      try {
        const raw: unknown = JSON.parse((message as MessageEvent<string>).data);
        handleEvent(parseExecutionEvent(raw));
      } catch {
        void recover();
      }
    };

    for (const type of eventTypes) source.addEventListener(type, messageListener);
    source.onopen = () => {
      if (!disposed) setConnectionState("connected");
    };
    source.onerror = () => {
      if (!disposed) {
        setConnectionState(
          source.readyState === EventSource.CLOSED ? "disconnected" : "reconnecting",
        );
      }
    };

    return () => {
      disposed = true;
      queuedEvents.length = 0;
      for (const type of eventTypes) source.removeEventListener(type, messageListener);
      source.close();
    };
  }, [apiUrl, executionId, queryClient, terminal]);

  return terminal ? "completed" : connectionState;
}
