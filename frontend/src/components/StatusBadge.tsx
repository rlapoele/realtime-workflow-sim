import type { AppIcon } from "@/components/icons/types";
import { Badge, type BadgeProps } from "@/components/ui/badge";

export interface StatusBadgeProps extends BadgeProps {
  readonly icon: AppIcon;
  readonly spin?: boolean;
}

export function StatusBadge({
  children,
  icon: Icon,
  spin = false,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge {...props}>
      <Icon
        aria-hidden="true"
        className={spin ? "animate-spin motion-reduce:animate-none" : undefined}
      />
      {children}
    </Badge>
  );
}
