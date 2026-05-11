import { NextRequest, NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string) {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { success: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { success: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  record.count++;

  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

export function rateLimitMiddleware(req: NextRequest) {
  const identifier = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const result = rateLimit(identifier);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  return null;
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 10000);
}

export function sanitizeFile(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 255);
}
