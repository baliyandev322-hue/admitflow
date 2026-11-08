import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { AgentOrchestrator } from '@/lib/agent';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const agent = new AgentOrchestrator(authUser.instituteId);
  const result = await agent.recommend_next_action(params.id);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json(result);
}
