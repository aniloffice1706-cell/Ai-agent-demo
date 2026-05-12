import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;
let groq: OpenAI | null = null;

function isPlaceholder(key: string | undefined): boolean {
  if (!key) return true;
  return key.includes('sk-abcdef') || key.length < 20;
}

export function getAnthropic(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (isPlaceholder(key)) return null;
  if (!anthropic) anthropic = new Anthropic({ apiKey: key });
  return anthropic;
}

export function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (isPlaceholder(key)) return null;
  if (!openai) openai = new OpenAI({ apiKey: key });
  return openai;
}

export function getGroq(): OpenAI | null {
  const key = process.env.GROQ_API_KEY;
  if (isPlaceholder(key)) return null;
  if (!groq)
    groq = new OpenAI({
      apiKey: key,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  return groq;
}

export const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
export const OPENAI_MODEL = 'gpt-4o-mini';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}
