import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { verifyAdminToken } from '@/lib/admin-auth';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

function makeRatelimit(requests: number, windowSeconds: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const redis = new Redis({ url, token });
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    });
  } catch {
    return null;
  }
}

// Lazily initialized to avoid build-time errors when env vars are absent
let apiLimiter: Ratelimit | null | undefined;
let adminLimiter: Ratelimit | null | undefined;

function getApiLimiter(): Ratelimit | null {
  if (apiLimiter === undefined) apiLimiter = makeRatelimit(10, 60);
  return apiLimiter;
}

function getAdminLimiter(): Ratelimit | null {
  if (adminLimiter === undefined) adminLimiter = makeRatelimit(5, 900);
  return adminLimiter;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

const RATE_LIMITED_API_PATHS = [
  '/api/leads',
  '/api/quote-request',
  '/api/messages',
  '/api/conversations',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Admin brute-force guard: max 5 POST attempts per IP per 15 minutes
  if (pathname === '/admin/login' && method === 'POST') {
    const limiter = getAdminLimiter();
    if (limiter) {
      const ip = getClientIp(request);
      const { success } = await limiter.limit(`admin_login:${ip}`);
      if (!success) {
        return applySecurityHeaders(
          new NextResponse(
            JSON.stringify({ error: 'Too many login attempts. Try again later.' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
    } else {
      console.warn('[proxy] Rate limit client not configured — admin brute-force guard disabled');
    }
  }

  // API rate limiting: 10 POST requests per IP per 60 seconds
  if (method === 'POST' && RATE_LIMITED_API_PATHS.some((p) => pathname.startsWith(p))) {
    const limiter = getApiLimiter();
    if (limiter) {
      const ip = getClientIp(request);
      const { success } = await limiter.limit(`api:${ip}`);
      if (!success) {
        return applySecurityHeaders(
          new NextResponse(
            JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
    } else {
      console.warn('[proxy] Rate limit client not configured — API rate limiting disabled');
    }
  }

  // Admin session protection
  const tokenCookie = request.cookies.get('admin_token')?.value;
  const secretKey = process.env.ADMIN_SECRET_KEY;
  const isValidSession =
    !!tokenCookie && !!secretKey && !!(await verifyAdminToken(tokenCookie, secretKey));

  if (pathname === '/admin/login') {
    if (isValidSession) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/admin', request.url)));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith('/admin')) {
    if (!isValidSession) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/admin/login', request.url)));
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
