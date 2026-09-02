export function Footer() {
  return (
    <div className="flex flex-col items-start justify-between gap-4 border-t border-border px-6 py-6 md:flex-row md:px-12">
      <div className="max-w-2xl">
        <div className="text-[13px] font-bold">Paper Trader — a portfolio project</div>
        <div className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
          Built to demonstrate full-stack engineering practice: live WebSocket price feeds, race-condition-safe
          trade execution, and integer-precision money math. All balances, trades and P&amp;L shown are simulated
          for demonstration only — no real funds change hands, and nothing here is investment advice. Live prices
          are sourced from public market data for illustrative purposes.
        </div>
      </div>
      <div className="whitespace-nowrap text-xs font-semibold text-muted">Demo build · Not for real trading</div>
    </div>
  );
}
