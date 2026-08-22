import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function normalizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('channel_binding');
    return parsed.toString();
  } catch {
    return url.replace(/([?&])channel_binding=[^&]*/g, '').replace(/\?&/, '?');
  }
}

function createPgPool(connectionString: string): Pool {
  const requiresSsl =
    /\.neon\.tech/i.test(connectionString) || /sslmode=require/i.test(connectionString);

  return new Pool({
    connectionString,
    max: 10,
    ...(requiresSsl ? { ssl: { rejectUnauthorized: true } } : {}),
  });
}

function createPrismaClient(): PrismaClient {
  const connectionString = normalizeDatabaseUrl(
    process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/triage_db?schema=public'
  );

  const pool = createPgPool(connectionString);
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
