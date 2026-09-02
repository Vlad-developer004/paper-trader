import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/auth.js";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: "Missing bearer token" });
  }
  try {
    req.userId = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}
