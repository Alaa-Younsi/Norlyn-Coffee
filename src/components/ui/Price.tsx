import { formatPrice } from "@/lib/format";

/**
 * ALWAYS render prices through this, never `formatPrice()` raw inside JSX.
 *
 * "950 DA" mixes a digit run with a Latin unit suffix separated by a neutral
 * space — under an RTL ambient direction the Bidi algorithm reorders it to
 * "DA 950". `dir="ltr"` pins the run; the component exists so no call site can
 * regress.
 */
export function Price({
  value,
  prefix,
  className,
}: {
  value: number;
  prefix?: string;
  className?: string;
}) {
  return (
    <span dir="ltr" className={className}>
      {prefix}
      {formatPrice(value)}
    </span>
  );
}
