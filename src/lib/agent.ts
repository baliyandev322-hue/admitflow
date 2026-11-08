import { db } from './db';
import { searchKnowledgeBrain } from './rag';
import { gemini } from './gemini';
import { Lead, LeadStatus, LeadSource, AgentExecution } from './types';

export interface SkillResult {
  success: boolean;
  skillName: string;
  data: any;
  message: string;
  requiresHumanApproval?: boolean;
}

export class AgentOrchestrator {
  private instituteId: string;

  constructor(instituteId: string) {
    this.instituteId = instituteId;
  }

  // Log execution to DB
  private logSkill(skillName: string, input: any, output: any, status: 'SUCCESS' | 'FAILED' | 'ESCALATED', timeMs: number, error?: string) {
    db.logAgentExecution({
      id: 'exec-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      instituteId: this.instituteId,
      skillName,
      triggeredBy: 'AI_AGENT_CORE',
      inputPayload: input,
      outputPayload: output,
      status,
      executionTimeMs: timeMs,
      errorMessage: error,
      createdAt: new Date().toISOString()
    });
  }

  // 1. answer_enquiry() with RAG + Live Gemini Integration
  public async answer_enquiry(query: string, languagePreference: 'hinglish' | 'hindi' | 'english' = 'hinglish'): Promise<SkillResult> {
    const startTime = Date.now();
    try {
      const institute = db.getInstituteById(this.instituteId);
      if (!institute) throw new Error('Institute not found');

      // 1. Retrieve verified knowledge isolated by institute
      const sources = await searchKnowledgeBrain(query, this.instituteId, 3);
      const courses = db.getCourses(this.instituteId);
      const batches = db.getBatches(this.instituteId);

      let groundedAnswer = '';
      let isGrounded = sources.length > 0;

      // Detect fee or course intent directly
      const qLower = query.toLowerCase();
      const matchedCourse = courses.find(c => 
        qLower.includes(c.name.toLowerCase()) || 
        (c.code && qLower.includes(c.code.toLowerCase())) ||
        (c.category && qLower.includes(c.category.toLowerCase())) ||
        (qLower.includes('jee') && c.name.toLowerCase().includes('jee')) ||
        (qLower.includes('neet') && c.name.toLowerCase().includes('neet'))
      );

      // 2. Prepare Context for Live Gemini Call
      const contextText = sources.map(s => `[Document: ${s.documentTitle}] ${s.chunk.content}`).join('\n\n');
      const coursesSummary = courses.map(c => `${c.name} (Code: ${c.code}): Base Fee ₹${c.baseFee.toLocaleString('en-IN')}, Min Installment ₹${c.minInstallmentFee.toLocaleString('en-IN')}, Duration: ${c.durationWeeks} weeks`).join('\n');
      const batchesSummary = batches.map(b => `${b.batchName}: Starts ${b.startDate}, Timings ${b.timings}, Seats Left: ${b.maxSeats - b.enrolledCount}`).join('\n');

      const systemInstruction = `You are AdmitFlow AI, the professional and helpful admission assistant for "${institute.name}".
Your task is to answer student and parent admission enquiries accurately.

CRITICAL RULES:
1. Base your answer STRICTLY on the verified context below.
2. NEVER invent or hallucinate course fees, seat counts, deadlines, or scholarship rules.
3. If the query asks for information NOT present in the verified context, state clearly that you do not have that specific detail in the current prospectus and offer to connect them with a human admission counselor.
4. Respond naturally in ${languagePreference.toUpperCase()} (Hinglish = Hindi written in English script with casual natural tone, Hindi = Devanagari script, English = clear professional English).
5. Always offer to book a free counseling slot or trial demo class.`;

      const prompt = `STUDENT QUERY: "${query}"

VERIFIED INSTITUTION CONTEXT:
${contextText || 'No specific brochure chunks found for this exact query.'}

VERIFIED COURSES & FEES:
${coursesSummary || 'None listed.'}

AVAILABLE BATCH SCHEDULES:
${batchesSummary || 'None listed.'}

Respond directly to the student in ${languagePreference}:`;

      // 3. Call Live Gemini Service
      const geminiRes = await gemini.generateText(prompt, {
        systemInstruction,
        temperature: 0.2, // High precision
        maxOutputTokens: 300
      });

      if (geminiRes.text && !geminiRes.fallbackUsed) {
        groundedAnswer = geminiRes.text;
        isGrounded = Boolean(sources.length > 0 || matchedCourse);
      } else {
        // Deterministic Fallback if Gemini is unavailable
        if (matchedCourse && (qLower.includes('fee') || qLower.includes('fees') || qLower.includes('cost') || qLower.includes('kitna') || qLower.includes('paisa'))) {
          isGrounded = true;
          if (languagePreference === 'hindi') {
            groundedAnswer = `नमस्ते! ${institute.name} में ${matchedCourse.name} की बेस फीस ₹${matchedCourse.baseFee.toLocaleString('en-IN')} है। आप इसे आसान किश्तों में दे सकते हैं। क्या आप डेमो क्लास बुक करना चाहते हैं?`;
          } else if (languagePreference === 'english') {
            groundedAnswer = `The base tuition fee for ${matchedCourse.name} at ${institute.name} is ₹${matchedCourse.baseFee.toLocaleString('en-IN')}. It can be paid in 3 installments. Would you like to schedule a counseling session?`;
          } else {
            groundedAnswer = `${institute.name} mein ${matchedCourse.name} ki total base fee ₹${matchedCourse.baseFee.toLocaleString('en-IN')} hai. Isko aap 3 installments mein pay kar sakte hain (minimum first installment ₹${matchedCourse.minInstallmentFee.toLocaleString('en-IN')}). Kya aap batch timings ya counseling session ke baare mein jaanna chahenge?`;
          }
        } else if (sources.length > 0) {
          isGrounded = true;
          const topSource = sources[0];
          groundedAnswer = languagePreference === 'english'
            ? `${topSource.chunk.content} Please feel free to provide your phone number if you would like to book a counseling session.`
            : `${topSource.chunk.content} Agar aapko admission process ya counseling slot book karna hai toh kripya apna phone number share karein!`;
        } else {
          isGrounded = false;
          groundedAnswer = languagePreference === 'english'
            ? `I could not find exact details regarding this in our current prospectus. Our senior admission counselor would be glad to help you personally. Please share your contact number.`
            : `Maaf kijiye, is vishay par hamare official prospectus mein specific jaankari uplabdh nahi hai. Hamare senior admission counsellor aapse connect karke detail share kar sakte hain. Kripya apna phone number drop karein!`;
        }
      }

      const resData = {
        answer: groundedAnswer,
        isGrounded,
        modelUsed: geminiRes.modelUsed,
        fallbackUsed: geminiRes.fallbackUsed,
        sources: sources.map(s => ({ title: s.documentTitle, score: s.score, text: s.chunk.content })),
        matchedCourse: matchedCourse ? { id: matchedCourse.id, name: matchedCourse.name, fee: matchedCourse.baseFee } : null
      };

      this.logSkill('answer_enquiry', { query, languagePreference }, resData, 'SUCCESS', Date.now() - startTime);
      return { success: true, skillName: 'answer_enquiry', data: resData, message: 'Enquiry processed successfully' };
    } catch (e: any) {
      this.logSkill('answer_enquiry', { query }, null, 'FAILED', Date.now() - startTime, e.message);
      return { success: false, skillName: 'answer_enquiry', data: null, message: e.message };
    }
  }

  // 2. qualify_lead()
  public async qualify_lead(leadId: string, context: string): Promise<SkillResult> {
    const startTime = Date.now();
    try {
      const lead = db.getLeadById(leadId);
      if (!lead || lead.instituteId !== this.instituteId) throw new Error('Lead not found in this institute');

      let scoreDelta = 0;
      const ctx = context.toLowerCase();
      if (ctx.includes('admission') || ctx.includes('join') || ctx.includes('fees pay')) scoreDelta += 25;
      if (ctx.includes('demo') || ctx.includes('trial') || ctx.includes('counseling') || ctx.includes('counselling')) scoreDelta += 20;
      if (ctx.includes('hostel') || ctx.includes('timing') || ctx.includes('batch')) scoreDelta += 15;

      const newScore = Math.min(100, Math.max(10, lead.leadScore + scoreDelta));
      const updated = db.updateLead(leadId, { leadScore: newScore });

      this.logSkill('qualify_lead', { leadId, context }, { leadScore: newScore }, 'SUCCESS', Date.now() - startTime);
      return { success: true, skillName: 'qualify_lead', data: updated, message: `Lead qualified with score ${newScore}` };
    } catch (e: any) {
      this.logSkill('qualify_lead', { leadId }, null, 'FAILED', Date.now() - startTime, e.message);
      return { success: false, skillName: 'qualify_lead', data: null, message: e.message };
    }
  }

  // 3. create_lead()
  public async create_lead(payload: {
    studentName: string;
    phone: string;
    email?: string;
    courseNameOrId?: string;
    branchId?: string;
    source?: LeadSource;
    notes?: string;
    whatsappConsent?: boolean;
    whatsappConsentAt?: string;
  }): Promise<SkillResult> {
    const startTime = Date.now();
    try {
      if (!payload.studentName || !payload.phone) {
        throw new Error('Student name and phone number are strictly required');
      }

      // Check duplicates
      const existing = db.findLeadByPhone(this.instituteId, payload.phone);
      if (existing) {
        db.addLeadActivity({
          id: 'act-' + Date.now(),
          leadId: existing.id,
          instituteId: this.instituteId,
          actorType: 'AI_AGENT',
          activityType: 'DUPLICATE_RE_ENQUIRY',
          description: `Student re-enquired via ${payload.source || 'WEBSITE_CHAT'}.`,
          createdAt: new Date().toISOString()
        });
        this.logSkill('create_lead', payload, { leadId: existing.id, isDuplicate: true }, 'SUCCESS', Date.now() - startTime);
        return { success: true, skillName: 'create_lead', data: existing, message: 'Existing lead updated with new interaction' };
      }

      // Resolve course
      const courses = db.getCourses(this.instituteId);
      const matchedCourse = courses.find(c => 
        c.id === payload.courseNameOrId || 
        c.name.toLowerCase().includes((payload.courseNameOrId || '').toLowerCase())
      );

      // Auto-assign counsellor
      const counsellors = db.getUsers(this.instituteId).filter(u => u.role === 'ADMISSION_COUNSELLOR');
      const assignedCounsellor = counsellors.length > 0 ? counsellors[0] : undefined;

      const newLead: Lead = {
        id: 'lead-' + Date.now(),
        instituteId: this.instituteId,
        branchId: payload.branchId || (assignedCounsellor?.branchId),
        assignedCounsellorId: assignedCounsellor?.id,
        studentName: payload.studentName,
        phone: payload.phone,
        email: payload.email,
        courseId: matchedCourse?.id,
        status: 'NEW',
        source: payload.source || 'WEBSITE_CHAT',
        leadScore: 60,
        whatsappConsent: payload.whatsappConsent !== undefined ? payload.whatsappConsent : true,
        whatsappConsentAt: payload.whatsappConsentAt || new Date().toISOString(),
        nextBestAction: 'Send course syllabus brochure and schedule introductory counseling.',
        notes: payload.notes || 'Lead captured by AdmitFlow AI Assistant.',
        lastInteractionAt: new Date().toISOString(),
        nextFollowupAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const created = db.createLead(newLead);
      this.logSkill('create_lead', payload, created, 'SUCCESS', Date.now() - startTime);
      return { success: true, skillName: 'create_lead', data: created, message: 'New student lead created' };
    } catch (e: any) {
      this.logSkill('create_lead', payload, null, 'FAILED', Date.now() - startTime, e.message);
      return { success: false, skillName: 'create_lead', data: null, message: e.message };
    }
  }

  // 4. update_lead()
  public async update_lead(leadId: string, updates: Partial<Lead>): Promise<SkillResult> {
    const startTime = Date.now();
    try {
      const lead = db.getLeadById(leadId);
      if (!lead || lead.instituteId !== this.instituteId) throw new Error('Lead not found');

      const updated = db.updateLead(leadId, updates);
      db.addLeadActivity({
        id: 'act-' + Date.now(),
        leadId,
        instituteId: this.instituteId,
        actorType: 'AI_AGENT',
        activityType: 'LEAD_STATUS_UPDATE',
        description: `Lead status changed to ${updates.status || lead.status}`,
        createdAt: new Date().toISOString()
      });

      this.logSkill('update_lead', { leadId, updates }, updated, 'SUCCESS', Date.now() - startTime);
      return { success: true, skillName: 'update_lead', data: updated, message: 'Lead updated successfully' };
    } catch (e: any) {
      this.logSkill('update_lead', { leadId, updates }, null, 'FAILED', Date.now() - startTime, e.message);
      return { success: false, skillName: 'update_lead', data: null, message: e.message };
    }
  }

  // 5. retrieve_course_details()
  public async retrieve_course_details(courseNameOrId: string): Promise<SkillResult> {
    const startTime = Date.now();
    try {
      const courses = db.getCourses(this.instituteId);
      const course = courses.find(c => 
        c.id === courseNameOrId || 
        c.name.toLowerCase().includes(courseNameOrId.toLowerCase()) ||
        c.code.toLowerCase().includes(courseNameOrId.toLowerCase())
      );

      if (!course) throw new Error(`No course found matching '${courseNameOrId}'`);
      const batches = db.getBatches(this.instituteId, course.id);

      const res = { course, availableBatches: batches };
      this.logSkill('retrieve_course_details', { courseNameOrId }, res, 'SUCCESS', Date.now() - startTime);
      return { success: true, skillName: 'retrieve_course_details', data: res, message: 'Course details retrieved' };
    } catch (e: any) {
      this.logSkill('retrieve_course_details', { courseNameOrId }, null, 'FAILED', Date.now() - startTime, e.message);
      return { success: false, skillName: 'retrieve_course_details', data: null, message: e.message };
    }
  }

  // 6. retrieve_fee_details()
  public async retrieve_fee_details(courseId: string, scholarshipPercent = 0): Promise<SkillResult> {
    const startTime = Date.now();
    try {
      const course = db.getCourseById(courseId);
      if (!course || course.instituteId !== this.instituteId) throw new Error('Course not found');

      const discountAmount = (course.baseFee * Math.min(scholarshipPercent, course.maxDiscountPct)) / 100;
      const netPayable = course.baseFee - discountAmount;
      const installment3Amount = Math.round(netPayable / 3);

      const feeBreakup = {
        courseName: course.name,
        baseFee: course.baseFee,
        scholarshipPercent,
        discountApplied: discountAmount,
        netPayable,
        installments: [
          { installmentNumber: 1, due: 'At Admission', amount: course.minInstallmentFee },
          { installmentNumber: 2, due: '60 Days after start', amount: installment3Amount },
          { installmentNumber: 3, due: '120 Days after start', amount: netPayable - (course.minInstallmentFee + installment3Amount) }
        ],
        refundPolicy: '100% refund within 15 days of batch start (₹2,000 admin charge). 50% between 16-30 days.'
      };

      this.logSkill('retrieve_fee_details', { courseId, scholarshipPercent }, feeBreakup, 'SUCCESS', Date.now() - startTime);
      return { success: true, skillName: 'retrieve_fee_details', data: feeBreakup, message: 'Fee details calculated from verified structure' };
    } catch (e: any) {
      this.logSkill('retrieve_fee_details', { courseId }, null, 'FAILED', Date.now() - startTime, e.message);
      return { success: false, skillName: 'retrieve_fee_details', data: null, message: e.message };
    }
  }

  // 7. check_batch_availability()
  public async check_batch_availability(courseId: string, branchId?: string): Promise<SkillResult> {
    const startTime = Date.now();
    try {
      let batches = db.getBatches(this.instituteId, courseId);
      if (branchId) {
        batches = batches.filter(b => b.branchId === branchId);
      }
      const availability = batches.map(b => ({
        batchId: b.id,
        name: b.batchName,
        startDate: b.startDate,
        timings: b.timings,
        seatsLeft: b.maxSeats - b.enrolledCount,
        status: b.enrolledCount >= b.maxSeats ? 'FULL' : 'OPEN'
      }));

      this.logSkill('check_batch_availability', { courseId, branchId }, availability, 'SUCCESS', Date.now() - startTime);
      return { success: true, skillName: 'check_batch_availability', data: availability, message: 'Batch availability checked' };
    } catch (e: any) {
      this.logSkill('check_batch_availability', { courseId }, null, 'FAILED', Date.now() - startTime, e.message);
      return { success: false, skillName: 'check_batch_availability', data: null, message: e.message };
    }
  }

  // 8. schedule_counselling()
  public async schedule_counselling(payload: {
    leadId: string;
    scheduledAt: string;
    counsellorId?: string;
    branchId?: string;
    mode?: 'ONLINE_MEET' | 'OFFLINE_CAMPUS';
  }): Promise<SkillResult> {
    const startTime = Date.now();
    try {
      const lead = db.getLeadById(payload.leadId);
      if (!lead || lead.instituteId !== this.instituteId) throw new Error('Lead not found');

      // Check double booking for counsellor at slot
      const existingApts = db.getAppointments(this.instituteId);
      const isSlotTaken = existingApts.some(a => 
        a.counsellorId === payload.counsellorId && 
        a.scheduledAt === payload.scheduledAt && 
        a.status === 'SCHEDULED'
      );
      if (isSlotTaken) {
        throw new Error('This counsellor slot is already booked. Please choose another time.');
      }

      const apt = db.createAppointment({
        id: 'apt-' + Date.now(),
        instituteId: this.instituteId,
        branchId: payload.branchId || lead.branchId,
        leadId: payload.leadId,
        counsellorId: payload.counsellorId || lead.assignedCounsellorId,
        scheduledAt: payload.scheduledAt,
        durationMinutes: 45,
        mode: payload.mode || 'ONLINE_MEET',
        status: 'SCHEDULED',
        meetingLink: payload.mode === 'ONLINE_MEET' ? 'https://meet.google.com/adm-flow-demo' : undefined,
        notes: `Counselling booked for ${lead.studentName}`,
        createdAt: new Date().toISOString()
      });

      // Update lead stage to COUNSELLING_SCHEDULED
      db.updateLead(payload.leadId, { 
        status: 'COUNSELLING_SCHEDULED', 
        nextBestAction: 'Send appointment confirmation SMS and WhatsApp directions.',
        leadScore: Math.min(100, lead.leadScore + 20)
      });

      db.addLeadActivity({
        id: 'act-' + Date.now(),
        leadId: payload.leadId,
        instituteId: this.instituteId,
        actorType: 'AI_AGENT',
        activityType: 'COUNSELLING_SCHEDULED',
        description: `1-on-1 counseling booked for ${new Date(payload.scheduledAt).toLocaleString('en-IN')}`,
        createdAt: new Date().toISOString()
      });

      this.logSkill('schedule_counselling', payload, apt, 'SUCCESS', Date.now() - startTime);
      return { success: true, skillName: 'schedule_counselling', data: apt, message: 'Counselling slot confirmed' };
    } catch (e: any) {
      this.logSkill('schedule_counselling', payload, null, 'FAILED', Date.now() - startTime, e.message);
      return { success: false, skillName: 'schedule_counselling', data: null, message: e.message };
    }
  }

  // 9. create_followup()
  public async create_followup(payload: {
    leadId: string;
    dueDate: string;
    suggestedMessage: string;
    channel?: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'CALL';
  }): Promise<SkillResult> {
    const startTime = Date.now();
    try {
      const lead = db.getLeadById(payload.leadId);
      if (!lead || lead.instituteId !== this.instituteId) throw new Error('Lead not found');

      const followup = db.createFollowup({
        id: 'fol-' + Date.now(),
        instituteId: this.instituteId,
        leadId: payload.leadId,
        counsellorId: lead.assignedCounsellorId,
        dueDate: payload.dueDate,
        suggestedMessage: payload.suggestedMessage,
        channel: payload.channel || 'WHATSAPP',
        status: 'PENDING',
        isOverdue: false,
        createdAt: new Date().toISOString()
      });

      db.updateLead(payload.leadId, { nextFollowupAt: payload.dueDate });

      this.logSkill('create_followup', payload, followup, 'SUCCESS', Date.now() - startTime);
      return { 
        success: true, 
        skillName: 'create_followup', 
        data: followup, 
        message: 'Follow-up created awaiting counsellor approval', 
        requiresHumanApproval: true 
      };
    } catch (e: any) {
      this.logSkill('create_followup', payload, null, 'FAILED', Date.now() - startTime, e.message);
      return { success: false, skillName: 'create_followup', data: null, message: e.message };
    }
  }

  // 10. generate_lead_report()
  public async generate_lead_report(): Promise<SkillResult> {
    const startTime = Date.now();
    try {
      const leads = db.getLeads(this.instituteId);
      const total = leads.length;
      const stageCounts = leads.reduce((acc, l) => {
        acc[l.status] = (acc[l.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const confirmed = stageCounts['ADMISSION_CONFIRMED'] || 0;
      const conversionRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : '0';

      const report = {
        totalLeads: total,
        stageBreakdown: stageCounts,
        admissionsConfirmed: confirmed,
        conversionRatePct: conversionRate,
        hotLeadsCount: leads.filter(l => l.leadScore >= 80 && l.status !== 'ADMISSION_CONFIRMED' && l.status !== 'LOST').length,
        generatedAt: new Date().toISOString()
      };

      this.logSkill('generate_lead_report', {}, report, 'SUCCESS', Date.now() - startTime);
      return { success: true, skillName: 'generate_lead_report', data: report, message: 'Admission performance report compiled' };
    } catch (e: any) {
      this.logSkill('generate_lead_report', {}, null, 'FAILED', Date.now() - startTime, e.message);
      return { success: false, skillName: 'generate_lead_report', data: null, message: e.message };
    }
  }

  // 11. identify_dropoffs()
  public async identify_dropoffs(): Promise<SkillResult> {
    const startTime = Date.now();
    try {
      const leads = db.getLeads(this.instituteId);
      const stalledLeads = leads.filter(l => {
        if (l.status === 'ADMISSION_CONFIRMED' || l.status === 'LOST') return false;
        const lastActive = new Date(l.lastInteractionAt).getTime();
        const daysSilent = (Date.now() - lastActive) / (1000 * 60 * 60 * 24);
        return daysSilent >= 2;
      });

      const dropoffInsights = stalledLeads.map(l => ({
        leadId: l.id,
        studentName: l.studentName,
        phone: l.phone,
        currentStage: l.status,
        daysSilent: Math.round((Date.now() - new Date(l.lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24)),
        leadScore: l.leadScore,
        recommendedIntervention: l.leadScore > 75 
          ? 'High-priority phone call with fee concession pass' 
          : 'WhatsApp re-engagement message with batch start reminder'
      }));

      this.logSkill('identify_dropoffs', {}, { stalledCount: stalledLeads.length, dropoffs: dropoffInsights }, 'SUCCESS', Date.now() - startTime);
      return { success: true, skillName: 'identify_dropoffs', data: dropoffInsights, message: `Identified ${stalledLeads.length} stalled leads at risk of drop-off` };
    } catch (e: any) {
      this.logSkill('identify_dropoffs', {}, null, 'FAILED', Date.now() - startTime, e.message);
      return { success: false, skillName: 'identify_dropoffs', data: null, message: e.message };
    }
  }

  // 12. recommend_next_action()
  public async recommend_next_action(leadId: string): Promise<SkillResult> {
    const startTime = Date.now();
    try {
      const lead = db.getLeadById(leadId);
      if (!lead || lead.instituteId !== this.instituteId) throw new Error('Lead not found');

      let action = '';
      switch (lead.status) {
        case 'NEW':
          action = 'Dispatch automated course brochure & offer 3-day free trial demo pass.';
          break;
        case 'CONTACTED':
          action = 'Check student class 10/12 target percentage & propose 1-on-1 counseling slot.';
          break;
        case 'INTERESTED':
          action = 'Share batch schedule & invite parent for campus walk-through.';
          break;
        case 'COUNSELLING_SCHEDULED':
          action = 'Send counselor profile, Google Meet link or campus Google Map location.';
          break;
        case 'TRIAL_CLASS':
          action = 'Collect demo class feedback & present early bird installment fee voucher.';
          break;
        case 'ADMISSION_CONFIRMED':
          action = 'Generate student ID badge, issue syllabus books, and add to batch WhatsApp group.';
          break;
        case 'LOST':
          action = lead.dropOffReason ? `Add to nurture pool for next academic cycle: reason "${lead.dropOffReason}".` : 'Send 1-question feedback survey.';
          break;
      }

      db.updateLead(leadId, { nextBestAction: action });
      this.logSkill('recommend_next_action', { leadId }, { recommendedAction: action }, 'SUCCESS', Date.now() - startTime);
      return { success: true, skillName: 'recommend_next_action', data: { leadId, recommendedAction: action }, message: 'Next best action prescribed' };
    } catch (e: any) {
      this.logSkill('recommend_next_action', { leadId }, null, 'FAILED', Date.now() - startTime, e.message);
      return { success: false, skillName: 'recommend_next_action', data: null, message: e.message };
    }
  }
}
