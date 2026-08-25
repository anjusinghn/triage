import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const PRISMA_SCHEMA_VERSION = 'parsed-resume-justifications-v1';
const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  prismaSchemaVersion?: string;
};

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

if (globalForPrisma.prismaSchemaVersion !== PRISMA_SCHEMA_VERSION) {
  void globalForPrisma.prisma?.$disconnect();
  globalForPrisma.prisma = createPrismaClient();
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}

export const prisma = globalForPrisma.prisma as PrismaClient;

export default prisma;
