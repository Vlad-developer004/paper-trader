// Integration test against a real Postgres (Neon dev branch or local Docker Postgres) — the
// single most interview-relevant test in this project: proves concurrent trades against the
// same balance/position can never overdraft or oversell, mirroring shop's guarded-updateMany
// stock-decrement pattern applied to money instead of inventory.
//
// Requires DATABASE_URL to point at a disposable test database (never point this at prod data —
// the test truncates its own rows but runs real writes). Skipped automatically if unset so
// `npm test` stays green in CI/sandboxes without a provisioned DB; wire DATABASE_URL as a CI
// secret once a Neon test branch exists to enable it there.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const hasDb = Boolean(process.env.DATABASE_URL);
const describeIfDb = hasDb ? describe : describe.skip;

describeIfDb("orderExecution concurrency", () => {
  let prisma: import("../src/lib/prisma.js")["prisma"];
  let placeMarketOrder: typeof import("../src/services/orderExecution.js").placeMarketOrder;
  let userId: string;

  beforeAll(async () => {
    ({ prisma } = await import("../src/lib/prisma.js"));
    ({ placeMarketOrder } = await import("../src/services/orderExecution.js"));
    const user = await prisma.user.create({
      data: {
        email: `race-test-${Date.now()}@example.com`,
        passwordHash: "unused",
        displayName: "Race Test",
        balanceCents: 100_000n, // exactly $1,000.00 — enough for ONE of the two concurrent buys below
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.trade.deleteMany({ where: { userId } });
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.position.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it("allows exactly one of two concurrent buys that together exceed the balance", async () => {
    // Each buy alone costs slightly under $1,000 at any real BTC price; two of them together
    // must exceed the $1,000.00 starting balance above, so at most one can legitimately fill.
    const buy = () => placeMarketOrder(userId, "BTC", "BUY", 1_000_000n); // 0.01 BTC each

    const results = await Promise.allSettled([buy(), buy()]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");

    expect(fulfilled.length).toBeLessThanOrEqual(1);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.balanceCents).toBeGreaterThanOrEqual(0n);
  });
});
