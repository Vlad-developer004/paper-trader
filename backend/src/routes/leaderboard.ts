import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getVerifiedPricesCents, type AssetSymbol } from "../services/priceService.js";
import { totalPnlCents } from "../services/pnl.js";

export const leaderboardRouter = Router();

// Leaderboard is derived on read, not a stored table — always consistent with the underlying
// trade/position data, and the demo user count here is far too small to need pre-aggregation.
leaderboardRouter.get("/", async (_req, res) => {
  const [users, prices] = await Promise.all([
    prisma.user.findMany({ include: { positions: true } }),
    getVerifiedPricesCents(),
  ]);

  const ranked = users
    .map((user) => ({
      displayName: user.displayName,
      balanceCents: user.balanceCents,
      pnlCents: totalPnlCents(
        user.balanceCents,
        user.positions.filter((p) => p.quantity > 0n).map((p) => ({ ...p, asset: p.asset as AssetSymbol })),
        prices,
      ),
    }))
    .sort((a, b) => (a.pnlCents > b.pnlCents ? -1 : a.pnlCents < b.pnlCents ? 1 : 0));

  res.json({ success: true, data: ranked });
});
