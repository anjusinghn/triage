import { headers } from 'next/headers';

export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for');
    if (forwarded) {
      const first = forwarded.split(',')[0]?.trim() ?? '';
      if (first && first.length < 64) return first;
    }
    const realIp = headerList.get('x-real-ip')?.trim();
    if (realIp && realIp.length < 64) return realIp;
    return '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

function hostnameFrom(value: string | null): string | null {
  if (!value) return null;
  try {
    if (value.includes('://')) return new URL(value).host.toLowerCase();
    return value.split(',')[0].trim().toLowerCase();
  } catch {
    return null;
  }
}

function allowedHosts(): Set<string> {
  const hosts = new Set<string>(['localhost:3000', 'localhost:3001']);
  const vercel = process.env.VERCEL_URL?.replace(/^https?:\/\//, '').toLowerCase();
  if (vercel) hosts.add(vercel);
  for (const raw of (process.env.ALLOWED_ORIGINS ?? '').split(',')) {
    const host = hostnameFrom(raw.trim());
    if (host) hosts.add(host);
  }
  return hosts;
}

export async function assertTrustedRequest(): Promise<void> {
  const headerList = await headers();
  const originHost = hostnameFrom(headerList.get('origin'));
  const host = hostnameFrom(headerList.get('x-forwarded-host') || headerList.get('host'));
  const allowed = allowedHosts();
  if (host) allowed.add(host);

  if (!originHost) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Forbidden');
    }
    return;
  }

  if (!allowed.has(originHost)) {
    throw new Error('Forbidden');
  }
}

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString('latin1') === '%PDF-';
}

export function publicSafeError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/forbidden/i.test(raw)) return 'This request is not allowed.';
  if (/too many|rate|quota|429/i.test(raw)) {
    return 'Too many AI reviews right now. Please wait and try again.';
  }
  if (/not configured/i.test(raw)) return 'AI review is not configured.';
  if (/access code/i.test(raw)) return raw;
  if (/pdf|file|resume|position|least one/i.test(raw) && raw.length < 180) {
    if (/fireworks|api[_-]?key|bearer|sk-|fw_/i.test(raw)) return fallback;
    return raw;
  }
  return fallback;
}
