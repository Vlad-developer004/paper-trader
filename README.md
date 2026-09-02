# Paper Trader

Crypto paper-trading simulator — portfolio project. Demo $10,000 balance, trade BTC/ETH/SOL
against live quotes, no real money anywhere. Built to demonstrate what
[Leaf & Cup](../shop) (a Next.js monolith) doesn't: a split Express backend, live WebSocket
price streaming, and financial-precision/race-condition-safe trade execution.

See `docs` in the plan history for the full architecture rationale. Short version:

- **Frontend**: Vite + React + TypeScript + Tailwind, connects directly to Binance's public
  WebSocket for live prices — the backend is never touched for streaming.
- **Backend**: Express + TypeScript + Prisma, deployed as a single Vercel serverless function
  (`api/[...path].ts`) alongside the frontend — same codebase, `npm run dev:backend` also runs it
  as a normal long-lived process locally.
- **DB**: Postgres (Neon), scale-to-zero on the free tier.
- **Precision**: money in integer cents, crypto quantities in 1e8 minor-units — no floats
  anywhere near balance/price/PnL math.
- **Limit orders**: fill on a ~5 minute sweep triggered by a GitHub Actions scheduled workflow
  (`.github/workflows/fill-check.yml`), not instantly on price cross — serverless functions have
  no persistent process to run an in-process cron. This is a deliberate, documented trade-off,
  not a bug.

## Local development

```bash
npm install                    # installs both workspaces
cp backend/.env.example backend/.env   # fill in a real DATABASE_URL, JWT_SECRET, INTERNAL_CRON_SECRET
npm run dev:backend            # Express on http://localhost:3001
npm run dev:frontend           # Vite on http://localhost:5173, proxies /api to the backend
```

## Demo data

The leaderboard is derived live from real trades — on a fresh database it's just empty. Seed a
handful of demo accounts with real (varied-outcome) trade history:

```bash
npm run db:seed --workspace=backend
```

Re-runnable any time — each demo profile is keyed by a fixed email and gets deleted/recreated on
every run. All seeded accounts share the password `demo1234`.

## Testing

```bash
npm test   # backend unit tests always run; the concurrency integration test
           # (test/orderExecution.integration.test.ts) auto-skips unless DATABASE_URL
           # points at a real disposable test database
```
