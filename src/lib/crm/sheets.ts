import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import type { Lead } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

const SHEET_HEADER = [
  'Lead ID',
  'Created At',
  'Last Message',
  'Channel',
  'Name',
  'Phone',
  'Email',
  'BHK',
  'Budget',
  'Area',
  'Intent',
  'Status',
  'Priority',
  'Score',
  'Messages',
  'Matched Projects',
];

let sheetsClient: ReturnType<typeof google.sheets> | null = null;
let headerEnsured = false;

function getSheets() {
  if (sheetsClient) return sheetsClient;

  let email: string | undefined;
  let key: string | undefined;

  // Preferred: JSON credentials file at project root (gitignored)
  const jsonPath = path.join(process.cwd(), 'google-credentials.json');
  if (existsSync(jsonPath)) {
    try {
      const j = JSON.parse(readFileSync(jsonPath, 'utf8'));
      email = j.client_email;
      key = j.private_key;
      console.log('[sheets] auth from JSON file');
    } catch (e) {
      console.error('[sheets] Failed to parse google-credentials.json:', e);
    }
  }

  // Fallback: env vars (used in serverless deployments)
  if (!email || !key) {
    email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const raw = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    if (raw) {
      key = raw.replace(/\\n/g, '\n');
      if (!key.includes('BEGIN PRIVATE KEY')) {
        key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----\n`;
      }
    }
    console.log(
      '[sheets] auth from env: email=',
      email ? email.slice(0, 20) + '...' : 'MISSING',
      ' key=',
      key ? `${key.length}chars, has_BEGIN=${key.includes('BEGIN')}` : 'MISSING',
    );
  }

  if (!email || !key) {
    console.warn('[sheets] no credentials available');
    return null;
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

function leadToRow(l: Lead): (string | number)[] {
  let bhk: string | number = '';
  let budget = l.budget ?? '';
  let area = l.location ?? '';
  if (l.requirementJson) {
    try {
      const r = JSON.parse(l.requirementJson);
      if (r.bhk) bhk = r.bhk;
      if (!area && Array.isArray(r.areas) && r.areas.length > 0) area = r.areas[0];
    } catch {}
  }
  return [
    l.id,
    l.createdAt.toISOString(),
    l.lastMessageAt ? l.lastMessageAt.toISOString() : '',
    l.channel,
    l.name,
    l.phone,
    l.email ?? '',
    bhk,
    budget,
    area,
    l.intent ?? '',
    l.status,
    l.priority,
    l.score,
    l.messageCount,
    l.chatSummary ?? '',
  ];
}

async function ensureHeader(sheets: ReturnType<typeof google.sheets>, sheetId: string) {
  if (headerEnsured) return;
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A1:P1',
  });
  if (!resp.data.values || resp.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: { values: [SHEET_HEADER] },
    });
  }
  headerEnsured = true;
}

export async function syncLeadToSheet(lead: Lead): Promise<number | null> {
  const sheets = getSheets();
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  if (!sheets) {
    console.warn('[sheets] skipping: no sheets client');
    return null;
  }
  if (!sheetId) {
    console.warn('[sheets] skipping: GOOGLE_SHEETS_ID env var missing');
    return null;
  }

  await ensureHeader(sheets, sheetId);
  const row = leadToRow(lead);

  if (lead.sheetRowIndex && lead.sheetRowIndex >= 2) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `A${lead.sheetRowIndex}:P${lead.sheetRowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
    return lead.sheetRowIndex;
  }

  const appendResp = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'A1',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
  // updates.updatedRange looks like 'Sheet1!A5:P5' — extract 5
  const updated = appendResp.data.updates?.updatedRange ?? '';
  const m = updated.match(/!A(\d+):/);
  const rowIndex = m ? parseInt(m[1], 10) : null;
  if (rowIndex) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { sheetRowIndex: rowIndex },
    });
  }
  return rowIndex;
}
