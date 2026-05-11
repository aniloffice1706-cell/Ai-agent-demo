import { NextResponse } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { rateLimitMiddleware, sanitizeInput } from '@/lib/security/rateLimiter';
import { ChatMessageSchema } from '@/lib/security/validation';
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
import { getAnthropic, CLAUDE_MODEL } from '@/lib/ai/client';

type Turn = { role: 'user' | 'assistant'; text: string };

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

async function llmReply(
  turns: Turn[],
  current: string,
  req: Requirement,
  matches: Project[],
  relaxed: string[],
): Promise<string | null> {
  const a = getAnthropic();
  if (!a) return null;

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

  const system = `You are "Plexus AI", a sharp, warm real-estate broker assistant for Lucknow, India.
Your job: help a human broker qualify their buyer's brief and surface matching projects from the portfolio.

Style:
- Short replies (2–5 sentences max). Conversational, never robotic.
- Lead with the substance — what was found or what's missing.
- When matches exist, reference them by name briefly; the UI already shows a card list, so don't re-list everything.
- Ask exactly ONE clarifying question if the brief is incomplete (missing BHK, budget, area, intent).
- Use ₹ symbol with L (lakhs) or Cr (crores). Indian English.
- Never invent projects or prices. Only reference the portfolio below.
- If the user is greeting or off-topic, redirect politely toward what they're looking for.

Portfolio (the ONLY projects you can reference):
${portfolioSummary}

Current parsed requirement: ${reqSummary}
Top portfolio matches for this turn:
${matchSummary}
${relaxNote}`;

  const messages = [
    ...turns.map((t) => ({
      role: t.role,
      content: t.text,
    })),
    { role: 'user' as const, content: current },
  ];

  try {
    const resp = await a.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 350,
      system,
      messages,
    });
    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    return text || null;
  } catch (e) {
    console.error('Claude API error:', e);
    return null;
  }
}

export async function POST(request: Request) {
  const limitResult = rateLimitMiddleware(request as any);
  if (limitResult) return limitResult;

  try {
    const body = await request.json();
    const { content } = ChatMessageSchema.parse(body);

    const rawHistory: Turn[] = Array.isArray(body.turns)
      ? body.turns
          .filter(
            (t: any): t is Turn =>
              t && (t.role === 'user' || t.role === 'assistant') && typeof t.text === 'string',
          )
          .slice(-12)
          .map((t: Turn) => ({ role: t.role, text: sanitizeInput(t.text) }))
      : [];

    const userHistory = rawHistory.filter((t) => t.role === 'user').map((t) => t.text);
    const sanitized = sanitizeInput(content);

    const { req, usedCommand } = buildRequirement(userHistory, sanitized);
    const hasRequirement =
      req.bhk !== undefined || req.maxLakh !== undefined || req.areas.length > 0;

    const { matches, relaxed } = hasRequirement
      ? findMatchesRelaxed(req)
      : { matches: [], relaxed: [] };

    const llmText = await llmReply(rawHistory, sanitized, req, matches, relaxed);
    const reply = llmText ?? fallbackReply(req, matches, relaxed, usedCommand, hasRequirement);

    return NextResponse.json({
      success: true,
      reply,
      header: hasRequirement ? summarizeRequirement(req) : null,
      matches: matches.map((p) => ({
        name: p.name,
        area: p.area,
        price: formatPrice(p.priceLakh),
        tag: p.tag,
      })),
      llm: llmText !== null,
    });
  } catch (error) {
    console.error('Chat route error:', error);
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
