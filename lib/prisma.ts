import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Neon's free tier suspends its compute after ~5 minutes of inactivity, which
// silently closes any TCP connection Prisma was holding onto. The next query
// on that stale connection fails with "Error in PostgreSQL connection: Error
// { kind: Closed, cause: None }". Prisma doesn't retry this automatically, so
// we wrap every query with a single automatic retry — the retry opens a
// fresh connection, which also transparently wakes Neon's compute back up.
function isClosedConnectionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("kind: Closed") || message.includes("Error in PostgreSQL connection");
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          try {
            return await query(args);
          } catch (err) {
            if (isClosedConnectionError(err)) {
              return await query(args);
            }
            throw err;
          }
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? (createPrismaClient() as unknown as PrismaClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
