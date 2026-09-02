import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api.js";
import { useLanguage } from "../lib/i18n/index.js";
import { formatCents } from "../lib/format.js";
import { Card } from "../components/Card.js";
import { Badge } from "../components/Badge.js";
import { EmptyState } from "../components/EmptyState.js";
import { ErrorState } from "../components/ErrorState.js";
import { Reveal } from "../components/Reveal.js";

interface LeaderboardEntry {
  displayName: string;
  pnlCents: string;
}

export function LeaderboardPage() {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setError(null);
    apiFetch<LeaderboardEntry[]>("/leaderboard")
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : t("common.failedToLoad")));
  }, [retryKey]);

  if (error) return <ErrorState message={error} onRetry={() => setRetryKey((k) => k + 1)} />;
  if (!entries) return <p className="pt-6 text-muted">{t("common.loading")}</p>;

  return (
    <div className="mt-2 space-y-2">
      {entries.length === 0 ? (
        <Card>
          <EmptyState title={t("leaderboard.noTraders")} body={t("leaderboard.beFirst")} />
        </Card>
      ) : (
        entries.map((e, i) => {
          const pnl = Number(e.pnlCents);
          return (
            <Reveal key={e.displayName} delay={Math.min(i, 8) * 40}>
              <Card className="flex items-center justify-between !p-4">
                <div className="flex items-center gap-3 font-semibold">
                  <span className="w-6 text-muted">#{i + 1}</span>
                  {e.displayName}
                </div>
                <Badge tone={pnl >= 0 ? "positive" : "negative"}>{formatCents(e.pnlCents)}</Badge>
              </Card>
            </Reveal>
          );
        })
      )}
    </div>
  );
}
