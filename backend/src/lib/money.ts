// crypto quantities are stored as integers scaled by 1e8 (satoshi-style minor units),
// same reasoning as shop's Int-cents pricing: no floats anywhere near money math.
export const QTY_SCALE = 100_000_000n;

export function parseQuantity(input: string): bigint {
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Quantity must be a positive number");
  }
  return BigInt(Math.round(value * Number(QTY_SCALE)));
}

export function parseCents(input: string): bigint {
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Price must be a positive number");
  }
  return BigInt(Math.round(value * 100));
}

// cost = quantity (1e8-scaled) * priceCents / 1e8, all integer math, floors down
export function costCents(quantity: bigint, priceCentsPerUnit: bigint): bigint {
  return (quantity * priceCentsPerUnit) / QTY_SCALE;
}
