import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { useAuth } from "@/hooks/useAuth";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ADMIN_SECTIONS } from "@/lib/adminSections";
import { supabase } from "@/lib/supabase";

const MIN_LENGTH = 8;

export function AdminAccount() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const { profile, isOwner } = useAdminProfile(session?.user.id);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const email = session?.user.email ?? "";

  const grantedLabels = isOwner
    ? [t("admin.account.allSections")]
    : ADMIN_SECTIONS.filter((s) => profile?.sections.includes(s.key)).map((s) => t(s.labelKey));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (next.length < MIN_LENGTH) {
      setStatus({ tone: "error", text: t("admin.account.tooShort") });
      return;
    }
    if (next !== confirm) {
      setStatus({ tone: "error", text: t("admin.account.mismatch") });
      return;
    }

    setBusy(true);
    try {
      // Re-verify the CURRENT password before writing the new one — this is the
      // point of the feature, not ceremony. A Supabase session outlives the
      // browser tab by days, and updateUser({password}) asks for no proof of
      // the old one: the access token is all it checks. A failed sign-in
      // returns an error WITHOUT disturbing the session we already hold.
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (authError) {
        setStatus({ tone: "error", text: t("admin.account.wrongPassword") });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        setStatus({ tone: "error", text: error.message });
        return;
      }

      setStatus({ tone: "ok", text: t("admin.account.updated") });
      setCurrent("");
      setNext("");
      setConfirm("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">{t("admin.account.title")}</h1>

      <Panel className="mt-6 p-6">
        <dl className="space-y-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">{t("admin.account.email")}</dt>
            <dd dir="ltr">{email}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">{t("admin.account.role")}</dt>
            <dd>{isOwner ? t("admin.account.owner") : t("admin.account.worker")}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">{t("admin.account.sections")}</dt>
            <dd className="text-end">{grantedLabels.join(" · ") || "—"}</dd>
          </div>
        </dl>
      </Panel>

      <Panel className="mt-6 p-6">
        <h2 className="font-display text-xl">{t("admin.account.changePassword")}</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <FieldWrapper label={t("admin.account.current")}>
            <Input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </FieldWrapper>
          <FieldWrapper label={t("admin.account.new")}>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={MIN_LENGTH}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
          </FieldWrapper>
          <FieldWrapper label={t("admin.account.confirm")}>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={MIN_LENGTH}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </FieldWrapper>

          {status && (
            <p
              className={
                status.tone === "ok" ? "text-sm text-brand" : "text-sm text-red-700 dark:text-red-400"
              }
            >
              {status.text}
            </p>
          )}

          <Button type="submit" disabled={busy}>
            {busy ? t("common.saving") : t("admin.account.submit")}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
