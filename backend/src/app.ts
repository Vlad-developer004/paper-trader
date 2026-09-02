import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { ordersRouter } from "./routes/orders.js";
import { portfolioRouter } from "./routes/portfolio.js";
import { tradesRouter } from "./routes/trades.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { internalRouter } from "./routes/internal.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // BigInt columns (cents/minor-units) can't go through native JSON.stringify — serialize them
  // as decimal strings at the API boundary, the frontend never parses a raw float for money.
  app.set("json replacer", (_key: string, value: unknown) => (typeof value === "bigint" ? value.toString() : value));

  app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

  app.use("/auth", authRouter);
  app.use("/me", meRouter);
  app.use("/orders", ordersRouter);
  app.use("/portfolio", portfolioRouter);
  app.use("/trades", tradesRouter);
  app.use("/leaderboard", leaderboardRouter);
  app.use("/internal", internalRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  });

  return app;
}
