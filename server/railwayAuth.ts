import type { Express, RequestHandler } from "express";

// Simple auth bypass for personal Railway deployment
export async function setupAuth(app: Express): Promise<void> {
  console.log("Using Railway auth bypass for personal use");
  // No auth setup needed for personal deployment
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  // For personal use on Railway, create a fake user
  req.user = {
    claims: {
      sub: "personal-user-railway" // Fixed user ID for personal use
    }
  };
  next();
};