import type { WorkflowDefinition } from "../../../shared/types";
import { parseWorkflowDefinitions } from "../../../shared/workflow-schema";

export async function fetchWorkflows(apiUrl: string): Promise<readonly WorkflowDefinition[]> {
  const response = await fetch(`${apiUrl}/workflows`);
  if (!response.ok) {
    throw new Error(`Workflow catalogue request failed with HTTP ${response.status}`);
  }

  return parseWorkflowDefinitions(await response.json());
}
