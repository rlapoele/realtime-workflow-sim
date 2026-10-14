import type { ComponentType, SVGProps } from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";

type OutlineIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface StatusBadgeProps extends BadgeProps {
  readonly icon: OutlineIcon;
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
