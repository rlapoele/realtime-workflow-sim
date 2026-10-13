import { PlayIcon } from "@heroicons/react/24/outline";

import type { WorkflowDefinition } from "../../../shared/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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
      <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]" id="workflow-label">
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

export function WorkflowControls({
  active,
  buttonLabel,
  isStarting,
  onChange,
  onRun,
  selectedId,
  workflows,
}: {
  readonly active: boolean;
  readonly buttonLabel: string;
  readonly isStarting: boolean;
  readonly onChange: (workflowId: string) => void;
  readonly onRun: () => void;
  readonly selectedId: string;
  readonly workflows: readonly WorkflowDefinition[];
}) {
  return (
    <section
      aria-labelledby="workflow-controls-title"
      className="rounded-[var(--radius-panel)] border border-[var(--border-strong)] bg-[var(--surface)] p-4 shadow-[var(--shadow-panel)] sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold" id="workflow-controls-title">
          Run a workflow
        </h2>
        <p className="text-xs font-medium text-[var(--muted-foreground)]">
          Fictional data · simulated actions
        </p>
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <WorkflowPicker
          disabled={active}
          onChange={onChange}
          value={selectedId}
          workflows={workflows}
        />
        <button
          aria-label={isStarting ? "Starting workflow" : buttonLabel}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-[var(--primary-foreground)] shadow-[var(--shadow-control)] outline-none transition hover:bg-[var(--primary-hover)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:bg-[var(--disabled)] disabled:text-[var(--disabled-foreground)] motion-reduce:transition-none sm:min-w-44"
          disabled={active || isStarting}
          onClick={onRun}
          type="button"
        >
          <PlayIcon aria-hidden="true" className="size-4" />
          {isStarting ? "Starting…" : buttonLabel}
        </button>
      </div>
    </section>
  );
}
