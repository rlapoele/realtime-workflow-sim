import * as React from "react";

const variantClasses = {
  default: "border-transparent bg-primary text-primary-foreground",
  accent: "border-decorative-border bg-decorative text-brand",
  surface: "border-transparent bg-surface-subtle",
  secondary: "border-transparent bg-surface-subtle text-muted-foreground",
  pending: "border-transparent bg-status-pending-surface text-status-pending",
  running: "border-transparent bg-status-running-surface text-status-running",
  success: "border-transparent bg-status-success-surface text-status-success",
  warning: "border-transparent bg-status-warning-surface text-status-warning",
  destructive: "border-transparent bg-status-failure-surface text-status-failure",
  skipped: "border-transparent bg-status-skipped-border text-status-skipped",
  outline: "border-border-strong text-foreground",
} as const;

export interface BadgeProps extends React.ComponentPropsWithoutRef<"span"> {
  readonly variant?: keyof typeof variantClasses;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <span
      className={`inline-flex min-h-7 shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3.5 ${variantClasses[variant]} ${className ?? ""}`}
      data-slot="badge"
      ref={ref}
      {...props}
    />
  );
});
