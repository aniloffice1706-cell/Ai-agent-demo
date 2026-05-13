import { NextResponse } from 'next/server';
import { processChatMessage, type Turn } from '@/lib/chat/processor';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';
import { prisma } from '@/lib/db/prisma';

// ── Webhook verification (Meta calls GET once when you set the webhook URL) ──
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expected) {
    return new NextResponse('Server not configured', { status: 500 });
  }
  if (mode === 'subscribe' && token === expected) {
    return new NextResponse(challenge ?? '', { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// ── Incoming message from a WhatsApp user ──
type WaMessage = { from: string; id: string; text?: { body: string }; type: string };
type WaEntry = { changes: { value: { messages?: WaMessage[]; metadata?: any } }[] };
type WaPayload = { object: string; entry: WaEntry[] };

async function loadRecentTurns(sessionId: string): Promise<Turn[]> {
  // We don't store full conversation history in DB yet — use the latest summary line
  // For now return empty so each WA message is treated as a fresh turn that still
  // benefits from accumulated requirement state in the Lead row.
  // Future: persist ChatMessage rows keyed by sessionId.
  return [];
}

export async function POST(request: Request) {
  let payload: WaPayload;
  try {
    payload = (await request.json()) as WaPayload;
  } catch {
    return NextResponse.json({ ok: true }); // ack so Meta doesn't retry
  }

  // Meta requires a 200 within a few seconds — kick processing off and return fast.
  // We use waitUntil-style fire-and-forget because Next.js dev server doesn't have
  // waitUntil; the message-processing promise will run before the response actually
  // completes since fetch keeps the function alive in serverless deploys.
  if (payload.object !== 'whatsapp_business_account') {
    return NextResponse.json({ ok: true });
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const msgs = change.value?.messages ?? [];
      for (const m of msgs) {
        if (m.type !== 'text' || !m.text?.body) continue;
        const from = m.from;
        const body = m.text.body.trim();
        if (!body) continue;

        const sessionId = `wa_${from}`;
        try {
          const result = await processChatMessage({
            content: body,
            turns: await loadRecentTurns(sessionId),
            sessionId,
            channel: 'whatsapp',
          });

          // Backfill the lead's phone number from the WhatsApp sender ID so it shows up in CRM
          if (result.lead && !result.lead.phone) {
            try {
              await prisma.lead.update({
                where: { id: result.lead.id },
                data: { phone: from },
              });
            } catch {}
          }

          await sendWhatsAppMessage(from, result.reply);
        } catch (e: any) {
          console.error('WA processing failed:', e?.message ?? e);
          await sendWhatsAppMessage(
            from,
            'Sorry, something went wrong on my end. Could you try again in a moment?',
          );
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
