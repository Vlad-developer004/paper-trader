import { describe, expect, it } from "vitest";
import { totalPnlCents, unrealizedValueCents, STARTING_BALANCE_CENTS } from "../src/services/pnl.js";

describe("pnl", () => {
  const prices = { BTC: 5_000_000n, ETH: 300_000n, SOL: 15_000n };

  it("values open positions at current market price", () => {
    const positions = [{ asset: "BTC" as const, quantity: 100_000_000n, costBasisCents: 4_000_000n }];
    expect(unrealizedValueCents(positions, prices)).toBe(5_000_000n);
  });

  it("computes total PnL as balance + position value - starting balance", () => {
    const positions = [{ asset: "BTC" as const, quantity: 100_000_000n, costBasisCents: 4_000_000n }];
    const balanceCents = STARTING_BALANCE_CENTS - 4_000_000n; // spent $40,000 buying 1 BTC
    expect(totalPnlCents(balanceCents, positions, prices)).toBe(1_000_000n); // up $10,000
  });

  it("is flat with no trades", () => {
    expect(totalPnlCents(STARTING_BALANCE_CENTS, [], prices)).toBe(0n);
  });
});
