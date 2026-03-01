"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, disabled, ...props }, ref) => {
  return (
    <input
      ref={ref}
      disabled={disabled}
      className={clsx(
        "w-full rounded-lg border border-gray-300 bg-white",
        "px-3 py-2 text-sm text-gray-900",
        "placeholder:text-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-gray-400",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-colors duration-150 ease-out",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={clsx(
          "w-full rounded-lg border border-gray-300 bg-white",
          "px-3 py-2 text-sm text-gray-900",
          "placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-gray-400",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "resize-none transition-colors duration-150 ease-out",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
