import type {
  ExecutionStatus,
  StepExecution,
  StepStatus,
  WorkflowExecution,
} from "./types.js";
import { ContractValidationError, parseRequestContext } from "./workflow-schema.js";

function fail(path: string, expectation: string): never {
  throw new ContractValidationError(`${path}: ${expectation}`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail(path, "expected an object");
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, path: string, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && value.trim() === "")) {
    return fail(path, allowEmpty ? "expected a string" : "expected a non-empty string");
  }
  return value;
}

function optionalString(
  source: Record<string, unknown>,
  key: string,
  path: string,
): string | undefined {
  return source[key] === undefined ? undefined : string(source[key], `${path}.${key}`);
}

function executionStatus(value: unknown, path: string): ExecutionStatus {
  if (!["pending", "running", "success", "failed"].includes(value as string)) {
    return fail(path, "expected a valid execution status");
  }
  return value as ExecutionStatus;
}

function stepStatus(value: unknown, path: string): StepStatus {
  if (!["pending", "running", "success", "failed", "skipped"].includes(value as string)) {
    return fail(path, "expected a valid step status");
  }
  return value as StepStatus;
}

function parseStepExecution(value: unknown, path: string): StepExecution {
  const source = record(value, path);
  const startedAt = optionalString(source, "startedAt", path);
  const completedAt = optionalString(source, "completedAt", path);
  const resultSummary = optionalString(source, "resultSummary", path);
  const failureReason = optionalString(source, "failureReason", path);

  return {
    stepId: string(source.stepId, `${path}.stepId`),
    status: stepStatus(source.status, `${path}.status`),
    logs: string(source.logs, `${path}.logs`, true),
    ...(startedAt === undefined ? {} : { startedAt }),
    ...(completedAt === undefined ? {} : { completedAt }),
    ...(resultSummary === undefined ? {} : { resultSummary }),
    ...(failureReason === undefined ? {} : { failureReason }),
  };
}

export function parseWorkflowExecution(
  value: unknown,
  path = "execution",
): WorkflowExecution {
  const source = record(value, path);
  if (!Array.isArray(source.steps) || source.steps.length === 0) {
    return fail(`${path}.steps`, "expected a non-empty array");
  }
  if (
    typeof source.latestSequence !== "number" ||
    !Number.isInteger(source.latestSequence) ||
    source.latestSequence < 0
  ) {
    return fail(`${path}.latestSequence`, "expected a non-negative integer");
  }

  const startedAt = optionalString(source, "startedAt", path);
  const completedAt = optionalString(source, "completedAt", path);
  const failureReason = optionalString(source, "failureReason", path);

  return {
    id: string(source.id, `${path}.id`),
    workflowId: string(source.workflowId, `${path}.workflowId`),
    request: parseRequestContext(source.request, `${path}.request`),
    status: executionStatus(source.status, `${path}.status`),
    steps: source.steps.map((step, index) =>
      parseStepExecution(step, `${path}.steps[${index}]`),
    ),
    latestSequence: source.latestSequence,
    createdAt: string(source.createdAt, `${path}.createdAt`),
    ...(startedAt === undefined ? {} : { startedAt }),
    ...(completedAt === undefined ? {} : { completedAt }),
    ...(failureReason === undefined ? {} : { failureReason }),
  };
}
