import { describe, expect, it } from "vitest";
import { costCents, parseCents, parseQuantity, QTY_SCALE } from "../src/lib/money.js";

describe("money", () => {
  it("parses a quantity string into 1e8-scaled integer units", () => {
    expect(parseQuantity("0.5")).toBe(50_000_000n);
    expect(parseQuantity("1")).toBe(QTY_SCALE);
  });

  it("rejects non-positive quantities", () => {
    expect(() => parseQuantity("0")).toThrow();
    expect(() => parseQuantity("-1")).toThrow();
  });

  it("parses a price string into integer cents", () => {
    expect(parseCents("42000.50")).toBe(4_200_050n);
  });

  it("computes cost with pure integer math, no float drift", () => {
    // 0.5 BTC @ $42,000.00 = $21,000.00
    expect(costCents(50_000_000n, 4_200_000n)).toBe(2_100_000n);
  });
});
