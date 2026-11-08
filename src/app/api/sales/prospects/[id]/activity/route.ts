import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isSuperAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { SalesActivity } from '@/lib/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  if (!isSuperAdmin(authUser)) {
    return NextResponse.json(
      { error: 'Forbidden: SUPER_ADMIN role required' }, 
      { status: 403 }
    );
  }

  const prospect = db.getSalesProspectById(params.id);
  if (!prospect) {
    return NextResponse.json({ error: 'Sales prospect not found' }, { status: 404 });
  }

  const activities = db.getSalesActivities(params.id);

  return NextResponse.json({
    success: true,
    activities
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  if (!isSuperAdmin(authUser)) {
    return NextResponse.json(
      { error: 'Forbidden: SUPER_ADMIN role required' }, 
      { status: 403 }
    );
  }

  const prospect = db.getSalesProspectById(params.id);
  if (!prospect) {
    return NextResponse.json({ error: 'Sales prospect not found' }, { status: 404 });
  }

  try {
    const { activityType = 'NOTE', outcome, notes } = await req.json();

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return NextResponse.json({ error: 'Activity notes are required' }, { status: 400 });
    }

    const validActivityTypes = ['CALL', 'EMAIL', 'DEMO', 'MEETING', 'NOTE', 'STAGE_CHANGE'];
    if (!validActivityTypes.includes(activityType)) {
      return NextResponse.json({ error: `Invalid activityType. Must be one of: ${validActivityTypes.join(', ')}` }, { status: 400 });
    }

    const activity: SalesActivity = {
      id: 'sact-' + Date.now(),
      prospectId: params.id,
      activityType,
      outcome: outcome?.trim(),
      notes: notes.trim(),
      performedBy: authUser.name || 'SALES_REP',
      createdAt: new Date().toISOString()
    };

    const saved = db.addSalesActivity(activity);

    // Also update prospect's lastContactDate
    db.updateSalesProspect(params.id, { lastContactDate: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      activity: saved
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Malformed request payload' }, { status: 400 });
  }
}
