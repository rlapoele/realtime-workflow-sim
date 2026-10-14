import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  SignalSlashIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import type { WorkflowExecution } from "../../../shared/types";
import type { AppIcon } from "@/components/icons/types";
import { StatusBadge } from "@/components/StatusBadge";
import type { ConnectionState } from "@/hooks/useWorkflowStream";

interface StatusPresentation {
  readonly icon: AppIcon;
  readonly label: string;
  readonly tone: string;
}

const executionPresentation: Record<WorkflowExecution["status"], StatusPresentation> = {
  pending: { icon: ClockIcon, label: "Execution queued", tone: "text-[var(--status-pending)]" },
  running: { icon: ArrowPathIcon, label: "Execution running", tone: "text-[var(--status-running)]" },
  success: {
    icon: CheckCircleIcon,
    label: "Execution succeeded",
    tone: "text-[var(--status-success)]",
  },
  failed: {
    icon: ExclamationTriangleIcon,
    label: "Execution failed",
    tone: "text-[var(--status-failure)]",
  },
};

const connectionPresentation: Record<ConnectionState, StatusPresentation> = {
  connecting: { icon: ArrowPathIcon, label: "Connecting", tone: "text-[var(--status-running)]" },
  connected: { icon: SignalIcon, label: "Connected", tone: "text-[var(--status-success)]" },
  reconnecting: {
    icon: ArrowPathIcon,
    label: "Reconnecting",
    tone: "text-[var(--status-warning)]",
  },
  disconnected: {
    icon: SignalSlashIcon,
    label: "Disconnected",
    tone: "text-[var(--status-failure)]",
  },
  completed: { icon: CheckCircleIcon, label: "Completed", tone: "text-[var(--status-success)]" },
};

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds}s`;
}

function useElapsedDuration(execution: WorkflowExecution): string {
  const active = execution.status === "pending" || execution.status === "running";
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || execution.startedAt === undefined) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [active, execution.startedAt]);

  if (execution.startedAt === undefined) return "—";
  const end = execution.completedAt === undefined ? now : Date.parse(execution.completedAt);
  return formatDuration(end - Date.parse(execution.startedAt));
}

function Fact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-[var(--muted-foreground)]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[var(--foreground)]">{value}</dd>
    </div>
  );
}

export function ExecutionSummary({
  connectionState,
  execution,
}: {
  readonly connectionState: ConnectionState;
  readonly execution: WorkflowExecution;
}) {
  const status = executionPresentation[execution.status];
  const connection = connectionPresentation[connectionState];
  const StatusIcon = status.icon;
  const completedSteps = execution.steps.filter(
    (step) => step.status === "success" || step.status === "failed",
  ).length;
  const elapsed = useElapsedDuration(execution);

  return (
    <section
      aria-labelledby="execution-status-title"
      className="rounded-[var(--radius-panel)] border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-panel)] overflow-hidden"
    >
      <div className="flex flex-col gap-4 border-b border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div aria-atomic="true" aria-live="polite" className="flex items-center gap-3" role="status">
          <span className={`grid size-10 place-items-center rounded-full bg-[var(--surface-subtle)] ${status.tone}`}>
            <StatusIcon
              aria-hidden="true"
              className={`size-5 ${execution.status === "running" ? "animate-spin motion-reduce:animate-none" : ""}`}
            />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
              Execution status
            </p>
            <h3 className={`mt-0.5 text-lg font-semibold ${status.tone}`} id="execution-status-title">
              {status.label}
            </h3>
          </div>
        </div>
        <StatusBadge
          aria-atomic="true"
          aria-live="polite"
          className={`min-h-9 self-start px-3 text-sm ${connection.tone}`}
          icon={connection.icon}
          role="status"
          spin={connectionState === "connecting" || connectionState === "reconnecting"}
          variant="surface"
        >
          {connection.label}
        </StatusBadge>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 px-4 py-4 sm:grid-cols-4 sm:px-5">
        <Fact label="Steps complete" value={`${completedSteps} of ${execution.steps.length}`} />
        <Fact label="Elapsed" value={elapsed} />
        <div className="col-span-2 min-w-0 sm:col-span-2">
          <dt className="text-xs font-medium text-[var(--muted-foreground)]">Execution ID</dt>
          <dd className="mt-1 break-all font-mono text-xs font-semibold text-[var(--foreground)]">
            Execution {execution.id}
          </dd>
        </div>
      </dl>
      <progress
        aria-label="Workflow completion"
        className="execution-progress block h-1.5 w-full"
        max={execution.steps.length}
        value={completedSteps}
      />
      {execution.failureReason === undefined ? null : (
        <p className="border-t border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--status-failure)] sm:px-5">
          {execution.failureReason}
        </p>
      )}
    </section>
  );
}
