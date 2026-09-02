import { create } from "zustand";

export type AssetSymbol = "BTC" | "ETH" | "SOL";

const STREAM_TO_ASSET: Record<string, AssetSymbol> = {
  btcusdt: "BTC",
  ethusdt: "ETH",
  solusdt: "SOL",
};

const STREAM_URL =
  "wss://stream.binance.com:9443/stream?streams=btcusdt@trade/ethusdt@trade/solusdt@trade";

interface PriceFeedState {
  prices: Partial<Record<AssetSymbol, number>>;
  // first price observed this session per asset — lets the UI show a "change since page load"
  // percentage without a separate 24hr-ticker stream subscription
  basePrices: Partial<Record<AssetSymbol, number>>;
  connected: boolean;
  setPrices: (ticks: Partial<Record<AssetSymbol, number>>) => void;
  setConnected: (connected: boolean) => void;
}

// One shared price store for the whole app — the chart and the trade panel both read from this,
// neither opens its own WebSocket. The backend is never touched for streaming ticks; this
// connects straight to Binance's public stream from the browser.
export const usePriceFeed = create<PriceFeedState>((set) => ({
  prices: {},
  basePrices: {},
  connected: false,
  setPrices: (ticks) =>
    set((s) => {
      const prices = { ...s.prices, ...ticks };
      const basePrices = { ...s.basePrices };
      for (const asset of Object.keys(ticks) as AssetSymbol[]) {
        if (!(asset in basePrices)) basePrices[asset] = ticks[asset];
      }
      return { prices, basePrices };
    }),
  setConnected: (connected) => set({ connected }),
}));

let socket: WebSocket | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;

// Binance trades on BTC/ETH/SOL fire dozens of times a second — updating the store (and
// re-rendering the ticker/chart) on every single one is far more work than a human can perceive.
// Ticks are buffered here and flushed to the store at most once per interval instead.
const FLUSH_INTERVAL_MS = 1000;
let pendingTicks: Partial<Record<AssetSymbol, number>> = {};

interface BinanceTradeEvent {
  stream: string;
  data: { s: string; p: string };
}

export function connectPriceFeed() {
  if (socket) return;

  socket = new WebSocket(STREAM_URL);
  const { setConnected } = usePriceFeed.getState();

  socket.onopen = () => setConnected(true);
  socket.onclose = () => {
    setConnected(false);
    socket = null;
    // simple reconnect with a fixed backoff — good enough for a portfolio demo, no exponential
    // backoff/jitter needed at this traffic scale
    setTimeout(connectPriceFeed, 3000);
  };
  socket.onerror = () => socket?.close();
  socket.onmessage = (event) => {
    const payload = JSON.parse(event.data) as BinanceTradeEvent;
    const streamName = payload.stream.split("@")[0];
    const asset = STREAM_TO_ASSET[streamName];
    if (!asset) return;
    pendingTicks[asset] = Number(payload.data.p);
  };

  flushTimer ??= setInterval(() => {
    if (Object.keys(pendingTicks).length === 0) return;
    usePriceFeed.getState().setPrices(pendingTicks);
    pendingTicks = {};
  }, FLUSH_INTERVAL_MS);
}
