import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  if (!client) client = new Anthropic({ apiKey: key });
  return client;
}

export const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}
