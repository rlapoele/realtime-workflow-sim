import {
  ArrowPathIcon,
  BellAlertIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClockIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  FingerPrintIcon,
  InboxArrowDownIcon,
  MinusCircleIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import type {
  StepDefinition,
  StepExecution,
  WorkflowDefinition,
  WorkflowExecution,
} from "../../../shared/types";
import type { AppIcon } from "@/components/icons/types";
import { StatusBadge } from "@/components/StatusBadge";
import type { BadgeProps } from "@/components/ui/badge";
import type { ConnectionState } from "@/hooks/useWorkflowStream";
import { ExecutionConsole } from "./ExecutionConsole";
import { ExecutionSummary } from "./ExecutionSummary";
import { RequestContextPanel } from "./RequestContextPanel";

const systemIcons: Readonly<Record<string, AppIcon>> = {
  applications: Squares2X2Icon,
  approval: UserGroupIcon,
  device: ComputerDesktopIcon,
  guidance: ShieldCheckIcon,
  hris: CircleStackIcon,
  identity: FingerPrintIcon,
  notification: BellAlertIcon,
  policy: ShieldCheckIcon,
  "request-intake": InboxArrowDownIcon,
};

const statusPresentation = {
  pending: {
    badgeVariant: "pending",
    cardClass: "border-border bg-surface",
    icon: ClockIcon,
    iconClass: "border-border text-status-pending",
    label: "Pending",
  },
  running: {
    badgeVariant: "running",
    cardClass: "border-status-running-border bg-surface",
    icon: ArrowPathIcon,
    iconClass: "border-status-running text-status-running",
    label: "Running",
  },
  success: {
    badgeVariant: "success",
    cardClass: "border-border bg-surface",
    icon: CheckCircleIcon,
    iconClass: "border-status-success-border text-status-success",
    label: "Succeeded",
  },
  failed: {
    badgeVariant: "destructive",
    cardClass: "border-status-failure-border bg-surface",
    icon: ExclamationTriangleIcon,
    iconClass: "border-status-failure-border text-status-failure",
    label: "Failed",
  },
  skipped: {
    badgeVariant: "skipped",
    cardClass: "border-border bg-status-skipped-surface",
    icon: MinusCircleIcon,
    iconClass: "border-border text-status-skipped",
    label: "Skipped",
  },
} as const satisfies Record<
  StepExecution["status"],
  {
    readonly badgeVariant: NonNullable<BadgeProps["variant"]>;
    readonly cardClass: string;
    readonly icon: AppIcon;
    readonly iconClass: string;
    readonly label: string;
  }
>;

function WorkflowStep({
  execution,
  index,
  step,
  total,
}: {
  readonly execution: StepExecution | undefined;
  readonly index: number;
  readonly step: StepDefinition;
  readonly total: number;
}) {
  const SystemIcon = systemIcons[step.systemId] ?? CircleStackIcon;
  const status = execution?.status ?? "pending";
  const presentation = statusPresentation[status];
  const StatusIcon = presentation.icon;

  return (
    <li
      className="relative grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 pb-4 last:pb-0"
    >
      {index === total - 1 ? null : (
        <span
          aria-hidden="true"
          className="absolute left-[1.22rem] top-10 h-[calc(100%-1.5rem)] w-px bg-border-strong"
        />
      )}
      <span
        className={`relative z-10 grid size-10 place-items-center rounded-control border bg-surface shadow-control ${presentation.iconClass}`}
      >
        <SystemIcon aria-hidden="true" className="size-5" />
      </span>
      <div
        className={`min-w-0 rounded-control border px-4 py-3 shadow-control ${presentation.cardClass}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="font-semibold leading-6">{step.name}</h4>
          <StatusBadge
            icon={StatusIcon}
            spin={status === "running"}
            variant={presentation.badgeVariant}
          >
            {presentation.label}
          </StatusBadge>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-action text-muted-foreground">
          {step.actionLabel}
        </p>
        {execution?.resultSummary ? (
          <p className="mt-2 text-sm font-medium text-status-success">
            {execution.resultSummary}
          </p>
        ) : null}
        {execution?.failureReason ? (
          <p className="mt-2 text-sm font-medium text-status-failure">
            {execution.failureReason}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function WorkflowDetail({
  connectionState,
  execution,
  workflow,
}: {
  readonly connectionState: ConnectionState;
  readonly execution: WorkflowExecution | undefined;
  readonly workflow: WorkflowDefinition;
}) {
  const fails = workflow.expectedScenario === "failure";

  return (
    <section
      aria-labelledby="selected-workflow-title"
      className={`workflow-layout mt-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] ${execution === undefined ? "" : "workflow-layout-active"}`}
    >
      <div className="workflow-intro min-w-0 rounded-panel border border-border bg-surface p-5 shadow-panel sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">{workflow.category}</p>
            <h2
              className="mt-1 text-2xl font-semibold tracking-heading-tight"
              id="selected-workflow-title"
            >
              {workflow.name}
            </h2>
            <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
              {workflow.description}
            </p>
          </div>
          <StatusBadge
            className="min-h-8 gap-2 px-3"
            icon={fails ? ExclamationTriangleIcon : CheckCircleIcon}
            variant={fails ? "destructive" : "success"}
          >
            Expected {workflow.expectedScenario}
          </StatusBadge>
        </div>
        <div className="mt-5 flex gap-2 rounded-control border border-border bg-surface-subtle px-4 py-3 text-sm">
          <span className="shrink-0 font-semibold">Trigger</span>
          <span className="min-w-0 break-words text-muted-foreground">
            {workflow.triggerDescription}
          </span>
        </div>
      </div>

      {execution === undefined ? null : (
        <div className="workflow-summary min-w-0">
          <ExecutionSummary connectionState={connectionState} execution={execution} />
        </div>
      )}

      <div className="workflow-context min-w-0">
        <RequestContextPanel request={execution?.request ?? workflow.request} />
      </div>

      <div className="workflow-canvas workflow-steps min-w-0 rounded-panel border border-border p-4 shadow-panel sm:p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-label text-primary">
              Execution path
            </p>
            <h3 className="mt-1 text-lg font-semibold">Workflow steps</h3>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {workflow.steps.length} steps
          </span>
        </div>
        <ol aria-label="Workflow steps" className="mt-5">
          {workflow.steps.map((step, index) => (
            <WorkflowStep
              execution={execution?.steps.find((item) => item.stepId === step.id)}
              index={index}
              key={step.id}
              step={step}
              total={workflow.steps.length}
            />
          ))}
        </ol>
      </div>

      <div className="workflow-console min-w-0">
        <ExecutionConsole execution={execution} workflow={workflow} />
      </div>
    </section>
  );
}
