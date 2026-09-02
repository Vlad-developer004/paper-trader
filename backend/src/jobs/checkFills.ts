import { prisma } from "../lib/prisma.js";
import { getVerifiedPricesCents, type AssetSymbol } from "../services/priceService.js";
import { fillPendingOrderTx } from "../services/orderExecution.js";
import { InsufficientBalanceError, InsufficientPositionError } from "../lib/errors.js";
import { crossesLimit } from "../lib/limitOrder.js";

// Driven by a GitHub Actions scheduled workflow (every 5 min) hitting POST /api/internal/check-fills,
// since neither Vercel serverless functions nor a sleeping Render/Koyeb host can run an in-process
// cron — see .github/workflows/fill-check.yml. Limit orders therefore fill on a ~5 min sweep, not
// instantly on price cross; documented as a deliberate, honest scoping trade-off.
export async function checkFills(): Promise<{ checked: number; filled: number; skipped: number }> {
  const prices = await getVerifiedPricesCents();
  const pending = await prisma.order.findMany({
    where: { status: "PENDING", type: "LIMIT" },
  });

  let filled = 0;
  let skipped = 0;

  for (const order of pending) {
    const asset = order.asset as AssetSymbol;
    const currentPrice = prices[asset];
    const limitPrice = order.limitPriceCents!;
    if (!crossesLimit(order.side, currentPrice, limitPrice)) continue;

    try {
      await prisma.$transaction(async (tx) => {
        // re-fetch inside the transaction to avoid acting on a status that changed since the
        // findMany above (e.g. the user cancelled it in the meantime)
        const fresh = await tx.order.findUnique({ where: { id: order.id } });
        if (!fresh || fresh.status !== "PENDING") return;
        await fillPendingOrderTx(
          tx,
          { id: fresh.id, userId: fresh.userId, asset, side: fresh.side, quantity: fresh.quantity },
          currentPrice,
        );
      });
      filled += 1;
    } catch (err) {
      // insufficient balance/position at fill time: leave PENDING, retry on the next sweep
      if (err instanceof InsufficientBalanceError || err instanceof InsufficientPositionError) {
        skipped += 1;
      } else {
        throw err;
      }
    }
  }

  return { checked: pending.length, filled, skipped };
}
