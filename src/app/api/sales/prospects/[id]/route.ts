import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isSuperAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { SalesStage } from '@/lib/types';

const VALID_STAGES: SalesStage[] = [
  'PROSPECT_IDENTIFIED',
  'CONTACTED',
  'INTERESTED',
  'DEMO_SCHEDULED',
  'DEMO_COMPLETED',
  'PILOT_PROPOSED',
  'NEGOTIATION',
  'WON',
  'LOST'
];

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
    prospect,
    activities
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

  const existing = db.getSalesProspectById(params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Sales prospect not found' }, { status: 404 });
  }

  try {
    const updates = await req.json();

    if (updates.stage && !VALID_STAGES.includes(updates.stage)) {
      return NextResponse.json({ error: `Invalid stage: ${updates.stage}` }, { status: 400 });
    }

    // Disallow overriding ID or createdAt
    delete updates.id;
    delete updates.createdAt;

    const updated = db.updateSalesProspect(params.id, updates);

    return NextResponse.json({
      success: true,
      prospect: updated
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update prospect' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

  const deleted = db.deleteSalesProspect(params.id);
  if (!deleted) {
    return NextResponse.json({ error: 'Sales prospect not found or already deleted' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: 'Sales prospect deleted successfully'
  });
}
