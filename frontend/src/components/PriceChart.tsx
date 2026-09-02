import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";
import type { IChartApi, ISeriesApi, UTCTimestamp } from "lightweight-charts";
import { usePriceFeed, type AssetSymbol } from "../lib/binanceSocket.js";
import { fetchKlines, type Candle } from "../lib/klines.js";
import { useLanguage } from "../lib/i18n/index.js";

let probeCanvas: HTMLCanvasElement | null = null;
function toRgb(cssColor: string): string {
  probeCanvas ??= document.createElement("canvas");
  const ctx = probeCanvas.getContext("2d");
  if (!ctx) return cssColor;
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

function readColor(varName: string) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return toRgb(raw);
}

export function PriceChart({ asset }: { asset: AssetSymbol }) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const bucketRef = useRef<Candle | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const price = usePriceFeed((s) => s.prices[asset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 220,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: readColor("--color-muted"),
        fontFamily: "Sora, system-ui, sans-serif",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: readColor("--color-border") },
      },
      rightPriceScale: { borderColor: readColor("--color-border") },
      timeScale: { borderColor: readColor("--color-border"), timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
    });

    const series = chart.addCandlestickSeries({
      upColor: readColor("--color-positive"),
      downColor: readColor("--color-negative"),
      borderVisible: false,
      wickUpColor: readColor("--color-positive"),
      wickDownColor: readColor("--color-negative"),
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) chart.applyOptions({ width });
    });
    resizeObserver.observe(container);

    const themeObserver = new MutationObserver(() => {
      chart.applyOptions({
        layout: { textColor: readColor("--color-muted") },
        grid: { horzLines: { color: readColor("--color-border") } },
        rightPriceScale: { borderColor: readColor("--color-border") },
        timeScale: { borderColor: readColor("--color-border") },
      });
      series.applyOptions({
        upColor: readColor("--color-positive"),
        downColor: readColor("--color-negative"),
        wickUpColor: readColor("--color-positive"),
        wickDownColor: readColor("--color-negative"),
      });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    bucketRef.current = null;
    setStatus("loading");
    fetchKlines(asset)
      .then((candles) => {
        if (cancelled || !seriesRef.current) return;
        seriesRef.current.setData(candles);
        chartRef.current?.timeScale().fitContent();
        chartRef.current?.priceScale("right").applyOptions({ autoScale: true });
        bucketRef.current = candles[candles.length - 1] ?? null;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [asset]);

  useEffect(() => {
    if (price === undefined || !seriesRef.current) return;
    const bucketTime = (Math.floor(Date.now() / 60_000) * 60) as UTCTimestamp;
    const bucket = bucketRef.current;
    if (!bucket || bucket.time !== bucketTime) {
      const next: Candle = { time: bucketTime, open: price, high: price, low: price, close: price };
      bucketRef.current = next;
      seriesRef.current.update(next);
    } else {
      const next: Candle = {
        time: bucket.time,
        open: bucket.open,
        high: Math.max(bucket.high, price),
        low: Math.min(bucket.low, price),
        close: price,
      };
      bucketRef.current = next;
      seriesRef.current.update(next);
    }
  }, [price]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[220px] w-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">{t("chart.loading")}</div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">{t("chart.error")}</div>
      )}
    </div>
  );
}
