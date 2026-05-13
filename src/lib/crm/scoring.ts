import type { Lead } from '@prisma/client';
import type { Requirement } from '@/lib/projects';

export type Priority = 'cold' | 'warm' | 'hot';

export type ScoreBreakdown = {
  score: number;
  priority: Priority;
  reasons: string[];
};

const HOT_THRESHOLD = 70;
const WARM_THRESHOLD = 40;

export function scoreLead(input: {
  requirement: Requirement;
  name: string;
  phone: string;
  email: string | null;
  intent: string | null;
  messageCount: number;
  userTextThisTurn: string;
}): ScoreBreakdown {
  const reasons: string[] = [];
  let score = 0;

  if (input.requirement.bhk) {
    score += 15;
    reasons.push('BHK known (+15)');
  }
  if (input.requirement.areas.length > 0) {
    score += 15;
    reasons.push('area known (+15)');
  }
  if (input.requirement.maxLakh !== undefined) {
    score += 15;
    reasons.push('budget known (+15)');
    if (input.requirement.maxLakh >= 100) {
      score += 10;
      reasons.push('premium budget ≥₹1Cr (+10)');
    } else if (input.requirement.maxLakh >= 50) {
      score += 5;
      reasons.push('mid budget ≥₹50L (+5)');
    }
  }
  if (input.intent === 'purchase') {
    score += 10;
    reasons.push('purchase intent (+10)');
  } else if (input.intent === 'rent') {
    score += 5;
    reasons.push('rent intent (+5)');
  }

  if (input.name && input.name !== 'Unknown') {
    score += 8;
    reasons.push('name captured (+8)');
  }
  if (input.phone) {
    score += 15;
    reasons.push('phone captured (+15)');
  }
  if (input.email) {
    score += 5;
    reasons.push('email captured (+5)');
  }

  const engagement = Math.min(input.messageCount * 2, 12);
  if (engagement > 0) {
    score += engagement;
    reasons.push(`engagement (+${engagement})`);
  }

  const urgencyText = input.userTextThisTurn.toLowerCase();
  if (/\b(urgent|asap|immediately|this week|this month|ready to buy|finalise|finalize|book)\b/.test(urgencyText)) {
    score += 12;
    reasons.push('urgency signal (+12)');
  }
  if (/\b(investment|invest|portfolio|second home|nri)\b/.test(urgencyText)) {
    score += 8;
    reasons.push('investor signal (+8)');
  }
  if (/\b(just looking|just browsing|maybe|not sure|exploring|window shopping)\b/.test(urgencyText)) {
    score -= 10;
    reasons.push('window-shopper signal (−10)');
  }

  score = Math.max(0, Math.min(100, score));
  const priority: Priority =
    score >= HOT_THRESHOLD ? 'hot' : score >= WARM_THRESHOLD ? 'warm' : 'cold';

  return { score, priority, reasons };
}
