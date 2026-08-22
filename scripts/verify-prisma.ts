import { prisma } from '../lib/prisma';
import 'dotenv/config';

async function verify() {
  try {
    const jobCount = await prisma.job.count();
    console.log(`[SUCCESS] Connected! Database is online and accessible. Total jobs in DB: ${jobCount}`);
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] Connection verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
