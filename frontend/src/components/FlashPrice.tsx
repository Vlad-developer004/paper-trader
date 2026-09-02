import { usePriceFlash } from "../lib/priceFlash.js";

export function FlashPrice({ price, className = "" }: { price: number | undefined; className?: string }) {
  const flash = usePriceFlash(price);
  return (
    <span
      className={`num inline-block -mx-1 rounded px-1 transition-colors duration-500 ${
        flash === "up" ? "bg-positive-bg" : flash === "down" ? "bg-negative-bg" : ""
      } ${className}`}
    >
      {price ? `$${price.toLocaleString()}` : "—"}
    </span>
  );
}
