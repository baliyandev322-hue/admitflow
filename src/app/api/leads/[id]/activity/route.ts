import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { LeadActivity } from '@/lib/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = db.getLeadById(params.id);
  if (!lead || lead.instituteId !== authUser.instituteId) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const activities = db.getLeadActivities(params.id);
  return NextResponse.json({ success: true, activities });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = db.getLeadById(params.id);
  if (!lead || lead.instituteId !== authUser.instituteId) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const { description, activityType = 'NOTE_ADDED' } = await req.json();
  if (!description) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  const act: LeadActivity = {
    id: 'act-' + Date.now(),
    leadId: params.id,
    instituteId: authUser.instituteId,
    actorId: authUser.userId,
    actorType: 'COUNSELLOR',
    activityType,
    description,
    createdAt: new Date().toISOString()
  };

  db.addLeadActivity(act);
  db.updateLead(params.id, { lastInteractionAt: new Date().toISOString() });

  return NextResponse.json({ success: true, activity: act });
}
