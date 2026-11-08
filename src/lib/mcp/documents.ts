import { db } from '../db';
import { StudentDocument, DocumentType, DocumentReviewStatus } from '../types';

export interface DocumentCompletenessReport {
  leadId: string;
  studentName: string;
  totalRequired: number;
  submittedCount: number;
  verifiedCount: number;
  missingCount: number;
  isComplete: boolean;
  completenessPercentage: number;
  submittedDocuments: StudentDocument[];
  missingDocuments: DocumentType[];
  regulatoryNotice: string;
}

export class StudentDocumentWorkflow {
  private instituteId: string;

  // Standard admission requirements for Indian coaching institutes
  private static MANDATORY_DOCS: DocumentType[] = [
    '10TH_MARKSHEET',
    'PHOTO',
    'ID_PROOF'
  ];

  constructor(instituteId: string) {
    this.instituteId = instituteId;
  }

  /**
   * 1. list_student_documents
   */
  public listDocuments(leadId: string): { success: boolean; documents: StudentDocument[] } {
    const docs = db.getStudentDocuments(this.instituteId, leadId);
    return {
      success: true,
      documents: docs
    };
  }

  /**
   * 2. get_document_status
   */
  public getDocumentStatus(documentId: string): { success: boolean; document?: StudentDocument; error?: string } {
    const all = db.getStudentDocuments(this.instituteId);
    const doc = all.find(d => d.id === documentId);
    if (!doc) {
      return { success: false, error: 'Document not found or belongs to another institute' };
    }
    return { success: true, document: doc };
  }

  /**
   * 3. check_application_completeness
   */
  public checkCompleteness(leadId: string): DocumentCompletenessReport {
    const lead = db.getLeadById(leadId);
    if (!lead || lead.instituteId !== this.instituteId) {
      throw new Error('Student lead not found in this institute');
    }

    const docs = db.getStudentDocuments(this.instituteId, leadId);
    
    // Determine required docs based on course
    const requiredDocs = [...StudentDocumentWorkflow.MANDATORY_DOCS];
    if (lead.courseId?.includes('target') || lead.courseId?.includes('achiever') || lead.courseId?.includes('dropper')) {
      requiredDocs.push('12TH_MARKSHEET');
    }

    const submittedTypes = new Set(docs.map(d => d.docType));
    const missingDocs = requiredDocs.filter(req => !submittedTypes.has(req));

    const verifiedDocs = docs.filter(d => d.status === 'VERIFIED');
    const completenessPct = Math.round(((requiredDocs.length - missingDocs.length) / requiredDocs.length) * 100);

    return {
      leadId,
      studentName: lead.studentName,
      totalRequired: requiredDocs.length,
      submittedCount: docs.length,
      verifiedCount: verifiedDocs.length,
      missingCount: missingDocs.length,
      isComplete: missingDocs.length === 0,
      completenessPercentage: completenessPct,
      submittedDocuments: docs,
      missingDocuments: missingDocs,
      regulatoryNotice: 'AdmitFlow AI records application file completeness for institute admission processing. Authenticity of government identity documents must be independently verified via sanctioned verification channels.'
    };
  }

  /**
   * 4. request_missing_document
   */
  public requestMissingDocument(leadId: string, docType: DocumentType, notes?: string): {
    success: boolean;
    leadId: string;
    requestedDoc: DocumentType;
    followupCreated: boolean;
    message: string;
  } {
    const lead = db.getLeadById(leadId);
    if (!lead || lead.instituteId !== this.instituteId) {
      throw new Error('Student lead not found in this institute');
    }

    const readableType = docType.replace(/_/g, ' ').toLowerCase();
    const suggestedMsg = `Dear ${lead.studentName}, your admission file is missing your ${readableType}. Please upload or submit a clear copy to ensure uninterrupted seat confirmation.`;

    db.createFollowup({
      id: `fol-doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      instituteId: this.instituteId,
      leadId,
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      suggestedMessage: suggestedMsg,
      channel: 'WHATSAPP',
      status: 'PENDING',
      isOverdue: false,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      leadId,
      requestedDoc: docType,
      followupCreated: true,
      message: `Follow-up request queued for ${readableType}`
    };
  }

  /**
   * 5. update_document_review_status
   */
  public updateReviewStatus(
    documentId: string, 
    status: DocumentReviewStatus, 
    reviewedBy: string, 
    notes?: string
  ): { success: boolean; document?: StudentDocument; error?: string } {
    const updated = db.updateStudentDocument(documentId, {
      status,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
      notes
    });

    if (!updated || updated.instituteId !== this.instituteId) {
      return { success: false, error: 'Document update failed or document not found' };
    }

    return { success: true, document: updated };
  }
}
