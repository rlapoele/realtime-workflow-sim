import { Button as ButtonPrimitive } from "@base-ui/react/button";
import * as React from "react";

const variantClasses = {
  default:
    "bg-primary text-primary-foreground shadow-control hover:bg-primary-hover focus-visible:ring-focus-ring disabled:bg-disabled disabled:text-disabled-foreground",
  outline:
    "border border-border-strong bg-surface text-foreground shadow-control hover:bg-surface-subtle focus-visible:ring-focus-ring",
  warning:
    "border border-status-warning bg-transparent text-status-warning hover:bg-status-warning-surface focus-visible:ring-focus-warning",
  console:
    "border border-console-border-strong bg-white/6 text-console-foreground hover:bg-white/10 focus-visible:ring-focus-console",
  ghost: "text-foreground hover:bg-surface-subtle focus-visible:ring-focus-ring",
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
      className={`inline-flex items-center justify-center gap-2 rounded-control font-bold outline-none transition focus-visible:ring-3 disabled:cursor-not-allowed motion-reduce:transition-none ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ""}`}
      data-slot="button"
      ref={ref}
      type={type}
      {...props}
    />
  );
});
