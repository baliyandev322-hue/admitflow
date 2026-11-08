import bcrypt from 'bcryptjs';
import { db } from '../db';
import { 
  Institute, Branch, User, Course, Batch, 
  KnowledgeDocument, DocumentChunk 
} from '../types';

export const PRERNA_PILOT_INSTITUTE_ID = 'inst-prerna-pilot';
export const PRERNA_PILOT_SLUG = 'prerna-career-institute';

export const DEMO_PRERNA_OWNER_EMAIL = 'director@prerna-demo.invalid';
export const DEMO_PRERNA_COUNSELOR1_EMAIL = 'sunita.sharma@prerna-demo.invalid';
export const DEMO_PRERNA_COUNSELOR2_EMAIL = 'vikram.rathore@prerna-demo.invalid';
export const DEMO_PRERNA_INSTITUTE_EMAIL = 'admissions@prerna-demo.invalid';
export const DEMO_PRERNA_PHONE = '+91-00000-00000';

export function seedPrernaPilotInstitute(options?: { force?: boolean }) {
  // Production Security Barrier:
  // In production (NODE_ENV === 'production'), synthetic tenant creation is unconditionally blocked.
  // ALLOW_DEMO_SEED cannot override production seed blocking under company policy.
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return {
      institute: null,
      branches: [],
      users: [],
      courses: [],
      docs: [],
      alreadySeeded: false,
      blockedInProduction: true
    };
  }

  const now = new Date().toISOString();

  // Deduplicate branches and users if duplicates existed
  if ((db as any).data) {
    if ((db as any).data.branches) {
      const seen = new Set<string>();
      (db as any).data.branches = (db as any).data.branches.filter((b: any) => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      });
    }
    if ((db as any).data.users) {
      const seenUsers = new Set<string>();
      (db as any).data.users = (db as any).data.users.filter((u: any) => {
        if (seenUsers.has(u.email)) return false;
        seenUsers.add(u.email);
        return true;
      });
    }
  }

  // 1. Institute with safe unroutable placeholders
  let pilotInstitute = db.getInstituteById(PRERNA_PILOT_INSTITUTE_ID);
  if (!pilotInstitute) {
    pilotInstitute = {
      id: PRERNA_PILOT_INSTITUTE_ID,
      name: 'Prerna Career Institute (IIT-JEE & NEET Academy)',
      slug: PRERNA_PILOT_SLUG,
      email: DEMO_PRERNA_INSTITUTE_EMAIL,
      phone: DEMO_PRERNA_PHONE,
      website: 'https://demo.admitflow.invalid',
      aiTone: 'helpful_professional',
      welcomeMessage: 'Namaste! Prerna Career Institute AI Admission Desk (Demo Sandbox) mein aapka swagat hai. IIT-JEE aur NEET demo batches, fees aur Kota/Jaipur center counseling ke bare mein poochein.',
      currency: 'INR',
      address: 'Road No. 2, Indraprastha Industrial Area, Kota, Rajasthan - 324005 (Demo Facility)',
      createdAt: now,
      updatedAt: now
    };
    db.createInstitute(pilotInstitute);
  } else {
    // Ensure safe demo placeholders on existing institute
    pilotInstitute.email = DEMO_PRERNA_INSTITUTE_EMAIL;
    pilotInstitute.phone = DEMO_PRERNA_PHONE;
    pilotInstitute.website = 'https://demo.admitflow.invalid';
  }

  // 2. Branches with safe dummy numbers and .invalid domains
  const kotaBranch: Branch = {
    id: 'branch-prerna-kota',
    instituteId: PRERNA_PILOT_INSTITUTE_ID,
    name: 'Indraprastha Main Campus (Demo)',
    city: 'Kota',
    address: 'Road No. 2, Indraprastha Industrial Area, Kota, Rajasthan (Demo)',
    phone: '+91-00000-00001',
    email: 'kota-branch@prerna-demo.invalid',
    isHeadquarters: true,
    createdAt: now
  };
  const jaipurBranch: Branch = {
    id: 'branch-prerna-jaipur',
    instituteId: PRERNA_PILOT_INSTITUTE_ID,
    name: 'Tonk Road Center (Demo)',
    city: 'Jaipur',
    address: 'Plot 18, Tonk Road, Near Gopalpura Flyover, Jaipur, Rajasthan (Demo)',
    phone: '+91-00000-00002',
    email: 'jaipur-branch@prerna-demo.invalid',
    isHeadquarters: false,
    createdAt: now
  };
  if (!db.getBranches(PRERNA_PILOT_INSTITUTE_ID).some(b => b.id === kotaBranch.id)) db.createBranch(kotaBranch);
  if (!db.getBranches(PRERNA_PILOT_INSTITUTE_ID).some(b => b.id === jaipurBranch.id)) db.createBranch(jaipurBranch);

  // 3. User Accounts with safe demo placeholders
  const salt = bcrypt.genSaltSync(10);
  const ownerUser: User = {
    id: 'user-prerna-owner',
    instituteId: PRERNA_PILOT_INSTITUTE_ID,
    name: 'Dr. Rajesh Verma (Demo Persona)',
    email: DEMO_PRERNA_OWNER_EMAIL,
    passwordHash: bcrypt.hashSync('PrernaPilot2026!', salt),
    role: 'INSTITUTE_OWNER',
    phone: '+91-00000-00010',
    isActive: true,
    createdAt: now
  };

  const sunitaCounselor: User = {
    id: 'user-prerna-counsellor-sunita',
    instituteId: PRERNA_PILOT_INSTITUTE_ID,
    branchId: 'branch-prerna-kota',
    name: 'Sunita Sharma (Demo Persona)',
    email: DEMO_PRERNA_COUNSELOR1_EMAIL,
    passwordHash: bcrypt.hashSync('PrernaCounselor2026!', salt),
    role: 'ADMISSION_COUNSELLOR',
    phone: '+91-00000-00011',
    isActive: true,
    createdAt: now
  };

  const vikramCounselor: User = {
    id: 'user-prerna-counsellor-vikram',
    instituteId: PRERNA_PILOT_INSTITUTE_ID,
    branchId: 'branch-prerna-jaipur',
    name: 'Vikram Rathore (Demo Persona)',
    email: DEMO_PRERNA_COUNSELOR2_EMAIL,
    passwordHash: bcrypt.hashSync('PrernaCounselor2026!', salt),
    role: 'ADMISSION_COUNSELLOR',
    phone: '+91-00000-00012',
    isActive: true,
    createdAt: now
  };

  if (!db.getUserByEmail(ownerUser.email)) db.createUser(ownerUser);
  if (!db.getUserByEmail(sunitaCounselor.email)) db.createUser(sunitaCounselor);
  if (!db.getUserByEmail(vikramCounselor.email)) db.createUser(vikramCounselor);

  // Synchronize existing users in DB to safe demo emails if they carried legacy emails
  const existingUsers = db.getUsers(PRERNA_PILOT_INSTITUTE_ID);
  existingUsers.forEach(u => {
    if (u.id === 'user-prerna-owner') {
      u.email = DEMO_PRERNA_OWNER_EMAIL;
      u.phone = '+91-00000-00010';
      u.name = 'Dr. Rajesh Verma (Demo Persona)';
    } else if (u.id === 'user-prerna-counsellor-sunita') {
      u.email = DEMO_PRERNA_COUNSELOR1_EMAIL;
      u.phone = '+91-00000-00011';
      u.name = 'Sunita Sharma (Demo Persona)';
    } else if (u.id === 'user-prerna-counsellor-vikram') {
      u.email = DEMO_PRERNA_COUNSELOR2_EMAIL;
      u.phone = '+91-00000-00012';
      u.name = 'Vikram Rathore (Demo Persona)';
    }
  });

  // 4. Courses
  const jeeCourse: Course = {
    id: 'course-prerna-jee-2yr',
    instituteId: PRERNA_PILOT_INSTITUTE_ID,
    name: 'Target IIT-JEE 2-Year Classroom Program (Class 11 to 12)',
    code: 'JEE-2YR-2027',
    category: 'Engineering / JEE',
    durationWeeks: 104,
    baseFee: 150000,
    minInstallmentFee: 45000,
    maxDiscountPct: 20,
    description: 'Comprehensive 2-year classroom preparation for JEE Main & JEE Advanced with Kota expert faculty.',
    eligibility: 'Class 10 completed with minimum 75% marks in Science & Mathematics.',
    isActive: true,
    createdAt: now
  };

  const neetCourse: Course = {
    id: 'course-prerna-neet-dropper',
    instituteId: PRERNA_PILOT_INSTITUTE_ID,
    name: 'NEET Achiever Dropper Batch 2026-27',
    code: 'NEET-ACH-2027',
    category: 'Medical / NEET',
    durationWeeks: 52,
    baseFee: 130000,
    minInstallmentFee: 40000,
    maxDiscountPct: 15,
    description: 'Dedicated 1-year intensive repeater program for NEET-UG aspirants with daily test series and NCERT focus.',
    eligibility: 'Class 12 pass with PCB minimum 50% aggregate.',
    isActive: true,
    createdAt: now
  };

  if (!db.getCourseById(jeeCourse.id)) db.createCourse(jeeCourse);
  if (!db.getCourseById(neetCourse.id)) db.createCourse(neetCourse);

  // 5. Batches
  const jeeKotaBatch: Batch = {
    id: 'batch-prerna-jee-kota-01',
    courseId: 'course-prerna-jee-2yr',
    instituteId: PRERNA_PILOT_INSTITUTE_ID,
    branchId: 'branch-prerna-kota',
    batchName: 'JEE 2027 Kota Morning Super-50',
    startDate: '2026-04-15',
    timings: '08:00 AM - 01:30 PM',
    daysOfWeek: 'Mon, Tue, Wed, Thu, Fri, Sat',
    maxSeats: 50,
    enrolledCount: 32,
    status: 'ENROLLING'
  };

  const neetJaipurBatch: Batch = {
    id: 'batch-prerna-neet-jaipur-01',
    courseId: 'course-prerna-neet-dropper',
    instituteId: PRERNA_PILOT_INSTITUTE_ID,
    branchId: 'branch-prerna-jaipur',
    batchName: 'NEET 2027 Jaipur FastTrack Batch',
    startDate: '2026-05-02',
    timings: '08:30 AM - 02:00 PM',
    daysOfWeek: 'Mon, Tue, Wed, Thu, Fri, Sat',
    maxSeats: 60,
    enrolledCount: 28,
    status: 'ENROLLING'
  };

  if (!db.getBatches(PRERNA_PILOT_INSTITUTE_ID).some(b => b.id === jeeKotaBatch.id)) db.createBatch(jeeKotaBatch);
  if (!db.getBatches(PRERNA_PILOT_INSTITUTE_ID).some(b => b.id === neetJaipurBatch.id)) db.createBatch(neetJaipurBatch);

  // 6. RAG Knowledge Document & Chunks
  const prospectusDocId = 'doc-prerna-prospectus-2026';
  const prospectusDoc: KnowledgeDocument = {
    id: prospectusDocId,
    instituteId: PRERNA_PILOT_INSTITUTE_ID,
    title: 'Prerna Career Institute Official Prospectus & Admission Rules 2026-27',
    fileType: 'application/pdf',
    rawContent: 'Official prospectus containing course fees, installment options, refund rules, hostel information, and scholarship criteria for 2026-27 academic session.',
    chunkCount: 4,
    status: 'INDEXED',
    createdAt: now
  };

  const chunks: DocumentChunk[] = [
    {
      id: 'chunk-prerna-001',
      documentId: prospectusDocId,
      instituteId: PRERNA_PILOT_INSTITUTE_ID,
      chunkIndex: 0,
      content: 'Course Fees and Payment Schedule: Target IIT-JEE 2-Year Program base fee is Rs 1,50,000 for Class 11 and 12 combined. Payment can be made in 3 equal installments: 1st installment Rs 60,000 at admission, 2nd installment Rs 50,000 within 90 days, 3rd installment Rs 40,000 within 180 days. NEET Achiever Dropper batch base fee is Rs 1,30,000 payable in 3 installments (Rs 50,000, Rs 45,000, Rs 35,000). A one-time non-refundable registration fee of Rs 5,000 is included in the total fee.',
      keywords: ['fee', 'fees', 'installment', 'cost', 'payment', 'jee', 'neet', 'registration']
    },
    {
      id: 'chunk-prerna-002',
      documentId: prospectusDocId,
      instituteId: PRERNA_PILOT_INSTITUTE_ID,
      chunkIndex: 1,
      content: 'Refund Policy: If a student wishes to withdraw admission, a written request must be submitted within 15 calendar days from the official batch commencement date. 100% of the tuition fee will be refunded after deducting an administrative processing fee of Rs 10,000. Under no circumstances will any fee refund request be entertained after 15 calendar days from the batch start date.',
      keywords: ['refund', 'moneyback', 'cancellation', 'withdraw', 'rules', 'policy']
    },
    {
      id: 'chunk-prerna-003',
      documentId: prospectusDocId,
      instituteId: PRERNA_PILOT_INSTITUTE_ID,
      chunkIndex: 2,
      content: 'Hostel and Mess Facilities: Prerna Career Institute has dedicated, verified partner hostels in Indraprastha Industrial Area Kota and Tonk Road Jaipur. Separate hostels are available for boys and girls with 24x7 security warden and CCTV surveillance. Monthly hostel fees range from Rs 9,000 to Rs 12,000 per month including twin-sharing air-conditioned room, 4 hygienic meals daily, Wi-Fi, and laundry service.',
      keywords: ['hostel', 'pg', 'food', 'mess', 'accommodation', 'stay', 'rooms', 'kota', 'jaipur']
    },
    {
      id: 'chunk-prerna-004',
      documentId: prospectusDocId,
      instituteId: PRERNA_PILOT_INSTITUTE_ID,
      chunkIndex: 3,
      content: 'Scholarships & Merit Waivers: Up to 90% tuition fee waiver is awarded based on performance in the Prerna Talent Search Exam (PTSE) conducted every Sunday. Direct 15% discount on tuition fee is granted to students securing above 95% in Class 10 or 12 board examinations. A sibling discount of 10% is available for siblings enrolled concurrently. Defence personnel children receive an exclusive 20% tuition concession.',
      keywords: ['scholarship', 'discount', 'waiver', 'ptse', 'merit', 'defence', 'sibling', 'concession']
    }
  ];

  if (!db.getKnowledgeDocs(PRERNA_PILOT_INSTITUTE_ID).some(d => d.id === prospectusDocId)) {
    db.addKnowledgeDoc(prospectusDoc, chunks);
  }

  return {
    institute: pilotInstitute,
    branches: [kotaBranch, jaipurBranch],
    users: [ownerUser, sunitaCounselor, vikramCounselor],
    courses: [jeeCourse, neetCourse],
    docs: [prospectusDoc],
    alreadySeeded: false
  };
}
