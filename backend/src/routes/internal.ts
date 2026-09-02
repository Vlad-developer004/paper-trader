import { Router } from "express";
import { env } from "../lib/env.js";
import { checkFills } from "../jobs/checkFills.js";

export const internalRouter = Router();

// Triggered by .github/workflows/fill-check.yml on a schedule — see jobs/checkFills.ts for why
// this can't just be an in-process cron (serverless functions have no persistent process).
internalRouter.post("/check-fills", async (req, res) => {
  const secret = req.headers["x-cron-secret"];
  if (secret !== env.internalCronSecret) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  const result = await checkFills();
  res.json({ success: true, data: result });
});
