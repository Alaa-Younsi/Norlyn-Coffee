import type { CSSProperties } from "react";

/** Stylized coffee bean SVG — inherits color via currentColor. */
export function CoffeeBeanIcon({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 48 64"
      className={className}
      style={style}
      aria-hidden
      fill="currentColor"
    >
      <ellipse cx="24" cy="32" rx="21" ry="29" />
      {/* the S-curve crease */}
      <path
        d="M24 5 C 12 20, 36 40, 24 59"
        fill="none"
        stroke="rgb(var(--c-bg))"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
