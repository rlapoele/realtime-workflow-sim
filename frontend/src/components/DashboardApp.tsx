import { CircleStackIcon, SignalIcon } from "@heroicons/react/24/outline";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { fetchHealth } from "../lib/health";

export interface DashboardAppProps {
  readonly apiUrl: string;
}

function HealthStatus({ apiUrl }: DashboardAppProps) {
  const health = useQuery({
    queryKey: ["health", apiUrl],
    queryFn: () => fetchHealth(apiUrl),
    retry: false,
  });

  if (health.isPending) {
    return <p role="status">Checking backend…</p>;
  }

  if (health.isError) {
    return (
      <p className="text-red-700" role="alert">
        Backend unavailable. Check the local API process and configuration.
      </p>
    );
  }

  return (
    <p className="flex items-center gap-2 text-emerald-800" role="status">
      <SignalIcon aria-hidden="true" className="size-5" />
      Backend available
    </p>
  );
}

function DashboardShell({ apiUrl }: DashboardAppProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a className="flex items-center gap-2 font-semibold tracking-tight" href="/">
            <CircleStackIcon aria-hidden="true" className="size-6 text-emerald-400" />
            AgentFlow Live
          </a>
          <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-950">
            Simulation
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12">
        <section aria-labelledby="page-title" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Local foundation
          </p>
          <h1 className="text-3xl font-semibold tracking-tight" id="page-title">
            Workflow executions
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            The application shell and shared service boundary are ready. Workflow selection and simulated execution arrive in later reviewed phases.
          </p>

          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Service status</h2>
            <div className="mt-2 text-sm">
              <HealthStatus apiUrl={apiUrl} />
            </div>
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
