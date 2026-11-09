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

      const systemInstruction = `You are AdmitFlow AI, the professional and empathetic admission assistant & educational mentor for "${institute.name}".
Your goal is to guide students and parents with high academic intelligence, practical guidance, and absolute honesty.

FACTUAL ACCURACY & CLAIM VERIFICATION (STRICT BOUNDARIES):
1. VERIFIED INSTITUTE KNOWLEDGE (Courses, Fees, Batches, Admission Rules, Facilities, Faculty):
   - Base ALL institute-specific claims (fees, installment plans, discounts, batch timings, seat availability, scholarships, hostel availability, and demo classes) STRICTLY on the verified institute context below.
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
- Respond naturally and conversationally in ${languagePreference.toUpperCase()} (Hinglish = conversational everyday Hindi written in English script; English = clear professional English; Hindi = Devanagari script).
- Keep responses concise, warm, helpful, and encourage booking a free counseling session or demo class when appropriate.`;

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
        temperature: 0.25,
        maxOutputTokens: 800
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
        } else if (qLower.includes('difference') && (qLower.includes('main') || qLower.includes('advanced'))) {
          // General Educational: JEE Main vs Advanced
          isGrounded = false;
          groundedAnswer = languagePreference === 'english'
            ? `JEE Main and JEE Advanced have distinct objectives: 1) JEE Main is the screening test for NITs, IIITs, and CFTIs, focusing on speed, broad syllabus coverage, and accuracy. 2) JEE Advanced is exclusively for admission to IITs, testing deep multi-concept problem-solving and higher analytical depth. Would you like to discuss our focused preparation batches?`
            : `JEE Main aur JEE Advanced mein 2 main differences hain: 1) JEE Main NITs, IIITs aur CFTIs mein admission ke liye hota hai aur yeh speed aur syllabus coverage test karta hai. 2) JEE Advanced exclusively IITs ke liye hota hai jisme deep conceptual problem-solving test hoti hai. Kya aap hamare integrated JEE batch ke baare mein jaanna chahenge?`;
        } else if (qLower.includes('how should i prepare') || qLower.includes('how to prepare') || qLower.includes('prepare for jee') || qLower.includes('taiyari kaise')) {
          // General Educational: Preparation guidance
          isGrounded = false;
          groundedAnswer = languagePreference === 'english'
            ? `To prepare effectively for JEE: 1) Build strong conceptual foundation using NCERT and core material. 2) Practice daily numerical problems and Previous Year Questions (PYQs). 3) Take regular timed mock tests to analyze weak areas. 4) Maintain consistent revision. Would you like to book a free 1-on-1 counseling session with our mentors?`
            : `JEE ki best preparation strategy: 1) NCERT aur core concepts ko strong karein, 2) Daily numericals aur Previous Year Questions (PYQs) solve karein, 3) Regular timed mock tests dekar apni mistakes ko analyze karein, 4) Consistent daily routine aur revision maintain karein. Kya aap hamare expert mentors ke saath ek free counseling session book karna chahte hain?`;
        } else if (qLower.includes('guarantee') || qLower.includes('selection guarantee')) {
          // General Educational: Ethical guarantee stance
          isGrounded = false;
          groundedAnswer = languagePreference === 'english'
            ? `No honest coaching institute can guarantee selection. Final selection depends entirely on the student's hard work, regular practice, and self-discipline. Our institute guarantees top-tier faculty guidance, rigorous test series, and personalized doubt support to give you the highest probability of success. Would you like to attend a demo class?`
            : `Nahi, koi bhi honest institute selection ki guarantee nahi de sakta. Selection 100% student ki mehnat, consistency aur self-discipline par depend karta hai. ${institute.name} mein hum aapko best faculty guidance, daily doubt clearing aur structured mock tests provide karte hain taaki aapka potential maximize ho sake. Kya aap demo class dekhna chahenge?`;
        } else if (qLower.includes('benefit') && qLower.includes('coaching')) {
          // General Educational: Coaching benefits
          isGrounded = false;
          groundedAnswer = languagePreference === 'english'
            ? `Coaching provides: 1) Structured curriculum and disciplined timetable, 2) Instant doubt resolution with expert faculty, 3) Curated high-yield study material, 4) National-level peer benchmark through regular mock tests. Would you like to experience a demo session at ${institute.name}?`
            : `Coaching ke mukhya fayde: 1) Structured study routine aur discipline, 2) Experienced faculty se quick doubt resolution, 3) Exam-oriented curated material, 4) Regular mock tests jisse aapko apni all-India ranking aur weak areas ka pata chalta hai. Kya aap ${institute.name} mein demo class try karna chahenge?`;
        } else if (qLower.includes('best teacher') || qLower.includes('best faculty') || (qLower.includes('who') && qLower.includes('teacher'))) {
          // Category 1 & 2: Faculty query
          isGrounded = false;
          groundedAnswer = languagePreference === 'english'
            ? `At ${institute.name}, our faculty consists of highly experienced subject matter experts and senior IIT-JEE/NEET mentors dedicated to concept clarity and individual doubt support. We invite you to attend a free trial demo lecture to interact with our teachers directly!`
            : `${institute.name} mein sabhi subjects ke liye highly qualified aur experienced faculty members hain jo IIT-JEE aur NEET ke dedicated mentors hain. Har teacher concept building aur doubt clearing par focus karte hain. Aap unke teaching methodology ko dekhne ke liye ek free trial demo class attend kar sakte hain!`;
        } else if (qLower.includes('hostel')) {
          // Category 1: Specific Hostel fee query
          isGrounded = false;
          groundedAnswer = languagePreference === 'english'
            ? `Exact hostel and mess charges are not specified in our general prospectus, as they vary based on room sharing preferences (AC/Non-AC, single/double occupancy). Our admission team can provide current hostel partner tariffs—would you like our counselor to call you?`
            : `Hamare current prospectus mein hostel fees ki exact amount listed nahi hai kyunki hostel charges room type (AC/Non-AC, single/double sharing) par depend karte hain. Hamare admission counselor aapko hostel options aur tariffs directly share kar sakte hain. Kripya apna phone number drop karein!`;
        } else if (qLower.includes('why should i join') || qLower.includes('why join') || qLower.includes('competitor') || qLower.includes('choose this institute')) {
          // Category 1 & 2: Why join / Competitors
          isGrounded = false;
          groundedAnswer = languagePreference === 'english'
            ? `You should choose ${institute.name} for our student-centric focus: compact batch sizes, dedicated daily doubt sessions, comprehensive study modules, and regular performance benchmarking. We focus entirely on student transformation rather than marketing claims. Would you like to schedule a free counseling session?`
            : `${institute.name} ko chunne ke sabse bade kaaran hain: small batch sizes, daily dedicated doubt clearing, scientifically designed study modules aur regular performance tracking. Hum har student par personal attention dete hain. Kya aap ek free demo class ya counseling session book karna chahenge?`;
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
