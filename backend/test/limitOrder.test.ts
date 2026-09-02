import { describe, expect, it } from "vitest";
import { crossesLimit } from "../src/lib/limitOrder.js";

describe("crossesLimit", () => {
  it("fills a BUY when the price drops to or below the limit", () => {
    expect(crossesLimit("BUY", 4_000_000n, 4_200_000n)).toBe(true);
    expect(crossesLimit("BUY", 4_200_000n, 4_200_000n)).toBe(true);
    expect(crossesLimit("BUY", 4_300_000n, 4_200_000n)).toBe(false);
  });

  it("fills a SELL when the price rises to or above the limit", () => {
    expect(crossesLimit("SELL", 4_300_000n, 4_200_000n)).toBe(true);
    expect(crossesLimit("SELL", 4_200_000n, 4_200_000n)).toBe(true);
    expect(crossesLimit("SELL", 4_000_000n, 4_200_000n)).toBe(false);
  });
});
