import { cn } from "@/lib/utils";

/** Accessible on/off toggle — used wherever a checkbox would read as a form
 *  field but the choice is really a feature on/off switch (e.g. notification
 *  channels). Native semantics via role="switch", not just visual styling. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
          checked ? "border-brand bg-brand" : "border-line bg-panel-2",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform rtl:right-0.5 ltr:left-0.5",
            checked ? "rtl:-translate-x-5 ltr:translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </label>
  );
}
