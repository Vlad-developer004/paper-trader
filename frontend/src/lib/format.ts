// Money/quantity travel as decimal strings over the API (BigInt isn't native JSON) — convert to
// Number only here, at the final display boundary, never in state or comparisons.
export function formatCents(cents: string | number): string {
  const value = Number(cents) / 100;
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatUnits(units: string | number, decimals = 6): string {
  const value = Number(units) / 100_000_000;
  return value.toFixed(decimals);
}

// Splits a cents value into whole-dollar and cents parts for hero displays that render the
// cents smaller (e.g. "$10,432" + ".18") — avoids parsing the locale-formatted string back apart.
export function splitCents(cents: string | number): { dollars: string; cents: string } {
  const value = Number(cents) / 100;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const dollars = Math.trunc(abs).toLocaleString("en-US");
  const centsPart = Math.round((abs - Math.trunc(abs)) * 100)
    .toString()
    .padStart(2, "0");
  return { dollars: `${sign}$${dollars}`, cents: centsPart };
}
