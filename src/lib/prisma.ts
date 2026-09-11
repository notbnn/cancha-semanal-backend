import { PrismaClient } from "@prisma/client";

// Singleton del cliente Prisma — evita agotar conexiones con el hot-reload
// de `tsx watch` en desarrollo y con funciones serverless en Vercel.
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
