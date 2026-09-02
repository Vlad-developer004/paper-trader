// Must be imported before any router: patches Express 4's route handlers so a rejected promise
// (e.g. an unvalidated query value that makes Prisma throw) reaches the error middleware below
// instead of just hanging the request until the platform timeout.
import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./lib/env.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { ordersRouter } from "./routes/orders.js";
import { portfolioRouter } from "./routes/portfolio.js";
import { tradesRouter } from "./routes/trades.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { internalRouter } from "./routes/internal.js";

export function createApp() {
  const app = express();

  // Both the Vercel serverless deployment and local `vite` proxy sit in front of this app —
  // trust the first hop's X-Forwarded-For so express-rate-limit (auth.ts) keys on the real
  // client IP instead of the proxy's.
  app.set("trust proxy", 1);

  app.use(helmet());
  // No cookies are ever set (bearer-token auth), so a same-site CSP default is safe; the frontend
  // is same-origin in production (one Vercel project) and cross-origin only in local dev, where
  // env.frontendOrigins is unset and any origin is allowed.
  app.use(cors(env.frontendOrigins ? { origin: env.frontendOrigins } : {}));
  app.use(express.json());

  // BigInt columns (cents/minor-units) can't go through native JSON.stringify — serialize them
  // as decimal strings at the API boundary, the frontend never parses a raw float for money.
  app.set("json replacer", (_key: string, value: unknown) => (typeof value === "bigint" ? value.toString() : value));

  // Mounted under /api — Vercel routes the whole /api/(.*) prefix to this service without
  // stripping it, and the same prefix is used unmodified by the local Vite dev proxy.
  const api = express.Router();
  api.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

  api.use("/auth", authRouter);
  api.use("/me", meRouter);
  api.use("/orders", ordersRouter);
  api.use("/portfolio", portfolioRouter);
  api.use("/trades", tradesRouter);
  api.use("/leaderboard", leaderboardRouter);
  api.use("/internal", internalRouter);

  app.use("/api", api);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  });

  return app;
}
