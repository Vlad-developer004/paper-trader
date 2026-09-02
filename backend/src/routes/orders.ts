import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { parseCents, parseQuantity } from "../lib/money.js";
import { cancelOrder, placeLimitOrder, placeMarketOrder } from "../services/orderExecution.js";
import { InsufficientBalanceError, InsufficientPositionError, OrderNotFoundError } from "../lib/errors.js";

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

const assetSchema = z.enum(["BTC", "ETH", "SOL"]);
const sideSchema = z.enum(["BUY", "SELL"]);

const marketOrderSchema = z.object({
  asset: assetSchema,
  side: sideSchema,
  quantity: z.string(),
});

ordersRouter.post("/market", async (req, res) => {
  const parsed = marketOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid input" });
  }
  try {
    const quantity = parseQuantity(parsed.data.quantity);
    const order = await placeMarketOrder(req.userId!, parsed.data.asset, parsed.data.side, quantity);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    if (err instanceof InsufficientBalanceError || err instanceof InsufficientPositionError) {
      return res.status(422).json({ success: false, error: err.message });
    }
    if (err instanceof Error) {
      return res.status(400).json({ success: false, error: err.message });
    }
    throw err;
  }
});

const limitOrderSchema = z.object({
  asset: assetSchema,
  side: sideSchema,
  quantity: z.string(),
  limitPrice: z.string(),
});

ordersRouter.post("/limit", async (req, res) => {
  const parsed = limitOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid input" });
  }
  try {
    const quantity = parseQuantity(parsed.data.quantity);
    const limitPriceCents = parseCents(parsed.data.limitPrice);
    const order = await placeLimitOrder(req.userId!, parsed.data.asset, parsed.data.side, quantity, limitPriceCents);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    if (err instanceof InsufficientBalanceError || err instanceof InsufficientPositionError) {
      return res.status(422).json({ success: false, error: err.message });
    }
    if (err instanceof Error) {
      return res.status(400).json({ success: false, error: err.message });
    }
    throw err;
  }
});

ordersRouter.delete("/:id", async (req, res) => {
  try {
    await cancelOrder(req.userId!, req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    if (err instanceof OrderNotFoundError) {
      return res.status(404).json({ success: false, error: "Order not found or not cancellable" });
    }
    throw err;
  }
});

ordersRouter.get("/", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const orders = await prisma.order.findMany({
    where: { userId: req.userId!, ...(status ? { status: status as never } : {}) },
    orderBy: { createdAt: "desc" },
    include: { trade: true },
  });
  res.json({ success: true, data: orders });
});
