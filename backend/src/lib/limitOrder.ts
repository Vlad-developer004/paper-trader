export type OrderSide = "BUY" | "SELL";

export function crossesLimit(side: OrderSide, currentPriceCents: bigint, limitPriceCents: bigint): boolean {
  return side === "BUY" ? currentPriceCents <= limitPriceCents : currentPriceCents >= limitPriceCents;
}
