import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { getVerifiedPricesCents, type AssetSymbol } from "../services/priceService.js";
import { totalPnlCents, unrealizedValueCents } from "../services/pnl.js";

export const portfolioRouter = Router();
portfolioRouter.use(requireAuth);

portfolioRouter.get("/", async (req, res) => {
  const [user, positions, prices] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: req.userId! } }),
    prisma.position.findMany({ where: { userId: req.userId!, quantity: { gt: 0n } } }),
    getVerifiedPricesCents(),
  ]);

  const positionsWithMarket = positions.map((p) => {
    const asset = p.asset as AssetSymbol;
    const marketValueCents = (p.quantity * prices[asset]) / 100_000_000n;
    return { ...p, currentPriceCents: prices[asset], marketValueCents };
  });

  res.json({
    success: true,
    data: {
      balanceCents: user.balanceCents,
      positions: positionsWithMarket,
      unrealizedValueCents: unrealizedValueCents(positions, prices),
      totalPnlCents: totalPnlCents(user.balanceCents, positions, prices),
    },
  });
});
