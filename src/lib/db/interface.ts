import { 
  Institute, Branch, User, Course, Batch, 
  KnowledgeDocument, DocumentChunk, Lead, 
  LeadActivity, Appointment, Followup, 
  AgentExecution, Subscription, StudentDocument, IntegrationSetting,
  SalesProspect, SalesActivity, PilotTrackingRecord
} from '../types';

export interface IDatabase {
  // Institutes
  getInstitutes(): Institute[];
  getInstituteById(id: string): Institute | undefined;
  getInstituteBySlug(slug: string): Institute | undefined;
  createInstitute(inst: Institute): Institute;
  updateInstitute(id: string, updates: Partial<Institute>): Institute | null;

  // Branches
  getBranches(instituteId: string): Branch[];
  createBranch(branch: Branch): Branch;

  // Users
  getUsers(instituteId?: string): User[];
  getUserByEmail(email: string): User | undefined;
  getUserById(id: string): User | undefined;
  createUser(user: User): User;

  // Courses & Batches
  getCourses(instituteId: string): Course[];
  getCourseById(id: string): Course | undefined;
  createCourse(course: Course): Course;
  getBatches(instituteId: string, courseId?: string): Batch[];
  createBatch(batch: Batch): Batch;

  // Leads CRM
  getLeads(instituteId: string): Lead[];
  getLeadById(id: string): Lead | undefined;
  findLeadByPhone(instituteId: string, phone: string): Lead | undefined;
  createLead(lead: Lead): Lead;
  updateLead(id: string, updates: Partial<Lead>): Lead | null;

  // Lead Activities
  getLeadActivities(leadId: string): LeadActivity[];
  addLeadActivity(activity: LeadActivity): LeadActivity;

  // Knowledge RAG
  getKnowledgeDocs(instituteId: string): KnowledgeDocument[];
  addKnowledgeDoc(doc: KnowledgeDocument, chunks: DocumentChunk[]): KnowledgeDocument;
  deleteKnowledgeDoc(docId: string, instituteId: string): boolean;
  getChunksForInstitute(instituteId: string): DocumentChunk[];

  // Appointments
  getAppointments(instituteId: string): Appointment[];
  createAppointment(apt: Appointment): Appointment;
  updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null;

  // Followups
  getFollowups(instituteId: string): Followup[];
  createFollowup(f: Followup): Followup;
  updateFollowup(id: string, updates: Partial<Followup>): Followup | null;

  // Student Documents Workflow
  getStudentDocuments(instituteId: string, leadId?: string): StudentDocument[];
  addStudentDocument(doc: StudentDocument): StudentDocument;
  updateStudentDocument(id: string, updates: Partial<StudentDocument>): StudentDocument | null;

  // Integration Settings
  getIntegrationSettings(instituteId: string): IntegrationSetting[];
  updateIntegrationSetting(
    instituteId: string, 
    provider: 'GOOGLE_CALENDAR' | 'WHATSAPP_BUSINESS' | 'MCP_SERVER', 
    updates: Partial<IntegrationSetting>
  ): IntegrationSetting;

  // Agent Executions
  logAgentExecution(exec: AgentExecution): AgentExecution;
  getAgentExecutions(instituteId: string): AgentExecution[];

  // Subscriptions
  getSubscription(instituteId: string): Subscription | undefined;
  updateSubscription(instituteId: string, updates: Partial<Subscription>): Subscription | null;

  // Internal B2B Sales Prospects
  getSalesProspects(): SalesProspect[];
  getSalesProspectById(id: string): SalesProspect | undefined;
  createSalesProspect(prospect: SalesProspect): SalesProspect;
  updateSalesProspect(id: string, updates: Partial<SalesProspect>): SalesProspect | null;
  deleteSalesProspect(id: string): boolean;

  // Sales Activities
  getSalesActivities(prospectId: string): SalesActivity[];
  addSalesActivity(act: SalesActivity): SalesActivity;

  // Pilot Tracking
  getPilotTracking(instituteId: string): PilotTrackingRecord | undefined;
  upsertPilotTracking(record: PilotTrackingRecord): PilotTrackingRecord;

  // Raw data access for specialized tools
  getData(): any;
  persist(): void;
}
