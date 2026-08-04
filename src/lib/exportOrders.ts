import * as XLSX from "xlsx";
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
 * browser, not a spreadsheet app opening the file.
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

/** Clients run their dispatch off this file — it's a launch feature. */
export function exportOrders(orders: Order[]): void {
  const rows = orders.map((order) => ({
    "N° commande": excelSafe(order.order_number),
    Client: excelSafe(order.customer_name),
    Téléphone: excelSafe(order.customer_phone),
    Wilaya: excelSafe(order.wilaya),
    Ville: excelSafe(order.city),
    Adresse: excelSafe(order.address ?? ""),
    Statut: STATUS_FR[order.status] ?? order.status,
    Livraison: order.delivery_type === "office" ? "Bureau" : "Domicile",
    "Sous-total": Number(order.subtotal),
    "Frais livraison": Number(order.shipping),
    Total: Number(order.total),
    Notes: excelSafe(order.notes ?? ""),
    Date: new Date(order.created_at).toLocaleString("fr-DZ"),
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Commandes");

  const today = new Date();
  const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  XLSX.writeFile(book, `commandes-${stamp}.xlsx`);
}
