import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, clearToken, getToken } from "../lib/api.js";
import { useLanguage } from "../lib/i18n/index.js";
import { formatCents } from "../lib/format.js";
import { Card } from "../components/Card.js";
import { Button } from "../components/Button.js";
import { Avatar } from "../components/Avatar.js";
import { ErrorState } from "../components/ErrorState.js";
import { Reveal } from "../components/Reveal.js";

interface Me {
  id: string;
  email: string;
  displayName: string;
  balanceCents: string;
}

export function AccountPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    setError(null);
    apiFetch<Me>("/me")
      .then(setMe)
      .catch((err) => setError(err instanceof Error ? err.message : t("common.failedToLoad")));
  }, [retryKey, navigate, t]);

  function logout() {
    clearToken();
    navigate("/");
  }

  if (error) return <ErrorState message={error} onRetry={() => setRetryKey((k) => k + 1)} />;
  if (!me) return <p className="pt-6 text-muted">{t("common.loading")}</p>;

  return (
    <Reveal>
      <Card className="mx-auto mt-8 max-w-sm">
        <div className="mb-5 flex flex-col items-center text-center">
          <Avatar size={56} />
          <h1 className="mt-3 text-xl font-bold">{me.displayName}</h1>
          <p className="mt-1 text-sm text-muted">{me.email}</p>
        </div>

        <div className="rounded-xl border border-border px-4 py-3">
          <div className="text-xs font-semibold text-muted">{t("account.balance")}</div>
          <div className="num mt-1 text-lg font-bold">{formatCents(me.balanceCents)}</div>
        </div>

        <Button variant="secondary" className="mt-5 w-full" onClick={logout}>
          {t("account.logout")}
        </Button>
      </Card>
    </Reveal>
  );
}
