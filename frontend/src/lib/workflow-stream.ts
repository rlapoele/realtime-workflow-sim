import type { ExecutionEvent, WorkflowExecution } from "../../../shared/types";

export type ReconciliationResult = {
  readonly kind: "applied" | "gap" | "ignored";
  readonly execution: WorkflowExecution | undefined;
};

export function reconcileExecutionEvent(
  current: WorkflowExecution | undefined,
  event: ExecutionEvent,
): ReconciliationResult {
  if (event.type === "heartbeat" || (current !== undefined && event.executionId !== current.id)) {
    return { kind: "ignored", execution: current };
  }

  if (event.type === "execution.snapshot") {
    if (current !== undefined && event.sequence < current.latestSequence) {
      return { kind: "ignored", execution: current };
    }
    return { kind: "applied", execution: event.execution };
  }

  if (current === undefined || event.sequence > current.latestSequence + 1) {
    return { kind: "gap", execution: current };
  }
  if (event.sequence <= current.latestSequence) {
    return { kind: "ignored", execution: current };
  }

  if (event.type === "execution.status") {
    return {
      kind: "applied",
      execution: {
        ...current,
        status: event.status,
        latestSequence: event.sequence,
        ...(event.startedAt === undefined ? {} : { startedAt: event.startedAt }),
        ...(event.completedAt === undefined ? {} : { completedAt: event.completedAt }),
        ...(event.failureReason === undefined ? {} : { failureReason: event.failureReason }),
      },
    };
  }

  const stepIndex = current.steps.findIndex((step) => step.stepId === event.stepId);
  if (stepIndex === -1) return { kind: "gap", execution: current };

  const steps = [...current.steps];
  const step = steps[stepIndex]!;
  if (event.type === "log.delta") {
    steps[stepIndex] = { ...step, logs: step.logs + event.delta };
  } else {
    steps[stepIndex] = {
      ...step,
      status: event.status,
      ...(event.startedAt === undefined ? {} : { startedAt: event.startedAt }),
      ...(event.completedAt === undefined ? {} : { completedAt: event.completedAt }),
      ...(event.resultSummary === undefined ? {} : { resultSummary: event.resultSummary }),
      ...(event.failureReason === undefined ? {} : { failureReason: event.failureReason }),
    };
  }

  return {
    kind: "applied",
    execution: { ...current, steps, latestSequence: event.sequence },
  };
}
