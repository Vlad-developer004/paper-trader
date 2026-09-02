import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get("/", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  res.json({
    success: true,
    data: { id: user.id, email: user.email, displayName: user.displayName, balanceCents: user.balanceCents },
  });
});
