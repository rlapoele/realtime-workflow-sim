import { ArrowDownIcon, CommandLineIcon } from "@heroicons/react/24/outline";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { WorkflowDefinition, WorkflowExecution } from "../../../shared/types";

const NEAR_BOTTOM_PX = 48;

function isNearBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.clientHeight - element.scrollTop <= NEAR_BOTTOM_PX;
}

export function ExecutionConsole({
  execution,
  workflow,
}: {
  readonly execution: WorkflowExecution | undefined;
  readonly workflow: WorkflowDefinition;
}) {
  const outputRef = useRef<HTMLDivElement>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const logs = workflow.steps.map((step) => ({
    name: step.name,
    text: execution?.steps.find((item) => item.stepId === step.id)?.logs ?? "",
  }));
  const logText = logs.map((log) => log.text).join("");
  const hasLogs = logs.some((log) => log.text.length > 0);

  useEffect(() => {
    setIsFollowing(true);
  }, [execution?.id, workflow.id]);

  useLayoutEffect(() => {
    const output = outputRef.current;
    if (output !== null && isFollowing) output.scrollTop = output.scrollHeight;
  }, [isFollowing, logText]);

  const jumpToLatest = () => {
    const output = outputRef.current;
    if (output !== null) output.scrollTop = output.scrollHeight;
    setIsFollowing(true);
  };

  return (
    <section
      aria-labelledby="execution-log-title"
      className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--console-border)] bg-[var(--console-background)] text-[var(--console-foreground)] shadow-[var(--shadow-panel)]"
    >
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-[var(--console-border)] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)] bg-white/8 text-[var(--decorative)]">
            <CommandLineIcon aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold" id="execution-log-title">
              Execution log
            </h3>
            <p className="text-xs text-[var(--console-muted)]">
              {isFollowing ? "Following latest output" : "Live follow paused"}
            </p>
          </div>
        </div>
        {!isFollowing && hasLogs ? (
          <button
            aria-label="Jump to latest log"
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--console-border-strong)] bg-white/6 px-3 text-xs font-semibold text-[var(--console-foreground)] outline-none transition hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-[var(--focus-console)] motion-reduce:transition-none"
            onClick={jumpToLatest}
            type="button"
          >
            <ArrowDownIcon aria-hidden="true" className="size-4" />
            Jump to latest
          </button>
        ) : null}
      </div>
      <div
        aria-label="Execution log output"
        className="max-h-80 min-h-48 overflow-auto px-4 py-4 font-mono text-[0.8125rem] leading-6 outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[var(--focus-console)] sm:px-5"
        onScroll={(event) => setIsFollowing(isNearBottom(event.currentTarget))}
        ref={outputRef}
        role="region"
        tabIndex={0}
      >
        {hasLogs ? (
          <ol className="grid gap-4" role="list">
            {logs.map((log, index) =>
              log.text.length === 0 ? null : (
                <li className="min-w-0" key={workflow.steps[index]!.id}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--decorative)]">
                    {log.name}
                  </p>
                  <pre className="min-w-0 whitespace-pre-wrap break-words text-[var(--console-foreground)]">
                    {log.text}
                  </pre>
                </li>
              ),
            )}
          </ol>
        ) : (
          <p className="text-[var(--console-muted)]">
            Logs will appear here after the simulated workflow starts.
          </p>
        )}
      </div>
    </section>
  );
}
