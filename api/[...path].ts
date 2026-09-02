import serverless from "serverless-http";
import { createApp } from "../backend/src/app.js";

// Single Vercel catch-all function wrapping the Express app — same router/middleware/service
// code as local dev (backend/src/server.ts), just a different entry point for the serverless
// runtime. See plan doc for why this replaced a separate Render/Koyeb host.
const handler = serverless(createApp());

export default async function (req: unknown, res: unknown) {
  return handler(req as never, res as never);
}
