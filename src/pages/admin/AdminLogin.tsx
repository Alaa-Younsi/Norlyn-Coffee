import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSeo } from "@/hooks/useSeo";

export function AdminLogin() {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useSeo({ title: "Admin — Norlyn Coffee" });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const { error: authError } = await signIn(email, password);
    setLoading(false);
    if (authError) {
      setError(true);
      return;
    }
    navigate("/admin");
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Panel className="w-full max-w-sm p-8">
        <img
          src="/images/norlyn-logo.webp"
          alt="Norlyn Coffee"
          width={640}
          height={237}
          className="norlyn-logo mx-auto h-10 w-auto"
        />
        <h1 className="mt-5 text-center font-display text-2xl">{t("admin.login.title")}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <FieldWrapper label={t("admin.login.email")}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </FieldWrapper>
          <FieldWrapper label={t("admin.login.password")}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </FieldWrapper>
          {error && <p className="text-sm text-red-700 dark:text-red-400">{t("admin.login.error")}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("common.loading") : t("admin.login.submit")}
          </Button>
        </form>
      </Panel>
    </main>
  );
}
