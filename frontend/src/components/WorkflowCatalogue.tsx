import { CircleStackIcon, UserIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { WorkflowExecution } from "../../../shared/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ExecutionApiError,
  fetchExecution,
  triggerWorkflow,
} from "@/lib/executions";
import {
  executionQueryKey,
  preferNewerExecution,
  useWorkflowStream,
} from "@/hooks/useWorkflowStream";
import { fetchWorkflows } from "@/lib/workflows";
import { WorkflowControls } from "./WorkflowControls";
import { WorkflowDetail } from "./WorkflowDetail";

export interface WorkflowCatalogueProps {
  readonly apiUrl: string;
}

function isActive(execution: WorkflowExecution | undefined): boolean {
  return execution?.status === "pending" || execution?.status === "running";
}

function setExecutionUrl(executionId: string | null): void {
  const url = new URL(window.location.href);
  if (executionId === null) url.searchParams.delete("executionId");
  else url.searchParams.set("executionId", executionId);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

export function WorkflowCatalogue({ apiUrl }: WorkflowCatalogueProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>();
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [urlReady, setUrlReady] = useState(false);

  useEffect(() => {
    setExecutionId(new URL(window.location.href).searchParams.get("executionId"));
    setUrlReady(true);
  }, []);

  const catalogueQuery = useQuery({
    queryKey: ["workflows", apiUrl],
    queryFn: () => fetchWorkflows(apiUrl),
    retry: false,
  });
  const executionQuery = useQuery({
    queryKey: executionQueryKey(apiUrl, executionId ?? "inactive"),
    queryFn: () => fetchExecution(apiUrl, executionId!),
    enabled: urlReady && executionId !== null,
    retry: false,
    structuralSharing: (current, incoming) =>
      preferNewerExecution(
        current as WorkflowExecution | undefined,
        incoming as WorkflowExecution,
      ),
  });
  const triggerMutation = useMutation({
    mutationFn: (workflowId: string) => triggerWorkflow(apiUrl, workflowId),
    onSuccess: (execution) => {
      queryClient.setQueryData(executionQueryKey(apiUrl, execution.id), execution);
      setExecutionId(execution.id);
      setExecutionUrl(execution.id);
    },
  });

  const execution = executionQuery.data;
  const connectionState = useWorkflowStream({
    apiUrl,
    executionId,
    executionStatus: execution?.status,
  });
  useEffect(() => {
    if (execution !== undefined) setSelectedId(execution.workflowId);
  }, [execution]);

  const clearExecution = () => {
    if (executionId !== null) {
      queryClient.removeQueries({ queryKey: executionQueryKey(apiUrl, executionId), exact: true });
    }
    setExecutionId(null);
    setExecutionUrl(null);
    triggerMutation.reset();
  };

  if (catalogueQuery.isPending) {
    return (
      <div
        aria-busy="true"
        className="rounded-panel border border-border bg-surface p-8 text-center shadow-panel"
        role="status"
      >
        <CircleStackIcon
          aria-hidden="true"
          className="mx-auto size-7 animate-pulse text-primary motion-reduce:animate-none"
        />
        <p className="mt-3 font-medium">Loading workflows…</p>
      </div>
    );
  }

  if (catalogueQuery.isError) {
    return (
      <Alert role="alert" variant="destructive">
        <AlertTitle>Workflow catalogue unavailable.</AlertTitle>
        <AlertDescription>Check that the local API is running and try again.</AlertDescription>
      </Alert>
    );
  }

  if (catalogueQuery.data.length === 0) {
    return (
      <div className="rounded-panel border border-border bg-surface p-8 text-center shadow-panel">
        <UserIcon aria-hidden="true" className="mx-auto size-7 text-muted-foreground" />
        <p className="mt-3 font-semibold">No workflows are available.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a validated workflow seed to populate this catalogue.
        </p>
      </div>
    );
  }

  const selectedWorkflow =
    catalogueQuery.data.find((workflow) => workflow.id === selectedId) ??
    catalogueQuery.data[0]!;
  const shownExecution = execution?.workflowId === selectedWorkflow.id ? execution : undefined;
  const active = isActive(shownExecution);
  const missingExecution =
    executionQuery.error instanceof ExecutionApiError && executionQuery.error.status === 404;
  const terminalButtonLabel = active
    ? "Workflow running"
    : shownExecution === undefined
      ? "Run workflow"
      : "Run again";
  return (
    <>
      <WorkflowControls
        active={active}
        buttonLabel={terminalButtonLabel}
        isStarting={triggerMutation.isPending}
        onChange={(workflowId) => {
          setSelectedId(workflowId);
          clearExecution();
        }}
        onRun={() => triggerMutation.mutate(selectedWorkflow.id)}
        selectedId={selectedWorkflow.id}
        workflows={catalogueQuery.data}
      />

      {missingExecution ? (
        <Alert className="mt-5" role="alert" variant="warning">
          <AlertTitle>This execution is no longer available.</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            The local API may have restarted or removed older completed runs.
          </AlertDescription>
          <Button className="mt-4" onClick={clearExecution} variant="warning">
            Start a new run
          </Button>
        </Alert>
      ) : null}

      {triggerMutation.isError ? (
        <Alert className="mt-5" role="alert" variant="destructive">
          <AlertTitle>The workflow could not be started.</AlertTitle>
          <AlertDescription>Check that the local API is running and try again.</AlertDescription>
        </Alert>
      ) : null}

      <WorkflowDetail
        connectionState={connectionState}
        execution={shownExecution}
        workflow={selectedWorkflow}
      />
    </>
  );
}
