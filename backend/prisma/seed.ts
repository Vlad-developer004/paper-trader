// Seeds a handful of demo accounts with real trade history so the leaderboard isn't empty on a
// fresh database. Re-runnable: each profile is deleted and recreated by its (fixed) email, so
// re-seeding after schema changes or a demo reset is just `npm run db:seed` again.
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/auth.js";
import { getVerifiedPricesCents, type AssetSymbol } from "../src/services/priceService.js";
import { costCents, QTY_SCALE } from "../src/lib/money.js";

const STARTING_BALANCE_CENTS = 1_000_000n; // $10,000.00 — mirrors services/pnl.ts
const DEMO_PASSWORD = "demo1234";

interface DemoProfile {
  email: string;
  displayName: string;
  asset: AssetSymbol;
  quantity: number; // whole coins
  // entry price relative to the live price fetched at seed time — <1 means they "bought the
  // dip" (unrealized gain right now), >1 means they bought high (unrealized loss)
  entryMultiplier: number;
}

const PROFILES: DemoProfile[] = [
  { email: "demo-1@papertrader.dev", displayName: "Satoshi_Stacker", asset: "BTC", quantity: 0.08, entryMultiplier: 0.82 },
  { email: "demo-2@papertrader.dev", displayName: "EthMaximalist", asset: "ETH", quantity: 1.5, entryMultiplier: 0.9 },
  { email: "demo-3@papertrader.dev", displayName: "SolStorm", asset: "SOL", quantity: 40, entryMultiplier: 0.75 },
  { email: "demo-4@papertrader.dev", displayName: "LateToTheParty", asset: "BTC", quantity: 0.05, entryMultiplier: 1.18 },
  { email: "demo-5@papertrader.dev", displayName: "PaperHands", asset: "ETH", quantity: 2, entryMultiplier: 1.08 },
  { email: "demo-6@papertrader.dev", displayName: "SteadyEddie", asset: "SOL", quantity: 20, entryMultiplier: 1.0 },
];

async function main() {
  console.log("Fetching live prices to seed realistic demo entry prices…");
  const currentPrices = await getVerifiedPricesCents();
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  for (const profile of PROFILES) {
    await prisma.user.deleteMany({ where: { email: profile.email } });

    const quantityUnits = BigInt(Math.round(profile.quantity * Number(QTY_SCALE)));
    const entryPriceCents = BigInt(Math.round(Number(currentPrices[profile.asset]) * profile.entryMultiplier));
    const spentCents = costCents(quantityUnits, entryPriceCents);

    const user = await prisma.user.create({
      data: {
        email: profile.email,
        passwordHash,
        displayName: profile.displayName,
        balanceCents: STARTING_BALANCE_CENTS - spentCents,
      },
    });

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        asset: profile.asset,
        side: "BUY",
        type: "MARKET",
        status: "FILLED",
        quantity: quantityUnits,
        filledAt: new Date(),
      },
    });

    await prisma.trade.create({
      data: {
        orderId: order.id,
        userId: user.id,
        asset: profile.asset,
        side: "BUY",
        quantity: quantityUnits,
        priceCents: entryPriceCents,
      },
    });

    await prisma.position.create({
      data: {
        userId: user.id,
        asset: profile.asset,
        quantity: quantityUnits,
        costBasisCents: spentCents,
      },
    });

    console.log(`  ${profile.displayName.padEnd(18)} bought ${profile.quantity} ${profile.asset} @ $${(Number(entryPriceCents) / 100).toFixed(2)}`);
  }

  console.log(`\nSeeded ${PROFILES.length} demo accounts. All share the password: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
