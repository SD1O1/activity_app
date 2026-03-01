import { HTMLAttributes } from "react";
import clsx from "clsx";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mx-auto w-full max-w-[1200px] px-4 md:px-6", className)} {...props} />;
}
