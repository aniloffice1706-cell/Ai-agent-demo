import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';
import { syncLeadToSheet } from '@/lib/crm/sheets';

// Vercel cron hits this with header `Authorization: Bearer ${CRON_SECRET}`.
// Manual triggers (curl from terminal) must pass the same header.
function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev mode — no secret set, allow
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

const SILENT_THRESHOLD_MIN = 120; // 2 hours
const MAX_PER_RUN = 20; // safety cap so a buggy run can't burn through Meta quota

function buildFollowupMessage(lead: { name: string; propertyType: string | null; location: string | null; budget: string | null }): string {
  const greet = lead.name && lead.name !== 'Unknown' ? `Hi ${lead.name},` : 'Hi,';
  const what = [lead.propertyType, lead.location && `in ${lead.location}`, lead.budget && `around ${lead.budget}`]
    .filter(Boolean)
    .join(' ');
  return `${greet} this is Plexus AI. Just checking in on ${what || 'your enquiry'} — still looking? Want me to share fresh matches that came in this week?`;
}

export async function GET(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - SILENT_THRESHOLD_MIN * 60_000);

  const candidates = await prisma.lead.findMany({
    where: {
      AND: [
        { phone: { not: '' } },
        { priority: { in: ['hot', 'warm'] } },
        { status: { notIn: ['contacted', 'converted'] } },
        { lastMessageAt: { lt: cutoff } },
        { lastMessageAt: { not: null } },
      ],
    },
    orderBy: { score: 'desc' },
    take: MAX_PER_RUN,
  });

  const results: Array<{ id: string; name: string; phone: string; sent: boolean }> = [];

  for (const lead of candidates) {
    const text = buildFollowupMessage(lead);
    const sent = await sendWhatsAppMessage(lead.phone, text);
    if (sent) {
      const updated = await prisma.lead.update({
        where: { id: lead.id },
        data: { status: 'contacted', notes: `[followup ${new Date().toISOString()}] ${text}` },
      });
      try {
        await syncLeadToSheet(updated);
      } catch (e: any) {
        console.error('[followups] sheets sync failed for', lead.id, e?.message ?? e);
      }
    } else {
      console.warn('[followups] WA send failed for lead', lead.id);
    }
    results.push({ id: lead.id, name: lead.name, phone: lead.phone, sent });
  }

  return NextResponse.json({
    success: true,
    threshold_minutes: SILENT_THRESHOLD_MIN,
    candidates: candidates.length,
    results,
  });
}

// Also accept POST for clients that prefer it (Vercel cron uses GET).
export const POST = GET;
