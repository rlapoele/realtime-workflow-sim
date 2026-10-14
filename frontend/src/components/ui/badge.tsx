import * as React from "react";

const variantClasses = {
  default: "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]",
  accent:
    "border-[color:color-mix(in_srgb,var(--decorative)_35%,transparent)] bg-[var(--decorative)] text-[var(--brand)]",
  surface: "border-transparent bg-[var(--surface-subtle)]",
  secondary: "border-transparent bg-[var(--surface-subtle)] text-[var(--muted-foreground)]",
  success:
    "border-transparent bg-[var(--status-success-surface)] text-[var(--status-success)]",
  warning:
    "border-transparent bg-[var(--status-warning-surface)] text-[var(--status-warning)]",
  destructive:
    "border-transparent bg-[var(--status-failure-surface)] text-[var(--status-failure)]",
  outline: "border-[var(--border-strong)] text-[var(--foreground)]",
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
