import { ReactNode } from "react";
import { Button } from "./Button";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  actionSlot?: ReactNode;
}

export function SectionHeader({ title, subtitle, actionLabel, onActionClick, actionSlot }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>

      {actionSlot ??
        (actionLabel ? (
          <Button variant="ghost" size="sm" onClick={onActionClick}>
            {actionLabel}
          </Button>
        ) : null)}
    </div>
  );
}
