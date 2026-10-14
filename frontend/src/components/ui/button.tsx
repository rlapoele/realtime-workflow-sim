import { Button as ButtonPrimitive } from "@base-ui/react/button";
import * as React from "react";

const variantClasses = {
  default:
    "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-control)] hover:bg-[var(--primary-hover)] focus-visible:ring-[var(--focus-ring)] disabled:bg-[var(--disabled)] disabled:text-[var(--disabled-foreground)]",
  outline:
    "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-control)] hover:bg-[var(--surface-subtle)] focus-visible:ring-[var(--focus-ring)]",
  warning:
    "border border-[var(--status-warning)] bg-transparent text-[var(--status-warning)] hover:bg-[var(--status-warning-surface)] focus-visible:ring-[var(--focus-warning)]",
  console:
    "border border-[var(--console-border-strong)] bg-white/6 text-[var(--console-foreground)] hover:bg-white/10 focus-visible:ring-[var(--focus-console)]",
  ghost:
    "text-[var(--foreground)] hover:bg-[var(--surface-subtle)] focus-visible:ring-[var(--focus-ring)]",
} as const;

const sizeClasses = {
  default: "min-h-11 px-5 py-2.5 text-sm",
  compact: "min-h-11 px-3 py-2 text-xs",
} as const;

export interface ButtonProps extends Omit<ButtonPrimitive.Props, "className"> {
  readonly className?: string;
  readonly size?: keyof typeof sizeClasses;
  readonly variant?: keyof typeof variantClasses;
}

export const Button = React.forwardRef<HTMLElement, ButtonProps>(function Button(
  { className, size = "default", type = "button", variant = "default", ...props },
  ref,
) {
  return (
    <ButtonPrimitive
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-bold outline-none transition focus-visible:ring-3 disabled:cursor-not-allowed motion-reduce:transition-none ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ""}`}
      data-slot="button"
      ref={ref}
      type={type}
      {...props}
    />
  );
});
