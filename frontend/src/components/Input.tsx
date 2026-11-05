"use client";

import {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, iconRight, className = "", id, ...props },
  ref,
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-charcoal mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={[
            "w-full rounded-lg border bg-white text-charcoal text-sm",
            "placeholder:text-charcoal/40",
            "transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green",
            error
              ? "border-red-400"
              : "border-charcoal/20 hover:border-charcoal/40",
            icon ? "pl-10" : "pl-4",
            iconRight ? "pr-10" : "pr-4",
            "py-2.5",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        />
        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40">
            {iconRight}
          </span>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-charcoal/50">{hint}</p>
      )}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, className = "", id, ...props }, ref) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-charcoal mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          {...props}
          className={[
            "w-full rounded-lg border bg-white text-charcoal text-sm",
            "placeholder:text-charcoal/40",
            "transition-colors duration-200 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green",
            "px-4 py-2.5",
            error
              ? "border-red-400"
              : "border-charcoal/20 hover:border-charcoal/40",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-charcoal/50">{hint}</p>
        )}
      </div>
    );
  },
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, error, children, className = "", id, ...props }, ref) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-charcoal mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          {...props}
          className={[
            "w-full rounded-lg border bg-white text-charcoal text-sm",
            "transition-colors duration-200 appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green",
            "px-4 py-2.5",
            error
              ? "border-red-400"
              : "border-charcoal/20 hover:border-charcoal/40",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </select>
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);
