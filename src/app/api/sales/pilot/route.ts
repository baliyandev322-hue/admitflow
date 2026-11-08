import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isSuperAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { PRERNA_PILOT_INSTITUTE_ID, seedPrernaPilotInstitute } from '@/lib/pilot/prerna_seed';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  if (!isSuperAdmin(authUser)) {
    return NextResponse.json(
      { error: 'Forbidden: SUPER_ADMIN role required to view pilot management console' }, 
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const instituteId = url.searchParams.get('instituteId') || PRERNA_PILOT_INSTITUTE_ID;

  // Ensure pilot institute is seeded
  seedPrernaPilotInstitute();

  let tracking = db.getPilotTracking(instituteId);
  if (!tracking) {
    const inst = db.getInstituteById(instituteId);
    tracking = {
      id: `pilot-track-${instituteId}`,
      instituteId,
      instituteName: inst?.name || 'Prerna Career Institute (IIT-JEE & NEET Academy)',
      ownerAcceptanceStatus: 'PENDING_SIGN_OFF',
      authorizationConfirmed: false,
      widgetInstallationApproved: false,
      pilotStartDate: '2026-04-01T00:00:00Z',
      pilotEndDate: '2026-04-14T23:59:59Z',
      demoStatus: 'NOT_SCHEDULED',
      technicalIssues: [],
      counselorFeedback: 'Awaiting launch',
      ownerFeedback: 'Awaiting live session',
      paidConversionStatus: 'PILOT_ACTIVE',
      proposedTier: 'GROWTH',
      isDemoTenant: true,
      tenantClassification: 'UNVERIFIED_DEMO_TENANT',
      updatedAt: new Date().toISOString()
    };
    db.upsertPilotTracking(tracking);
  } else if (instituteId === PRERNA_PILOT_INSTITUTE_ID && tracking.tenantClassification !== 'UNVERIFIED_DEMO_TENANT') {
    tracking.isDemoTenant = true;
    tracking.tenantClassification = 'UNVERIFIED_DEMO_TENANT';
    db.upsertPilotTracking(tracking);
  }

  // Derive genuine live pilot metrics directly from actual recorded events
  const leads = db.getLeads(instituteId);
  const appointments = db.getAppointments(instituteId);
  const docs = db.getKnowledgeDocs(instituteId);
  const chunks = db.getChunksForInstitute(instituteId);

  const genuineMetrics = {
    totalRecordedEnquiries: leads.length,
    leadsCaptured: leads.length,
    appointmentsConfirmed: appointments.length,
    knowledgeDocumentsIndexed: docs.length,
    vectorChunksIndexed: chunks.length,
    activeBranchesCount: db.getBranches(instituteId).length,
    counselorsAllocated: db.getUsers(instituteId).filter(u => u.role === 'ADMISSION_COUNSELLOR').length
  };

  return NextResponse.json({
    success: true,
    pilot: tracking,
    genuineMetrics
  });
}

export async function PATCH(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  if (!isSuperAdmin(authUser)) {
    return NextResponse.json(
      { error: 'Forbidden: SUPER_ADMIN role required to update pilot tracking records' }, 
      { status: 403 }
    );
  }

  try {
    const updates = await req.json();
    const instituteId = updates.instituteId || PRERNA_PILOT_INSTITUTE_ID;

    let existing = db.getPilotTracking(instituteId);
    if (!existing) {
      existing = {
        id: `pilot-track-${instituteId}`,
        instituteId,
        instituteName: 'Prerna Career Institute (IIT-JEE & NEET Academy)',
        ownerAcceptanceStatus: 'PENDING_SIGN_OFF',
        authorizationConfirmed: false,
        widgetInstallationApproved: false,
        demoStatus: 'NOT_SCHEDULED',
        technicalIssues: [],
        counselorFeedback: '',
        ownerFeedback: '',
        paidConversionStatus: 'PILOT_ACTIVE',
        proposedTier: 'GROWTH',
        updatedAt: new Date().toISOString()
      };
    }

    delete updates.id;
    delete updates.instituteId;

    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const saved = db.upsertPilotTracking(merged);

    return NextResponse.json({
      success: true,
      pilot: saved
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Malformed update payload' }, { status: 400 });
  }
}
