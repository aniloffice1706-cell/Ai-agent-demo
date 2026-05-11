import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { LeadFormSchema } from '@/lib/security/validation';
import { rateLimitMiddleware } from '@/lib/security/rateLimiter';

export async function POST(request: Request) {
  const limitResult = rateLimitMiddleware(request as any);
  if (limitResult) return limitResult;

  try {
    const body = await request.json();
    const leadData = LeadFormSchema.parse(body);

    const lead = await prisma.lead.create({
      data: {
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email,
        budget: leadData.budget,
        location: leadData.location,
        propertyType: leadData.propertyType,
        intent: leadData.intent,
        timeline: leadData.timeline,
        source: 'chat',
        status: 'new',
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lead' },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, leads });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
