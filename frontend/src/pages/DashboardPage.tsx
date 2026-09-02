import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePriceFeed, type AssetSymbol } from "../lib/binanceSocket.js";
import { apiFetch, getToken } from "../lib/api.js";
import { formatCents, formatUnits, splitCents } from "../lib/format.js";
import { Card } from "../components/Card.js";
import { Button } from "../components/Button.js";
import { Badge } from "../components/Badge.js";
import { AssetIcon } from "../components/AssetIcon.js";
import { EmptyState } from "../components/EmptyState.js";
import { ErrorState } from "../components/ErrorState.js";
import { Reveal } from "../components/Reveal.js";
import { PriceChart } from "../components/PriceChart.js";
import { FlashPrice } from "../components/FlashPrice.js";
import { AssetSelect } from "../components/AssetSelect.js";

const ASSETS: AssetSymbol[] = ["BTC", "ETH", "SOL"];

interface PortfolioData {
  balanceCents: string;
  totalPnlCents: string;
  positions: { asset: AssetSymbol; quantity: string; marketValueCents: string }[];
}

interface Trade {
  id: string;
  asset: AssetSymbol;
  side: "BUY" | "SELL";
  quantity: string;
  priceCents: string;
  executedAt: string;
}

function pctChange(current: number | undefined, base: number | undefined): number | null {
  if (!current || !base) return null;
  return ((current - base) / base) * 100;
}

export function DashboardPage() {
  const { prices, basePrices, connected } = usePriceFeed();
  const [asset, setAsset] = useState<AssetSymbol>("BTC");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [quantity, setQuantity] = useState("0.01");
  const [limitPrice, setLimitPrice] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      setLoadError("not-logged-in");
      return;
    }
    setLoadError(null);
    Promise.all([apiFetch<PortfolioData>("/portfolio"), apiFetch<Trade[]>("/trades")])
      .then(([p, t]) => {
        setPortfolio(p);
        setTrades(t);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load"));
  }, [retryKey]);

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      if (orderType === "MARKET") {
        await apiFetch("/orders/market", { method: "POST", body: JSON.stringify({ asset, side, quantity }) });
      } else {
        await apiFetch("/orders/limit", {
          method: "POST",
          body: JSON.stringify({ asset, side, quantity, limitPrice }),
        });
      }
      setMessage("Order placed.");
      setRetryKey((k) => k + 1); // pull the fresh balance/positions/trades right away, don't wait for a reload
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Order failed");
    }
  }

  const pnl = portfolio ? Number(portfolio.totalPnlCents) : 0;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <Reveal className="flex flex-col flex-wrap gap-6 pt-2 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[oklch(0.55_0.1_40)]">
            Demo portfolio <span className="font-serif italic text-base normal-case tracking-normal text-accent">value</span>
          </div>
          <div className="num mt-2 break-all text-5xl font-extrabold tracking-tight md:text-6xl">
            {portfolio ? (
              <>
                {splitCents(portfolio.balanceCents).dollars}
                <span className="text-2xl font-bold opacity-50">.{splitCents(portfolio.balanceCents).cents}</span>
              </>
            ) : (
              "$—"
            )}
          </div>
          {portfolio && (
            <div className="mt-3 flex items-center gap-2.5">
              <Badge tone={pnl >= 0 ? "positive" : "negative"}>
                {pnl >= 0 ? "+" : ""}
                {formatCents(portfolio.totalPnlCents)}
              </Badge>
              <span className="text-sm text-muted">since you started with $10,000</span>
            </div>
          )}
        </div>

        {/* Desktop: horizontal price chips. Mobile gets its own stacked-list layout below —
            these chips are wide enough that a naive reflow would clip the third one off-screen. */}
        <div className="hidden gap-3 md:flex">
          {ASSETS.map((a) => {
            const change = pctChange(prices[a], basePrices[a]);
            return (
              <div key={a} className="min-w-[140px] rounded-2xl border border-border bg-card/85 p-4 backdrop-blur">
                <div className="flex items-center gap-2">
                  <AssetIcon asset={a} size={20} />
                  <span className="text-xs font-bold text-muted">{a}</span>
                </div>
                <FlashPrice price={prices[a]} className="mt-2 text-lg font-bold" />
                {change !== null && (
                  <div className={`mt-0.5 text-xs font-bold ${change >= 0 ? "text-positive" : "text-negative"}`}>
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(2)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Reveal>

      {/* Mobile: ticker as full-width stacked rows, no horizontal scroll/clipping */}
      <div className="flex flex-col gap-2 md:hidden">
        {ASSETS.map((a, i) => {
          const change = pctChange(prices[a], basePrices[a]);
          return (
            <Reveal key={a} delay={i * 60}>
              <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card/90 px-3.5 py-2.5">
                <AssetIcon asset={a} size={24} />
                <span className="flex-1 text-sm font-bold">{a}</span>
                <FlashPrice price={prices[a]} className="text-sm font-bold" />
                {change !== null && (
                  <span className={`w-14 text-right text-xs font-bold ${change >= 0 ? "text-positive" : "text-negative"}`}>
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(2)}%
                  </span>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* MAIN GRID */}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* CHART CARD */}
        <Reveal delay={80}>
        <Card className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div className="flex gap-1 rounded-xl bg-black/5 p-1 dark:bg-white/5 sm:gap-1.5">
              {ASSETS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAsset(a)}
                  className={`rounded-lg px-2.5 py-2 text-sm font-bold sm:px-4 ${
                    a === asset ? "bg-card shadow-sm" : "text-muted"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="shrink-0 text-xs font-bold text-muted">{connected ? "Live" : "Connecting…"}</div>
          </div>

          <div>
            <FlashPrice price={prices[asset]} className="text-3xl font-bold md:text-4xl" />
          </div>

          <PriceChart asset={asset} />

          <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-muted">Portfolio value</div>
              <div className="num mt-1 break-all text-lg font-bold">
                {portfolio ? formatCents(portfolio.balanceCents) : "—"}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-muted">Total P&amp;L</div>
              <div className={`num mt-1 break-all text-lg font-bold ${pnl >= 0 ? "text-positive" : "text-negative"}`}>
                {portfolio ? formatCents(portfolio.totalPnlCents) : "—"}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-muted">Positions</div>
              <div className="num mt-1 text-lg font-bold">{portfolio ? portfolio.positions.length : "—"}</div>
            </div>
          </div>
        </Card>
        </Reveal>

        {/* TRADE PANEL */}
        <Reveal delay={140}>
        <Card className="flex h-fit flex-col gap-4">
          <div className="text-base font-bold">Place order</div>
          <form onSubmit={submitOrder} className="flex flex-col gap-4">
            <div className="flex gap-1.5 rounded-xl bg-black/5 p-1 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setSide("BUY")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold ${
                  side === "BUY" ? "bg-accent text-white" : "text-muted"
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setSide("SELL")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold ${
                  side === "SELL" ? "bg-negative text-white" : "text-muted"
                }`}
              >
                Sell
              </button>
            </div>

            <div className="flex gap-5 border-b border-border">
              <button
                type="button"
                onClick={() => setOrderType("MARKET")}
                className={`pb-2.5 text-sm font-bold ${
                  orderType === "MARKET" ? "border-b-2 border-accent" : "text-muted"
                }`}
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => setOrderType("LIMIT")}
                className={`pb-2.5 text-sm font-bold ${
                  orderType === "LIMIT" ? "border-b-2 border-accent" : "text-muted"
                }`}
              >
                Limit
              </button>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-semibold text-muted">Asset</div>
              <AssetSelect value={asset} onChange={setAsset} />
            </div>

            <label className="block">
              <div className="mb-1.5 text-xs font-semibold text-muted">Quantity</div>
              <input
                className="num w-full rounded-xl border border-border bg-transparent px-3.5 py-3 text-sm font-semibold"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>

            {orderType === "LIMIT" && (
              <label className="block">
                <div className="mb-1.5 text-xs font-semibold text-muted">Limit price (USD)</div>
                <input
                  className="num w-full rounded-xl border border-border bg-transparent px-3.5 py-3 text-sm font-semibold"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder="e.g. 65000"
                />
              </label>
            )}

            <Button type="submit">
              {side === "BUY" ? "Buy" : "Sell"} {asset}
            </Button>

            {orderType === "LIMIT" && (
              <p className="text-xs text-muted">Limit orders fill on a ~5 min sweep, not instantly on price cross.</p>
            )}
            {message && <p className="text-sm">{message}</p>}
          </form>
        </Card>
        </Reveal>
      </div>

      {/* RECENT ACTIVITY */}
      <Reveal delay={200}>
      {loadError && loadError !== "not-logged-in" ? (
        <ErrorState message={loadError} onRetry={() => setRetryKey((k) => k + 1)} />
      ) : (
        <Card>
          <div className="mb-3 text-base font-bold">Recent activity</div>
          {loadError === "not-logged-in" && (
            <EmptyState
              title="Log in to see your activity"
              body="Your demo balance and trade history live behind an account."
              action={<Link to="/login"><Button>Log in</Button></Link>}
            />
          )}
          {trades && trades.length === 0 && (
            <EmptyState title="No trades yet" body="Place your first order above to see it here." />
          )}
          {trades && trades.length > 0 && (
            <div className="flex flex-col">
              {trades.slice(0, 6).map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border py-3 first:border-t-0"
                >
                  <Badge tone={t.side === "BUY" ? "positive" : "negative"}>{t.side === "BUY" ? "Buy" : "Sell"}</Badge>
                  <AssetIcon asset={t.asset} />
                  <span className="text-sm font-bold">{t.asset}</span>
                  <span className="num min-w-0 flex-1 truncate text-sm text-muted">
                    {formatUnits(t.quantity)} {t.asset}
                  </span>
                  <span className="num text-sm font-bold">{formatCents(t.priceCents)}</span>
                  <span className="text-right text-xs text-muted">
                    {new Date(t.executedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      </Reveal>
    </div>
  );
}
