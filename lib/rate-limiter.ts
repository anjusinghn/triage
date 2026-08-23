interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const isProd = process.env.NODE_ENV === 'production';

const WINDOW_MS = 10 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const WINDOW_MAX = isProd ? 30 : 400;
const HOUR_MAX = isProd ? 30 : 400;
const DAY_MAX = isProd ? 80 : 400;
const INFERENCE_CONCURRENCY = isProd ? 4 : 8;
const MIN_INFERENCE_INTERVAL_MS = isProd ? 50 : 0;

const RATE_LIMIT_MESSAGE =
  'Too many AI reviews right now. Please wait and try again.';

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  message?: string;
}

function inspectBucket(
  trackerKey: string,
  windowMs: number,
  maxUnits: number,
  units: number,
  increment: boolean
): RateLimitCheckResult {
  const now = Date.now();
  const existing = rateLimitStore.get(trackerKey);
  const record =
    !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : existing;

  if (record.count + units > maxUnits) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      message: RATE_LIMIT_MESSAGE,
    };
  }

  if (increment) {
    record.count += units;
    rateLimitStore.set(trackerKey, record);
  }

  return { allowed: true };
}

function inspectAll(clientIp: string, units: number, increment: boolean): RateLimitCheckResult {
  const windowCheck = inspectBucket(
    `inference-window:${clientIp}`,
    WINDOW_MS,
    WINDOW_MAX,
    units,
    increment
  );
  if (!windowCheck.allowed) return windowCheck;

  const hourCheck = inspectBucket(`inference-hour:${clientIp}`, HOUR_MS, HOUR_MAX, units, increment);
  if (!hourCheck.allowed) return hourCheck;

  return inspectBucket(`inference-day:${clientIp}`, DAY_MS, DAY_MAX, units, increment);
}

export function checkInferenceRateLimit(
  clientIp: string,
  _isCustomKey: boolean,
  units: number
): RateLimitCheckResult {
  return inspectAll(clientIp, units, true);
}

export function peekInferenceRateLimit(
  clientIp: string,
  _isCustomKey: boolean,
  units: number
): RateLimitCheckResult {
  return inspectAll(clientIp, units, false);
}

export function checkEvaluationRateLimit(
  clientIp: string,
  isCustomKey: boolean,
  fileCount = 1
): RateLimitCheckResult {
  return checkInferenceRateLimit(clientIp, isCustomKey, fileCount);
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

export async function withAtsConcurrency<T>(
  _limit: number,
  fn: () => Promise<T>
): Promise<T> {
  return withInferenceThrottle(fn);
}
