import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { useLanguage } from "@/i18n/LanguageProvider";
import { GRANTABLE_SECTIONS } from "@/lib/adminSections";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { AdminProfile } from "@/types/db";

const MIN_PASSWORD = 8;

function useWorkers() {
  return useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async (): Promise<AdminProfile[]> => {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as AdminProfile[];
    },
  });
}

/**
 * supabase.functions.invoke throws a FunctionsHttpError whose body is NOT on
 * error.message — without reading the response, "email already exists" looks
 * like a generic bug.
 */
async function readFunctionErrorCode(error: unknown): Promise<string> {
  const context = (error as { context?: Response }).context;
  if (!context) return "generic";
  try {
    const body = (await context.json()) as { code?: string };
    return body.code ?? "generic";
  } catch {
    return "generic";
  }
}

export function AdminTeam() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: profiles } = useWorkers();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const createWorker = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("create-worker", {
        body: { email, password, sections },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setStatus({ tone: "ok", text: t("admin.team.created") });
      setEmail("");
      setPassword("");
      setSections([]);
      void queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
    onError: async (error) => {
      const code = await readFunctionErrorCode(error);
      const map: Record<string, string> = {
        email_exists: t("admin.team.errEmailExists"),
        weak_password: t("admin.team.errWeak"),
        forbidden: t("admin.team.errForbidden"),
      };
      setStatus({ tone: "error", text: map[code] ?? t("admin.team.errGeneric") });
    },
  });

  const workers = (profiles ?? []).filter((p) => !p.is_owner);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl">{t("admin.team.title")}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">{t("admin.team.subtitle")}</p>

      <Panel className="mt-6 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl">
          <UserPlus size={18} className="text-brand" />
          {t("admin.team.create")}
        </h2>

        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setStatus(null);
            createWorker.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrapper label={t("admin.team.email")}>
              <Input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FieldWrapper>
            <FieldWrapper label={t("admin.team.password")}>
              <Input
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </FieldWrapper>
          </div>
          <p className="-mt-2 text-xs text-muted">{t("admin.team.passwordHint")}</p>

          <SectionGrid
            selected={sections}
            onToggle={(key) =>
              setSections((prev) =>
                prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
              )
            }
          />

          {status && (
            <p
              className={cn(
                "text-sm",
                status.tone === "ok" ? "text-brand" : "text-red-700 dark:text-red-400",
              )}
            >
              {status.text}
            </p>
          )}

          <Button type="submit" disabled={createWorker.isPending}>
            {createWorker.isPending ? t("admin.team.creating") : t("admin.team.createSubmit")}
          </Button>
        </form>
      </Panel>

      <h2 className="mt-10 font-display text-2xl">{t("admin.team.workers")}</h2>
      <p className="mt-1 text-xs text-muted">{t("admin.team.deactivateHint")}</p>

      {workers.length === 0 ? (
        <Panel className="mt-4 p-6 text-sm text-muted">{t("admin.team.noWorkers")}</Panel>
      ) : (
        <div className="mt-4 space-y-4">
          {workers.map((worker) => (
            <WorkerPanel key={worker.user_id} worker={worker} />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionGrid({
  selected,
  onToggle,
  disabled,
}: {
  selected: string[];
  onToggle: (key: string) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{t("admin.team.sections")}</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {GRANTABLE_SECTIONS.map((section) => {
          const checked = selected.includes(section.key);
          return (
            <label
              key={section.key}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                checked ? "border-brand bg-brand/10 text-ink" : "border-line text-muted hover:border-brand/50",
                disabled && "pointer-events-none opacity-60",
              )}
            >
              <input
                type="checkbox"
                className="accent-[rgb(var(--c-brand))]"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(section.key)}
              />
              <section.icon size={15} strokeWidth={1.8} />
              {t(section.labelKey)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function WorkerPanel({ worker }: { worker: AdminProfile }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string[]>(worker.sections);

  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetStatus, setResetStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  const dirty =
    draft.length !== worker.sections.length ||
    draft.some((key) => !worker.sections.includes(key));

  const save = useMutation({
    mutationFn: async (values: Partial<AdminProfile>) => {
      const { error } = await supabase
        .from("admin_profiles")
        .update(values)
        .eq("user_id", worker.user_id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-profiles"] }),
  });

  const resetPassword = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("update-worker-password", {
        body: { user_id: worker.user_id, password: newPassword },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setResetStatus({ tone: "ok", text: t("admin.team.resetSuccess") });
      setNewPassword("");
    },
    onError: async (error) => {
      const code = await readFunctionErrorCode(error);
      const map: Record<string, string> = {
        weak_password: t("admin.team.errWeak"),
        forbidden: t("admin.team.errForbidden"),
        not_found: t("admin.team.resetErrNotFound"),
      };
      setResetStatus({ tone: "error", text: map[code] ?? t("admin.team.errGeneric") });
    },
  });

  return (
    <Panel className={cn("p-5", !worker.active && "opacity-60")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand" />
          <span className="text-sm font-medium" dir="ltr">
            {worker.email}
          </span>
          {!worker.active && (
            <span className="rounded-full bg-panel-2 px-2 py-0.5 text-xs text-muted">
              {t("admin.team.inactive")}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setResetStatus(null);
              setResetOpen((open) => !open);
            }}
          >
            <KeyRound size={14} className="me-1.5" />
            {t("admin.team.resetPassword")}
          </Button>
          <Button
            size="sm"
            variant={worker.active ? "ghost" : "outline"}
            onClick={() => save.mutate({ active: !worker.active })}
            disabled={save.isPending}
          >
            {worker.active ? t("admin.team.deactivate") : t("admin.team.activate")}
          </Button>
        </div>
      </div>

      {resetOpen && (
        <form
          className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-line p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setResetStatus(null);
            resetPassword.mutate();
          }}
        >
          <FieldWrapper label={t("admin.team.newPassword")} className="flex-1 min-w-[12rem]">
            <Input
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </FieldWrapper>
          <Button type="submit" size="sm" disabled={resetPassword.isPending}>
            {resetPassword.isPending ? t("admin.team.resetting") : t("admin.team.resetSubmit")}
          </Button>
          {resetStatus && (
            <p
              className={cn(
                "w-full text-sm",
                resetStatus.tone === "ok" ? "text-brand" : "text-red-700 dark:text-red-400",
              )}
            >
              {resetStatus.text}
            </p>
          )}
        </form>
      )}

      <div className="mt-4">
        <SectionGrid
          selected={draft}
          onToggle={(key) =>
            setDraft((prev) =>
              prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
            )
          }
        />
      </div>

      {/* dirty-state pair — don't write on every tick */}
      {dirty && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={() => save.mutate({ sections: draft })} disabled={save.isPending}>
            {save.isPending ? t("common.saving") : t("common.save")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDraft(worker.sections)}>
            {t("common.cancel")}
          </Button>
        </div>
      )}
    </Panel>
  );
}
