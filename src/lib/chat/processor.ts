import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { sanitizeInput } from '@/lib/security/rateLimiter';
import { captureLead } from '@/lib/crm/leadCapture';
import {
  parseRequirement,
  findMatchesRelaxed,
  formatPrice,
  summarizeRequirement,
  mergeRequirements,
  parseCommand,
  applyCommand,
  PROJECTS,
  type Requirement,
  type Project,
} from '@/lib/projects';
import {
  getAnthropic,
  getOpenAI,
  getGroq,
  CLAUDE_MODEL,
  OPENAI_MODEL,
  GROQ_MODEL,
} from '@/lib/ai/client';

export type Turn = { role: 'user' | 'assistant'; text: string };
export type Channel = 'chat' | 'voice' | 'whatsapp';

export type ProcessInput = {
  content: string;
  turns: Turn[];
  sessionId: string | null;
  channel: Channel;
};

export type ProcessOutput = {
  reply: string;
  header: string | null;
  matches: { name: string; area: string; price: string; tag: string }[];
  llm: boolean;
  provider: string;
  lead: { id: string; name: string; phone: string; score: number; priority: string } | null;
};

function buildRequirement(
  userHistory: string[],
  current: string,
): { req: Requirement; usedCommand: boolean } {
  let req: Requirement = { areas: [] };
  for (const past of userHistory) {
    req = mergeRequirements(req, parseRequirement(past));
    const cmd = parseCommand(past);
    if (cmd) req = applyCommand(req, cmd);
  }
  const cmd = parseCommand(current);
  let usedCommand = false;
  if (cmd) {
    req = applyCommand(req, cmd);
    usedCommand = true;
  }
  req = mergeRequirements(req, parseRequirement(current));
  return { req, usedCommand };
}

function fallbackReply(
  req: Requirement,
  matches: Project[],
  relaxed: string[],
  usedCommand: boolean,
  hasRequirement: boolean,
): string {
  if (!hasRequirement) {
    return 'Hi! Tell me what your buyer needs — e.g. "3 BHK in Gomti Nagar, 1–2 Cr" — and I\'ll surface matching projects from the portfolio.';
  }
  if (matches.length === 0) {
    return `Nothing in the portfolio matches ${summarizeRequirement(req)} even after widening. Try a different area or BHK?`;
  }
  const lines = matches
    .map((p, i) => `${i + 1}. ${p.name} — ${formatPrice(p.priceLakh)} · ${p.area}`)
    .join('\n');
  const missing: string[] = [];
  if (!req.bhk) missing.push('BHK');
  if (req.maxLakh === undefined) missing.push('budget');
  if (req.areas.length === 0) missing.push('preferred area');
  const followUp =
    missing.length > 0
      ? `To shortlist further, what's the ${missing.join(' and ')}?`
      : req.intent
        ? 'Should I shortlist by floor plan or possession date?'
        : 'Is this for end-use or investment?';
  const lead =
    usedCommand && relaxed.length === 0
      ? `Updated search (${summarizeRequirement(req)}):`
      : relaxed.length > 0
        ? `No exact match — closest options after relaxing ${relaxed.join(' and ')} (${summarizeRequirement(req)}):`
        : `Matching your brief (${summarizeRequirement(req)}):`;
  return `${lead}\n\n${lines}\n\n${followUp}`;
}

function buildSystemPrompt(req: Requirement, matches: Project[], relaxed: string[], channel: Channel): string {
  const portfolioSummary = PROJECTS.map(
    (p) =>
      `- ${p.name} (${p.area}, ${formatPrice(p.priceLakh)}, ${p.bhk.join('/')} BHK, ${p.intent.join('+')}, ${p.tag})`,
  ).join('\n');

  const matchSummary =
    matches.length > 0
      ? matches
          .map(
            (p, i) =>
              `${i + 1}. ${p.name} — ${formatPrice(p.priceLakh)} · ${p.area} · ${p.bhk.join('/')} BHK · ${p.tag}`,
          )
          .join('\n')
      : '(no exact match)';

  const reqSummary = summarizeRequirement(req) || '(none yet)';
  const relaxNote = relaxed.length > 0 ? `Constraints relaxed: ${relaxed.join(', ')}.` : '';
  const channelNote =
    channel === 'whatsapp'
      ? '\n- This is a WhatsApp conversation — keep replies short (under 4 lines). No markdown bold/italics. Plain text only.'
      : channel === 'voice'
        ? '\n- This message will be SPOKEN ALOUD — keep replies under 2 sentences, no bullet lists, no special characters.'
        : '';

  return `You are "Plexus AI", a sharp, warm real-estate broker assistant for Lucknow, India.
Your job: help a human broker qualify their buyer's brief and surface matching projects from the portfolio.

Style:
- Short replies (2–5 sentences max). Conversational, never robotic.
- Lead with the substance — what was found or what's missing.
- When matches exist, reference them by name briefly.
- Ask exactly ONE clarifying question if the brief is incomplete (missing BHK, budget, area, intent).
- Use ₹ symbol with L (lakhs) or Cr (crores). Indian English.
- Never invent projects or prices. Only reference the portfolio below.
- If the user is greeting or off-topic, redirect politely toward what they're looking for.${channelNote}

Portfolio (the ONLY projects you can reference):
${portfolioSummary}

Current parsed requirement: ${reqSummary}
Top portfolio matches for this turn:
${matchSummary}
${relaxNote}`;
}

async function tryOpenAICompatible(
  client: OpenAI,
  model: string,
  label: string,
  system: string,
  turns: Turn[],
  current: string,
): Promise<string | null> {
  try {
    const resp = await client.chat.completions.create({
      model,
      max_tokens: 350,
      messages: [
        { role: 'system', content: system },
        ...turns.map((t) => ({ role: t.role, content: t.text })),
        { role: 'user' as const, content: current },
      ],
    });
    const text = resp.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (e: any) {
    console.error(`${label} API error:`, e?.message ?? e);
    return null;
  }
}

async function tryAnthropic(system: string, turns: Turn[], current: string): Promise<string | null> {
  const client = getAnthropic();
  if (!client) return null;
  try {
    const resp = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 350,
      system,
      messages: [
        ...turns.map((t) => ({ role: t.role, content: t.text })),
        { role: 'user' as const, content: current },
      ],
    });
    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    return text || null;
  } catch (e: any) {
    console.error('Claude API error:', e?.message ?? e);
    return null;
  }
}

async function llmReply(
  turns: Turn[],
  current: string,
  system: string,
): Promise<{ text: string; provider: string } | null> {
  const groq = getGroq();
  if (groq) {
    const g = await tryOpenAICompatible(groq, GROQ_MODEL, 'Groq', system, turns, current);
    if (g) return { text: g, provider: 'groq' };
  }
  const oai = getOpenAI();
  if (oai) {
    const o = await tryOpenAICompatible(oai, OPENAI_MODEL, 'OpenAI', system, turns, current);
    if (o) return { text: o, provider: 'openai' };
  }
  const a = await tryAnthropic(system, turns, current);
  if (a) return { text: a, provider: 'anthropic' };
  return null;
}

export async function processChatMessage(input: ProcessInput): Promise<ProcessOutput> {
  const sanitized = sanitizeInput(input.content);
  const turns = input.turns.map((t) => ({ role: t.role, text: sanitizeInput(t.text) })).slice(-12);
  const userHistory = turns.filter((t) => t.role === 'user').map((t) => t.text);

  const { req, usedCommand } = buildRequirement(userHistory, sanitized);
  const hasRequirement =
    req.bhk !== undefined || req.maxLakh !== undefined || req.areas.length > 0;

  const { matches, relaxed } = hasRequirement
    ? findMatchesRelaxed(req)
    : { matches: [] as Project[], relaxed: [] as string[] };

  const system = buildSystemPrompt(req, matches, relaxed, input.channel);
  const llm = await llmReply(turns, sanitized, system);
  const reply = llm?.text ?? fallbackReply(req, matches, relaxed, usedCommand, hasRequirement);

  let lead: ProcessOutput['lead'] = null;
  if (input.sessionId) {
    try {
      const captured = await captureLead({
        sessionId: input.sessionId,
        channel: input.channel,
        userText: sanitized,
        requirement: req,
        matches,
      });
      lead = {
        id: captured.id,
        name: captured.name,
        phone: captured.phone,
        score: captured.score,
        priority: captured.priority,
      };
    } catch (e) {
      console.error('Lead capture failed:', e);
    }
  }

  return {
    reply,
    header: hasRequirement ? summarizeRequirement(req) : null,
    matches: matches.map((p) => ({
      name: p.name,
      area: p.area,
      price: formatPrice(p.priceLakh),
      tag: p.tag,
    })),
    llm: llm !== null,
    provider: llm?.provider ?? 'regex',
    lead,
  };
}
