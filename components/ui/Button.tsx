"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "outline" | "ghost" | "secondary" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          "inline-flex items-center justify-center rounded-lg font-semibold text-sm whitespace-nowrap",
          "transition-colors duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-black/20",
          "disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-[1px]",
          size === "sm" && "h-9 px-3",
          size === "md" && "h-10 px-4",
          size === "lg" && "h-11 px-5",
          variant === "primary" && "bg-black text-white hover:bg-black/90",
          variant === "outline" && "bg-white border border-black/15 text-black hover:bg-gray-50",
          variant === "ghost" && "bg-transparent text-black hover:bg-black/5",
          variant === "secondary" && "bg-gray-100 border border-black/5 text-black hover:bg-gray-200",
          variant === "destructive" && "bg-red-500 text-white hover:bg-red-600",
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
