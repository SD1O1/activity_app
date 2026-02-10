"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

/* =========================
   INPUT
   ========================= */

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        disabled={disabled}
        className={clsx(
          "w-full rounded-md border border-border bg-card",
          "px-3 py-2 text-sm text-text-primary",
          "placeholder:text-text-muted",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors duration-150 ease-out",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

/* =========================
   TEXTAREA
   ========================= */

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={clsx(
          "w-full rounded-md border border-border bg-card",
          "px-3 py-2 text-sm text-text-primary",
          "placeholder:text-text-muted",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "resize-none transition-colors duration-150 ease-out",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";