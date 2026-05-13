import { NextResponse } from 'next/server';
import { triggerMockCall } from '@/lib/calls/mockCall';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const leadId = typeof body.leadId === 'string' ? body.leadId : null;
    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId required' }, { status: 400 });
    }
    const call = await triggerMockCall({ leadId, reason: 'manual' });
    if (!call) {
      return NextResponse.json({ success: false, error: 'lead not found or no phone' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      callId: call.id,
      status: call.status,
      summary: call.summary,
    });
  } catch (e: any) {
    console.error('Call initiate error:', e?.message ?? e);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
