import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "gold" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  gold: "fx-sheen bg-brand text-cream font-semibold shadow-lg shadow-brand/25 hover:bg-gold-hi hover:text-ink border border-brand/40",
  outline:
    "fx-sheen border border-brand/50 text-ink hover:border-brand hover:bg-brand/10 font-medium",
  ghost: "text-muted hover:text-ink hover:bg-panel-2 font-medium",
  danger: "bg-red-800/90 text-white hover:bg-red-700 font-medium",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-full",
  md: "px-6 py-2.5 text-sm rounded-full",
  lg: "px-9 py-3.5 text-base rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "gold", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 tracking-wide transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});
