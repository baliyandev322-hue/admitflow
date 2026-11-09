import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AgentOrchestrator } from '@/lib/agent';
import { checkRateLimit } from '@/lib/rateLimit';
import { gemini } from '@/lib/gemini';
import { searchKnowledgeBrain } from '@/lib/rag';
import { Conversation, ChatMessage } from '@/lib/types';

/**
 * GET /api/chat?sessionId=...&instituteId=...
 * Restores conversation history for returning students
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const conversationId = searchParams.get('conversationId');
    let resolvedInstituteId = searchParams.get('instituteId');
    const instituteSlug = searchParams.get('instituteSlug') || searchParams.get('slug');

    if (!resolvedInstituteId && instituteSlug) {
      const inst = db.getInstituteBySlug(instituteSlug);
      if (inst) resolvedInstituteId = inst.id;
    }

    if (!resolvedInstituteId) {
      return NextResponse.json({ error: 'instituteId or instituteSlug is required' }, { status: 400 });
    }

    let conversation: Conversation | undefined;
    if (conversationId) {
      conversation = db.getConversationById(conversationId);
    } else if (sessionId) {
      conversation = db.findConversationBySession(resolvedInstituteId, sessionId);
    }

    if (!conversation || conversation.instituteId !== resolvedInstituteId) {
      return NextResponse.json({
        success: true,
        conversation: null,
        messages: []
      });
    }

    const messages = db.getMessages(conversation.id);

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        sessionId: conversation.sessionId,
        status: conversation.status,
        createdAt: conversation.createdAt
      },
      messages: messages.map(m => ({
        id: m.id,
        sender: m.senderType,
        text: m.content,
        createdAt: m.createdAt,
        sources: m.ragSources
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to retrieve conversation history' }, { status: 500 });
  }
}

/**
 * POST /api/chat
 * Handles conversational queries with RAG, Lead Capture, Session Persistence & Optional Streaming
 */
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

    const body = await req.json();
    const { 
      instituteId, 
      instituteSlug, 
      message, 
      studentName, 
      phone, 
      email, 
      courseInterest,
      whatsappConsent = true,
      language = 'hinglish',
      sessionId: clientSessionId,
      conversationId: clientConvId,
      stream = false
    } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    if (message.length > 2500) {
      return NextResponse.json({ error: 'Message exceeds maximum length of 2500 characters' }, { status: 400 });
    }

    // 1. Resolve Institute
    let resolvedInstituteId = instituteId;
    if (!resolvedInstituteId && instituteSlug) {
      const inst = db.getInstituteBySlug(instituteSlug);
      if (inst) resolvedInstituteId = inst.id;
    }
    if (!resolvedInstituteId) {
      const insts = db.getInstitutes();
      if (insts.length > 0) resolvedInstituteId = insts[0].id;
    }

    if (!resolvedInstituteId) {
      return NextResponse.json({ error: 'Institute not found' }, { status: 404 });
    }

    // 2. Resolve / Create Persistent Conversation Session
    const activeSessionId = clientSessionId || `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    let conversation: Conversation | undefined;

    if (clientConvId) {
      conversation = db.getConversationById(clientConvId);
    }
    if (!conversation && activeSessionId) {
      conversation = db.findConversationBySession(resolvedInstituteId, activeSessionId);
    }
    if (!conversation) {
      const convId = 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      conversation = db.createConversation({
        id: convId,
        instituteId: resolvedInstituteId,
        channel: 'WEB_CHAT',
        sessionId: activeSessionId,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      });
    }

    // 3. Persist Incoming User Message
    const userMsgId = 'msg-u-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    db.addMessage({
      id: userMsgId,
      conversationId: conversation.id,
      senderType: 'STUDENT',
      content: message.trim(),
      createdAt: new Date().toISOString()
    });

    const agent = new AgentOrchestrator(resolvedInstituteId);

    // 4. Handle Lead Capture if contact information is provided
    let capturedLead = null;
    if (phone && studentName) {
      const leadRes = await agent.create_lead({
        studentName,
        phone,
        email,
        courseNameOrId: courseInterest,
        source: 'WEBSITE_CHAT',
        whatsappConsent: !!whatsappConsent,
        whatsappConsentAt: new Date().toISOString(),
        notes: `Enquiry query: "${message}"`
      });
      if (leadRes.success) {
        capturedLead = leadRes.data;
        await agent.qualify_lead(capturedLead.id, message);
        // Link lead to conversation
        if (conversation && !conversation.leadId) {
          db.updateConversation(conversation.id, { leadId: capturedLead.id });
        }
      }
    }

    const lowerMsg = message.toLowerCase();
    const wantsCounseling = lowerMsg.includes('counseling') || lowerMsg.includes('counselling') || lowerMsg.includes('slot') || lowerMsg.includes('talk to');

    // =========================================================================
    // OPTIONAL STREAMING PATH (ReadableStream / Server-Sent Events)
    // =========================================================================
    if (stream) {
      const institute = db.getInstituteById(resolvedInstituteId);
      const sources = await searchKnowledgeBrain(message, resolvedInstituteId, 3);
      const courses = db.getCourses(resolvedInstituteId);
      const batches = db.getBatches(resolvedInstituteId);

      const contextText = sources.map(s => `[Document: ${s.documentTitle}] ${s.chunk.content}`).join('\n\n');
      const coursesSummary = courses.map(c => `${c.name} (Code: ${c.code}): Base Fee ₹${c.baseFee.toLocaleString('en-IN')}, Min Installment ₹${c.minInstallmentFee.toLocaleString('en-IN')}`).join('\n');
      const batchesSummary = batches.map(b => `${b.batchName}: Starts ${b.startDate}, Timings ${b.timings}, Seats Left: ${b.maxSeats - b.enrolledCount}`).join('\n');

      const systemInstruction = `You are AdmitFlow AI, the professional and empathetic admission assistant & educational mentor for "${institute?.name || 'the Institute'}".
Your goal is to guide students and parents with high academic intelligence, practical guidance, and absolute honesty.

FACTUAL ACCURACY & CLAIM VERIFICATION (STRICT BOUNDARIES):
1. VERIFIED INSTITUTE KNOWLEDGE (Courses, Fees, Batches, Admission Rules, Facilities, Faculty):
   - Base ALL institute-specific claims (fees, installment plans, discounts, batch timings, seat availability, scholarships, hostel availability, and demo classes) STRICTLY on the verified context below.
   - BATCH SIZES & SEAT AVAILABILITY: Quote seat availability ONLY from the verified AVAILABLE BATCH SCHEDULES (Seats Left = maxSeats - enrolledCount). Do NOT claim arbitrary batch sizes (e.g. "micro-batches of 10 students") unless explicitly stated in context.
   - FACULTY CLAIMS: Do NOT invent arbitrary years of experience (e.g. "our faculty has 25 years experience") or individual names not in context. State honestly that faculty consists of experienced IIT-JEE/NEET subject mentors and invite them to attend a free trial demo class to experience the teaching directly.
   - HOSTEL CLAIMS: If hostel information is present in the verified context (e.g., Kota campus ₹12,000/month with food/security), state it accurately. If asking about a branch or detail not in context, state clearly that it is not in the prospectus and offer counselor assistance.
   - STUDENT RESULTS & RANKS: NEVER fabricate fake AIR ranks (e.g., AIR 1, 5, 10), fake selection counts, or 100% selection guarantees.
   - SCHOLARSHIP CLAIMS: Quote only verified scholarship tests (e.g., AAT/ATSE up to 40%/90% based on test score). Never promise 100% direct fee waivers without a test.
   - DEMO CLASSES: Quote verified trial policy (e.g. free 3-day classroom demo pass).
   - CONFLICTING INFORMATION: If a student asserts incorrect fees or conflicting details, gently correct them with the verified figures from the context.

2. GENERAL EDUCATIONAL KNOWLEDGE (Preparation strategies, Exam patterns, Career guidance, Coaching benefits):
   - For educational guidance (e.g. "How should I prepare for JEE?", "What is the difference between JEE Main and Advanced?", "What are the benefits of coaching?"), provide rich, practical, motivating academic advice based on standard pedagogy (NCERT concepts, PYQs, mock tests, time management, structured discipline).
   - EXAM POLICIES: For national exam rules (e.g. NEET age limit, JEE attempt limits, 75% board eligibility criteria), provide accurate, up-to-date guidance based on current official guidelines.
   - SELECTION GUARANTEES: Be strictly honest and ethical. State clearly that NO coaching institute can guarantee selection; selection depends 100% on the student's personal dedication, consistent practice, and discipline, supported by institute mentorship and mock tests.
   - COMPETITOR COMPARISONS: Highlight pedagogical strengths without disparaging competitors or making false superiority claims. Offer a free demo class so students can judge quality directly.
   - NEVER convert general educational advice into an unverified institute-specific promise!

3. UNRELATED QUESTIONS:
   - If the query is completely unrelated to education, studies, exams, career, or institute admission (e.g. recipes, cinema, sports gossip, politics), politely state your role as an educational and admission counselor and guide them back to their academic preparation.

LANGUAGE & TONE:
- Respond naturally and conversationally in ${language.toUpperCase()} (Hinglish = conversational everyday Hindi written in English script; English = clear professional English; Hindi = Devanagari script).
- Keep responses concise, warm, helpful, and encourage booking a free counseling session or demo class when appropriate.`;

      const prompt = `STUDENT QUERY: "${message}"\n\nVERIFIED BROCHURE CONTEXT:\n${contextText || 'No specific brochure chunks found for this exact query.'}\n\nCOURSES & FEES:\n${coursesSummary || 'None'}\n\nBATCHES:\n${batchesSummary || 'None'}\n\nRespond directly to the student in ${language}:`;

      const encoder = new TextEncoder();
      let completeResponse = '';

      const readable = new ReadableStream({
        async start(controller) {
          try {
            // Send metadata event first
            const metaPayload = JSON.stringify({
              conversationId: conversation!.id,
              sessionId: conversation!.sessionId,
              sources: sources.map(s => ({ title: s.documentTitle, score: s.score })),
              isGrounded: sources.length > 0,
              suggestCounselingBooking: wantsCounseling
            });
            controller.enqueue(encoder.encode(`event: metadata\ndata: ${metaPayload}\n\n`));

            // Stream text chunks from Gemini
            for await (const chunk of gemini.streamText(prompt, { systemInstruction, temperature: 0.2 })) {
              completeResponse += chunk;
              const chunkPayload = JSON.stringify({ text: chunk });
              controller.enqueue(encoder.encode(`event: chunk\ndata: ${chunkPayload}\n\n`));
            }

            // Persist AI Response in Messages Table
            const aiMsgId = 'msg-ai-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
            db.addMessage({
              id: aiMsgId,
              conversationId: conversation!.id,
              senderType: 'AI_ASSISTANT',
              content: completeResponse.trim(),
              ragSources: sources.map(s => ({ title: s.documentTitle, score: s.score })),
              createdAt: new Date().toISOString()
            });

            controller.enqueue(encoder.encode(`event: done\ndata: [DONE]\n\n`));
            controller.close();
          } catch (err: any) {
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive'
        }
      });
    }

    // =========================================================================
    // STANDARD NON-STREAMING PATH (100% Backward Compatible JSON)
    // =========================================================================
    const enquiryResult = await agent.answer_enquiry(message, language);

    // Persist AI Assistant Response
    const aiMsgId = 'msg-ai-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    db.addMessage({
      id: aiMsgId,
      conversationId: conversation.id,
      senderType: 'AI_ASSISTANT',
      content: enquiryResult.data.answer,
      ragSources: enquiryResult.data.sources,
      toolCalls: enquiryResult.data.matchedCourse ? [{ tool: 'matchedCourse', data: enquiryResult.data.matchedCourse }] : [],
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      sessionId: conversation.sessionId,
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
