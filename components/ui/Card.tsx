import { HTMLAttributes } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  shadow?: "none" | "subtle" | "medium";
}

export function Card({ className, shadow = "subtle", ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-200 bg-white p-4",
        shadow === "subtle" && "shadow-[0_1px_2px_rgba(17,24,39,0.06)]",
        shadow === "medium" && "shadow-[0_8px_20px_rgba(17,24,39,0.1)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mb-3 border-b border-gray-200 pb-3", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("text-gray-600", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mt-3 border-t border-gray-200 pt-3", className)} {...props} />;
}
