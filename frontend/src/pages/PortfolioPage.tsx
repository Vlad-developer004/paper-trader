import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, getToken } from "../lib/api.js";
import { useLanguage } from "../lib/i18n/index.js";
import { formatCents, formatUnits } from "../lib/format.js";
import { Card } from "../components/Card.js";
import { Badge } from "../components/Badge.js";
import { AssetIcon } from "../components/AssetIcon.js";
import { Button } from "../components/Button.js";
import { EmptyState } from "../components/EmptyState.js";
import { ErrorState } from "../components/ErrorState.js";
import { Reveal } from "../components/Reveal.js";
import type { AssetSymbol } from "../lib/binanceSocket.js";

interface PortfolioData {
  balanceCents: string;
  totalPnlCents: string;
  positions: { asset: AssetSymbol; quantity: string; marketValueCents: string }[];
}

export function PortfolioPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      setNotLoggedIn(true);
      return;
    }
    setError(null);
    apiFetch<PortfolioData>("/portfolio")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : t("common.failedToLoad")));
  }, [retryKey]);

  if (notLoggedIn) {
    return (
      <Card className="mt-2">
        <EmptyState
          title={t("portfolio.loginToSee")}
          body={t("portfolio.behindAccount")}
          action={<Link to="/login"><Button>{t("common.login")}</Button></Link>}
        />
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => setRetryKey((k) => k + 1)} />;
  if (!data) return <p className="pt-6 text-muted">{t("common.loading")}</p>;

  const pnl = Number(data.totalPnlCents);

  return (
    <div className="space-y-6 pt-2">
      <Reveal className="flex flex-wrap gap-x-8 gap-y-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">{t("portfolio.balance")}</div>
          <div className="num mt-1 break-all text-2xl font-bold sm:text-3xl">{formatCents(data.balanceCents)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">{t("dashboard.totalPnl")}</div>
          <div className={`num mt-1 break-all text-2xl font-bold sm:text-3xl ${pnl >= 0 ? "text-positive" : "text-negative"}`}>
            {formatCents(data.totalPnlCents)}
          </div>
        </div>
      </Reveal>

      <Reveal delay={80}>
      <Card>
        {data.positions.length === 0 ? (
          <EmptyState title={t("portfolio.noPositions")} body={t("portfolio.placeTradeToSee")} />
        ) : (
          <>
            <table className="hidden w-full text-left text-sm sm:table">
              <thead className="text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="pb-3">{t("common.asset")}</th>
                  <th className="pb-3">{t("common.quantity")}</th>
                  <th className="pb-3">{t("portfolio.marketValue")}</th>
                </tr>
              </thead>
              <tbody>
                {data.positions.map((p) => (
                  <tr key={p.asset} className="border-t border-border">
                    <td className="py-3">
                      <div className="flex items-center gap-2 font-bold">
                        <AssetIcon asset={p.asset} size={20} />
                        {p.asset}
                      </div>
                    </td>
                    <td className="num py-3">{formatUnits(p.quantity)}</td>
                    <td className="num py-3 font-semibold">{formatCents(p.marketValueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col sm:hidden">
              {data.positions.map((p) => (
                <div key={p.asset} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-border py-3 first:border-t-0">
                  <AssetIcon asset={p.asset} size={20} />
                  <span className="font-bold">{p.asset}</span>
                  <span className="num ml-auto font-semibold">{formatCents(p.marketValueCents)}</span>
                  <span className="num w-full text-xs text-muted">{formatUnits(p.quantity)} {p.asset}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
      </Reveal>
      {pnl !== 0 && (
        <Badge tone={pnl >= 0 ? "positive" : "negative"}>
          {pnl >= 0 ? t("portfolio.up") : t("portfolio.down")} {t("portfolio.overall")}
        </Badge>
      )}
    </div>
  );
}
