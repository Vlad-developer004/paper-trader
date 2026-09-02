import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// reuse across hot reloads (dev) and warm serverless invocations (Vercel)
export const prisma = globalThis.__prisma ?? createClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
