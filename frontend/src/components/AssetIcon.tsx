import type { AssetSymbol } from "../lib/binanceSocket.js";

// Flat solid-fill coin glyphs — no gradients or shadows, matching the rest of the icon system.
export function AssetIcon({ asset, size = 22 }: { asset: AssetSymbol; size?: number }) {
  if (asset === "BTC") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="var(--color-btc)" />
        <text x="16" y="21" fontFamily="Sora" fontWeight="700" fontSize="13" fill="white" textAnchor="middle">
          ₿
        </text>
      </svg>
    );
  }
  if (asset === "ETH") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="var(--color-eth)" />
        <polygon points="16,7 23,16.5 16,20.5 9,16.5" fill="white" fillOpacity="0.95" />
        <polygon points="16,22 23,18 16,26.5 9,18" fill="white" fillOpacity="0.75" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill="var(--color-sol)" />
      <g transform="translate(8,10)">
        <rect x="0" y="0" width="16" height="2.6" rx="1.3" fill="white" transform="skewX(-18)" />
        <rect x="1.5" y="5.7" width="16" height="2.6" rx="1.3" fill="white" transform="skewX(-18)" opacity="0.8" />
        <rect x="0" y="11.4" width="16" height="2.6" rx="1.3" fill="white" transform="skewX(-18)" opacity="0.6" />
      </g>
    </svg>
  );
}
