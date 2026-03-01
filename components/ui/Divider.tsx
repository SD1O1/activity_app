import { HTMLAttributes } from "react";
import clsx from "clsx";

export function Divider({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={clsx("w-full border-0 border-t border-gray-200", className)} {...props} />;
}
