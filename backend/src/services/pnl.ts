import { QTY_SCALE } from "../lib/money.js";
import type { AssetSymbol } from "./priceService.js";

export const STARTING_BALANCE_CENTS = 1_000_000n; // $10,000.00

interface PositionLike {
  asset: AssetSymbol;
  quantity: bigint;
  costBasisCents: bigint;
}

export function unrealizedValueCents(positions: PositionLike[], pricesCents: Record<AssetSymbol, bigint>): bigint {
  return positions.reduce((sum, p) => sum + (p.quantity * pricesCents[p.asset]) / QTY_SCALE, 0n);
}

// total PnL = current balance + mark-to-market value of open positions - starting balance
export function totalPnlCents(
  balanceCents: bigint,
  positions: PositionLike[],
  pricesCents: Record<AssetSymbol, bigint>,
): bigint {
  return balanceCents + unrealizedValueCents(positions, pricesCents) - STARTING_BALANCE_CENTS;
}
