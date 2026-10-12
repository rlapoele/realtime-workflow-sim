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
  UserIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { JsonValue, StepDefinition, WorkflowDefinition } from "../../../shared/types";
import { fetchWorkflows } from "../lib/workflows";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export interface WorkflowCatalogueProps {
  readonly apiUrl: string;
}

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

function WorkflowPicker({
  workflows,
  value,
  onChange,
}: {
  readonly workflows: readonly WorkflowDefinition[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const items = workflows.map((workflow) => ({ label: workflow.name, value: workflow.id }));

  return (
    <div className="min-w-0 flex-1">
      <label className="mb-2 block text-sm font-semibold" id="workflow-label">
        Workflow
      </label>
      <Select
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

function RequestContextPanel({ workflow }: { readonly workflow: WorkflowDefinition }) {
  const { request } = workflow;
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

function WorkflowStep({
  step,
  index,
  total,
}: {
  readonly step: StepDefinition;
  readonly index: number;
  readonly total: number;
}) {
  const Icon = systemIcons[step.systemId as keyof typeof systemIcons] ?? CircleStackIcon;
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
            <ClockIcon aria-hidden="true" className="size-3.5" />
            Pending
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-6 text-[var(--muted-foreground)]">
          {step.description}
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {step.actionLabel}
        </p>
      </div>
    </li>
  );
}

function CatalogueDetail({ workflow }: { readonly workflow: WorkflowDefinition }) {
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
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${fails ? "bg-red-50 text-[var(--failure)]" : "bg-[var(--accent)] text-emerald-800"}`}
          >
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

        <h3 className="mt-7 text-sm font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Planned steps
        </h3>
        <ol aria-label="Workflow steps" className="mt-4">
          {workflow.steps.map((step, index) => (
            <WorkflowStep
              index={index}
              key={step.id}
              step={step}
              total={workflow.steps.length}
            />
          ))}
        </ol>
      </section>
      <RequestContextPanel workflow={workflow} />
    </div>
  );
}

export function WorkflowCatalogue({ apiUrl }: WorkflowCatalogueProps) {
  const [selectedId, setSelectedId] = useState<string>();
  const query = useQuery({
    queryKey: ["workflows", apiUrl],
    queryFn: () => fetchWorkflows(apiUrl),
    retry: false,
  });

  if (query.isPending) {
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

  if (query.isError) {
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

  if (query.data.length === 0) {
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
    query.data.find((workflow) => workflow.id === selectedId) ?? query.data[0]!;

  return (
    <>
      <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm sm:flex-row sm:items-end">
        <WorkflowPicker
          onChange={setSelectedId}
          value={selectedWorkflow.id}
          workflows={query.data}
        />
        <div className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm text-emerald-900 sm:max-w-xs">
          Browse-only simulation preview. No external systems are connected.
        </div>
      </div>
      <CatalogueDetail workflow={selectedWorkflow} />
    </>
  );
}
