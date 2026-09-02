import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, getToken } from "../lib/api.js";
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
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [retryKey]);

  if (notLoggedIn) {
    return (
      <Card className="mt-2">
        <EmptyState
          title="Log in to see your trade history"
          body="Your fills live behind an account."
          action={<Link to="/login"><Button>Log in</Button></Link>}
        />
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => setRetryKey((k) => k + 1)} />;
  if (!trades) return <p className="pt-6 text-muted">Loading…</p>;

  return (
    <Reveal>
    <Card className="mt-2">
      {trades.length === 0 ? (
        <EmptyState title="No trades yet" body="Place your first order on the dashboard to see it here." />
      ) : (
        <>
          {/* Desktop: full table — plenty of width for five columns. */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="pb-3">Date</th>
                <th className="pb-3">Asset</th>
                <th className="pb-3">Side</th>
                <th className="pb-3">Quantity</th>
                <th className="pb-3">Price</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="py-3 text-muted">{new Date(t.executedAt).toLocaleString()}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2 font-bold">
                      <AssetIcon asset={t.asset} size={20} />
                      {t.asset}
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge tone={t.side === "BUY" ? "positive" : "negative"}>{t.side === "BUY" ? "Buy" : "Sell"}</Badge>
                  </td>
                  <td className="num py-3">{formatUnits(t.quantity)}</td>
                  <td className="num py-3 font-semibold">{formatCents(t.priceCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: five columns don't fit side by side at this width — stack each trade as a
              two-line row instead of squeezing a table (which used to run headers/values together). */}
          <div className="flex flex-col md:hidden">
            {trades.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-border py-3 first:border-t-0">
                <Badge tone={t.side === "BUY" ? "positive" : "negative"}>{t.side === "BUY" ? "Buy" : "Sell"}</Badge>
                <AssetIcon asset={t.asset} size={20} />
                <span className="text-sm font-bold">{t.asset}</span>
                <span className="num ml-auto text-sm font-semibold">{formatCents(t.priceCents)}</span>
                <div className="flex w-full items-center justify-between text-xs text-muted">
                  <span className="num">{formatUnits(t.quantity)} {t.asset}</span>
                  <span>{new Date(t.executedAt).toLocaleString()}</span>
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
