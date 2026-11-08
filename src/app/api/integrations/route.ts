import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, getAuthUser } from '@/lib/auth';
import { listAvailableMcpTools } from '@/lib/mcp/server';

function getAuthInstitute(req: NextRequest): string {
  const user = getAuthUser(req);
  if (user) return user.instituteId;
  return 'inst-apex-001';
}

export async function GET(req: NextRequest) {
  try {
    const instituteId = getAuthInstitute(req);
    const settings = db.getIntegrationSettings(instituteId);
    const tools = listAvailableMcpTools(instituteId, 'ADMIN');
    const logs = db.getAgentExecutions(instituteId)
      .filter(l => l.skillName.startsWith('mcp:') || l.triggeredBy.includes('mcp'))
      .slice(0, 15);

    return NextResponse.json({
      success: true,
      settings,
      tools,
      logs
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const instituteId = getAuthInstitute(req);
    const body = await req.json();
    const { provider, updates } = body;

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const updated = db.updateIntegrationSetting(instituteId, provider, updates);
    return NextResponse.json({ success: true, setting: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
