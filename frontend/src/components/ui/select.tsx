import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import * as React from "react";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectPrimitive.Trigger.Props
>(function SelectTrigger({ children, className, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--control-border)] bg-[var(--surface)] px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-control)] outline-none transition hover:border-[var(--primary)] focus-visible:border-[var(--primary)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] data-[popup-open]:border-[var(--primary)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--muted-foreground)] motion-reduce:transition-none ${className ?? ""}`}
      ref={ref}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="shrink-0 text-[var(--muted-foreground)]">
        <ChevronDownIcon aria-hidden="true" className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export function SelectContent({ children }: { readonly children: React.ReactNode }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        align="start"
        alignItemWithTrigger={false}
        className="z-50 outline-none"
        sideOffset={6}
      >
        <SelectPrimitive.Popup className="max-h-[min(22rem,var(--available-height))] min-w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-y-auto rounded-[var(--radius-control)] border border-[var(--control-border)] bg-[var(--surface)] p-1 text-[var(--foreground)] shadow-xl outline-none data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none">
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  SelectPrimitive.Item.Props
>(function SelectItem({ children, className, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      className={`grid min-h-11 cursor-default grid-cols-[1fr_1.25rem] items-center gap-3 rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--accent)] data-[highlighted]:text-[var(--accent-foreground)] ${className ?? ""}`}
      ref={ref}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <CheckIcon aria-hidden="true" className="size-4 text-[var(--primary)]" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
});
