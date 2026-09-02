# Paper Trader

Crypto paper-trading simulator — portfolio project. Demo $10,000 balance, trade BTC/ETH/SOL
against live quotes, no real money anywhere. Built to demonstrate what
[Leaf & Cup](../shop) (a Next.js monolith) doesn't: a split Express backend, live WebSocket
price streaming, and financial-precision/race-condition-safe trade execution.

See `docs` in the plan history for the full architecture rationale. Short version:

- **Frontend**: Vite + React + TypeScript + Tailwind, connects directly to Binance's public
  WebSocket for live prices — the backend is never touched for streaming.
- **Backend**: Express + TypeScript + Prisma, deployed as its own Vercel Service (`vercel.json`'s
  `services.backend`) alongside the frontend service — same codebase, `npm run dev:backend` runs
  the same entry point locally. The service's entrypoint is a single esbuild bundle
  (`backend/dist/server.mjs`, via `npm run vercel-build`) rather than the raw TS source, working
  around a zero-config gap where Vercel doesn't reliably carry `"type": "module"` into the
  deployed function. `backend/dist/server.mjs` is committed (unusual for a build artifact) because
  Vercel checks that a service's `entrypoint` file exists in the repo *before* running its
  `buildCommand` on a git-triggered deploy — a gitignored dist file doesn't exist yet at that
  point and fails deploy outright. Vercel's own build still regenerates it fresh; the committed
  copy only needs to exist, not be current — but run `npm run vercel-build --workspace=backend`
  and commit the result after backend changes anyway, to keep it truthful for local testing.
- **DB**: Postgres (Neon), scale-to-zero on the free tier.
- **Precision**: money in integer cents, crypto quantities in 1e8 minor-units — no floats
  anywhere near balance/price/PnL math.
- **Limit orders**: fill on a ~5 minute `setInterval` sweep inside the backend process
  (`backend/src/server.ts`), not instantly on price cross. Because the backend now runs as a
  warm process (Vercel Fluid compute) instead of a cold-per-request function, the sweep only
  ticks while a real visitor has kept an instance alive, and costs nothing while idle — no
  external scheduler needed. `.github/workflows/fill-check.yml` is kept as a manual-only fallback.

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
