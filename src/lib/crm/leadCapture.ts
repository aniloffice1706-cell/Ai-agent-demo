import { prisma } from '@/lib/db/prisma';
import type { Requirement, Project } from '@/lib/projects';
import { scoreLead } from './scoring';
import { syncLeadToSheet } from './sheets';

type CaptureInput = {
  sessionId: string;
  channel: 'chat' | 'voice' | 'whatsapp';
  userText: string;
  requirement: Requirement;
  matches: Project[];
};

function extractPhone(text: string): string | null {
  const m = text.match(/(?:\+?91[-\s]?)?[6-9]\d{9}/);
  return m ? m[0].replace(/\D/g, '').slice(-10) : null;
}

function extractEmail(text: string): string | null {
  const m = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return m ? m[0] : null;
}

function extractName(text: string): string | null {
  const patterns = [
    /(?:my name is|i am|i'm|this is|name'?s)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:buyer'?s? name is|client'?s? name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1].length >= 2 && m[1].length < 50) return m[1];
  }
  return null;
}

export async function captureLead(input: CaptureInput) {
  const { sessionId, channel, userText, requirement, matches } = input;

  const phone = extractPhone(userText);
  const email = extractEmail(userText);
  const name = extractName(userText);

  const existing = await prisma.lead.findUnique({ where: { sessionId } });

  const data: any = {
    sessionId,
    channel,
    source: channel,
    requirementJson: JSON.stringify(requirement),
    messageCount: (existing?.messageCount ?? 0) + 1,
    lastMessageAt: new Date(),
  };

  if (name && (!existing || existing.name === 'Unknown')) data.name = name;
  if (phone && (!existing || !existing.phone)) data.phone = phone;
  if (email && (!existing || !existing.email)) data.email = email;
  if (requirement.intent && !existing?.intent) data.intent = requirement.intent;
  if (requirement.areas.length > 0 && !existing?.location) data.location = requirement.areas[0];
  if (requirement.bhk && !existing?.propertyType) data.propertyType = `${requirement.bhk} BHK`;
  if (requirement.maxLakh !== undefined && !existing?.budget) {
    data.budget =
      requirement.minLakh !== undefined
        ? `${requirement.minLakh}L–${requirement.maxLakh}L`
        : `up to ${requirement.maxLakh}L`;
  }
  if (matches.length > 0) {
    data.chatSummary = matches.map((m) => m.name).join(', ');
  }

  const { score, priority } = scoreLead({
    requirement,
    name: data.name ?? existing?.name ?? 'Unknown',
    phone: data.phone ?? existing?.phone ?? '',
    email: data.email ?? existing?.email ?? null,
    intent: data.intent ?? existing?.intent ?? null,
    messageCount: data.messageCount,
    userTextThisTurn: userText,
  });
  data.score = score;
  data.priority = priority;
  if (priority === 'hot') data.status = 'hot';
  else if (priority === 'warm' && existing?.status !== 'hot') data.status = 'warm';

  const lead = existing
    ? await prisma.lead.update({ where: { sessionId }, data })
    : await prisma.lead.create({ data });

  // Awaited so errors surface in serverless request logs (Vercel kills fire-and-forget).
  // Sheets API typically responds in 400–800ms which is acceptable for this chat flow.
  try {
    const rowIdx = await syncLeadToSheet(lead);
    console.log('[sheets] sync ok, row=', rowIdx, 'lead=', lead.id);
  } catch (e: any) {
    console.error('[sheets] sync failed:', e?.message ?? e);
  }

  return lead;
}
