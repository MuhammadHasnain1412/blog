import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    // ✅ Only log queries in development — never in production
    // Production logs errors only to avoid leaking query details
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// ── Connection pool note ──────────────────────────────────────────────────────
//
// Connection pool size is set via DATABASE_URL, not in code.
// Add these parameters to your .env on the server:
//
//   DATABASE_URL="mysql://user:pass@host:3306/blog?connection_limit=5&pool_timeout=10"
//
// Why 5? RDS db.t3.micro allows ~66 connections total.
// With PM2 running 1 process, 5 connections leaves plenty of headroom
// for RDS internal connections and any admin/monitoring tools.
// If you add more PM2 workers later, reduce this number accordingly.
