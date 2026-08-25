import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'ats_gate';

function configuredCode(): string {
  return process.env.REVIEW_ACCESS_CODE?.trim() ?? '';
}

function tokenFor(code: string): string {
  return createHmac('sha256', code).update('ats-gate-v1').digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isReviewGateEnabled(): boolean {
  return configuredCode().length > 0;
}

export async function isReviewGateUnlocked(): Promise<boolean> {
  const code = configuredCode();
  if (!code) return true;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;
  return safeEqual(token, tokenFor(code));
}

export async function unlockReviewGate(code: string): Promise<boolean> {
  const expected = configuredCode();
  if (!expected) return true;
  if (!safeEqual(code.trim(), expected)) return false;
  (await cookies()).set(COOKIE_NAME, tokenFor(expected), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return true;
}
