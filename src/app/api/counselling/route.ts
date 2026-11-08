import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { AgentOrchestrator } from '@/lib/agent';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const appointments = db.getAppointments(authUser.instituteId);
  return NextResponse.json({ success: true, appointments });
}

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { leadId, scheduledAt, counsellorId, branchId, mode } = body;

  if (!leadId || !scheduledAt) {
    return NextResponse.json({ error: 'Lead ID and scheduled time are required' }, { status: 400 });
  }

  const agent = new AgentOrchestrator(authUser.instituteId);
  const result = await agent.schedule_counselling({
    leadId,
    scheduledAt,
    counsellorId: counsellorId || authUser.userId,
    branchId: branchId || authUser.branchId,
    mode
  });

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status, scheduledAt, notes } = await req.json();
  if (!id) return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 });

  const apt = db.getData().appointments.find(a => a.id === id && a.instituteId === authUser.instituteId);
  if (!apt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

  const updated = db.updateAppointment(id, {
    status: status || apt.status,
    scheduledAt: scheduledAt || apt.scheduledAt,
    notes: notes || apt.notes
  });

  return NextResponse.json({ success: true, appointment: updated });
}
