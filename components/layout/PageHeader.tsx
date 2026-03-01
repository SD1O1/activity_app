"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
}

export function PageHeader({ title, onBack, rightSlot }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 md:py-4">
      <div className="flex min-w-0 items-center gap-2">
        {onBack ? (
          <Button aria-label="Go back" variant="ghost" size="sm" onClick={onBack}>
            ←
          </Button>
        ) : null}
        <h1 className="truncate text-xl font-semibold text-gray-900 md:text-2xl">{title}</h1>
      </div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </div>
  );
}
