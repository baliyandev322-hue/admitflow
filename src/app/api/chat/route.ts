import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AgentOrchestrator } from '@/lib/agent';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`chat-${ip}`, 60, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json({
        error: 'Too many requests. Please slow down and try again.',
        resetInSec: rateCheck.resetInSec
      }, { status: 429 });
    }

    const { 
      instituteId, 
      instituteSlug, 
      message, 
      studentName, 
      phone, 
      email, 
      courseInterest,
      whatsappConsent = true,
      language = 'hinglish' 
    } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // Resolve institute
    let resolvedInstituteId = instituteId;
    if (!resolvedInstituteId && instituteSlug) {
      const inst = db.getInstituteBySlug(instituteSlug);
      if (inst) resolvedInstituteId = inst.id;
    }
    if (!resolvedInstituteId) {
      // Default to first active institute for demo if not supplied
      const insts = db.getInstitutes();
      if (insts.length > 0) resolvedInstituteId = insts[0].id;
    }

    if (!resolvedInstituteId) {
      return NextResponse.json({ error: 'Institute not found' }, { status: 404 });
    }

    const agent = new AgentOrchestrator(resolvedInstituteId);

    // 1. Answer question using RAG & Knowledge Engine
    const enquiryResult = await agent.answer_enquiry(message, language);

    // 2. If student provided phone or name, auto create/capture or qualify lead
    let capturedLead = null;
    if (phone && studentName) {
      const leadRes = await agent.create_lead({
        studentName,
        phone,
        email,
        courseNameOrId: courseInterest || enquiryResult.data?.matchedCourse?.name,
        source: 'WEBSITE_CHAT',
        whatsappConsent: !!whatsappConsent,
        whatsappConsentAt: new Date().toISOString(),
        notes: `Enquiry query: "${message}"`
      });
      if (leadRes.success) {
        capturedLead = leadRes.data;
        await agent.qualify_lead(capturedLead.id, message);
      }
    }

    // Check if counseling intent is expressed
    const lowerMsg = message.toLowerCase();
    const wantsCounseling = lowerMsg.includes('counseling') || lowerMsg.includes('counselling') || lowerMsg.includes('slot') || lowerMsg.includes('talk to');

    return NextResponse.json({
      success: true,
      reply: enquiryResult.data.answer,
      isGrounded: enquiryResult.data.isGrounded,
      sources: enquiryResult.data.sources,
      matchedCourse: enquiryResult.data.matchedCourse,
      capturedLead,
      suggestCounselingBooking: wantsCounseling,
      requiresPhonePrompt: !phone && (wantsCounseling || lowerMsg.includes('fee') || lowerMsg.includes('admission'))
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Chat service error' }, { status: 500 });
  }
}
