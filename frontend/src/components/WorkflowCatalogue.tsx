import { CircleStackIcon, PlayIcon, UserIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { WorkflowDefinition, WorkflowExecution } from "../../../shared/types";
import {
  ExecutionApiError,
  fetchExecution,
  triggerWorkflow,
} from "../lib/executions";
import { fetchWorkflows } from "../lib/workflows";
import { WorkflowDetail } from "./WorkflowDetail";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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

function WorkflowPicker({
  disabled,
  onChange,
  value,
  workflows,
}: {
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
  readonly value: string;
  readonly workflows: readonly WorkflowDefinition[];
}) {
  const items = workflows.map((workflow) => ({ label: workflow.name, value: workflow.id }));

  return (
    <div className="min-w-0 flex-1">
      <label className="mb-2 block text-sm font-semibold" id="workflow-label">
        Workflow
      </label>
      <Select
        disabled={disabled}
        items={items}
        onValueChange={(nextValue) => {
          if (typeof nextValue === "string") onChange(nextValue);
        }}
        value={value}
      >
        <SelectTrigger aria-labelledby="workflow-label">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {workflows.map((workflow) => (
            <SelectItem key={workflow.id} value={workflow.id}>
              {workflow.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
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
    queryKey: ["execution", apiUrl, executionId],
    queryFn: () => fetchExecution(apiUrl, executionId!),
    enabled: urlReady && executionId !== null,
    retry: false,
    refetchInterval: (query) =>
      isActive(query.state.data as WorkflowExecution | undefined) ? 250 : false,
  });
  const triggerMutation = useMutation({
    mutationFn: (workflowId: string) => triggerWorkflow(apiUrl, workflowId),
    onSuccess: (execution) => {
      queryClient.setQueryData(["execution", apiUrl, execution.id], execution);
      setExecutionId(execution.id);
      setExecutionUrl(execution.id);
    },
  });

  const execution = executionQuery.data;
  useEffect(() => {
    if (execution !== undefined) setSelectedId(execution.workflowId);
  }, [execution]);

  const clearExecution = () => {
    if (executionId !== null) {
      queryClient.removeQueries({ queryKey: ["execution", apiUrl, executionId], exact: true });
    }
    setExecutionId(null);
    setExecutionUrl(null);
    triggerMutation.reset();
  };

  if (catalogueQuery.isPending) {
    return (
      <div
        className="rounded-xl border border-[var(--border)] bg-white p-8 text-center shadow-sm"
        role="status"
      >
        <CircleStackIcon
          aria-hidden="true"
          className="mx-auto size-7 animate-pulse text-emerald-700 motion-reduce:animate-none"
        />
        <p className="mt-3 font-medium">Loading workflows…</p>
      </div>
    );
  }

  if (catalogueQuery.isError) {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 p-5 text-[var(--failure)]"
        role="alert"
      >
        <p className="font-semibold">Workflow catalogue unavailable.</p>
        <p className="mt-1 text-sm">Check that the local API is running and try again.</p>
      </div>
    );
  }

  if (catalogueQuery.data.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <UserIcon aria-hidden="true" className="mx-auto size-7 text-slate-500" />
        <p className="mt-3 font-semibold">No workflows are available.</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
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
  const buttonLabel = triggerMutation.isPending ? "Starting workflow" : terminalButtonLabel;

  return (
    <>
      <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm sm:flex-row sm:items-end">
        <WorkflowPicker
          disabled={active}
          onChange={(workflowId) => {
            setSelectedId(workflowId);
            clearExecution();
          }}
          value={selectedWorkflow.id}
          workflows={catalogueQuery.data}
        />
        <button
          aria-label={buttonLabel}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-700/25 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={active || triggerMutation.isPending}
          onClick={() => triggerMutation.mutate(selectedWorkflow.id)}
          type="button"
        >
          <PlayIcon aria-hidden="true" className="size-4" />
          {triggerMutation.isPending ? "Starting…" : terminalButtonLabel}
        </button>
        <div className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm text-emerald-900 sm:max-w-xs">
          Simulation only. No external systems are contacted.
        </div>
      </div>

      {missingExecution ? (
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-5" role="alert">
          <p className="font-semibold">This execution is no longer available.</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            The local API may have restarted or removed older completed runs.
          </p>
          <button
            className="mt-4 rounded-lg border border-amber-700 px-4 py-2 text-sm font-bold text-amber-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-amber-700/25"
            onClick={clearExecution}
            type="button"
          >
            Start a new run
          </button>
        </div>
      ) : null}

      {triggerMutation.isError ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5" role="alert">
          <p className="font-semibold text-[var(--failure)]">The workflow could not be started.</p>
          <p className="mt-1 text-sm">Check that the local API is running and try again.</p>
        </div>
      ) : null}

      <WorkflowDetail execution={shownExecution} workflow={selectedWorkflow} />
    </>
  );
}
