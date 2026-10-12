import {
  BellAlertIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClockIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  FingerPrintIcon,
  InboxArrowDownIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import type {
  JsonValue,
  RequestContext,
  StepDefinition,
  StepExecution,
  WorkflowDefinition,
  WorkflowExecution,
} from "../../../shared/types";

const systemIcons = {
  applications: Squares2X2Icon,
  approval: UserGroupIcon,
  device: ComputerDesktopIcon,
  guidance: ShieldCheckIcon,
  hris: CircleStackIcon,
  identity: FingerPrintIcon,
  notification: BellAlertIcon,
  policy: ShieldCheckIcon,
  "request-intake": InboxArrowDownIcon,
} as const;

const statusLabels = {
  pending: "Pending",
  running: "Running",
  success: "Succeeded",
  failed: "Failed",
  skipped: "Skipped",
} as const;

function labelFromKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatDetail(value: JsonValue): string {
  if (value === null) return "Not specified";
  if (Array.isArray(value)) return value.map(formatDetail).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function ExecutionSummary({ execution }: { readonly execution: WorkflowExecution }) {
  const title = {
    pending: "Execution queued",
    running: "Execution running",
    success: "Execution succeeded",
    failed: "Execution failed",
  }[execution.status];
  const tone =
    execution.status === "failed"
      ? "border-red-200 bg-red-50"
      : "border-emerald-200 bg-emerald-50";

  return (
    <div aria-live="polite" className={`mt-5 rounded-lg border px-4 py-3 ${tone}`} role="status">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{title}</p>
        <p className="text-xs font-medium text-[var(--muted-foreground)]">
          Execution {execution.id}
        </p>
      </div>
      {execution.failureReason === undefined ? null : (
        <p className="mt-2 text-sm text-[var(--failure)]">{execution.failureReason}</p>
      )}
    </div>
  );
}

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
  const Icon = systemIcons[step.systemId as keyof typeof systemIcons] ?? CircleStackIcon;
  const status = execution?.status ?? "pending";
  return (
    <li className="relative grid grid-cols-[2.75rem_1fr] gap-3 pb-5 last:pb-0">
      {index === total - 1 ? null : (
        <span
          aria-hidden="true"
          className="absolute left-[1.34rem] top-11 h-[calc(100%-2rem)] w-px bg-[var(--border)]"
        />
      )}
      <span className="relative z-10 grid size-11 place-items-center rounded-lg border border-[var(--border)] bg-white text-emerald-700 shadow-sm">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0 rounded-lg border border-[var(--border)] bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-semibold">{step.name}</h4>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {status === "success" ? (
              <CheckCircleIcon aria-hidden="true" className="size-3.5" />
            ) : status === "failed" ? (
              <ExclamationTriangleIcon aria-hidden="true" className="size-3.5" />
            ) : (
              <ClockIcon aria-hidden="true" className="size-3.5" />
            )}
            {statusLabels[status]}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-6 text-[var(--muted-foreground)]">
          {step.description}
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {step.actionLabel}
        </p>
        {execution?.logs ? (
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
            {execution.logs}
          </pre>
        ) : null}
        {execution?.resultSummary ? (
          <p className="mt-2 text-sm font-medium text-emerald-800">{execution.resultSummary}</p>
        ) : null}
        {execution?.failureReason ? (
          <p className="mt-2 text-sm font-medium text-[var(--failure)]">
            {execution.failureReason}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function RequestContextPanel({ request }: { readonly request: RequestContext }) {
  return (
    <aside
      aria-labelledby="request-context-title"
      className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
            Fictional request
          </p>
          <h3 className="mt-1 text-lg font-semibold" id="request-context-title">
            Request context
          </h3>
        </div>
        <span className="flex flex-nowrap items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
          {request.priority} priority
        </span>
      </div>
      <div className="mt-5 flex items-center gap-3 border-b border-[var(--border)] pb-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-sm font-bold text-emerald-800">
          {request.subject.initials}
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{request.subject.name}</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            {[request.subject.role, request.subject.department].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <dl className="mt-5 grid gap-4 text-sm">
        {request.subject.manager === undefined ? null : (
          <div>
            <dt className="font-medium text-[var(--muted-foreground)]">Manager</dt>
            <dd className="mt-1 font-medium">{request.subject.manager}</dd>
          </div>
        )}
        <div>
          <dt className="font-medium text-[var(--muted-foreground)]">Source</dt>
          <dd className="mt-1 font-medium">{request.source}</dd>
        </div>
        {Object.entries(request.details).map(([key, value]) => (
          <div key={key}>
            <dt className="font-medium text-[var(--muted-foreground)]">{labelFromKey(key)}</dt>
            <dd className="mt-1 break-words font-medium">{formatDetail(value)}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

export function WorkflowDetail({
  execution,
  workflow,
}: {
  readonly execution: WorkflowExecution | undefined;
  readonly workflow: WorkflowDefinition;
}) {
  const fails = workflow.expectedScenario === "failure";
  return (
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section
        aria-labelledby="selected-workflow-title"
        className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700">{workflow.category}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight" id="selected-workflow-title">
              {workflow.name}
            </h2>
            <p className="mt-2 max-w-2xl leading-7 text-[var(--muted-foreground)]">
              {workflow.description}
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${fails ? "bg-red-50 text-[var(--failure)]" : "bg-[var(--accent)] text-emerald-800"}`}>
            {fails ? (
              <ExclamationTriangleIcon aria-hidden="true" className="size-4" />
            ) : (
              <CheckCircleIcon aria-hidden="true" className="size-4" />
            )}
            Expected {workflow.expectedScenario}
          </span>
        </div>
        <div className="mt-5 rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm">
          <span className="font-semibold">Trigger:</span>{" "}
          <span className="text-[var(--muted-foreground)]">{workflow.triggerDescription}</span>
        </div>
        {execution === undefined ? null : <ExecutionSummary execution={execution} />}
        <h3 className="mt-7 text-sm font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Workflow steps
        </h3>
        <ol aria-label="Workflow steps" className="mt-4">
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
      </section>
      <RequestContextPanel request={execution?.request ?? workflow.request} />
    </div>
  );
}
