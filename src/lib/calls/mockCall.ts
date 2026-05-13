import { prisma } from '@/lib/db/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';

export type MockCallTrigger = {
  leadId: string;
  reason: 'hot_threshold' | 'manual' | 'followup';
};

/**
 * Mock outbound-call layer.
 *
 * What real Twilio/Exotel integration would do here:
 *   1. POST to Twilio /Calls API with `to: lead.phone`, TwiML pointing to
 *      a webhook that streams a Claude/Groq-generated voiceover.
 *   2. Twilio returns a Call SID; persist it on the VoiceCall row.
 *   3. Twilio fires status callbacks as the call progresses.
 *
 * For now we just persist a VoiceCall row, log the would-be payload, and
 * (if WhatsApp is configured) notify the lead via WhatsApp instead, so the
 * outbound-touch loop is observable end-to-end without paid telephony.
 */
export async function triggerMockCall(input: MockCallTrigger) {
  const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
  if (!lead) {
    console.warn('[call] mock skipped: lead not found', input.leadId);
    return null;
  }
  if (!lead.phone) {
    console.warn('[call] mock skipped: lead has no phone', input.leadId);
    return null;
  }

  const summaryParts: string[] = [];
  if (lead.propertyType) summaryParts.push(lead.propertyType);
  if (lead.location) summaryParts.push(`in ${lead.location}`);
  if (lead.budget) summaryParts.push(`budget ${lead.budget}`);
  const summary = summaryParts.join(', ') || 'their requirement';

  const opener = `Hi ${lead.name === 'Unknown' ? 'there' : lead.name}, this is Plexus AI. Following up on your enquiry for ${summary}. Is now a good time to talk through the matching options?`;

  const call = await prisma.voiceCall.create({
    data: {
      leadId: lead.id,
      userId: lead.userId,
      status: 'initiated',
      transcript: opener,
      summary: `mock call (${input.reason}) — would dial ${lead.phone}`,
    },
  });

  console.log(
    `[call] MOCK initiate → lead=${lead.id} phone=${lead.phone} reason=${input.reason} callId=${call.id}`,
  );
  console.log(`[call] would-say: "${opener}"`);

  // Fallback to WhatsApp ping so the user still gets touched even without real telephony
  try {
    const sent = await sendWhatsAppMessage(
      lead.phone,
      `Hi! This is Plexus AI following up on your enquiry for ${summary}. Want me to share the top matches?`,
    );
    if (sent) {
      await prisma.voiceCall.update({
        where: { id: call.id },
        data: { status: 'completed', summary: `mock call → WhatsApp follow-up sent to ${lead.phone}` },
      });
    } else {
      await prisma.voiceCall.update({
        where: { id: call.id },
        data: { status: 'failed', summary: `mock call (${input.reason}) — WA not configured, no outbound touch` },
      });
    }
  } catch (e: any) {
    console.error('[call] outbound WA fallback failed:', e?.message ?? e);
  }

  return call;
}
