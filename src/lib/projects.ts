export type Project = {
  name: string;
  area: string;
  priceLakh: number;
  bhk: number[];
  tag: string;
  intent: ('purchase' | 'rent')[];
};

export const PROJECTS: Project[] = [
  { name: 'Eldeco Saubhagyam',     area: 'Gomti Nagar Extension', priceLakh: 120, bhk: [2, 3],    tag: 'Best Value',  intent: ['purchase'] },
  { name: 'Omaxe Royal Residency', area: 'Vrindavan Yojna',       priceLakh: 150, bhk: [3, 4],    tag: 'Park Facing', intent: ['purchase'] },
  { name: 'Shalimar One World',    area: 'Sushant Golf City',     priceLakh: 180, bhk: [3, 4],    tag: 'Premium',     intent: ['purchase'] },
  { name: 'Ansal API Sushant Golf',area: 'Sushant Golf City',     priceLakh: 220, bhk: [4, 5],    tag: 'Luxury',      intent: ['purchase'] },
  { name: 'Paarth Aadyant',        area: 'Gomti Nagar',           priceLakh: 95,  bhk: [2, 3],    tag: 'Metro Nearby',intent: ['purchase'] },
  { name: 'Rohtas Plumeria',       area: 'Jankipuram',            priceLakh: 65,  bhk: [2, 3],    tag: 'Affordable',  intent: ['purchase'] },
  { name: 'Emaar Gomti Greens',    area: 'Gomti Nagar',           priceLakh: 175, bhk: [3, 4],    tag: 'Riverside',   intent: ['purchase'] },
  { name: 'Mahanagar Heights',     area: 'Mahanagar',             priceLakh: 80,  bhk: [2, 3],    tag: 'Central',     intent: ['purchase'] },
  { name: 'Aliganj Residency',     area: 'Aliganj',               priceLakh: 55,  bhk: [1, 2],    tag: 'Starter',     intent: ['purchase'] },
  { name: 'Hazratganj Suites',     area: 'Hazratganj',            priceLakh: 25,  bhk: [1, 2],    tag: 'For Rent',    intent: ['rent'] },
  { name: 'Indira Nagar Homes',    area: 'Indira Nagar',          priceLakh: 30,  bhk: [2, 3],    tag: 'For Rent',    intent: ['rent'] },
];

export type Requirement = {
  bhk?: number;
  minLakh?: number;
  maxLakh?: number;
  areas: string[];
  intent?: 'purchase' | 'rent';
};

const AREA_ALIASES: Record<string, string> = {
  'gomti nagar extension': 'Gomti Nagar Extension',
  'gomti extension': 'Gomti Nagar Extension',
  'gomti nagar': 'Gomti Nagar',
  'gomti': 'Gomti Nagar',
  'vrindavan yojna': 'Vrindavan Yojna',
  'vrindavan': 'Vrindavan Yojna',
  'sushant golf city': 'Sushant Golf City',
  'sushant': 'Sushant Golf City',
  'golf city': 'Sushant Golf City',
  'jankipuram': 'Jankipuram',
  'janki puram': 'Jankipuram',
  'mahanagar': 'Mahanagar',
  'aliganj': 'Aliganj',
  'hazratganj': 'Hazratganj',
  'ganj': 'Hazratganj',
  'indira nagar': 'Indira Nagar',
  'indra nagar': 'Indira Nagar',
  'indira': 'Indira Nagar',
  'shaheed path': 'Shaheed Path',
  'amar shaheed path': 'Amar Shaheed Path',
  'chowk': 'Chowk',
  'aminabad': 'Aminabad',
  'transport nagar': 'Transport Nagar',
};

export function parseRequirement(text: string): Requirement {
  const t = text.toLowerCase();
  const req: Requirement = { areas: [] };

  const bhkMatch = t.match(/(\d)\s*bhk/);
  if (bhkMatch) req.bhk = parseInt(bhkMatch[1], 10);

  // budget — supports "50 lakh", "1.5 cr", "1-2 cr", "50-75 lakh"
  const rangeCr = t.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(cr|crore)/);
  const rangeLakh = t.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(lakh|lac|l\b)/);
  const singleCr = t.match(/(?:under|below|upto|up to|around|~)?\s*(\d+(?:\.\d+)?)\s*(cr|crore)/);
  const singleLakh = t.match(/(?:under|below|upto|up to|around|~)?\s*(\d+(?:\.\d+)?)\s*(lakh|lac|l\b)/);

  if (rangeCr) {
    req.minLakh = parseFloat(rangeCr[1]) * 100;
    req.maxLakh = parseFloat(rangeCr[2]) * 100;
  } else if (rangeLakh) {
    req.minLakh = parseFloat(rangeLakh[1]);
    req.maxLakh = parseFloat(rangeLakh[2]);
  } else if (singleCr) {
    const v = parseFloat(singleCr[1]) * 100;
    req.maxLakh = v;
    req.minLakh = v * 0.7;
  } else if (singleLakh) {
    const v = parseFloat(singleLakh[1]);
    req.maxLakh = v;
    req.minLakh = v * 0.7;
  }

  const aliases = Object.keys(AREA_ALIASES).sort((a, b) => b.length - a.length);
  const matchedCanonical = new Set<string>();
  let scanText = ` ${t} `;
  for (const alias of aliases) {
    if (new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i').test(scanText)) {
      matchedCanonical.add(AREA_ALIASES[alias]);
      scanText = scanText.replace(new RegExp(alias, 'gi'), ' ');
    }
  }
  req.areas = Array.from(matchedCanonical);

  if (/\brent(al)?\b|\bto rent\b|\bfor rent\b/.test(t)) req.intent = 'rent';
  else if (/\bbuy\b|\bpurchase\b|\binvest(ment)?\b/.test(t)) req.intent = 'purchase';

  return req;
}

export type Command =
  | 'widen_budget'
  | 'nearby_areas'
  | 'cheaper'
  | 'bigger'
  | 'smaller'
  | 'reset';

export function parseCommand(text: string): Command | null {
  const t = text.toLowerCase();
  if (/\b(reset|start over|clear|new search)\b/.test(t)) return 'reset';
  if (/\b(widen|increase|raise|expand|more)\b.*\b(budget|price)\b/.test(t)) return 'widen_budget';
  if (/\b(any|nearby|other|different|expand)\b.*\b(area|location|locality|place)\b/.test(t)) return 'nearby_areas';
  if (/\bnearby\b|\bany area\b|\bother area/.test(t)) return 'nearby_areas';
  if (/\bcheaper|lower budget|reduce budget|less expensive\b/.test(t)) return 'cheaper';
  if (/\bbigger|larger|more bhk|more bedroom\b/.test(t)) return 'bigger';
  if (/\bsmaller|less bhk|fewer bedroom\b/.test(t)) return 'smaller';
  return null;
}

export function applyCommand(req: Requirement, cmd: Command): Requirement {
  switch (cmd) {
    case 'reset': return { areas: [] };
    case 'widen_budget':
      if (req.maxLakh !== undefined) return { ...req, maxLakh: req.maxLakh * 1.5, minLakh: req.minLakh ? req.minLakh * 0.7 : undefined };
      return req;
    case 'nearby_areas': return { ...req, areas: [] };
    case 'cheaper':
      if (req.maxLakh !== undefined) return { ...req, maxLakh: req.maxLakh * 0.7, minLakh: undefined };
      return { ...req, maxLakh: 60 };
    case 'bigger': return { ...req, bhk: req.bhk ? Math.min(req.bhk + 1, 5) : 3 };
    case 'smaller': return { ...req, bhk: req.bhk ? Math.max(req.bhk - 1, 1) : 1 };
  }
}

export function findMatchesRelaxed(req: Requirement): { matches: Project[]; relaxed: string[] } {
  let r = req;
  const relaxed: string[] = [];
  let matches = findMatches(r);
  if (matches.length > 0) return { matches, relaxed };

  if (r.minLakh !== undefined || r.maxLakh !== undefined) {
    r = { ...r, minLakh: undefined, maxLakh: undefined };
    matches = findMatches(r);
    if (matches.length > 0) { relaxed.push('budget'); return { matches, relaxed }; }
  }
  if (r.areas.length > 0) {
    r = { ...r, areas: [] };
    matches = findMatches(r);
    if (matches.length > 0) { relaxed.push('area'); return { matches, relaxed }; }
  }
  if (r.bhk !== undefined) {
    r = { ...r, bhk: undefined };
    matches = findMatches(r);
    if (matches.length > 0) { relaxed.push('BHK'); return { matches, relaxed }; }
  }
  return { matches: [], relaxed };
}

export function mergeRequirements(a: Requirement, b: Requirement): Requirement {
  return {
    bhk: b.bhk ?? a.bhk,
    minLakh: b.minLakh ?? a.minLakh,
    maxLakh: b.maxLakh ?? a.maxLakh,
    intent: b.intent ?? a.intent,
    areas: Array.from(new Set([...(a.areas || []), ...(b.areas || [])])),
  };
}

export function findMatches(req: Requirement): Project[] {
  let pool = PROJECTS.slice();

  if (req.intent) pool = pool.filter((p) => p.intent.includes(req.intent!));
  if (req.bhk) pool = pool.filter((p) => p.bhk.includes(req.bhk!));
  if (req.areas.length) pool = pool.filter((p) => req.areas.includes(p.area));
  if (req.maxLakh !== undefined) pool = pool.filter((p) => p.priceLakh <= req.maxLakh!);
  if (req.minLakh !== undefined) pool = pool.filter((p) => p.priceLakh >= req.minLakh! * 0.85);

  // Score by fit, prefer mid-range when both bounds given
  pool.sort((a, b) => {
    if (req.maxLakh !== undefined) {
      const target = req.minLakh !== undefined ? (req.minLakh + req.maxLakh) / 2 : req.maxLakh * 0.9;
      return Math.abs(a.priceLakh - target) - Math.abs(b.priceLakh - target);
    }
    return a.priceLakh - b.priceLakh;
  });

  return pool.slice(0, 3);
}

export function formatPrice(priceLakh: number): string {
  if (priceLakh >= 100) {
    const cr = priceLakh / 100;
    return `₹ ${cr.toFixed(cr % 1 === 0 ? 0 : 1)} Cr`;
  }
  return `₹ ${priceLakh} L`;
}

export function summarizeRequirement(req: Requirement): string {
  const parts: string[] = [];
  if (req.bhk) parts.push(`${req.bhk} BHK`);
  if (req.areas.length) parts.push(req.areas[0]);
  else parts.push('Lucknow');
  if (req.minLakh !== undefined && req.maxLakh !== undefined) {
    parts.push(`${formatPrice(req.minLakh)}–${formatPrice(req.maxLakh)}`);
  } else if (req.maxLakh !== undefined) {
    parts.push(`up to ${formatPrice(req.maxLakh)}`);
  }
  return parts.join(' · ');
}
