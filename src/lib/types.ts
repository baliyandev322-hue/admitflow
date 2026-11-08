export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'INSTITUTE_OWNER' 
  | 'BRANCH_MANAGER' 
  | 'ADMISSION_COUNSELLOR' 
  | 'SUPPORT_STAFF';

export type LeadStatus = 
  | 'NEW' 
  | 'CONTACTED' 
  | 'INTERESTED' 
  | 'COUNSELLING_SCHEDULED' 
  | 'TRIAL_CLASS' 
  | 'ADMISSION_CONFIRMED' 
  | 'LOST';

export type LeadSource = 
  | 'WEBSITE_CHAT' 
  | 'WHATSAPP' 
  | 'DIRECT_WALKIN' 
  | 'GOOGLE_ADS' 
  | 'META_ADS' 
  | 'REFERRAL' 
  | 'CALL';

export type SubscriptionTier = 'STARTER' | 'GROWTH' | 'PRO' | 'ENTERPRISE';

export interface Institute {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  website?: string;
  logoUrl?: string;
  aiTone: 'helpful_professional' | 'energetic' | 'academic' | 'friendly';
  welcomeMessage: string;
  currency: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  instituteId: string;
  name: string;
  city: string;
  address: string;
  phone?: string;
  email?: string;
  isHeadquarters: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  instituteId: string;
  branchId?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  instituteId: string;
  name: string;
  code: string;
  category: string;
  durationWeeks: number;
  baseFee: number;
  minInstallmentFee: number;
  maxDiscountPct: number;
  description: string;
  eligibility: string;
  isActive: boolean;
  createdAt: string;
}

export interface Batch {
  id: string;
  courseId: string;
  instituteId: string;
  branchId?: string;
  batchName: string;
  startDate: string;
  timings: string;
  daysOfWeek: string;
  maxSeats: number;
  enrolledCount: number;
  status: 'UPCOMING' | 'ENROLLING' | 'FULL' | 'IN_PROGRESS';
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  instituteId: string;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  keywords: string[];
}

export interface KnowledgeDocument {
  id: string;
  instituteId: string;
  title: string;
  fileType: string;
  rawContent: string;
  chunkCount: number;
  status: 'INDEXED' | 'PROCESSING' | 'ERROR';
  createdAt: string;
}

export interface Lead {
  id: string;
  instituteId: string;
  branchId?: string;
  assignedCounsellorId?: string;
  studentName: string;
  phone: string;
  email?: string;
  courseId?: string;
  status: LeadStatus;
  source: LeadSource;
  leadScore: number; // 0 - 100
  whatsappConsent?: boolean;
  whatsappConsentAt?: string;
  dropOffReason?: string;
  nextBestAction?: string;
  notes?: string;
  lastInteractionAt: string;
  nextFollowupAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = 
  | '10TH_MARKSHEET' 
  | '12TH_MARKSHEET' 
  | 'ID_PROOF' 
  | 'PHOTO' 
  | 'TRANSFER_CERTIFICATE' 
  | 'CATEGORY_CERTIFICATE';

export type DocumentReviewStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'MISSING';

export interface StudentDocument {
  id: string;
  instituteId: string;
  leadId: string;
  studentName: string;
  docType: DocumentType;
  fileName: string;
  fileSizeKb: number;
  mimeType: string;
  fileUrl?: string;
  status: DocumentReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface IntegrationSetting {
  id: string;
  instituteId: string;
  provider: 'GOOGLE_CALENDAR' | 'WHATSAPP_BUSINESS' | 'MCP_SERVER';
  status: 'ACTIVE' | 'PENDING_CONFIG' | 'ERROR' | 'DISCONNECTED';
  enabled: boolean;
  configData: Record<string, any>;
  lastSyncAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  instituteId: string;
  actorId?: string;
  actorType: 'AI_AGENT' | 'COUNSELLOR' | 'STUDENT' | 'SYSTEM';
  activityType: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Appointment {
  id: string;
  instituteId: string;
  branchId?: string;
  leadId: string;
  counsellorId?: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: 'ONLINE_MEET' | 'OFFLINE_CAMPUS';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW';
  meetingLink?: string;
  notes?: string;
  createdAt: string;
}

export interface Followup {
  id: string;
  instituteId: string;
  leadId: string;
  counsellorId?: string;
  dueDate: string;
  suggestedMessage: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'CALL';
  status: 'PENDING' | 'APPROVED' | 'SENT' | 'REJECTED' | 'CANCELLED';
  isOverdue: boolean;
  approvedBy?: string;
  createdAt: string;
}

export interface AgentExecution {
  id: string;
  instituteId: string;
  skillName: string;
  triggeredBy: string;
  inputPayload: Record<string, any>;
  outputPayload?: Record<string, any>;
  status: 'SUCCESS' | 'FAILED' | 'ESCALATED';
  executionTimeMs: number;
  errorMessage?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  instituteId: string;
  tier: SubscriptionTier;
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED';
  leadsUsed: number;
  leadsQuota: number;
  ragQueriesUsed: number;
  ragQueriesQuota: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

// ==========================================
// Internal B2B Sales & Pilot Tracking Types
// ==========================================

export type SalesStage = 
  | 'PROSPECT_IDENTIFIED'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'DEMO_SCHEDULED'
  | 'DEMO_COMPLETED'
  | 'PILOT_PROPOSED'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export type SalesProspectCategory = 
  | 'IIT_JEE_NEET' 
  | 'CODING_ACADEMY' 
  | 'CIVIL_SERVICES' 
  | 'COMMERCE_CA' 
  | 'K12_TUITION' 
  | 'OTHER';

export interface SalesProspect {
  id: string;
  instituteName: string;
  city: string;
  website?: string;
  contactPerson: string;
  email: string;
  phone: string;
  category: SalesProspectCategory;
  branchCount: number;
  mainProblem: string;
  stage: SalesStage;
  lastContactDate?: string;
  nextFollowupDate?: string;
  notes?: string;
  dealValueEstimated?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalesActivity {
  id: string;
  prospectId: string;
  activityType: 'CALL' | 'EMAIL' | 'DEMO' | 'MEETING' | 'NOTE' | 'STAGE_CHANGE';
  outcome?: string;
  notes: string;
  performedBy: string;
  createdAt: string;
}

export interface PilotIssue {
  id: string;
  issue: string;
  severity: 'P0' | 'P1' | 'P2';
  resolved: boolean;
  createdAt: string;
}

export interface PilotTrackingRecord {
  id: string;
  instituteId: string;
  instituteName: string;
  ownerAcceptanceStatus: 'PENDING_SIGN_OFF' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  authorizationConfirmed: boolean;
  widgetInstallationApproved: boolean;
  pilotStartDate?: string;
  pilotEndDate?: string;
  demoStatus: 'NOT_SCHEDULED' | 'SCHEDULED' | 'COMPLETED';
  technicalIssues: PilotIssue[];
  counselorFeedback: string;
  ownerFeedback: string;
  paidConversionStatus: 'PILOT_ACTIVE' | 'NEGOTIATION' | 'CONVERTED_PAID' | 'DROPPED';
  proposedTier: 'STARTER' | 'GROWTH' | 'PRO';
  isDemoTenant?: boolean;
  tenantClassification?: 'UNVERIFIED_DEMO_TENANT' | 'VERIFIED_PILOT' | 'COMMERCIAL_CUSTOMER';
  updatedAt: string;
}

