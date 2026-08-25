import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function hostname(value: string | null): string | null {
  if (!value) return null;
  try {
    if (value.includes('://')) return new URL(value).host.toLowerCase();
    return value.split(',')[0].trim().toLowerCase();
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.next();
  }

  const originHost = hostname(request.headers.get('origin'));
  const requestHost = hostname(
    request.headers.get('x-forwarded-host') || request.headers.get('host')
  );
  if (!originHost || !requestHost) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Forbidden', { status: 403 });
    }
    return NextResponse.next();
  }

  const allowed = new Set<string>([requestHost, 'localhost:3000', 'localhost:3001']);
  const vercel = process.env.VERCEL_URL?.replace(/^https?:\/\//, '').toLowerCase();
  if (vercel) allowed.add(vercel);
  for (const raw of (process.env.ALLOWED_ORIGINS ?? '').split(',')) {
    const host = hostname(raw.trim());
    if (host) allowed.add(host);
  }

  if (!allowed.has(originHost)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
