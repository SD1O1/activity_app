import { HTMLAttributes } from "react";
import clsx from "clsx";

export function Chip({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700",
        className,
      )}
      {...props}
    />
  );
}
