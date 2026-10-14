import { ChevronDownIcon } from "@heroicons/react/24/outline";

import type { JsonValue, RequestContext } from "../../../shared/types";
import { Badge } from "@/components/ui/badge";

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

export function RequestContextPanel({ request }: { readonly request: RequestContext }) {
  return (
    <aside aria-label="Request context" className="min-w-0">
      <details
        className="group overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]"
        open
      >
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 outline-none marker:hidden focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] sm:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
              Fictional request
            </p>
            <h3 className="mt-0.5 text-base font-semibold">Request context</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className="capitalize"
              variant={request.priority === "high" ? "warning" : "secondary"}
            >
              {request.priority} priority
            </Badge>
            <ChevronDownIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-[var(--muted-foreground)] transition group-open:rotate-180 motion-reduce:transition-none"
            />
          </div>
        </summary>
        <div className="border-t border-[var(--border)] px-4 pb-5 pt-4 sm:px-5">
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-foreground)]">
              {request.subject.initials}
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{request.subject.name}</p>
              <p className="text-sm leading-5 text-[var(--muted-foreground)]">
                {[request.subject.role, request.subject.department].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <dl className="mt-4 grid gap-4 text-sm">
            {request.subject.manager === undefined ? null : (
              <div>
                <dt className="font-medium text-[var(--muted-foreground)]">Manager</dt>
                <dd className="mt-1 font-semibold">{request.subject.manager}</dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-[var(--muted-foreground)]">Source</dt>
              <dd className="mt-1 break-words font-semibold">{request.source}</dd>
            </div>
            {Object.entries(request.details).map(([key, value]) => (
              <div key={key}>
                <dt className="font-medium text-[var(--muted-foreground)]">{labelFromKey(key)}</dt>
                <dd className="mt-1 break-words font-semibold">{formatDetail(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </details>
    </aside>
  );
}
