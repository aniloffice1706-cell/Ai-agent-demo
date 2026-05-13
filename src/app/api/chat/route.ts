import { NextResponse } from 'next/server';
import { rateLimitMiddleware, sanitizeInput } from '@/lib/security/rateLimiter';
import { ChatMessageSchema } from '@/lib/security/validation';
import { processChatMessage, type Turn, type Channel } from '@/lib/chat/processor';

export async function POST(request: Request) {
  const limitResult = rateLimitMiddleware(request as any);
  if (limitResult) return limitResult;

  try {
    const body = await request.json();
    const { content } = ChatMessageSchema.parse(body);

    const turns: Turn[] = Array.isArray(body.turns)
      ? body.turns.filter(
          (t: any): t is Turn =>
            t && (t.role === 'user' || t.role === 'assistant') && typeof t.text === 'string',
        )
      : [];

    const sessionId =
      typeof body.sessionId === 'string' && body.sessionId.length > 0
        ? sanitizeInput(body.sessionId).slice(0, 64)
        : null;

    const channel: Channel =
      body.channel === 'voice' || body.channel === 'whatsapp' ? body.channel : 'chat';

    const result = await processChatMessage({ content, turns, sessionId, channel });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Chat route error:', error);
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
