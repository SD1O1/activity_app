"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          /* Base */
          "inline-flex items-center justify-center rounded-md font-medium",
          "transition-colors duration-150 ease-out",
          "focus:outline-none focus:ring-2 focus:ring-primary/40",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:translate-y-[1px]",

          /* Sizes */
          size === "sm" && "h-8 px-3 text-sm",
          size === "md" && "h-10 px-4 text-sm",
          size === "lg" && "h-12 px-6 text-base",

          /* Variants */
          variant === "primary" &&
            "bg-primary text-white hover:bg-primary-hover",

          variant === "secondary" &&
            "bg-card border border-border text-text-primary hover:bg-muted",

          variant === "ghost" &&
            "bg-transparent text-text-primary hover:bg-muted",

          variant === "destructive" &&
            "bg-error text-white hover:opacity-90",

          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";