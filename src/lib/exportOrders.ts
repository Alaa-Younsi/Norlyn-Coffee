import type { Schema } from "write-excel-file";
import type { Order } from "@/types/db";

/**
 * CONFIRMED RISK — spreadsheet formula injection. customer_name, city,
 * address and notes are free-text checkout input: the RPC validates length and
 * shape but never restricts the character set, and a name is allowed to start
 * with `=`, `+`, `-` or `@`. Written verbatim into a cell, a customer named
 * `=cmd|'/c calc'!A1` executes for whoever opens the export — the client's own
 * dispatcher. A leading quote makes Excel/Sheets render it as literal text
 * with no visible change to the value.
 *
 * This is a different sink from React's DOM escaping: React protects the
 * browser, not a spreadsheet app opening the file. `write-excel-file` does not
 * escape this either — the guard has to stay.
 */
export function excelSafe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

const STATUS_FR: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const SCHEMA: Schema<Order> = [
  { column: "N° commande", type: String, width: 18, value: (o) => excelSafe(o.order_number) },
  { column: "Client", type: String, width: 24, value: (o) => excelSafe(o.customer_name) },
  { column: "Téléphone", type: String, width: 14, value: (o) => excelSafe(o.customer_phone) },
  { column: "Wilaya", type: String, width: 16, value: (o) => excelSafe(o.wilaya) },
  { column: "Ville", type: String, width: 16, value: (o) => excelSafe(o.city) },
  { column: "Adresse", type: String, width: 28, value: (o) => excelSafe(o.address ?? "") },
  { column: "Statut", type: String, width: 12, value: (o) => STATUS_FR[o.status] ?? o.status },
  {
    column: "Livraison",
    type: String,
    width: 12,
    value: (o) => (o.delivery_type === "office" ? "Bureau" : "Domicile"),
  },
  { column: "Sous-total", type: Number, width: 12, value: (o) => Number(o.subtotal) },
  { column: "Frais livraison", type: Number, width: 14, value: (o) => Number(o.shipping) },
  { column: "Total", type: Number, width: 12, value: (o) => Number(o.total) },
  { column: "Notes", type: String, width: 28, value: (o) => excelSafe(o.notes ?? "") },
  {
    column: "Date",
    type: String,
    width: 20,
    value: (o) => new Date(o.created_at).toLocaleString("fr-DZ"),
  },
];

/**
 * Clients run their dispatch off this file — it's a launch feature.
 *
 * `write-excel-file` (≈70 kB, tree-shaken) replaced `xlsx`/SheetJS: SheetJS is
 * 425 kB, and its npm build carries unfixed Prototype-Pollution + ReDoS
 * advisories that `bun audit` flags on every install and never clears.
 *
 * Still imported at CALL time, not module load — the difference was ~100 kB
 * gzipped on every shopper's first page. `exportOrders.ts` is small and
 * reachable, so a static import lets the bundler hoist the writer into the
 * shared chunk and every visitor in Algeria downloads it to look at coffee.
 * Behind a dynamic import it lands only when a dispatcher clicks Export.
 * Async as a consequence, which is why the callers `void` it.
 */
export async function exportOrders(orders: Order[]): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file");

  const today = new Date();
  const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;

  await writeXlsxFile(orders, { schema: SCHEMA, fileName: `commandes-${stamp}.xlsx` });
}
