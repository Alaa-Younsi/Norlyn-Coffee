import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, LogIn, Pencil, Plus, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Select } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { useActivityLog, useTeamOverview } from "@/hooks/useAdminActivity";
import type { ActivityFilters } from "@/hooks/useAdminActivity";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import { ADMIN_SECTIONS } from "@/lib/adminSections";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityValue, AdminActivity, AdminActivityAction } from "@/types/db";

/**
 * Which dashboard section each audited table belongs to.
 * KEEP IN SYNC with the trigger list in supabase/migrations/0020 — a table
 * missing here still logs, it just shows its raw name and has no filter.
 */
const TABLE_SECTION: Record<string, string> = {
  products: "products",
  product_images: "products",
  product_costs: "finance",
  categories: "categories",
  orders: "orders",
  order_items: "orders",
  delivery_prices: "delivery",
  client_reviews: "reviews",
  store_settings: "settings",
  admin_profiles: "team",
  meta_pixels: "pixels",
  media_slides: "content",
  site_images: "content",
  site_videos: "content",
  articles: "articles",
  contact_messages: "messages",
  newsletter_subscribers: "newsletter",
  expenses: "finance",
  stock_purchases: "finance",
  suppliers: "store",
  store_products: "store",
  store_sales: "store",
  store_sale_items: "store",
};

const SECTION_LABEL = new Map(ADMIN_SECTIONS.map((s) => [s.key, s.labelKey]));
const FILTER_SECTIONS = ADMIN_SECTIONS.filter((s) =>
  Object.values(TABLE_SECTION).includes(s.key),
);

const ACTION_META: Record<AdminActivityAction, { icon: LucideIcon; labelKey: TranslationKey; tone: string }> = {
  insert: { icon: Plus, labelKey: "admin.activity.insert", tone: "text-emerald-700 dark:text-emerald-400" },
  update: { icon: Pencil, labelKey: "admin.activity.update", tone: "text-brand" },
  delete: { icon: Trash2, labelKey: "admin.activity.delete", tone: "text-red-700 dark:text-red-400" },
  login: { icon: LogIn, labelKey: "admin.activity.login", tone: "text-muted" },
};

const KINDS: Array<{ value: ActivityFilters["kind"]; labelKey: TranslationKey }> = [
  { value: "all", labelKey: "admin.activity.kindAll" },
  { value: "changes", labelKey: "admin.activity.kindChanges" },
  { value: "login", labelKey: "admin.activity.kindLogins" },
];

export function AdminActivity() {
  const { t, lang } = useLanguage();
  const [params, setParams] = useSearchParams();
  const actorId = params.get("actor");
  const section = params.get("section");
  const [kind, setKind] = useState<ActivityFilters["kind"]>("all");

  const { data: team } = useTeamOverview();

  const filters = useMemo<ActivityFilters>(
    () => ({
      actorId,
      tables: section
        ? Object.entries(TABLE_SECTION)
            .filter(([, key]) => key === section)
            .map(([table]) => table)
        : null,
      kind: section && kind === "login" ? "all" : kind,
    }),
    [actorId, section, kind],
  );
  const log = useActivityLog(filters);
  const entries = log.data?.pages.flat() ?? [];

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const never = t("admin.activity.never");

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-3xl">{t("admin.activity.title")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t("admin.activity.subtitle")}</p>

      {/* ------------------------------------------------ accounts overview */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(team ?? []).map((member) => {
          const selected = actorId === member.user_id;
          return (
            <button
              key={member.user_id}
              type="button"
              onClick={() => setParam("actor", selected ? "" : member.user_id)}
              className={cn(
                "cursor-pointer rounded-2xl border p-4 text-start transition-colors",
                selected ? "border-brand bg-brand/10" : "border-line bg-panel/80 hover:border-brand/50",
                !member.active && "opacity-60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium" dir="ltr">
                  {member.email}
                </span>
                <span className="shrink-0 rounded-full bg-panel-2 px-2 py-0.5 text-[11px] text-muted">
                  {member.is_owner
                    ? t("admin.account.owner")
                    : member.active
                      ? t("admin.account.worker")
                      : t("admin.team.inactive")}
                </span>
              </div>
              <dl className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t("admin.activity.lastLogin")}</dt>
                  <dd>{member.last_sign_in_at ? formatDate(member.last_sign_in_at, lang) : never}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t("admin.activity.lastAction")}</dt>
                  <dd>{member.last_action_at ? formatDate(member.last_action_at, lang) : never}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t("admin.activity.actions7d")}</dt>
                  <dd className="font-medium">{member.actions_7d}</dd>
                </div>
              </dl>
            </button>
          );
        })}
      </div>

      {/* --------------------------------------------------------- filters */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <FieldWrapper label={t("admin.activity.filterAccount")}>
          <Select value={actorId ?? ""} onChange={(e) => setParam("actor", e.target.value)}>
            <option value="">{t("admin.activity.allAccounts")}</option>
            {(team ?? []).map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.email}
              </option>
            ))}
          </Select>
        </FieldWrapper>
        <FieldWrapper label={t("admin.activity.filterSection")}>
          <Select value={section ?? ""} onChange={(e) => setParam("section", e.target.value)}>
            <option value="">{t("admin.activity.allSections")}</option>
            {FILTER_SECTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {t(s.labelKey)}
              </option>
            ))}
          </Select>
        </FieldWrapper>
        <FieldWrapper label={t("admin.activity.filterKind")}>
          <Select
            value={filters.kind}
            onChange={(e) => setKind(e.target.value as ActivityFilters["kind"])}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value} disabled={Boolean(section) && k.value === "login"}>
                {t(k.labelKey)}
              </option>
            ))}
          </Select>
        </FieldWrapper>
      </div>

      {/* ------------------------------------------------------------- log */}
      {log.isLoading && <p className="mt-6 text-sm text-muted">{t("common.loading")}</p>}
      {log.isError && (
        <Panel className="mt-6 p-6 text-sm text-red-700 dark:text-red-400">
          {t("admin.activity.loadError")}
        </Panel>
      )}
      {!log.isLoading && !log.isError && entries.length === 0 && (
        <Panel className="mt-6 p-6 text-sm text-muted">{t("admin.activity.none")}</Panel>
      )}

      {entries.length > 0 && (
        <Panel className="mt-6 divide-y divide-line overflow-hidden">
          {entries.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} />
          ))}
        </Panel>
      )}

      {log.hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void log.fetchNextPage()}
            disabled={log.isFetchingNextPage}
          >
            {log.isFetchingNextPage ? t("common.loading") : t("admin.activity.loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}

function ActivityRow({ entry }: { entry: AdminActivity }) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const meta = ACTION_META[entry.action];
  const sectionKey = entry.table_name ? TABLE_SECTION[entry.table_name] : undefined;
  const sectionLabelKey = sectionKey ? SECTION_LABEL.get(sectionKey) : undefined;
  const fields = Object.entries(entry.changes ?? {});
  const expandable = entry.action !== "login" && fields.length > 0;

  return (
    <div className="px-5 py-3.5">
      <button
        type="button"
        onClick={() => expandable && setOpen((v) => !v)}
        className={cn(
          "flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-start text-sm",
          expandable && "cursor-pointer",
        )}
        aria-expanded={expandable ? open : undefined}
      >
        <meta.icon size={15} className={cn("shrink-0", meta.tone)} />
        <span className="text-xs text-muted tabular-nums">{formatDate(entry.at, lang)}</span>
        <span className="font-medium" dir="ltr">
          {entry.actor_email ?? "—"}
        </span>
        <span className={meta.tone}>{t(meta.labelKey)}</span>
        {entry.table_name && (
          <span className="rounded-full bg-panel-2 px-2 py-0.5 text-xs text-muted">
            {sectionLabelKey ? t(sectionLabelKey) : entry.table_name}
          </span>
        )}
        {entry.record_label && <span className="truncate text-ink/80">« {entry.record_label} »</span>}
        {expandable && (
          <ChevronDown
            size={14}
            className={cn("ms-auto text-muted transition-transform", open && "rotate-180")}
          />
        )}
      </button>

      {open && (
        <dl className="mt-3 grid gap-1.5 rounded-xl border border-line bg-panel-2/50 p-3 text-xs">
          {fields.map(([field, value]) => (
            <div key={field} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
              <dt className="font-mono text-muted" dir="ltr">
                {field}
              </dt>
              <dd className="break-words" dir="auto">
                {entry.action === "update" && Array.isArray(value) && value.length === 2 ? (
                  <>
                    <span className="text-red-700 line-through decoration-red-700/40 dark:text-red-400">
                      {display(value[0])}
                    </span>
                    <span className="mx-1.5 text-muted">→</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{display(value[1])}</span>
                  </>
                ) : (
                  display(value)
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function display(value: ActivityValue): string {
  if (value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "✓" : "✗";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}
