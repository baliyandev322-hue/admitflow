import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { AgentOrchestrator } from '@/lib/agent';

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { skillName, params = {} } = await req.json();
    if (!skillName) {
      return NextResponse.json({ error: 'skillName is required' }, { status: 400 });
    }

    const agent = new AgentOrchestrator(authUser.instituteId);
    let result: any;

    switch (skillName) {
      case 'answer_enquiry':
        result = await agent.answer_enquiry(params.query || '', params.languagePreference || 'hinglish');
        break;
      case 'qualify_lead':
        result = await agent.qualify_lead(params.leadId, params.context || '');
        break;
      case 'create_lead':
        result = await agent.create_lead(params);
        break;
      case 'update_lead':
        result = await agent.update_lead(params.leadId, params.updates || {});
        break;
      case 'retrieve_course_details':
        result = await agent.retrieve_course_details(params.courseNameOrId || '');
        break;
      case 'retrieve_fee_details':
        result = await agent.retrieve_fee_details(params.courseId, params.scholarshipPercent || 0);
        break;
      case 'check_batch_availability':
        result = await agent.check_batch_availability(params.courseId, params.branchId);
        break;
      case 'schedule_counselling':
        result = await agent.schedule_counselling(params);
        break;
      case 'create_followup':
        result = await agent.create_followup(params);
        break;
      case 'generate_lead_report':
        result = await agent.generate_lead_report();
        break;
      case 'identify_dropoffs':
        result = await agent.identify_dropoffs();
        break;
      case 'recommend_next_action':
        result = await agent.recommend_next_action(params.leadId);
        break;
      default:
        return NextResponse.json({ error: `Unknown skill: ${skillName}` }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Skill execution failed' }, { status: 500 });
  }
}
