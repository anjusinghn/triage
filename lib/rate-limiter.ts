import { prisma } from '@/lib/prisma';

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  message?: string;
}

const WINDOW_MS = 10 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const START_WINDOW_MS = 3 * 60 * 1000;

const IP_WINDOW_MAX = 5;
const IP_HOUR_MAX = 10;
const IP_DAY_MAX = 20;
const GLOBAL_WINDOW_MAX = 15;
const GLOBAL_HOUR_MAX = 40;
const GLOBAL_DAY_MAX = 80;
const STARTS_PER_WINDOW = 1;

const INFERENCE_CONCURRENCY = 1;
const MIN_INFERENCE_INTERVAL_MS = 400;

const RATE_LIMIT_MESSAGE = 'Too many AI reviews right now. Please wait and try again.';

export const MAX_REVIEW_FILES = 5;
export const MAX_RESUME_BYTES = 2 * 1024 * 1024;

function retryAfter(resetAt: Date): number {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
}

async function touchBucket(
  id: string,
  windowMs: number,
  maxUnits: number,
  units: number,
  increment: boolean
): Promise<RateLimitCheckResult> {
  const now = new Date();
  const nextReset = new Date(now.getTime() + windowMs);

  try {
    await prisma.rateLimitBucket.upsert({
      where: { id },
      create: { id, count: 0, resetAt: nextReset },
      update: {},
    });

    await prisma.rateLimitBucket.updateMany({
      where: { id, resetAt: { lte: now } },
      data: { count: 0, resetAt: nextReset },
    });

    const current = await prisma.rateLimitBucket.findUnique({ where: { id } });
    if (!current) {
      return { allowed: false, message: RATE_LIMIT_MESSAGE, retryAfterSeconds: 60 };
    }

    if (current.count + units > maxUnits) {
      return {
        allowed: false,
        message: RATE_LIMIT_MESSAGE,
        retryAfterSeconds: retryAfter(current.resetAt),
      };
    }

    if (increment) {
      const bumped = await prisma.rateLimitBucket.updateMany({
        where: {
          id,
          count: { lte: maxUnits - units },
          resetAt: { gt: now },
        },
        data: { count: { increment: units } },
      });
      if (bumped.count === 0) {
        return { allowed: false, message: RATE_LIMIT_MESSAGE, retryAfterSeconds: 60 };
      }
    }

    return { allowed: true };
  } catch {
    return { allowed: false, message: RATE_LIMIT_MESSAGE, retryAfterSeconds: 60 };
  }
}

async function inspectAll(
  clientIp: string,
  units: number,
  increment: boolean
): Promise<RateLimitCheckResult> {
  const ip = clientIp.trim() || 'unknown';
  const specs: Array<{ id: string; windowMs: number; max: number }> = [
    { id: `ip-window:${ip}`, windowMs: WINDOW_MS, max: IP_WINDOW_MAX },
    { id: `ip-hour:${ip}`, windowMs: HOUR_MS, max: IP_HOUR_MAX },
    { id: `ip-day:${ip}`, windowMs: DAY_MS, max: IP_DAY_MAX },
    { id: 'global-window', windowMs: WINDOW_MS, max: GLOBAL_WINDOW_MAX },
    { id: 'global-hour', windowMs: HOUR_MS, max: GLOBAL_HOUR_MAX },
    { id: 'global-day', windowMs: DAY_MS, max: GLOBAL_DAY_MAX },
  ];

  for (const spec of specs) {
    const peek = await touchBucket(spec.id, spec.windowMs, spec.max, units, false);
    if (!peek.allowed) return peek;
  }

  if (!increment) return { allowed: true };

  for (const spec of specs) {
    const consumed = await touchBucket(spec.id, spec.windowMs, spec.max, units, true);
    if (!consumed.allowed) return consumed;
  }

  return { allowed: true };
}

export async function checkInferenceRateLimit(
  clientIp: string,
  _isCustomKey: boolean,
  units: number
): Promise<RateLimitCheckResult> {
  return inspectAll(clientIp, units, true);
}

export async function peekInferenceRateLimit(
  clientIp: string,
  _isCustomKey: boolean,
  units: number
): Promise<RateLimitCheckResult> {
  return inspectAll(clientIp, units, false);
}

export async function checkReviewStartRateLimit(
  clientIp: string
): Promise<RateLimitCheckResult> {
  return touchBucket(
    `ip-start:${clientIp.trim() || 'unknown'}`,
    START_WINDOW_MS,
    STARTS_PER_WINDOW,
    1,
    true
  );
}

let inferenceActive = 0;
const inferenceWaiters: Array<() => void> = [];
let lastInferenceStartedAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withInferenceThrottle<T>(fn: () => Promise<T>): Promise<T> {
  await new Promise<void>((resolve) => {
    const tryAcquire = () => {
      if (inferenceActive < INFERENCE_CONCURRENCY) {
        inferenceActive += 1;
        resolve();
        return;
      }
      inferenceWaiters.push(tryAcquire);
    };
    tryAcquire();
  });

  try {
    const waitMs = Math.max(0, lastInferenceStartedAt + MIN_INFERENCE_INTERVAL_MS - Date.now());
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    lastInferenceStartedAt = Date.now();
    return await fn();
  } finally {
    inferenceActive -= 1;
    const next = inferenceWaiters.shift();
    if (next) next();
  }
}
