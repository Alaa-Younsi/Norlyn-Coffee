/**
 * Same formula-injection guard as the Excel export (see lib/exportOrders.ts) —
 * a leading `'` when the value starts with `=+-@`, then normal CSV quoting.
 */
export function csvSafe(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
}

/** U+FEFF — written as an escape so it can't be mistaken for stray whitespace. */
const BOM = "\uFEFF";

/**
 * The BOM is required: without it Excel renders the accented French headers as
 * mojibake.
 */
export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const body = [headers, ...rows].map((row) => row.map(csvSafe).join(",")).join("\r\n");
  const blob = new Blob([`${BOM}${body}`], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
