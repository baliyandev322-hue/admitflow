import { z } from 'zod';
import { db } from '../db';
import { AgentOrchestrator } from '../agent';
import { searchKnowledgeBrain } from '../rag';
import { GoogleCalendarConnector } from './calendar';
import { WhatsAppBusinessConnector } from './whatsapp';
import { StudentDocumentWorkflow } from './documents';

export interface McpToolDefinition {
  name: string;
  description: string;
  category: 'CRM' | 'COUNSELLING' | 'FOLLOWUP' | 'KNOWLEDGE' | 'ANALYTICS' | 'CALENDAR' | 'WHATSAPP' | 'DOCUMENTS';
  readOnly: boolean;
  requiresApproval: boolean;
  requiredRole: 'STUDENT' | 'COUNSELLOR' | 'ADMIN';
  schema: z.ZodObject<any>;
  execute: (instituteId: string, args: any, actor?: { id: string; role: string }) => Promise<any>;
}

export function createToolRegistry(): Record<string, McpToolDefinition> {
  const tools: Record<string, McpToolDefinition> = {};

  function register(def: McpToolDefinition) {
    tools[def.name] = def;
  }

  // ==========================================
  // CRM TOOLS
  // ==========================================

  register({
    name: 'create_lead',
    description: 'Create a new admission lead in the institute CRM database with automatic deduplication.',
    category: 'CRM',
    readOnly: false,
    requiresApproval: false,
    requiredRole: 'STUDENT',
    schema: z.object({
      studentName: z.string().min(2).describe('Full name of the student'),
      phone: z.string().min(10).describe('10-digit Indian phone number'),
      email: z.string().email().optional().describe('Email address'),
      courseNameOrId: z.string().optional().describe('Course name or ID of interest'),
      branchId: z.string().optional().describe('Branch ID'),
      source: z.string().optional().describe('Lead source e.g. WEBSITE_CHAT, WHATSAPP_BOT'),
      notes: z.string().optional().describe('Additional enquiry notes')
    }),
    execute: async (instituteId, args) => {
      const agent = new AgentOrchestrator(instituteId);
      const res = await agent.create_lead(args);
      return res.data;
    }
  });

  register({
    name: 'get_lead',
    description: 'Retrieve detailed student lead information, status, score and timeline by Lead ID.',
    category: 'CRM',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      leadId: z.string().describe('Unique ID of the lead')
    }),
    execute: async (instituteId, args) => {
      const lead = db.getLeadById(args.leadId);
      if (!lead || lead.instituteId !== instituteId) {
        throw new Error(`Lead ${args.leadId} not found in this institute.`);
      }
      const activities = db.getLeadActivities(args.leadId);
      return { lead, activities };
    }
  });

  register({
    name: 'update_lead',
    description: 'Update student lead details, CRM funnel status, or lead score.',
    category: 'CRM',
    readOnly: false,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      leadId: z.string().describe('Unique ID of the lead'),
      status: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'COUNSELLING_SCHEDULED', 'TRIAL_CLASS', 'ADMISSION_CONFIRMED', 'LOST']).optional(),
      leadScore: z.number().min(0).max(100).optional(),
      notes: z.string().optional(),
      dropOffReason: z.string().optional()
    }),
    execute: async (instituteId, args) => {
      const existing = db.getLeadById(args.leadId);
      if (!existing || existing.instituteId !== instituteId) {
        throw new Error(`Lead ${args.leadId} not found in this institute.`);
      }
      const { leadId, ...updates } = args;
      const updated = db.updateLead(leadId, updates);
      return updated;
    }
  });

  register({
    name: 'list_leads',
    description: 'List and filter institute admission leads by funnel status or branch.',
    category: 'CRM',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      status: z.string().optional().describe('Filter by status e.g. NEW, ENGAGED'),
      branchId: z.string().optional().describe('Filter by branch ID'),
      limit: z.number().min(1).max(100).optional().default(20)
    }),
    execute: async (instituteId, args) => {
      let leads = db.getLeads(instituteId);
      if (args.status) leads = leads.filter(l => l.status === args.status);
      if (args.branchId) leads = leads.filter(l => l.branchId === args.branchId);
      return leads.slice(0, args.limit || 20);
    }
  });

  register({
    name: 'add_lead_activity',
    description: 'Record a student interaction note, call log, or milestone activity on the CRM lead timeline.',
    category: 'CRM',
    readOnly: false,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      leadId: z.string().describe('ID of the lead'),
      activityType: z.string().describe('e.g. COUNSELLOR_CALL, VISIT_LOGGED, CHAT_NOTE'),
      description: z.string().describe('Summary of the activity'),
      metadata: z.record(z.string(), z.any()).optional()
    }),
    execute: async (instituteId, args, actor) => {
      const lead = db.getLeadById(args.leadId);
      if (!lead || lead.instituteId !== instituteId) {
        throw new Error(`Lead ${args.leadId} not found in this institute.`);
      }
      const act = db.addLeadActivity({
        id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        leadId: args.leadId,
        instituteId,
        actorId: actor?.id || 'agent-mcp',
        actorType: 'AI_AGENT',
        activityType: args.activityType,
        description: args.description,
        metadata: args.metadata,
        createdAt: new Date().toISOString()
      });
      return act;
    }
  });

  // ==========================================
  // COUNSELLING TOOLS
  // ==========================================

  register({
    name: 'check_available_slots',
    description: 'Check available 30-minute counselling slots for a given target date without conflict.',
    category: 'COUNSELLING',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'STUDENT',
    schema: z.object({
      dateStr: z.string().describe('Target date in YYYY-MM-DD format e.g. 2026-11-20'),
      branchId: z.string().optional().describe('Branch ID')
    }),
    execute: async (instituteId, args) => {
      const targetDate = args.dateStr;
      const appointments = db.getAppointments(instituteId).filter(a => a.status !== 'CANCELLED');
      const standardHours = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
      const slots = standardHours.map(hour => {
        const slotIso = `${targetDate}T${hour}:00.000Z`;
        const isBooked = appointments.some(a => a.scheduledAt.startsWith(`${targetDate}T${hour}`));
        return {
          slotIso,
          timeLabel: `${hour}`,
          isAvailable: !isBooked
        };
      });
      return {
        date: targetDate,
        totalSlots: slots.length,
        availableSlots: slots.filter(s => s.isAvailable)
      };
    }
  });

  register({
    name: 'create_appointment',
    description: 'Book a confirmed 1-on-1 career or admission counselling appointment.',
    category: 'COUNSELLING',
    readOnly: false,
    requiresApproval: false,
    requiredRole: 'STUDENT',
    schema: z.object({
      leadId: z.string().describe('ID of the student lead'),
      slotIso: z.string().describe('Appointment start time in ISO-8601 format'),
      mode: z.enum(['ONLINE_MEET', 'OFFLINE_CAMPUS']).optional().default('ONLINE_MEET'),
      branchId: z.string().optional(),
      notes: z.string().optional()
    }),
    execute: async (instituteId, args) => {
      const agent = new AgentOrchestrator(instituteId);
      const res = await agent.schedule_counselling({
        leadId: args.leadId,
        scheduledAt: args.slotIso,
        mode: args.mode,
        branchId: args.branchId
      });
      if (!res.success) throw new Error(res.message);
      return res.data;
    }
  });

  register({
    name: 'reschedule_appointment',
    description: 'Reschedule an existing counselling appointment to a new open time slot.',
    category: 'COUNSELLING',
    readOnly: false,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      appointmentId: z.string().describe('ID of the appointment to reschedule'),
      newSlotIso: z.string().describe('New ISO-8601 time slot')
    }),
    execute: async (instituteId, args) => {
      const appointments = db.getAppointments(instituteId);
      const apt = appointments.find(a => a.id === args.appointmentId);
      if (!apt) throw new Error(`Appointment ${args.appointmentId} not found in this institute.`);

      // Conflict check
      const conflict = appointments.find(a => a.id !== args.appointmentId && a.scheduledAt === args.newSlotIso && a.status !== 'CANCELLED');
      if (conflict) throw new Error('Target slot is already booked.');

      const updated = db.updateAppointment(args.appointmentId, {
        scheduledAt: args.newSlotIso,
        status: 'RESCHEDULED'
      });
      return updated;
    }
  });

  register({
    name: 'cancel_appointment',
    description: 'Cancel a scheduled counselling session (High-impact action requiring human confirmation).',
    category: 'COUNSELLING',
    readOnly: false,
    requiresApproval: true,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      appointmentId: z.string().describe('ID of the appointment to cancel'),
      reason: z.string().describe('Reason for cancellation')
    }),
    execute: async (instituteId, args) => {
      const appointments = db.getAppointments(instituteId);
      const apt = appointments.find(a => a.id === args.appointmentId);
      if (!apt) throw new Error(`Appointment ${args.appointmentId} not found.`);

      const updated = db.updateAppointment(args.appointmentId, {
        status: 'CANCELLED',
        notes: (apt.notes || '') + ` | Cancelled: ${args.reason}`
      });
      return { success: true, appointment: updated, requiresApproval: true };
    }
  });

  // ==========================================
  // FOLLOW-UP TOOLS
  // ==========================================

  register({
    name: 'create_followup',
    description: 'Schedule a smart follow-up message into the human-counsellor approval queue.',
    category: 'FOLLOWUP',
    readOnly: false,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      leadId: z.string().describe('Lead ID'),
      suggestedMessage: z.string().describe('Proposed follow-up message'),
      dueDate: z.string().describe('Follow-up trigger date ISO format'),
      channel: z.enum(['WHATSAPP', 'SMS', 'EMAIL', 'CALL']).optional().default('WHATSAPP')
    }),
    execute: async (instituteId, args) => {
      const lead = db.getLeadById(args.leadId);
      if (!lead || lead.instituteId !== instituteId) throw new Error(`Lead ${args.leadId} not found.`);

      const f = db.createFollowup({
        id: `fol-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        instituteId,
        leadId: args.leadId,
        dueDate: args.dueDate,
        suggestedMessage: args.suggestedMessage,
        channel: args.channel || 'WHATSAPP',
        status: 'PENDING',
        isOverdue: false,
        createdAt: new Date().toISOString()
      });
      return f;
    }
  });

  register({
    name: 'get_pending_followups',
    description: 'Retrieve all follow-ups awaiting counselor approval or dispatch.',
    category: 'FOLLOWUP',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      overdueOnly: z.boolean().optional().default(false)
    }),
    execute: async (instituteId, args) => {
      let followups = db.getFollowups(instituteId).filter(f => f.status === 'PENDING');
      if (args.overdueOnly) followups = followups.filter(f => f.isOverdue);
      return followups;
    }
  });

  register({
    name: 'update_followup_status',
    description: 'Approve, reject, or mark a follow-up message as sent.',
    category: 'FOLLOWUP',
    readOnly: false,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      followupId: z.string().describe('ID of the follow-up'),
      status: z.enum(['APPROVED', 'REJECTED', 'SENT', 'CANCELLED']),
      counsellorId: z.string().optional()
    }),
    execute: async (instituteId, args) => {
      const updated = db.updateFollowup(args.followupId, {
        status: args.status,
        approvedBy: args.counsellorId
      });
      if (!updated) throw new Error(`Follow-up ${args.followupId} not found.`);
      return updated;
    }
  });

  // ==========================================
  // KNOWLEDGE TOOLS
  // ==========================================

  register({
    name: 'search_institute_knowledge',
    description: 'Semantic & keyword hybrid RAG search against institute prospectus, policies, and brochures.',
    category: 'KNOWLEDGE',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'STUDENT',
    schema: z.object({
      query: z.string().min(2).describe('Search query from student or parent'),
      topK: z.number().min(1).max(5).optional().default(3)
    }),
    execute: async (instituteId, args) => {
      const results = await searchKnowledgeBrain(args.query, instituteId, args.topK || 3);
      return results.map(r => ({
        documentTitle: r.documentTitle,
        chunkContent: r.chunk.content,
        similarityScore: r.score
      }));
    }
  });

  register({
    name: 'get_course_information',
    description: 'Get verified details of all active academic courses and fee structures offered by the institute.',
    category: 'KNOWLEDGE',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'STUDENT',
    schema: z.object({
      courseId: z.string().optional().describe('Specific course ID or empty for all')
    }),
    execute: async (instituteId, args) => {
      const courses = db.getCourses(instituteId);
      if (args.courseId) {
        const c = courses.find(item => item.id === args.courseId);
        if (!c) throw new Error(`Course ${args.courseId} not found.`);
        return c;
      }
      return courses;
    }
  });

  register({
    name: 'get_fee_information',
    description: 'Get ground-truth base fees, installment structures, and maximum scholarship discount rules.',
    category: 'KNOWLEDGE',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'STUDENT',
    schema: z.object({
      courseNameOrCode: z.string().describe('Name or code of the course e.g. JEE, NEET')
    }),
    execute: async (instituteId, args) => {
      const courses = db.getCourses(instituteId);
      const query = args.courseNameOrCode.toLowerCase();
      const matched = courses.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.code.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
      );
      return matched.map(c => ({
        courseId: c.id,
        courseName: c.name,
        code: c.code,
        baseFee: c.baseFee,
        minInstallmentFee: c.minInstallmentFee,
        maxDiscountPct: c.maxDiscountPct,
        durationWeeks: c.durationWeeks
      }));
    }
  });

  register({
    name: 'get_batch_information',
    description: 'Retrieve available batch dates, timings, days, and enrolled seats.',
    category: 'KNOWLEDGE',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'STUDENT',
    schema: z.object({
      courseId: z.string().optional()
    }),
    execute: async (instituteId, args) => {
      const batches = db.getBatches(instituteId, args.courseId);
      return batches.map(b => ({
        batchId: b.id,
        batchName: b.batchName,
        startDate: b.startDate,
        timings: b.timings,
        daysOfWeek: b.daysOfWeek,
        availableSeats: b.maxSeats - b.enrolledCount,
        status: b.status
      }));
    }
  });

  // ==========================================
  // ANALYTICS TOOLS
  // ==========================================

  register({
    name: 'get_admission_statistics',
    description: 'Retrieve real-time admission metrics, total leads, conversion percentage, and pipeline status breakdown.',
    category: 'ANALYTICS',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      branchId: z.string().optional()
    }),
    execute: async (instituteId, args) => {
      let leads = db.getLeads(instituteId);
      if (args.branchId) leads = leads.filter(l => l.branchId === args.branchId);

      const enrolled = leads.filter(l => l.status === 'ADMISSION_CONFIRMED').length;
      const scheduled = leads.filter(l => l.status === 'COUNSELLING_SCHEDULED').length;
      const conversionRate = leads.length > 0 ? Math.round((enrolled / leads.length) * 100) : 0;

      return {
        totalLeads: leads.length,
        enrolledCount: enrolled,
        counsellingScheduledCount: scheduled,
        conversionRatePercent: conversionRate,
        statusDistribution: {
          NEW: leads.filter(l => l.status === 'NEW').length,
          CONTACTED: leads.filter(l => l.status === 'CONTACTED').length,
          INTERESTED: leads.filter(l => l.status === 'INTERESTED').length,
          COUNSELLING_SCHEDULED: scheduled,
          TRIAL_CLASS: leads.filter(l => l.status === 'TRIAL_CLASS').length,
          ADMISSION_CONFIRMED: enrolled,
          LOST: leads.filter(l => l.status === 'LOST').length,
        }
      };
    }
  });

  register({
    name: 'get_lead_conversion_report',
    description: 'Get lead funnel conversion report segmented by acquisition source.',
    category: 'ANALYTICS',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({}),
    execute: async (instituteId) => {
      const leads = db.getLeads(instituteId);
      const sourceMap: Record<string, { total: number; enrolled: number }> = {};
      leads.forEach(l => {
        sourceMap[l.source] = sourceMap[l.source] || { total: 0, enrolled: 0 };
        sourceMap[l.source].total++;
        if (l.status === 'ADMISSION_CONFIRMED') sourceMap[l.source].enrolled++;
      });
      return sourceMap;
    }
  });

  register({
    name: 'get_branch_performance',
    description: 'Compare lead volumes, conversion rates, and revenue across physical branch campuses.',
    category: 'ANALYTICS',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'ADMIN',
    schema: z.object({}),
    execute: async (instituteId) => {
      const branches = db.getBranches(instituteId);
      const leads = db.getLeads(instituteId);
      return branches.map(b => {
        const branchLeads = leads.filter(l => l.branchId === b.id);
        const enrolled = branchLeads.filter(l => l.status === 'ADMISSION_CONFIRMED').length;
        return {
          branchId: b.id,
          branchName: b.name,
          city: b.city,
          totalLeads: branchLeads.length,
          enrolledCount: enrolled,
          conversionRate: branchLeads.length > 0 ? Math.round((enrolled / branchLeads.length) * 100) : 0
        };
      });
    }
  });

  // ==========================================
  // GOOGLE CALENDAR TOOLS
  // ==========================================

  register({
    name: 'calendar_list_events',
    description: 'Fetch upcoming events from connected Google Calendar / AdmitFlow counsellor schedule.',
    category: 'CALENDAR',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      timeMin: z.string().optional().describe('Filter start date ISO string'),
      timeMax: z.string().optional().describe('Filter end date ISO string')
    }),
    execute: async (instituteId, args) => {
      const connector = new GoogleCalendarConnector(instituteId);
      return await connector.listEvents(args.timeMin, args.timeMax);
    }
  });

  register({
    name: 'calendar_check_availability',
    description: 'Check Google Calendar for conflicting counsellor meetings during a requested slot.',
    category: 'CALENDAR',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'STUDENT',
    schema: z.object({
      startTime: z.string().describe('Slot start ISO string e.g. 2026-11-20T10:00:00Z'),
      endTime: z.string().describe('Slot end ISO string e.g. 2026-11-20T10:30:00Z')
    }),
    execute: async (instituteId, args) => {
      const connector = new GoogleCalendarConnector(instituteId);
      return await connector.checkAvailability({ startTime: args.startTime, endTime: args.endTime });
    }
  });

  register({
    name: 'calendar_create_event',
    description: 'Create an admission counselling appointment on Google Calendar with Google Meet link.',
    category: 'CALENDAR',
    readOnly: false,
    requiresApproval: false,
    requiredRole: 'STUDENT',
    schema: z.object({
      summary: z.string().describe('Event title'),
      description: z.string().optional(),
      startTime: z.string().describe('Start ISO string'),
      endTime: z.string().describe('End ISO string'),
      attendeeEmail: z.string().optional(),
      attendeeName: z.string().optional()
    }),
    execute: async (instituteId, args) => {
      const connector = new GoogleCalendarConnector(instituteId);
      return await connector.createEvent(args);
    }
  });

  register({
    name: 'calendar_update_event',
    description: 'Update the details or timing of an existing calendar event.',
    category: 'CALENDAR',
    readOnly: false,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      eventId: z.string().describe('ID of the calendar event'),
      summary: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional()
    }),
    execute: async (instituteId, args) => {
      const connector = new GoogleCalendarConnector(instituteId);
      const { eventId, ...updates } = args;
      return await connector.updateEvent(eventId, updates);
    }
  });

  register({
    name: 'calendar_cancel_event',
    description: 'Cancel a Google Calendar appointment (High-impact action: flags human confirmation).',
    category: 'CALENDAR',
    readOnly: false,
    requiresApproval: true,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      eventId: z.string().describe('ID of the calendar event to cancel'),
      reason: z.string().optional()
    }),
    execute: async (instituteId, args) => {
      const connector = new GoogleCalendarConnector(instituteId);
      return await connector.cancelEvent(args.eventId, args.reason);
    }
  });

  // ==========================================
  // WHATSAPP BUSINESS TOOLS
  // ==========================================

  register({
    name: 'whatsapp_get_templates',
    description: 'Get verified Meta-approved WhatsApp Business message templates with parameter schemas.',
    category: 'WHATSAPP',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({}),
    execute: async (instituteId) => {
      const connector = new WhatsAppBusinessConnector(instituteId);
      return await connector.getTemplates();
    }
  });

  register({
    name: 'whatsapp_prepare_message',
    description: 'Prepare and validate WhatsApp template variables before sending to student.',
    category: 'WHATSAPP',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'STUDENT',
    schema: z.object({
      templateName: z.string().describe('Meta template name'),
      parameters: z.record(z.string(), z.string()).describe('Key-value map of parameter placeholders')
    }),
    execute: async (instituteId, args) => {
      const connector = new WhatsAppBusinessConnector(instituteId);
      return connector.prepareMessage(args.templateName, args.parameters);
    }
  });

  register({
    name: 'whatsapp_send_approved_template',
    description: 'Send approved WhatsApp Business template message with student opt-in consent verification.',
    category: 'WHATSAPP',
    readOnly: false,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      toPhone: z.string().describe('10-digit Indian phone number with country code'),
      templateName: z.string().describe('Approved template name'),
      parameters: z.record(z.string(), z.string()).describe('Template parameters'),
      leadId: z.string().optional()
    }),
    execute: async (instituteId, args) => {
      const connector = new WhatsAppBusinessConnector(instituteId);
      return await connector.sendApprovedTemplate(args);
    }
  });

  register({
    name: 'whatsapp_get_message_status',
    description: 'Check WhatsApp message delivery and read receipt status.',
    category: 'WHATSAPP',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      messageId: z.string().describe('Meta or AdmitFlow message ID')
    }),
    execute: async (instituteId, args) => {
      const connector = new WhatsAppBusinessConnector(instituteId);
      return await connector.getMessageStatus(args.messageId);
    }
  });

  // ==========================================
  // STUDENT DOCUMENT WORKFLOW TOOLS
  // ==========================================

  register({
    name: 'list_student_documents',
    description: 'List all application documents submitted by a student for admission review.',
    category: 'DOCUMENTS',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      leadId: z.string().describe('ID of the student lead')
    }),
    execute: async (instituteId, args) => {
      const workflow = new StudentDocumentWorkflow(instituteId);
      return workflow.listDocuments(args.leadId);
    }
  });

  register({
    name: 'get_document_status',
    description: 'Retrieve review status and metadata for a specific uploaded student document.',
    category: 'DOCUMENTS',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      documentId: z.string().describe('Document ID')
    }),
    execute: async (instituteId, args) => {
      const workflow = new StudentDocumentWorkflow(instituteId);
      return workflow.getDocumentStatus(args.documentId);
    }
  });

  register({
    name: 'check_application_completeness',
    description: 'Check admission application file completeness and calculate missing document percentage.',
    category: 'DOCUMENTS',
    readOnly: true,
    requiresApproval: false,
    requiredRole: 'STUDENT',
    schema: z.object({
      leadId: z.string().describe('ID of the student lead')
    }),
    execute: async (instituteId, args) => {
      const workflow = new StudentDocumentWorkflow(instituteId);
      return workflow.checkCompleteness(args.leadId);
    }
  });

  register({
    name: 'request_missing_document',
    description: 'Automatically queue a document upload reminder follow-up for missing student documents.',
    category: 'DOCUMENTS',
    readOnly: false,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      leadId: z.string().describe('ID of the student lead'),
      docType: z.enum(['10TH_MARKSHEET', '12TH_MARKSHEET', 'ID_PROOF', 'PHOTO', 'TRANSFER_CERTIFICATE', 'CATEGORY_CERTIFICATE']),
      notes: z.string().optional()
    }),
    execute: async (instituteId, args) => {
      const workflow = new StudentDocumentWorkflow(instituteId);
      return workflow.requestMissingDocument(args.leadId, args.docType, args.notes);
    }
  });

  register({
    name: 'update_document_review_status',
    description: 'Staff review action to mark a submitted document as VERIFIED or REJECTED.',
    category: 'DOCUMENTS',
    readOnly: false,
    requiresApproval: false,
    requiredRole: 'COUNSELLOR',
    schema: z.object({
      documentId: z.string().describe('Document ID'),
      status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'MISSING']),
      reviewedBy: z.string().optional().default('admitflow-staff'),
      notes: z.string().optional()
    }),
    execute: async (instituteId, args) => {
      const workflow = new StudentDocumentWorkflow(instituteId);
      return workflow.updateReviewStatus(args.documentId, args.status, args.reviewedBy, args.notes);
    }
  });

  return tools;
}

export const toolRegistry = createToolRegistry();
