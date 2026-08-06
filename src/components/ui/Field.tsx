import { forwardRef } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const baseInput =
  "w-full rounded-xl border border-line bg-panel px-4 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  /** quiet guidance under the input — replaced by `error` when one is present */
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FieldWrapper({ label, error, hint, children, className }: FieldWrapperProps) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-700 dark:text-red-300">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-muted">{hint}</span>
      )}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(baseInput, className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(baseInput, "min-h-24", className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cn(baseInput, "appearance-none", className)} {...props} />;
  },
);
