import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const tradesRouter = Router();
tradesRouter.use(requireAuth);

tradesRouter.get("/", async (req, res) => {
  const trades = await prisma.trade.findMany({
    where: { userId: req.userId! },
    orderBy: { executedAt: "desc" },
    take: 200,
  });
  res.json({ success: true, data: trades });
});
