import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, getToken } from "../lib/api.js";
import { useLanguage } from "../lib/i18n/index.js";
import { formatCents, formatUnits } from "../lib/format.js";
import { Card } from "../components/Card.js";
import { Badge } from "../components/Badge.js";
import { Button } from "../components/Button.js";
import { AssetIcon } from "../components/AssetIcon.js";
import { EmptyState } from "../components/EmptyState.js";
import { ErrorState } from "../components/ErrorState.js";
import { Reveal } from "../components/Reveal.js";
import type { AssetSymbol } from "../lib/binanceSocket.js";

interface Trade {
  id: string;
  asset: AssetSymbol;
  side: "BUY" | "SELL";
  quantity: string;
  priceCents: string;
  executedAt: string;
}

export function HistoryPage() {
  const { t } = useLanguage();
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      setNotLoggedIn(true);
      return;
    }
    setError(null);
    apiFetch<Trade[]>("/trades")
      .then(setTrades)
      .catch((err) => setError(err instanceof Error ? err.message : t("common.failedToLoad")));
  }, [retryKey]);

  if (notLoggedIn) {
    return (
      <Card className="mt-2">
        <EmptyState
          title={t("history.loginToSee")}
          body={t("history.behindAccount")}
          action={<Link to="/login"><Button>{t("common.login")}</Button></Link>}
        />
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => setRetryKey((k) => k + 1)} />;
  if (!trades) return <p className="pt-6 text-muted">{t("common.loading")}</p>;

  return (
    <Reveal>
    <Card className="mt-2">
      {trades.length === 0 ? (
        <EmptyState title={t("history.noTrades")} body={t("history.placeFirstOrder")} />
      ) : (
        <>
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="pb-3">{t("history.date")}</th>
                <th className="pb-3">{t("common.asset")}</th>
                <th className="pb-3">{t("history.side")}</th>
                <th className="pb-3">{t("common.quantity")}</th>
                <th className="pb-3">{t("history.price")}</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="border-t border-border">
                  <td className="py-3 text-muted">{new Date(trade.executedAt).toLocaleString()}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2 font-bold">
                      <AssetIcon asset={trade.asset} size={20} />
                      {trade.asset}
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge tone={trade.side === "BUY" ? "positive" : "negative"}>
                      {trade.side === "BUY" ? t("common.buy") : t("common.sell")}
                    </Badge>
                  </td>
                  <td className="num py-3">{formatUnits(trade.quantity)}</td>
                  <td className="num py-3 font-semibold">{formatCents(trade.priceCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col md:hidden">
            {trades.map((trade) => (
              <div key={trade.id} className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-border py-3 first:border-t-0">
                <Badge tone={trade.side === "BUY" ? "positive" : "negative"}>
                  {trade.side === "BUY" ? t("common.buy") : t("common.sell")}
                </Badge>
                <AssetIcon asset={trade.asset} size={20} />
                <span className="text-sm font-bold">{trade.asset}</span>
                <span className="num ml-auto text-sm font-semibold">{formatCents(trade.priceCents)}</span>
                <div className="flex w-full items-center justify-between text-xs text-muted">
                  <span className="num">{formatUnits(trade.quantity)} {trade.asset}</span>
                  <span>{new Date(trade.executedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
    </Reveal>
  );
}
