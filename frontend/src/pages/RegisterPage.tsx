import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, setToken } from "../lib/api.js";
import { useLanguage } from "../lib/i18n/index.js";
import { Card } from "../components/Card.js";
import { Button } from "../components/Button.js";
import { Reveal } from "../components/Reveal.js";
import { PasswordInput } from "../components/PasswordInput.js";

export function RegisterPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token } = await apiFetch<{ token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
      });
      setToken(token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.registrationFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Reveal>
      <Card className="mx-auto mt-8 max-w-sm">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12 text-accent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="2" />
              <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-xl font-bold">{t("register.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("register.subtitle")}</p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <label className="block">
            <div className="mb-1.5 text-xs font-semibold text-muted">{t("register.displayName")}</div>
            <input
              className="w-full rounded-xl border border-border bg-transparent px-3.5 py-3 text-sm outline-none transition-colors focus:border-accent"
              autoComplete="nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label className="block">
            <div className="mb-1.5 text-xs font-semibold text-muted">{t("auth.email")}</div>
            <input
              className="w-full rounded-xl border border-border bg-transparent px-3.5 py-3 text-sm outline-none transition-colors focus:border-accent"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <div className="mb-1.5 text-xs font-semibold text-muted">{t("auth.password")}</div>
            <PasswordInput
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-negative-bg px-3.5 py-2.5 text-sm text-negative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t("register.submitting") : t("register.submit")}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {t("register.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-fg hover:text-accent">
            {t("register.loginLink")}
          </Link>
        </p>
      </Card>
    </Reveal>
  );
}
