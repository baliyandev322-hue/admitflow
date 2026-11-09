import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { 
  Institute, Branch, User, Course, Batch, 
  KnowledgeDocument, DocumentChunk, Lead, 
  LeadActivity, Appointment, Followup, 
  AgentExecution, Subscription, StudentDocument, IntegrationSetting,
  SalesProspect, SalesActivity, PilotTrackingRecord,
  Conversation, ChatMessage
} from './types';

interface DatabaseSchema {
  institutes: Institute[];
  branches: Branch[];
  users: User[];
  courses: Course[];
  batches: Batch[];
  knowledge_documents: KnowledgeDocument[];
  document_chunks: DocumentChunk[];
  leads: Lead[];
  lead_activities: LeadActivity[];
  appointments: Appointment[];
  followups: Followup[];
  agent_executions: AgentExecution[];
  subscriptions: Subscription[];
  student_documents?: StudentDocument[];
  integration_settings?: IntegrationSetting[];
  sales_prospects?: SalesProspect[];
  sales_activities?: SalesActivity[];
  pilot_tracking?: PilotTrackingRecord[];
  conversations?: Conversation[];
  messages?: ChatMessage[];
}

const DB_FILE = path.join(process.cwd(), 'data', 'admitflow_db.json');

// Helper to seed initial data
function generateSeedData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Password123!', salt);

  const institute1Id = 'inst-apex-001';
  const institute2Id = 'inst-codecraft-002';

  const branches: Branch[] = [
    {
      id: 'branch-apex-kota',
      instituteId: institute1Id,
      name: 'Kota Head Campus',
      city: 'Kota',
      address: 'Road No. 1, Indraprastha Industrial Area, Kota, Rajasthan',
      phone: '+91-744-2391000',
      email: 'kota@apexacademy.in',
      isHeadquarters: true,
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'branch-apex-jaipur',
      instituteId: institute1Id,
      name: 'Jaipur Gopalpura Center',
      city: 'Jaipur',
      address: 'Plot 42, Gopalpura Bypass Road, Jaipur, Rajasthan',
      phone: '+91-141-2780000',
      email: 'jaipur@apexacademy.in',
      isHeadquarters: false,
      createdAt: '2026-02-15T10:00:00Z',
    },
    {
      id: 'branch-apex-delhi',
      instituteId: institute1Id,
      name: 'Delhi South Ext Center',
      city: 'New Delhi',
      address: 'E-12, South Extension Part 1, New Delhi',
      phone: '+91-11-45600000',
      email: 'delhi@apexacademy.in',
      isHeadquarters: false,
      createdAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'branch-codecraft-blr',
      instituteId: institute2Id,
      name: 'Bengaluru HSR Hub',
      city: 'Bengaluru',
      address: '27th Main Rd, Sector 1, HSR Layout, Bengaluru',
      phone: '+91-80-49001200',
      email: 'blr@codecraft.tech',
      isHeadquarters: true,
      createdAt: '2026-01-01T10:00:00Z',
    }
  ];

  const users: User[] = [
    {
      id: 'user-admitflow-superadmin',
      instituteId: 'inst-admitflow-internal',
      name: 'AdmitFlow Operations Admin',
      email: 'admin@admitflow.ai',
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
      phone: '+91-9999900000',
      isActive: true,
      createdAt: '2026-01-01T10:00:00Z',
    },
    {
      id: 'user-admin-01',
      instituteId: institute1Id,
      name: 'Rajesh Sharma',
      email: 'rajesh@apexacademy.in',
      passwordHash: passwordHash,
      role: 'INSTITUTE_OWNER',
      phone: '+91-9829012345',
      isActive: true,
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'user-counsellor-01',
      instituteId: institute1Id,
      branchId: 'branch-apex-kota',
      name: 'Priya Joshi',
      email: 'priya@apexacademy.in',
      passwordHash: passwordHash,
      role: 'ADMISSION_COUNSELLOR',
      phone: '+91-9829099887',
      isActive: true,
      createdAt: '2026-01-12T10:00:00Z',
    },
    {
      id: 'user-counsellor-02',
      instituteId: institute1Id,
      branchId: 'branch-apex-jaipur',
      name: 'Amit Verma',
      email: 'amit@apexacademy.in',
      passwordHash: passwordHash,
      role: 'ADMISSION_COUNSELLOR',
      phone: '+91-9829077665',
      isActive: true,
      createdAt: '2026-02-16T10:00:00Z',
    },
    {
      id: 'user-manager-01',
      instituteId: institute1Id,
      branchId: 'branch-apex-jaipur',
      name: 'Sunil Rao',
      email: 'sunil@apexacademy.in',
      passwordHash: passwordHash,
      role: 'BRANCH_MANAGER',
      phone: '+91-9829033442',
      isActive: true,
      createdAt: '2026-02-15T10:00:00Z',
    },
    {
      id: 'user-codecraft-owner',
      instituteId: institute2Id,
      name: 'Pooja Verma',
      email: 'pooja@codecraft.tech',
      passwordHash: passwordHash,
      role: 'INSTITUTE_OWNER',
      phone: '+91-9845012345',
      isActive: true,
      createdAt: '2026-01-01T10:00:00Z',
    }
  ];

  const institutes: Institute[] = [
    {
      id: institute1Id,
      name: 'Apex Academy (IIT-JEE & NEET)',
      slug: 'apex-academy',
      email: 'admissions@apexacademy.in',
      phone: '+91-744-2391000',
      website: 'https://apexacademy.in',
      aiTone: 'helpful_professional',
      welcomeMessage: 'Namaste! Welcome to Apex Academy. Are you preparing for IIT-JEE or NEET? Ask me about our courses, scholarship tests, or fee structures!',
      currency: 'INR',
      address: 'Kota, Rajasthan',
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-01-10T10:00:00Z',
    },
    {
      id: institute2Id,
      name: 'CodeCraft AI Academy',
      slug: 'codecraft-ai',
      email: 'hello@codecraft.tech',
      phone: '+91-80-49001200',
      website: 'https://codecraft.tech',
      aiTone: 'energetic',
      welcomeMessage: 'Hey there! Ready to level up your engineering career with Full Stack & AI? Ask me about our curriculum and placement guarantee!',
      currency: 'INR',
      address: 'Bengaluru, Karnataka',
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-01T10:00:00Z',
    }
  ];

  const courses: Course[] = [
    {
      id: 'course-jee-target',
      instituteId: institute1Id,
      name: 'Target JEE (Main + Advanced) 2027',
      code: 'JEE-T27',
      category: 'Engineering Test Prep',
      durationWeeks: 48,
      baseFee: 145000,
      minInstallmentFee: 40000,
      maxDiscountPct: 15,
      description: 'Comprehensive 1-year classroom program covering complete Class 11 and 12 Physics, Chemistry, and Mathematics for JEE Advanced.',
      eligibility: 'Class 12 studying or passed with minimum 75% in PCM',
      isActive: true,
      createdAt: '2026-01-11T10:00:00Z',
    },
    {
      id: 'course-neet-achiever',
      instituteId: institute1Id,
      name: 'NEET Achiever Dropper Batch',
      code: 'NEET-DRP',
      category: 'Medical Test Prep',
      durationWeeks: 40,
      baseFee: 125000,
      minInstallmentFee: 35000,
      maxDiscountPct: 20,
      description: 'Rigorous medical entrance prep with daily practice problems (DPP), NCERT line-by-line master sessions, and 45 full-length mock tests.',
      eligibility: 'Class 12 passed with Physics, Chemistry, Biology',
      isActive: true,
      createdAt: '2026-01-11T10:00:00Z',
    },
    {
      id: 'course-foundation-9-10',
      instituteId: institute1Id,
      name: 'Olympiad & NTSE Foundation (Class 9 & 10)',
      code: 'FND-O910',
      category: 'Junior Foundation',
      durationWeeks: 36,
      baseFee: 75000,
      minInstallmentFee: 25000,
      maxDiscountPct: 10,
      description: 'Strengthen core fundamentals in Science and Math for Olympiads, NTSE, and early JEE/NEET orientation.',
      eligibility: 'Students entering Class 9 or 10',
      isActive: true,
      createdAt: '2026-01-11T10:00:00Z',
    },
    {
      id: 'course-codecraft-fs',
      instituteId: institute2Id,
      name: 'Full Stack AI Software Engineering Bootcamp',
      code: 'FSAI-01',
      category: 'Coding & Tech',
      durationWeeks: 24,
      baseFee: 85000,
      minInstallmentFee: 20000,
      maxDiscountPct: 10,
      description: 'Learn Next.js, Node.js, Python, LLM orchestration, RAG, and cloud architecture with 1-on-1 industry mentorship.',
      eligibility: 'Final year college or working professionals',
      isActive: true,
      createdAt: '2026-01-05T10:00:00Z',
    }
  ];

  const batches: Batch[] = [
    {
      id: 'batch-jee-k1',
      courseId: 'course-jee-target',
      instituteId: institute1Id,
      branchId: 'branch-apex-kota',
      batchName: 'JEE Target Batch A1 (Morning)',
      startDate: '2026-11-20',
      timings: '08:00 AM - 01:30 PM',
      daysOfWeek: 'Monday to Saturday',
      maxSeats: 50,
      enrolledCount: 42,
      status: 'ENROLLING',
    },
    {
      id: 'batch-jee-j1',
      courseId: 'course-jee-target',
      instituteId: institute1Id,
      branchId: 'branch-apex-jaipur',
      batchName: 'JEE Target Jaipur Batch J1',
      startDate: '2026-11-25',
      timings: '09:00 AM - 02:30 PM',
      daysOfWeek: 'Monday to Saturday',
      maxSeats: 45,
      enrolledCount: 28,
      status: 'ENROLLING',
    },
    {
      id: 'batch-neet-k1',
      courseId: 'course-neet-achiever',
      instituteId: institute1Id,
      branchId: 'branch-apex-kota',
      batchName: 'NEET Achiever Super 40 Batch',
      startDate: '2026-11-18',
      timings: '08:30 AM - 02:00 PM',
      daysOfWeek: 'Monday to Saturday',
      maxSeats: 40,
      enrolledCount: 38,
      status: 'ENROLLING',
    }
  ];

  const rawBrochure = `APEX ACADEMY OFFICIAL ADMISSION BROCHURE & FEE POLICY
1. Admission & Scholarship:
- Direct admission based on Class 10/12 marks or Apex Talent Scholarship Exam (ATSE). Up to 90% scholarship available on tuition fees through ATSE conducted every Sunday.
- Hostel and Mess facility available at Kota campus: ₹12,000/month (Air-cooled single/twin rooms, nutritious vegetarian food, 24/7 security).
2. Fee Payment & Installments:
- Fees can be paid in 3 equal installments or 1-time upfront payment with a flat 5% early bird concession.
- Installment 1: At admission. Installment 2: After 60 days. Installment 3: After 120 days.
- Refund Policy: 100% refund (minus ₹2,000 processing fee) if withdrawal requested within 15 days of batch start. 50% refund between 16-30 days. No refund after 30 days.
3. Counseling & Trial Classes:
- Free 3-day classroom demo pass provided to registered students.
- 1-on-1 career counselling available with senior faculty on Monday to Saturday 10 AM to 6 PM.
4. Dropper NEET Batch Special Features:
- Daily 2-hour doubt clearing counter. Dedicated mentor assigned to every 25 students. Weekly computer-based test on latest NTA NEET pattern.`;

  const knowledge_documents: KnowledgeDocument[] = [
    {
      id: 'doc-apex-brochure',
      instituteId: institute1Id,
      title: 'Apex Academy Official Prospectus & Fee Policy 2026-27',
      fileType: 'PDF',
      rawContent: rawBrochure,
      chunkCount: 4,
      status: 'INDEXED',
      createdAt: '2026-01-12T10:00:00Z',
    }
  ];

  const document_chunks: DocumentChunk[] = [
    {
      id: 'chunk-apex-1',
      documentId: 'doc-apex-brochure',
      instituteId: institute1Id,
      chunkIndex: 0,
      content: 'Apex Academy Admission & Scholarship: Direct admission based on marks or ATSE exam. Up to 90% scholarship available. Hostel & Mess available in Kota at ₹12,000/month with single/twin rooms and security.',
      keywords: ['scholarship', 'atse', 'hostel', 'mess', 'kota', 'fees', 'living'],
    },
    {
      id: 'chunk-apex-2',
      documentId: 'doc-apex-brochure',
      instituteId: institute1Id,
      chunkIndex: 1,
      content: 'Fee Payment & Installments: 3 equal installments. 5% early bird discount on one-time payment. Target JEE 2027 base fee is ₹1,45,000. NEET Achiever dropper batch base fee is ₹1,25,000.',
      keywords: ['fee', 'installments', 'discount', 'payment', 'target jee', 'neet fee'],
    },
    {
      id: 'chunk-apex-3',
      documentId: 'doc-apex-brochure',
      instituteId: institute1Id,
      chunkIndex: 2,
      content: 'Refund Policy: 100% refund (minus ₹2,000 admin fee) if withdrawn within 15 days of batch start. 50% refund within 16-30 days. Zero refund after 30 days of batch commencement.',
      keywords: ['refund', 'cancellation', 'money back', 'policy', 'withdrawal'],
    },
    {
      id: 'chunk-apex-4',
      documentId: 'doc-apex-brochure',
      instituteId: institute1Id,
      chunkIndex: 3,
      content: 'Counseling & Trial Classes: Free 3-day demo class pass available. 1-on-1 counseling with senior faculty available Monday to Saturday 10 AM to 6 PM. Daily 2-hour doubt clearance counters.',
      keywords: ['demo', 'trial class', 'counseling', 'appointment', 'faculty', 'doubts'],
    }
  ];

  const leads: Lead[] = [
    {
      id: 'lead-01',
      instituteId: institute1Id,
      branchId: 'branch-apex-kota',
      assignedCounsellorId: 'user-counsellor-01',
      studentName: 'Aarav Choudhary',
      phone: '+91-9876543210',
      email: 'aarav.c@gmail.com',
      courseId: 'course-jee-target',
      status: 'INTERESTED',
      source: 'WEBSITE_CHAT',
      leadScore: 88,
      nextBestAction: 'Offer 3-day classroom demo pass and confirm hostel requirements.',
      notes: 'Asked detailed questions about Kota hostel safety and 2nd installment due date. Highly interested.',
      lastInteractionAt: '2026-11-07T14:30:00Z',
      nextFollowupAt: '2026-11-09T11:00:00Z',
      createdAt: '2026-11-05T10:00:00Z',
      updatedAt: '2026-11-07T14:30:00Z',
    },
    {
      id: 'lead-02',
      instituteId: institute1Id,
      branchId: 'branch-apex-jaipur',
      assignedCounsellorId: 'user-counsellor-02',
      studentName: 'Sneha Sharma',
      phone: '+91-9823456781',
      email: 'sneha.neet@gmail.com',
      courseId: 'course-neet-achiever',
      status: 'COUNSELLING_SCHEDULED',
      source: 'WHATSAPP',
      leadScore: 92,
      nextBestAction: 'Prepare NEET score analysis sheet before scheduled appointment.',
      notes: 'Scored 540 in NEET 2026, aims for 680+ in 2027. Wants Super 40 batch.',
      lastInteractionAt: '2026-11-07T18:00:00Z',
      nextFollowupAt: '2026-11-08T15:00:00Z',
      createdAt: '2026-11-04T12:00:00Z',
      updatedAt: '2026-11-07T18:00:00Z',
    },
    {
      id: 'lead-03',
      instituteId: institute1Id,
      branchId: 'branch-apex-kota',
      assignedCounsellorId: 'user-counsellor-01',
      studentName: 'Rohan Rathore',
      phone: '+91-9711223344',
      courseId: 'course-jee-target',
      status: 'NEW',
      source: 'WEBSITE_CHAT',
      leadScore: 65,
      nextBestAction: 'Send course syllabus brochure and scholarship test dates.',
      notes: 'New enquiry from website chatbot at 10 PM. Inquired about batch start dates.',
      lastInteractionAt: '2026-11-08T02:15:00Z',
      nextFollowupAt: '2026-11-08T12:00:00Z',
      createdAt: '2026-11-08T02:15:00Z',
      updatedAt: '2026-11-08T02:15:00Z',
    },
    {
      id: 'lead-04',
      instituteId: institute1Id,
      branchId: 'branch-apex-jaipur',
      assignedCounsellorId: 'user-counsellor-02',
      studentName: 'Kunal Singhal',
      phone: '+91-9988776655',
      courseId: 'course-neet-achiever',
      status: 'ADMISSION_CONFIRMED',
      source: 'DIRECT_WALKIN',
      leadScore: 100,
      nextBestAction: 'Issue ID card and study material welcome kit.',
      notes: 'Paid first installment of ₹45,000 via UPI. Enrolled in Jaipur batch.',
      lastInteractionAt: '2026-11-06T16:00:00Z',
      createdAt: '2026-11-02T11:00:00Z',
      updatedAt: '2026-11-06T16:00:00Z',
    },
    {
      id: 'lead-05',
      instituteId: institute1Id,
      branchId: 'branch-apex-delhi',
      studentName: 'Megha Gupta',
      phone: '+91-9123456789',
      courseId: 'course-foundation-9-10',
      status: 'LOST',
      source: 'GOOGLE_ADS',
      leadScore: 25,
      dropOffReason: 'Opted for school-integrated local program due to travel distance.',
      notes: 'Parent found South Extension center too far from residence in Noida.',
      lastInteractionAt: '2026-11-03T17:00:00Z',
      createdAt: '2026-10-28T09:00:00Z',
      updatedAt: '2026-11-03T17:00:00Z',
    }
  ];

  const lead_activities: LeadActivity[] = [
    {
      id: 'act-01',
      leadId: 'lead-01',
      instituteId: institute1Id,
      actorType: 'AI_AGENT',
      activityType: 'CHAT_ENQUIRY',
      description: 'AI Answered JEE Target 2027 fee enquiry in Hinglish and explained installment structure.',
      createdAt: '2026-11-05T10:02:00Z',
    },
    {
      id: 'act-02',
      leadId: 'lead-01',
      instituteId: institute1Id,
      actorType: 'COUNSELLOR',
      actorId: 'user-counsellor-01',
      activityType: 'COUNSELLOR_CALL',
      description: 'Priya Joshi connected with student Aarav. Discussed Kota hostel options.',
      createdAt: '2026-11-06T11:30:00Z',
    },
    {
      id: 'act-03',
      leadId: 'lead-02',
      instituteId: institute1Id,
      actorType: 'AI_AGENT',
      activityType: 'COUNSELLING_BOOKED',
      description: 'AI Agent booked a 1-on-1 counseling appointment for 8th Nov at 3:00 PM.',
      createdAt: '2026-11-07T18:00:00Z',
    }
  ];

  const appointments: Appointment[] = [
    {
      id: 'apt-01',
      instituteId: institute1Id,
      branchId: 'branch-apex-jaipur',
      leadId: 'lead-02',
      counsellorId: 'user-counsellor-02',
      scheduledAt: '2026-11-08T15:00:00Z',
      durationMinutes: 45,
      mode: 'OFFLINE_CAMPUS',
      status: 'SCHEDULED',
      notes: 'NEET Achiever 2027 Strategy & Scholarship Evaluation with Amit Verma.',
      createdAt: '2026-11-07T18:00:00Z',
    }
  ];

  const followups: Followup[] = [
    {
      id: 'fol-01',
      instituteId: institute1Id,
      leadId: 'lead-01',
      counsellorId: 'user-counsellor-01',
      dueDate: '2026-11-09T11:00:00Z',
      suggestedMessage: 'Namaste Aarav! We have reserved your provisional seat in JEE Target Batch A1. Would you like to confirm your 3-day demo pass for this Thursday?',
      channel: 'WHATSAPP',
      status: 'PENDING',
      isOverdue: false,
      createdAt: '2026-11-07T14:35:00Z',
    },
    {
      id: 'fol-02',
      instituteId: institute1Id,
      leadId: 'lead-03',
      counsellorId: 'user-counsellor-01',
      dueDate: '2026-11-08T10:00:00Z',
      suggestedMessage: 'Hello Rohan! Following up on your query regarding JEE batch start dates. Our early morning batch starts Nov 20th with limited 50 seats. Would you like a call back?',
      channel: 'WHATSAPP',
      status: 'PENDING',
      isOverdue: true,
      createdAt: '2026-11-08T02:20:00Z',
    }
  ];

  const agent_executions: AgentExecution[] = [
    {
      id: 'exec-01',
      instituteId: institute1Id,
      skillName: 'answer_enquiry',
      triggeredBy: 'WEBSITE_CHAT',
      inputPayload: { query: 'JEE Target batch ki fees kitni hai?' },
      outputPayload: { baseFee: 145000, installments: 3, grounded: true },
      status: 'SUCCESS',
      executionTimeMs: 420,
      createdAt: '2026-11-07T14:30:00Z',
    },
    {
      id: 'exec-02',
      instituteId: institute1Id,
      skillName: 'schedule_counselling',
      triggeredBy: 'WHATSAPP_BOT',
      inputPayload: { leadId: 'lead-02', slot: '2026-11-08T15:00:00Z' },
      outputPayload: { appointmentId: 'apt-01', confirmed: true },
      status: 'SUCCESS',
      executionTimeMs: 310,
      createdAt: '2026-11-07T18:00:00Z',
    }
  ];

  const subscriptions: Subscription[] = [
    {
      id: 'sub-apex-01',
      instituteId: institute1Id,
      tier: 'PRO',
      status: 'ACTIVE',
      leadsUsed: 1420,
      leadsQuota: 10000,
      ragQueriesUsed: 890,
      ragQueriesQuota: 5000,
      currentPeriodStart: '2026-11-01T00:00:00Z',
      currentPeriodEnd: '2026-12-01T00:00:00Z',
    },
    {
      id: 'sub-codecraft-01',
      instituteId: institute2Id,
      tier: 'GROWTH',
      status: 'ACTIVE',
      leadsUsed: 310,
      leadsQuota: 2500,
      ragQueriesUsed: 215,
      ragQueriesQuota: 1000,
      currentPeriodStart: '2026-11-01T00:00:00Z',
      currentPeriodEnd: '2026-12-01T00:00:00Z',
    }
  ];

  const student_documents: StudentDocument[] = [
    {
      id: 'doc-aarav-10th',
      instituteId: institute1Id,
      leadId: 'lead-01',
      studentName: 'Aarav Sharma',
      docType: '10TH_MARKSHEET',
      fileName: 'aarav_class10_cbse.pdf',
      fileSizeKb: 420,
      mimeType: 'application/pdf',
      status: 'VERIFIED',
      reviewedBy: 'user-counsellor-01',
      reviewedAt: '2026-11-07T16:00:00Z',
      notes: 'CBSE Class 10 scored 94.2% verified against marksheet copy',
      createdAt: '2026-11-07T15:00:00Z'
    },
    {
      id: 'doc-aarav-photo',
      instituteId: institute1Id,
      leadId: 'lead-01',
      studentName: 'Aarav Sharma',
      docType: 'PHOTO',
      fileName: 'aarav_passport_photo.jpg',
      fileSizeKb: 150,
      mimeType: 'image/jpeg',
      status: 'VERIFIED',
      reviewedBy: 'user-counsellor-01',
      reviewedAt: '2026-11-07T16:05:00Z',
      notes: 'Clear passport sized photograph received',
      createdAt: '2026-11-07T15:05:00Z'
    }
  ];

  const integration_settings: IntegrationSetting[] = [
    {
      id: 'integ-apex-mcp',
      instituteId: institute1Id,
      provider: 'MCP_SERVER',
      status: 'ACTIVE',
      enabled: true,
      configData: {
        endpoint: '/api/mcp',
        protocolVersion: '2024-11-05',
        sdkVersion: '1.32.2',
        allowedTools: '*'
      },
      lastSyncAt: new Date().toISOString(),
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'integ-apex-cal',
      instituteId: institute1Id,
      provider: 'GOOGLE_CALENDAR',
      status: 'PENDING_CONFIG',
      enabled: false,
      configData: {
        calendarId: 'primary',
        timeZone: 'Asia/Kolkata',
        autoSyncAppointments: true
      },
      errorMessage: 'OAuth credentials not configured. Connector standby mode active.',
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'integ-apex-wa',
      instituteId: institute1Id,
      provider: 'WHATSAPP_BUSINESS',
      status: 'PENDING_CONFIG',
      enabled: false,
      configData: {
        businessAccountId: '',
        phoneNumberId: '',
        webhookVerified: false
      },
      errorMessage: 'Meta Graph API credentials not configured. Official connector standby active.',
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    }
  ];

  return {
    institutes,
    branches,
    users,
    courses,
    batches,
    knowledge_documents,
    document_chunks,
    leads,
    lead_activities,
    appointments,
    followups,
    agent_executions,
    subscriptions,
    student_documents,
    integration_settings,
    sales_prospects: [],
    sales_activities: [],
    pilot_tracking: [],
    conversations: [],
    messages: []
  };
}

// Database helper functions
export class Database {
  private static instance: Database;
  private data: DatabaseSchema;

  private constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private ensureDataDir() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(fileContent);
        data.student_documents = data.student_documents || [];
        data.integration_settings = data.integration_settings || [];
        data.sales_prospects = data.sales_prospects || [];
        data.sales_activities = data.sales_activities || [];
        data.pilot_tracking = data.pilot_tracking || [];
        if (!data.users.some((u: any) => u.email === 'admin@admitflow.ai')) {
          const salt = bcrypt.genSaltSync(10);
          data.users.unshift({
            id: 'user-admitflow-superadmin',
            instituteId: 'inst-admitflow-internal',
            name: 'AdmitFlow Operations Admin',
            email: 'admin@admitflow.ai',
            passwordHash: bcrypt.hashSync('AdmitFlowSuper2026!', salt),
            role: 'SUPER_ADMIN',
            phone: '+91-9999900000',
            isActive: true,
            createdAt: '2026-01-01T10:00:00Z',
          });
        }
        return data;
      }
    } catch (e) {
      console.error('Error loading DB file, reinitializing seed data:', e);
    }
    const seed = generateSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(data: DatabaseSchema) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving DB file:', e);
    }
  }

  public persist() {
    this.saveData(this.data);
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  // Institutes
  public getInstitutes() { return this.data.institutes; }
  public getInstituteById(id: string) { return this.data.institutes.find(i => i.id === id); }
  public getInstituteBySlug(slug: string) { return this.data.institutes.find(i => i.slug === slug); }
  public createInstitute(inst: Institute) { 
    this.data.institutes.push(inst); 
    this.persist(); 
    return inst; 
  }
  public updateInstitute(id: string, updates: Partial<Institute>) {
    const idx = this.data.institutes.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.data.institutes[idx] = { ...this.data.institutes[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      return this.data.institutes[idx];
    }
    return null;
  }

  // Branches
  public getBranches(instituteId: string) {
    return this.data.branches.filter(b => b.instituteId === instituteId);
  }
  public createBranch(branch: Branch) {
    this.data.branches.push(branch);
    this.persist();
    return branch;
  }

  // Users
  public getUsers(instituteId?: string) {
    if (!instituteId) return this.data.users;
    return this.data.users.filter(u => u.instituteId === instituteId);
  }
  public getUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  public getUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }
  public createUser(user: User) {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  // Courses & Batches
  public getCourses(instituteId: string) {
    return this.data.courses.filter(c => c.instituteId === instituteId);
  }
  public getCourseById(id: string) {
    return this.data.courses.find(c => c.id === id);
  }
  public createCourse(course: Course) {
    this.data.courses.push(course);
    this.persist();
    return course;
  }
  public getBatches(instituteId: string, courseId?: string) {
    return this.data.batches.filter(b => b.instituteId === instituteId && (!courseId || b.courseId === courseId));
  }
  public createBatch(batch: Batch) {
    this.data.batches.push(batch);
    this.persist();
    return batch;
  }

  // Leads CRM
  public getLeads(instituteId: string) {
    return this.data.leads.filter(l => l.instituteId === instituteId);
  }
  public getLeadById(id: string) {
    return this.data.leads.find(l => l.id === id);
  }
  public findLeadByPhone(instituteId: string, phone: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    return this.data.leads.find(l => 
      l.instituteId === instituteId && 
      l.phone.replace(/[^0-9]/g, '').slice(-10) === cleanPhone
    );
  }
  public createLead(lead: Lead) {
    this.data.leads.unshift(lead);
    this.addLeadActivity({
      id: 'act-' + Date.now(),
      leadId: lead.id,
      instituteId: lead.instituteId,
      actorType: 'SYSTEM',
      activityType: 'LEAD_CREATED',
      description: `New lead created from ${lead.source}.`,
      createdAt: new Date().toISOString()
    });
    this.persist();
    return lead;
  }
  public updateLead(id: string, updates: Partial<Lead>) {
    const idx = this.data.leads.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.data.leads[idx] = { ...this.data.leads[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      return this.data.leads[idx];
    }
    return null;
  }

  // Lead Activities
  public getLeadActivities(leadId: string) {
    return this.data.lead_activities
      .filter(a => a.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public addLeadActivity(activity: LeadActivity) {
    this.data.lead_activities.unshift(activity);
    this.persist();
    return activity;
  }

  // Knowledge RAG
  public getKnowledgeDocs(instituteId: string) {
    return this.data.knowledge_documents.filter(d => d.instituteId === instituteId);
  }
  public addKnowledgeDoc(doc: KnowledgeDocument, chunks: DocumentChunk[]) {
    this.data.knowledge_documents.unshift(doc);
    this.data.document_chunks.push(...chunks);
    this.persist();
    return doc;
  }
  public deleteKnowledgeDoc(docId: string, instituteId: string) {
    this.data.knowledge_documents = this.data.knowledge_documents.filter(d => !(d.id === docId && d.instituteId === instituteId));
    this.data.document_chunks = this.data.document_chunks.filter(c => !(c.documentId === docId && c.instituteId === instituteId));
    this.persist();
    return true;
  }
  public getChunksForInstitute(instituteId: string): DocumentChunk[] {
    return this.data.document_chunks.filter(c => c.instituteId === instituteId);
  }

  // Appointments
  public getAppointments(instituteId: string) {
    return this.data.appointments.filter(a => a.instituteId === instituteId);
  }
  public createAppointment(apt: Appointment) {
    this.data.appointments.unshift(apt);
    this.persist();
    return apt;
  }
  public updateAppointment(id: string, updates: Partial<Appointment>) {
    const idx = this.data.appointments.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.appointments[idx] = { ...this.data.appointments[idx], ...updates };
      this.persist();
      return this.data.appointments[idx];
    }
    return null;
  }

  // Followups
  public getFollowups(instituteId: string) {
    return this.data.followups.filter(f => f.instituteId === instituteId);
  }
  public createFollowup(f: Followup) {
    this.data.followups.unshift(f);
    this.persist();
    return f;
  }
  public updateFollowup(id: string, updates: Partial<Followup>) {
    const idx = this.data.followups.findIndex(f => f.id === id);
    if (idx !== -1) {
      this.data.followups[idx] = { ...this.data.followups[idx], ...updates };
      this.persist();
      return this.data.followups[idx];
    }
    return null;
  }

  // Student Documents Workflow
  public getStudentDocuments(instituteId: string, leadId?: string): StudentDocument[] {
    this.data.student_documents = this.data.student_documents || [];
    return this.data.student_documents.filter(d => 
      d.instituteId === instituteId && (!leadId || d.leadId === leadId)
    );
  }
  public addStudentDocument(doc: StudentDocument): StudentDocument {
    this.data.student_documents = this.data.student_documents || [];
    this.data.student_documents.unshift(doc);
    this.persist();
    return doc;
  }
  public updateStudentDocument(id: string, updates: Partial<StudentDocument>): StudentDocument | null {
    this.data.student_documents = this.data.student_documents || [];
    const idx = this.data.student_documents.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.data.student_documents[idx] = { ...this.data.student_documents[idx], ...updates };
      this.persist();
      return this.data.student_documents[idx];
    }
    return null;
  }

  // Integration Settings
  public getIntegrationSettings(instituteId: string): IntegrationSetting[] {
    this.data.integration_settings = this.data.integration_settings || [];
    let items = this.data.integration_settings.filter(i => i.instituteId === instituteId);
    if (items.length === 0) {
      // Auto seed defaults for the institute
      const defaultProviders: Array<'MCP_SERVER' | 'GOOGLE_CALENDAR' | 'WHATSAPP_BUSINESS'> = [
        'MCP_SERVER',
        'GOOGLE_CALENDAR',
        'WHATSAPP_BUSINESS'
      ];
      for (const provider of defaultProviders) {
        const item: IntegrationSetting = {
          id: `integ-${instituteId}-${provider.toLowerCase()}`,
          instituteId,
          provider,
          status: provider === 'MCP_SERVER' ? 'ACTIVE' : 'PENDING_CONFIG',
          enabled: provider === 'MCP_SERVER',
          configData: provider === 'MCP_SERVER' 
            ? { endpoint: '/api/mcp', protocolVersion: '2024-11-05', sdkVersion: '1.32.2' }
            : {},
          errorMessage: provider === 'MCP_SERVER' ? undefined : 'Configuration credentials pending setup.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.data.integration_settings.push(item);
      }
      this.persist();
      items = this.data.integration_settings.filter(i => i.instituteId === instituteId);
    }
    return items;
  }
  public updateIntegrationSetting(
    instituteId: string, 
    provider: 'GOOGLE_CALENDAR' | 'WHATSAPP_BUSINESS' | 'MCP_SERVER', 
    updates: Partial<IntegrationSetting>
  ): IntegrationSetting {
    this.data.integration_settings = this.data.integration_settings || [];
    const idx = this.data.integration_settings.findIndex(i => i.instituteId === instituteId && i.provider === provider);
    if (idx !== -1) {
      this.data.integration_settings[idx] = { 
        ...this.data.integration_settings[idx], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      this.persist();
      return this.data.integration_settings[idx];
    }
    const newSetting: IntegrationSetting = {
      id: `integ-${instituteId}-${provider.toLowerCase()}`,
      instituteId,
      provider,
      status: updates.status || 'PENDING_CONFIG',
      enabled: updates.enabled ?? false,
      configData: updates.configData || {},
      errorMessage: updates.errorMessage,
      lastSyncAt: updates.lastSyncAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.integration_settings.push(newSetting);
    this.persist();
    return newSetting;
  }

  // Agent Executions
  public logAgentExecution(exec: AgentExecution) {
    this.data.agent_executions.unshift(exec);
    this.persist();
    return exec;
  }
  public getAgentExecutions(instituteId: string) {
    return this.data.agent_executions.filter(e => e.instituteId === instituteId);
  }

  // Subscriptions
  public getSubscription(instituteId: string) {
    return this.data.subscriptions.find(s => s.instituteId === instituteId);
  }
  public updateSubscription(instituteId: string, updates: Partial<Subscription>) {
    const idx = this.data.subscriptions.findIndex(s => s.instituteId === instituteId);
    if (idx !== -1) {
      this.data.subscriptions[idx] = { ...this.data.subscriptions[idx], ...updates };
      this.persist();
      return this.data.subscriptions[idx];
    }
    return null;
  }

  // ========================================================
  // Internal B2B Sales CRM Methods (AdmitFlow Sales Ops)
  // ========================================================

  public getSalesProspects(): SalesProspect[] {
    this.data.sales_prospects = this.data.sales_prospects || [];
    return [...this.data.sales_prospects];
  }

  public getSalesProspectById(id: string): SalesProspect | undefined {
    this.data.sales_prospects = this.data.sales_prospects || [];
    return this.data.sales_prospects.find(p => p.id === id);
  }

  public createSalesProspect(prospect: SalesProspect): SalesProspect {
    this.data.sales_prospects = this.data.sales_prospects || [];
    // Duplicate prevention: check phone or email
    const duplicate = this.data.sales_prospects.find(p => 
      (prospect.phone && p.phone === prospect.phone) || 
      (prospect.email && p.email.toLowerCase() === prospect.email.toLowerCase())
    );
    if (duplicate) {
      throw new Error(`A sales prospect with phone ${prospect.phone} or email ${prospect.email} already exists: ${duplicate.instituteName}`);
    }

    this.data.sales_prospects.unshift(prospect);
    this.addSalesActivity({
      id: 'sact-' + Date.now(),
      prospectId: prospect.id,
      activityType: 'STAGE_CHANGE',
      outcome: 'PROSPECT_IDENTIFIED',
      notes: `New B2B sales prospect added: ${prospect.instituteName} (${prospect.city})`,
      performedBy: 'SALES_OPS',
      createdAt: new Date().toISOString()
    });
    this.persist();
    return prospect;
  }

  public updateSalesProspect(id: string, updates: Partial<SalesProspect>): SalesProspect | null {
    this.data.sales_prospects = this.data.sales_prospects || [];
    const idx = this.data.sales_prospects.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const previousStage = this.data.sales_prospects[idx].stage;
    this.data.sales_prospects[idx] = {
      ...this.data.sales_prospects[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.stage && updates.stage !== previousStage) {
      this.addSalesActivity({
        id: 'sact-' + Date.now(),
        prospectId: id,
        activityType: 'STAGE_CHANGE',
        outcome: updates.stage,
        notes: `Sales stage moved from ${previousStage} to ${updates.stage}`,
        performedBy: 'SALES_REP',
        createdAt: new Date().toISOString()
      });
    }

    this.persist();
    return this.data.sales_prospects[idx];
  }

  public deleteSalesProspect(id: string): boolean {
    this.data.sales_prospects = this.data.sales_prospects || [];
    const initialLen = this.data.sales_prospects.length;
    this.data.sales_prospects = this.data.sales_prospects.filter(p => p.id !== id);
    if (this.data.sales_prospects.length < initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Sales Activities
  public getSalesActivities(prospectId: string): SalesActivity[] {
    this.data.sales_activities = this.data.sales_activities || [];
    return this.data.sales_activities
      .filter(a => a.prospectId === prospectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addSalesActivity(act: SalesActivity): SalesActivity {
    this.data.sales_activities = this.data.sales_activities || [];
    this.data.sales_activities.unshift(act);
    this.persist();
    return act;
  }

  // Pilot Tracking
  public getPilotTracking(instituteId: string): PilotTrackingRecord | undefined {
    this.data.pilot_tracking = this.data.pilot_tracking || [];
    return this.data.pilot_tracking.find(pt => pt.instituteId === instituteId);
  }

  public upsertPilotTracking(record: PilotTrackingRecord): PilotTrackingRecord {
    this.data.pilot_tracking = this.data.pilot_tracking || [];
    const idx = this.data.pilot_tracking.findIndex(pt => pt.instituteId === record.instituteId);
    if (idx !== -1) {
      this.data.pilot_tracking[idx] = { ...this.data.pilot_tracking[idx], ...record, updatedAt: new Date().toISOString() };
    } else {
      this.data.pilot_tracking.unshift(record);
    }
    this.persist();
    return record;
  }

  // ==========================================
  // Conversations & Multi-Turn Message Persistence
  // ==========================================

  public getConversations(instituteId: string): Conversation[] {
    this.data.conversations = this.data.conversations || [];
    return this.data.conversations
      .filter(c => c.instituteId === instituteId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getConversationById(id: string): Conversation | undefined {
    this.data.conversations = this.data.conversations || [];
    return this.data.conversations.find(c => c.id === id);
  }

  public findConversationBySession(instituteId: string, sessionId: string): Conversation | undefined {
    this.data.conversations = this.data.conversations || [];
    return this.data.conversations.find(c => c.instituteId === instituteId && c.sessionId === sessionId);
  }

  public createConversation(conv: Conversation): Conversation {
    this.data.conversations = this.data.conversations || [];
    const existing = this.data.conversations.find(c => c.id === conv.id || (c.instituteId === conv.instituteId && c.sessionId === conv.sessionId));
    if (existing) return existing;
    this.data.conversations.unshift(conv);
    this.persist();

    // Async sync to PostgreSQL if connected
    if (process.env.DATABASE_URL) {
      import('./db/postgresPool').then(({ getPostgresPool }) => {
        const pool = getPostgresPool();
        pool.query(`
          INSERT INTO conversations (id, institute_id, lead_id, channel, session_id, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING;
        `, [conv.id, conv.instituteId, conv.leadId || null, conv.channel || 'WEB_CHAT', conv.sessionId, conv.status || 'ACTIVE', conv.createdAt])
        .catch(err => console.warn('[Postgres Conversation Sync]', err.message));
      }).catch(() => {});
    }

    return conv;
  }

  public updateConversation(id: string, updates: Partial<Conversation>): Conversation | null {
    this.data.conversations = this.data.conversations || [];
    const idx = this.data.conversations.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.conversations[idx] = { 
      ...this.data.conversations[idx], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.persist();
    return this.data.conversations[idx];
  }

  public getMessages(conversationId: string): ChatMessage[] {
    this.data.messages = this.data.messages || [];
    return this.data.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addMessage(msg: ChatMessage): ChatMessage {
    this.data.messages = this.data.messages || [];
    // Deduplication check
    const existing = this.data.messages.find(m => m.id === msg.id);
    if (existing) return existing;

    this.data.messages.push(msg);
    this.persist();

    // Async sync to PostgreSQL if connected
    if (process.env.DATABASE_URL) {
      import('./db/postgresPool').then(({ getPostgresPool }) => {
        const pool = getPostgresPool();
        pool.query(`
          INSERT INTO messages (id, conversation_id, sender_type, content, rag_sources, tool_calls, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING;
        `, [
          msg.id, 
          msg.conversationId, 
          msg.senderType, 
          msg.content, 
          JSON.stringify(msg.ragSources || []), 
          JSON.stringify(msg.toolCalls || []), 
          msg.createdAt
        ])
        .catch(err => console.warn('[Postgres Message Sync]', err.message));
      }).catch(() => {});
    }

    return msg;
  }

  // Engine & Health Verification
  public getDatabaseEngine(): 'POSTGRESQL' | 'JSON_LOCAL' {
    return process.env.DATABASE_URL ? 'POSTGRESQL' : 'JSON_LOCAL';
  }

  public async verifyDatabaseConnection(): Promise<{ engine: 'POSTGRESQL' | 'JSON_LOCAL'; healthy: boolean; details: string }> {
    const dbUrl = process.env.DATABASE_URL;
    const isProduction = process.env.NODE_ENV === 'production';

    if (dbUrl) {
      const { checkPostgresHealth } = await import('./db/postgresPool');
      const health = await checkPostgresHealth();
      if (!health.healthy) {
        if (isProduction) {
          throw new Error(`[CRITICAL DATABASE FAILURE] DATABASE_URL is defined for production environment, but PostgreSQL connection failed: ${health.error}. Silently falling back to JSON storage is strictly prohibited.`);
        }
        return {
          engine: 'POSTGRESQL',
          healthy: false,
          details: `PostgreSQL connection failed: ${health.error}. (In dev mode, falling back to local JSON engine).`
        };
      }
      return {
        engine: 'POSTGRESQL',
        healthy: true,
        details: `PostgreSQL pool healthy (Latency: ${health.latencyMs}ms)`
      };
    }

    return {
      engine: 'JSON_LOCAL',
      healthy: true,
      details: 'Operating on persistent local JSON engine (admitflow_db.json)'
    };
  }
}

export const db = Database.getInstance();
export { getPostgresPool, checkPostgresHealth, withTransaction } from './db/postgresPool';
export { runPostgresMigrations } from './db/migrator';
export { seedPostgresFromJson } from './db/seedPostgres';

