import { useEffect, useRef, useState } from "react";

// Real trade ticks move a $76k BTC price by cents at a time — the number itself barely looks
// different frame to frame even though fresh data is arriving many times a second. A brief
// color flash on each tick makes that liveness visible without touching the actual values.
export function usePriceFlash(price: number | undefined): "up" | "down" | null {
  const prevRef = useRef<number | undefined>(price);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (price === undefined) return;
    const prev = prevRef.current;
    prevRef.current = price;
    if (prev === undefined || price === prev) return;

    setFlash(price > prev ? "up" : "down");
    const timer = setTimeout(() => setFlash(null), 500);
    return () => clearTimeout(timer);
  }, [price]);

  return flash;
}
