function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  jwtSecret: required("JWT_SECRET"),
  internalCronSecret: required("INTERNAL_CRON_SECRET"),
  coingeckoApiUrl: process.env.COINGECKO_API_URL ?? "https://api.coingecko.com/api/v3",
  // CORS allowlist — comma-separated origins (e.g. the deployed Vercel frontend URL). Falls back
  // to allowing any origin in local dev, where there's no fixed frontend URL to pin.
  frontendOrigins: process.env.FRONTEND_ORIGIN?.split(",").map((o) => o.trim()) ?? null,
};
