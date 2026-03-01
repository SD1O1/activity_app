"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl font-semibold text-[14px]",
        "transition-colors duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-primary/40",
        "disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-[1px]",
        size === "sm" && "h-10 px-3",
        size === "md" && "h-11 px-4",
        size === "lg" && "h-11 px-5",
        variant === "primary" && "bg-primary text-white hover:bg-primary-hover",
        variant === "secondary" && "bg-[#f3f4f6] border border-black/5 text-text-primary hover:bg-[#e5e7eb]",
        variant === "ghost" && "bg-transparent text-text-primary hover:bg-muted",
        variant === "destructive" && "bg-error text-white hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
});

Button.displayName = "Button";
