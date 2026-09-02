import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { env } from "../lib/env.js";
import { checkFills } from "../jobs/checkFills.js";

export const internalRouter = Router();

function isValidCronSecret(provided: unknown): boolean {
  if (typeof provided !== "string") return false;
  const expected = Buffer.from(env.internalCronSecret);
  const actual = Buffer.from(provided);
  // timingSafeEqual throws on a length mismatch rather than returning false, and the length
  // itself is not the secret we're protecting, so compare it up front with a plain check.
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

// Triggered by .github/workflows/fill-check.yml on a schedule — see jobs/checkFills.ts for why
// this can't just be an in-process cron (serverless functions have no persistent process).
internalRouter.post("/check-fills", async (req, res) => {
  if (!isValidCronSecret(req.headers["x-cron-secret"])) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  const result = await checkFills();
  res.json({ success: true, data: result });
});
