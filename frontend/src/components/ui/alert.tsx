import * as React from "react";

const variantClasses = {
  default: "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]",
  warning:
    "border-[var(--status-warning-border)] bg-[var(--status-warning-surface)] text-[var(--foreground)]",
  destructive:
    "border-[var(--status-failure-border)] bg-[var(--status-failure-surface)] text-[var(--status-failure)]",
} as const;

export interface AlertProps extends React.ComponentPropsWithoutRef<"div"> {
  readonly variant?: keyof typeof variantClasses;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <div
      className={`relative w-full rounded-[var(--radius-panel)] border p-5 shadow-[var(--shadow-panel)] ${variantClasses[variant]} ${className ?? ""}`}
      data-slot="alert"
      ref={ref}
      {...props}
    />
  );
});

export const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(function AlertTitle({ className, ...props }, ref) {
  return (
    <p
      className={`font-semibold leading-6 ${className ?? ""}`}
      data-slot="alert-title"
      ref={ref}
      {...props}
    />
  );
});

export const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function AlertDescription({ className, ...props }, ref) {
  return (
    <div
      className={`mt-1 text-sm leading-6 [&_p]:leading-relaxed ${className ?? ""}`}
      data-slot="alert-description"
      ref={ref}
      {...props}
    />
  );
});
