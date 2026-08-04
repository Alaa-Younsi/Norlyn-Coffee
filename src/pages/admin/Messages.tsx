import { useState } from "react";
import { Archive, Mail, MailOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import {
  useContactMessages,
  useDeleteMessage,
  useUpdateMessageStatus,
} from "@/hooks/useSiteContent";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MessageStatus } from "@/types/db";

const FILTERS: Array<{ value: MessageStatus | "all"; labelKey: TranslationKey }> = [
  { value: "all", labelKey: "admin.messages.filterAll" },
  { value: "new", labelKey: "admin.messages.filterNew" },
  { value: "read", labelKey: "admin.messages.filterRead" },
  { value: "archived", labelKey: "admin.messages.filterArchived" },
];

export function AdminMessages() {
  const { t, lang } = useLanguage();
  const { data: messages, isLoading } = useContactMessages();
  const updateStatus = useUpdateMessageStatus();
  const deleteMessage = useDeleteMessage();
  const [filter, setFilter] = useState<MessageStatus | "all">("all");

  const rows = (messages ?? []).filter((m) => filter === "all" || m.status === filter);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">{t("admin.messages.title")}</h1>

      {/* scrolls horizontally, never wraps: a wrapped row changes height between
          FR and AR and reflows the page under the user's thumb mid-tap */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors cursor-pointer",
              filter === option.value
                ? "border-brand bg-brand/10 font-medium text-brand"
                : "border-line text-muted hover:border-brand/50",
            )}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-6 text-sm text-muted">{t("common.loading")}</p>}
      {!isLoading && rows.length === 0 && (
        <Panel className="mt-6 p-6 text-sm text-muted">{t("admin.messages.none")}</Panel>
      )}

      <div className="mt-6 space-y-3">
        {rows.map((message) => (
          <Panel
            key={message.id}
            className={cn("p-5", message.status === "archived" && "opacity-60")}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  {message.status === "new" ? (
                    <Mail size={15} className="text-brand" />
                  ) : (
                    <MailOpen size={15} className="text-muted" />
                  )}
                  {message.name}
                </p>
                <p className="mt-0.5 text-xs text-muted" dir="ltr">
                  {[message.email, message.phone].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="text-xs text-muted">{formatDate(message.created_at, lang)}</p>
            </div>

            {message.subject && (
              <p className="mt-3 text-sm font-medium">{message.subject}</p>
            )}
            <p className="mt-1 whitespace-pre-line text-sm text-ink/85">{message.message}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {message.status === "new" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatus.mutate({ id: message.id, status: "read" })}
                >
                  {t("admin.messages.markRead")}
                </Button>
              )}
              {message.status !== "archived" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateStatus.mutate({ id: message.id, status: "archived" })}
                >
                  <Archive size={14} />
                  {t("admin.messages.archive")}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("common.delete")}
                onClick={() => {
                  if (confirm(t("admin.messages.deleteConfirm"))) deleteMessage.mutate(message.id);
                }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
