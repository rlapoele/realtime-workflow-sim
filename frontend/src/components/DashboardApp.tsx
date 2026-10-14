import { CircleStackIcon } from "@heroicons/react/24/outline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { WorkflowCatalogue } from "./WorkflowCatalogue";

export interface DashboardAppProps {
  readonly apiUrl: string;
}

function DashboardShell({ apiUrl }: DashboardAppProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-control bg-surface px-4 py-3 text-sm font-semibold text-foreground shadow-lg outline-none transition focus:translate-y-0 focus:ring-3 focus:ring-focus-ring motion-reduce:transition-none"
        href="#main-content"
      >
        Skip to main content
      </a>
      <header className="border-b border-brand-border bg-brand text-brand-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a
            className="flex min-h-11 items-center gap-3 rounded-control font-semibold tracking-brand-tight outline-none focus-visible:ring-3 focus-visible:ring-focus-console"
            href="/"
          >
            <span className="grid size-8 place-items-center rounded-control border border-white/15 bg-white/8">
              <CircleStackIcon aria-hidden="true" className="size-5 text-decorative" />
            </span>
            <span>
              AgentFlow <span className="text-console-muted">Live</span>
            </span>
          </a>
          <Badge
            className="min-h-8 gap-2 px-3 font-bold uppercase tracking-action"
            variant="accent"
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
            Simulation
          </Badge>
        </div>
      </header>

      <main
        className="mx-auto max-w-7xl px-4 pb-12 pt-7 outline-none sm:px-6 sm:pb-16 sm:pt-10"
        id="main-content"
        tabIndex={-1}
      >
        <section aria-labelledby="page-title">
          <p className="mb-2 text-xs font-semibold uppercase tracking-eyebrow text-primary">
            Service desk simulation
          </p>
          <h1
            className="max-w-3xl text-3xl font-semibold tracking-title-tight sm:text-4xl"
            id="page-title"
          >
            Workflow executions
          </h1>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-7 text-muted-foreground sm:text-base">
            Run fictional service workflows and inspect each deterministic step as it happens. No
            external systems are connected.
          </p>
          <div className="mt-7 sm:mt-8">
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
