import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { AgentOrchestrator } from '@/lib/agent';
import { checkOutboundCommunication } from '@/lib/safety';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const followups = db.getFollowups(authUser.instituteId);
  const now = new Date().getTime();

  // Dynamically recalculate isOverdue
  const enriched = followups.map(f => ({
    ...f,
    isOverdue: f.status === 'PENDING' && new Date(f.dueDate).getTime() < now
  }));

  return NextResponse.json({ success: true, followups: enriched });
}

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { leadId, dueDate, suggestedMessage, channel = 'WHATSAPP' } = body;

  if (!leadId || !dueDate || !suggestedMessage) {
    return NextResponse.json({ error: 'Lead ID, due date, and message draft are required' }, { status: 400 });
  }

  const agent = new AgentOrchestrator(authUser.instituteId);
  const result = await agent.create_followup({
    leadId,
    dueDate,
    suggestedMessage,
    channel
  });

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, action, editedMessage } = await req.json();
  if (!id || !action) {
    return NextResponse.json({ error: 'Followup ID and action (APPROVE, REJECT, COMPLETE) required' }, { status: 400 });
  }

  const followup = db.getFollowups(authUser.instituteId).find(f => f.id === id);
  if (!followup) return NextResponse.json({ error: 'Followup not found' }, { status: 404 });

  if (['APPROVE', 'COMPLETE'].includes(action)) {
    const safety = checkOutboundCommunication(authUser.instituteId);
    if (safety.blocked) {
      return NextResponse.json({ 
        error: safety.reason,
        code: 'BLOCKED_DEMO_TENANT_COMMUNICATION'
      }, { status: 403 });
    }
  }

  let newStatus: any = followup.status;
  if (action === 'APPROVE') newStatus = 'SENT';
  if (action === 'REJECT') newStatus = 'REJECTED';
  if (action === 'COMPLETE') newStatus = 'SENT';

  const updated = db.updateFollowup(id, {
    status: newStatus,
    suggestedMessage: editedMessage || followup.suggestedMessage,
    approvedBy: authUser.userId
  });

  db.addLeadActivity({
    id: 'act-' + Date.now(),
    leadId: followup.leadId,
    instituteId: authUser.instituteId,
    actorId: authUser.userId,
    actorType: 'COUNSELLOR',
    activityType: `FOLLOWUP_${action}`,
    description: `Follow-up ${action.toLowerCase()}d by ${authUser.name} via ${followup.channel}`,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({ success: true, followup: updated });
}
