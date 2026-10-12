import type { ApiError, WorkflowExecution } from "../../../shared/types";
import { parseWorkflowExecution } from "../../../shared/execution-schema";

export class ExecutionApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ExecutionApiError";
  }
}

function parseApiError(value: unknown): ApiError | undefined {
  if (typeof value !== "object" || value === null || !("error" in value)) return undefined;
  const error = (value as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return undefined;
  const { code, message } = error as { code?: unknown; message?: unknown };
  if (typeof code !== "string" || typeof message !== "string") return undefined;
  return { error: { code, message } };
}

async function readExecution(response: Response): Promise<WorkflowExecution> {
  const body: unknown = await response.json();
  if (!response.ok) {
    const apiError = parseApiError(body);
    throw new ExecutionApiError(
      apiError?.error.message ?? `Execution request failed with HTTP ${response.status}`,
      response.status,
      apiError?.error.code ?? "request_failed",
    );
  }
  return parseWorkflowExecution(body);
}

export async function triggerWorkflow(
  apiUrl: string,
  workflowId: string,
): Promise<WorkflowExecution> {
  const response = await fetch(
    `${apiUrl}/workflows/${encodeURIComponent(workflowId)}/trigger`,
    { method: "POST" },
  );
  return readExecution(response);
}

export async function fetchExecution(
  apiUrl: string,
  executionId: string,
): Promise<WorkflowExecution> {
  const response = await fetch(`${apiUrl}/executions/${encodeURIComponent(executionId)}`);
  return readExecution(response);
}
