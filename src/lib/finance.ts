/**
 * One pure aggregation engine, used by BOTH ledgers (/admin/finance for the
 * website, /admin/store for the counter). Each page maps its own rows into
 * SaleFact/SaleLine and reads the same numbers back. Nothing here touches
 * Supabase, so it is trivially testable.
 */

export interface SaleLine {
  itemKey: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface SaleFact {
  id: string;
  reference: string;
  /** local YYYY-MM-DD */
  day: string;
  customerName: string;
  subtotal: number;
  discount: number;
  /** collected for delivery, never counted as margin */
  shipping: number;
  lines: SaleLine[];
}

export interface CostFact {
  id: string;
  day: string;
  label: string;
  amount: number;
}

export type RangePreset = "day" | "week" | "month" | "year" | "max" | "custom";

export interface DateRange {
  preset: RangePreset;
  /** local YYYY-MM-DD, null = unbounded */
  from: string | null;
  to: string | null;
}

/**
 * NEVER use `new Date(iso).toISOString().slice(0,10)` for this. That
 * re-projects into UTC, so an Algiers sale at 00:30 lands on the previous day
 * and "today's revenue" silently drops orders.
 *
 * A bare YYYY-MM-DD input is returned untouched — parsing it as a Date treats
 * it as UTC midnight and shifts it west of Greenwich.
 */
export function toLocalDay(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function shiftDays(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, m - 1, d + delta);
  return toLocalDay(date);
}

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const diff = Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd);
  return Math.round(diff / 86400000);
}

/**
 * Ranges are TRAILING WINDOWS ending today — "week" is the last 7 days
 * including today, not the calendar week. That is what the owner means
 * comparing "this week vs last week" on a Wednesday.
 */
export function buildRange(preset: RangePreset, custom?: { from: string; to: string }): DateRange {
  const today = toLocalDay(new Date());
  switch (preset) {
    case "day":
      return { preset, from: today, to: today };
    case "week":
      return { preset, from: shiftDays(today, -6), to: today };
    case "month":
      return { preset, from: shiftDays(today, -29), to: today };
    case "year":
      return { preset, from: shiftDays(today, -364), to: today };
    case "max":
      return { preset, from: null, to: null };
    case "custom":
      return { preset, from: custom?.from ?? today, to: custom?.to ?? today };
  }
}

/** The immediately preceding window of equal length, for the delta badges. */
export function previousRange(range: DateRange): DateRange | null {
  if (!range.from || !range.to) return null;
  const span = daysBetween(range.from, range.to) + 1;
  return {
    preset: range.preset,
    from: shiftDays(range.from, -span),
    to: shiftDays(range.to, -span),
  };
}

export function inRange(day: string, range: DateRange): boolean {
  if (!day) return false;
  if (range.from && day < range.from) return false;
  if (range.to && day > range.to) return false;
  return true;
}

export interface Totals {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  purchases: number;
  margin: number;
  salesCount: number;
  itemsCount: number;
  averageBasket: number;
}

/**
 * Definitions — write these down, the client WILL ask:
 *   revenue     = Σ(subtotal − discount). Shipping is EXCLUDED (collected for
 *                 delivery, not margin).
 *   cogs        = Σ(unitCost × qty)
 *   grossProfit = revenue − cogs
 *   netProfit   = grossProfit − expenses
 *   purchases   is reported BESIDE netProfit, never inside it — stock bought
 *               today and sold next month would otherwise show as a loss this
 *               month and a windfall the next.
 */
export function computeTotals(
  sales: SaleFact[],
  expenses: CostFact[],
  purchases: CostFact[],
): Totals {
  let revenue = 0;
  let cogs = 0;
  let itemsCount = 0;

  for (const sale of sales) {
    revenue += sale.subtotal - sale.discount;
    for (const line of sale.lines) {
      cogs += line.unitCost * line.quantity;
      itemsCount += line.quantity;
    }
  }

  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const purchaseTotal = purchases.reduce((sum, p) => sum + p.amount, 0);
  const grossProfit = revenue - cogs;

  return {
    revenue,
    cogs,
    grossProfit,
    expenses: expenseTotal,
    netProfit: grossProfit - expenseTotal,
    purchases: purchaseTotal,
    margin: revenue > 0 ? grossProfit / revenue : 0,
    salesCount: sales.length,
    itemsCount,
    averageBasket: sales.length > 0 ? revenue / sales.length : 0,
  };
}

export interface ProductRow {
  key: string;
  name: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

/**
 * A header discount is PRORATED across the lines in proportion to their value,
 * so Σ(line revenue) equals the sale's net revenue and this table reconciles
 * with the summary tiles. Dropping the discount instead makes the two views
 * disagree and looks like a bug.
 */
export function byProduct(sales: SaleFact[]): ProductRow[] {
  const map = new Map<string, ProductRow>();

  for (const sale of sales) {
    const gross = sale.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const factor = gross > 0 ? Math.max(0, gross - sale.discount) / gross : 1;

    for (const line of sale.lines) {
      const row = map.get(line.itemKey) ?? {
        key: line.itemKey,
        name: line.itemName,
        quantity: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
      };
      row.quantity += line.quantity;
      row.revenue += line.unitPrice * line.quantity * factor;
      row.cost += line.unitCost * line.quantity;
      map.set(line.itemKey, row);
    }
  }

  return [...map.values()]
    .map((row) => ({
      ...row,
      profit: row.revenue - row.cost,
      margin: row.revenue > 0 ? (row.revenue - row.cost) / row.revenue : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export interface CustomerRow {
  name: string;
  orders: number;
  revenue: number;
  profit: number;
}

export function byCustomer(sales: SaleFact[]): CustomerRow[] {
  const map = new Map<string, CustomerRow>();

  for (const sale of sales) {
    const name = sale.customerName.trim() || "—";
    const row = map.get(name) ?? { name, orders: 0, revenue: 0, profit: 0 };
    const revenue = sale.subtotal - sale.discount;
    const cost = sale.lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);
    row.orders += 1;
    row.revenue += revenue;
    row.profit += revenue - cost;
    map.set(name, row);
  }

  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export interface SeriesPoint {
  bucket: string;
  label: string;
  revenue: number;
  profit: number;
  expenses: number;
}

/**
 * Emits EVERY bucket in the window, including empty ones. Plotting only the
 * days that happen to have a sale spaces two sales a fortnight apart the same
 * as two on consecutive days — the line's slope, the whole reason to draw it,
 * becomes meaningless.
 *
 * Switches day→month buckets past ~70 days (a year of daily points is 365
 * unreadable slivers). Cursor loops are capped so a corrupt date can't spin
 * forever inside a render.
 */
export function buildSeries(
  sales: SaleFact[],
  expenses: CostFact[],
  range: DateRange,
): SeriesPoint[] {
  // For `max`, fall back to the extent of the data INCLUDING expense-only days,
  // or a month with costs and no sales is cropped out of its own loss.
  const days = [...sales.map((s) => s.day), ...expenses.map((e) => e.day)].filter(Boolean).sort();
  const from = range.from ?? days[0] ?? toLocalDay(new Date());
  const to = range.to ?? days[days.length - 1] ?? toLocalDay(new Date());
  if (from > to) return [];

  const span = daysBetween(from, to);
  const monthly = span > 70;

  const points = new Map<string, SeriesPoint>();

  if (monthly) {
    let cursor = from.slice(0, 7);
    const last = to.slice(0, 7);
    for (let i = 0; i < 400 && cursor <= last; i += 1) {
      points.set(cursor, { bucket: cursor, label: cursor, revenue: 0, profit: 0, expenses: 0 });
      const [y, m] = cursor.split("-").map(Number);
      const next = new Date(y, m, 1);
      cursor = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    }
  } else {
    let cursor = from;
    for (let i = 0; i < 600 && cursor <= to; i += 1) {
      points.set(cursor, {
        bucket: cursor,
        label: cursor.slice(5),
        revenue: 0,
        profit: 0,
        expenses: 0,
      });
      cursor = shiftDays(cursor, 1);
    }
  }

  const bucketOf = (day: string) => (monthly ? day.slice(0, 7) : day);

  for (const sale of sales) {
    const point = points.get(bucketOf(sale.day));
    if (!point) continue;
    const revenue = sale.subtotal - sale.discount;
    const cost = sale.lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);
    point.revenue += revenue;
    point.profit += revenue - cost;
  }

  for (const expense of expenses) {
    const point = points.get(bucketOf(expense.day));
    if (!point) continue;
    point.expenses += expense.amount;
    point.profit -= expense.amount;
  }

  return [...points.values()];
}
