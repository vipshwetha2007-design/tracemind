import { PrismaClient } from "@prisma/client";

/**
 * The single shared Prisma client for the whole app.
 *
 * Next.js dev mode hot-reloads server modules on every file save, which
 * would normally create a brand new PrismaClient (and a new SQLite
 * connection) on every reload and eventually exhaust connections. The
 * standard fix — recommended by Prisma's own Next.js docs — is to stash the
 * client on the Node global object in development, so hot reloads reuse the
 * same instance instead of creating a new one.
 *
 * Every other file in this app imports `prisma` from here rather than
 * constructing its own `new PrismaClient()`.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
