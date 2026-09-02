import type { UTCTimestamp } from "lightweight-charts";
import type { AssetSymbol } from "./binanceSocket.js";

export interface Candle {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Binance's public kline REST endpoint — free, no key required, same origin as the live trade
// stream this app already opens a WebSocket to.
export async function fetchKlines(asset: AssetSymbol, interval = "1m", limit = 180): Promise<Candle[]> {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${asset}USDT&interval=${interval}&limit=${limit}`,
  );
  if (!res.ok) throw new Error("Failed to load chart history");
  const raw = (await res.json()) as unknown[][];
  return raw.map((k) => ({
    time: Math.floor(Number(k[0]) / 1000) as UTCTimestamp,
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
  }));
}
