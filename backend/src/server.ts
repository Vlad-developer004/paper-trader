import "dotenv/config";
import { createApp } from "./app.js";
import { checkFills } from "./jobs/checkFills.js";

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
createApp().listen(port, () => {
  console.log(`paper-trader backend listening on http://localhost:${port}`);
});

// Ties limit-order fills to actual traffic instead of a fixed external schedule: this only ticks
// while the process is warm (a real visitor kept it alive), and stops costing anything once
// Vercel scales the idle instance to zero — no GitHub Actions cron needed anymore.
const FILL_CHECK_INTERVAL_MS = 5 * 60 * 1000;
void checkFills().catch((err) => console.error("checkFills failed", err));
setInterval(() => {
  void checkFills().catch((err) => console.error("checkFills failed", err));
}, FILL_CHECK_INTERVAL_MS);
