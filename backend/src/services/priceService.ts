import { env } from "../lib/env.js";

export type AssetSymbol = "BTC" | "ETH" | "SOL";

const COINGECKO_ID: Record<AssetSymbol, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
};

const CACHE_TTL_MS = 10_000;
let cache: { fetchedAt: number; pricesCents: Record<AssetSymbol, bigint> } | null = null;

// Server-side price verification: the client's displayed price is never trusted for
// money math, every fill re-checks the real quote at execution time.
export async function getVerifiedPricesCents(): Promise<Record<AssetSymbol, bigint>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.pricesCents;
  }

  const ids = Object.values(COINGECKO_ID).join(",");
  const url = `${env.coingeckoApiUrl}/simple/price?ids=${ids}&vs_currencies=usd`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko request failed: ${res.status}`);
  const data = (await res.json()) as Record<string, { usd: number }>;

  const pricesCents = Object.fromEntries(
    (Object.entries(COINGECKO_ID) as [AssetSymbol, string][]).map(([symbol, id]) => {
      const usd = data[id]?.usd;
      if (typeof usd !== "number") throw new Error(`No price returned for ${symbol}`);
      return [symbol, BigInt(Math.round(usd * 100))];
    }),
  ) as Record<AssetSymbol, bigint>;

  cache = { fetchedAt: Date.now(), pricesCents };
  return pricesCents;
}

export async function getVerifiedPriceCents(asset: AssetSymbol): Promise<bigint> {
  const prices = await getVerifiedPricesCents();
  return prices[asset];
}
