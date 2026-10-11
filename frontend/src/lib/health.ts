import type { HealthResponse } from "../../../shared/types";

function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return candidate.service === "agentflow-backend" && candidate.status === "ok";
}

export async function fetchHealth(apiUrl: string): Promise<HealthResponse> {
  const response = await fetch(`${apiUrl}/health`);

  if (!response.ok) {
    throw new Error(`Health request failed with HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isHealthResponse(payload)) {
    throw new Error("Health response did not match the shared contract");
  }

  return payload;
}
