import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { costCents } from "../lib/money.js";
import { crossesLimit } from "../lib/limitOrder.js";
import { InsufficientBalanceError, InsufficientPositionError, OrderNotFoundError } from "../lib/errors.js";
import { getVerifiedPriceCents, type AssetSymbol } from "./priceService.js";

type Tx = Prisma.TransactionClient;
type Side = "BUY" | "SELL";

interface PendingOrder {
  id: string;
  userId: string;
  asset: AssetSymbol;
  side: Side;
  quantity: bigint;
}

// Shared fill logic: same guard-update pattern as shop's stock-decrement (updateMany with a
// `gte` guard instead of read-then-write) so concurrent fills against the same balance/position
// can never overdraft or oversell, even without relying solely on transaction isolation level.
async function fillPendingOrderTx(tx: Tx, order: PendingOrder, fillPriceCents: bigint) {
  const cost = costCents(order.quantity, fillPriceCents);

  if (order.side === "BUY") {
    const guarded = await tx.user.updateMany({
      where: { id: order.userId, balanceCents: { gte: cost } },
      data: { balanceCents: { decrement: cost } },
    });
    if (guarded.count === 0) throw new InsufficientBalanceError();

    await tx.position.upsert({
      where: { userId_asset: { userId: order.userId, asset: order.asset } },
      create: { userId: order.userId, asset: order.asset, quantity: order.quantity, costBasisCents: cost },
      update: { quantity: { increment: order.quantity }, costBasisCents: { increment: cost } },
    });
  } else {
    const guarded = await tx.position.updateMany({
      where: { userId: order.userId, asset: order.asset, quantity: { gte: order.quantity } },
      data: { quantity: { decrement: order.quantity } },
    });
    if (guarded.count === 0) throw new InsufficientPositionError();

    // Cost-basis reduction is proportional to the position snapshot read just below, guarded
    // separately from the decrement above — under heavy concurrent selling of the same position
    // this can drift slightly from a perfectly precise average-cost accounting. Acceptable,
    // documented simplification for a portfolio project; the balance/quantity guards (the actual
    // overdraft/oversell safety property) are unaffected by it.
    const position = await tx.position.findUniqueOrThrow({
      where: { userId_asset: { userId: order.userId, asset: order.asset } },
    });
    const priorQuantity = position.quantity + order.quantity;
    const costBasisReduction = priorQuantity > 0n ? (position.costBasisCents * order.quantity) / priorQuantity : 0n;
    await tx.position.update({
      where: { userId_asset: { userId: order.userId, asset: order.asset } },
      data: { costBasisCents: { decrement: costBasisReduction } },
    });

    await tx.user.update({
      where: { id: order.userId },
      data: { balanceCents: { increment: cost } },
    });
  }

  await tx.order.update({
    where: { id: order.id },
    data: { status: "FILLED", filledAt: new Date() },
  });

  await tx.trade.create({
    data: {
      orderId: order.id,
      userId: order.userId,
      asset: order.asset,
      side: order.side,
      quantity: order.quantity,
      priceCents: fillPriceCents,
    },
  });
}

export async function placeMarketOrder(userId: string, asset: AssetSymbol, side: Side, quantity: bigint) {
  const priceCents = await getVerifiedPriceCents(asset);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: { userId, asset, side, type: "MARKET", quantity, status: "PENDING" },
    });
    await fillPendingOrderTx(tx, order, priceCents);
    return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: { trade: true } });
  });
}

export async function placeLimitOrder(
  userId: string,
  asset: AssetSymbol,
  side: Side,
  quantity: bigint,
  limitPriceCents: bigint,
) {
  const currentPriceCents = await getVerifiedPriceCents(asset);
  const crossesNow = crossesLimit(side, currentPriceCents, limitPriceCents);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: { userId, asset, side, type: "LIMIT", quantity, limitPriceCents, status: "PENDING" },
    });
    // Best-effort immediate fill if the limit already crosses the live price at placement time —
    // otherwise it waits for the periodic checkFills sweep (see jobs/checkFills.ts).
    if (crossesNow) {
      await fillPendingOrderTx(tx, order, currentPriceCents);
    }
    return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: { trade: true } });
  });
}

export async function cancelOrder(userId: string, orderId: string) {
  const result = await prisma.order.updateMany({
    where: { id: orderId, userId, status: "PENDING" },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  if (result.count === 0) throw new OrderNotFoundError();
}

export { fillPendingOrderTx };
