import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { Switch } from "@/components/ui/Switch";
import { useAuth } from "@/hooks/useAuth";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { useNotificationPrefs, useSaveNotificationPrefs } from "@/hooks/useNotificationPrefs";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ADMIN_SECTIONS } from "@/lib/adminSections";
import { supabase } from "@/lib/supabase";
import type { AdminNotificationPrefs } from "@/types/db";

const MIN_LENGTH = 8;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;
const CALLMEBOT_ACTIVATE_URL =
  "https://wa.me/34644717104?text=" + encodeURIComponent("I allow callmebot to send me messages");

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

      <NotificationPrefsPanel userId={session?.user.id} defaultEmail={email} />
    </div>
  );
}

function NotificationPrefsPanel({
  userId,
  defaultEmail,
}: {
  userId: string | undefined;
  defaultEmail: string;
}) {
  const { data: prefs, isLoading } = useNotificationPrefs(userId);

  // Remount (via `key`) once the row has loaded rather than seeding it from
  // an effect: a setState-in-effect here would fire on every load, which the
  // project's react-hooks/set-state-in-effect rule treats as a build error —
  // same trap as ProductForm's `key={product?.id ?? "new"}` remount.
  if (isLoading) return null;
  return <NotificationPrefsForm key={userId} userId={userId} defaultEmail={defaultEmail} initial={prefs} />;
}

function NotificationPrefsForm({
  userId,
  defaultEmail,
  initial,
}: {
  userId: string | undefined;
  defaultEmail: string;
  initial: AdminNotificationPrefs | null | undefined;
}) {
  const { t } = useLanguage();
  const save = useSaveNotificationPrefs(userId);

  const [emailEnabled, setEmailEnabled] = useState(initial?.email_enabled ?? false);
  const [notifyEmail, setNotifyEmail] = useState(initial?.notify_email ?? defaultEmail);
  const [whatsappEnabled, setWhatsappEnabled] = useState(initial?.whatsapp_enabled ?? false);
  const [whatsappNumber, setWhatsappNumber] = useState(initial?.whatsapp_number ?? "");
  const [apikey, setApikey] = useState(initial?.callmebot_apikey ?? "");
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (emailEnabled && !EMAIL_RE.test(notifyEmail.trim())) {
      setStatus({ tone: "error", text: t("admin.account.notifEmailInvalid") });
      return;
    }
    if (whatsappEnabled && (!whatsappNumber.trim() || !apikey.trim())) {
      setStatus({ tone: "error", text: t("admin.account.notifWhatsappIncomplete") });
      return;
    }

    save.mutate(
      {
        email_enabled: emailEnabled,
        notify_email: notifyEmail.trim() || null,
        whatsapp_enabled: whatsappEnabled,
        whatsapp_number: whatsappNumber.trim() || null,
        callmebot_apikey: apikey.trim() || null,
      },
      {
        onSuccess: () => setStatus({ tone: "ok", text: t("admin.account.notifSaved") }),
        onError: (err) =>
          setStatus({ tone: "error", text: err instanceof Error ? err.message : String(err) }),
      },
    );
  };

  return (
    <Panel className="mt-6 p-6">
      <h2 className="font-display text-xl">{t("admin.account.notifTitle")}</h2>
      <p className="mt-1 text-sm text-muted">{t("admin.account.notifSubtitle")}</p>

      <form onSubmit={submit} className="mt-4 space-y-5">
        <div className="rounded-2xl border border-line p-4">
          <Switch
            checked={emailEnabled}
            onChange={setEmailEnabled}
            label={t("admin.account.notifEmailToggle")}
          />
          {emailEnabled && (
            <FieldWrapper label={t("admin.account.notifEmailLabel")} className="mt-3">
              <Input
                type="email"
                dir="ltr"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
              />
            </FieldWrapper>
          )}
        </div>

        <div className="rounded-2xl border border-line p-4">
          <Switch
            checked={whatsappEnabled}
            onChange={setWhatsappEnabled}
            label={t("admin.account.notifWhatsappToggle")}
          />
          {whatsappEnabled && (
            <div className="mt-3 space-y-3">
              <FieldWrapper
                label={t("admin.account.notifWhatsappNumberLabel")}
                hint={t("admin.account.notifWhatsappNumberHint")}
              >
                <Input
                  dir="ltr"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="213555000000"
                />
              </FieldWrapper>
              <FieldWrapper
                label={t("admin.account.notifApikeyLabel")}
                hint={t("admin.account.notifApikeyHint")}
              >
                <Input dir="ltr" value={apikey} onChange={(e) => setApikey(e.target.value)} />
              </FieldWrapper>
              <a
                href={CALLMEBOT_ACTIVATE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
              >
                <MessageCircle size={15} />
                {t("admin.account.notifActivateLink")}
              </a>
            </div>
          )}
        </div>

        {status && (
          <p
            className={
              status.tone === "ok" ? "text-sm text-brand" : "text-sm text-red-700 dark:text-red-400"
            }
          >
            {status.text}
          </p>
        )}

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? t("admin.account.notifSaving") : t("admin.account.notifSave")}
        </Button>
      </form>
    </Panel>
  );
}
