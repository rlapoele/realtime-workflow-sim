import { CircleStackIcon } from "@heroicons/react/24/outline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { WorkflowCatalogue } from "./WorkflowCatalogue";

export interface DashboardAppProps {
  readonly apiUrl: string;
}

function DashboardShell({ apiUrl }: DashboardAppProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-emerald-950 bg-[var(--brand)] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a className="flex items-center gap-2 font-semibold tracking-tight" href="/">
            <CircleStackIcon aria-hidden="true" className="size-6 text-[var(--decorative)]" />
            AgentFlow Live
          </a>
          <span className="rounded-full bg-[var(--decorative)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-950">
            Simulation
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10">
        <section aria-labelledby="page-title">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Service desk simulation
          </p>
          <h1 className="text-3xl font-semibold tracking-tight" id="page-title">
            Workflow executions
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-[var(--muted-foreground)]">
            Run fictional service workflows locally and inspect their deterministic execution state.
            No external systems are connected.
          </p>
          <div className="mt-8">
            <WorkflowCatalogue apiUrl={apiUrl} />
          </div>
        </section>
      </main>
    </div>
  );
}

export function DashboardApp(props: DashboardAppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardShell {...props} />
    </QueryClientProvider>
  );
}
