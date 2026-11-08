import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Lead } from '@/lib/types';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const branchId = url.searchParams.get('branchId');
  const status = url.searchParams.get('status');
  const counsellorId = url.searchParams.get('counsellorId');
  const search = url.searchParams.get('search')?.toLowerCase();

  let leads = db.getLeads(authUser.instituteId);

  // If counsellor role, limit to assigned leads unless owner/manager
  if (authUser.role === 'ADMISSION_COUNSELLOR') {
    leads = leads.filter(l => !l.assignedCounsellorId || l.assignedCounsellorId === authUser.userId);
  }

  if (branchId) {
    leads = leads.filter(l => l.branchId === branchId);
  }
  if (status) {
    leads = leads.filter(l => l.status === status);
  }
  if (counsellorId) {
    leads = leads.filter(l => l.assignedCounsellorId === counsellorId);
  }
  if (search) {
    leads = leads.filter(l => 
      l.studentName.toLowerCase().includes(search) || 
      l.phone.includes(search) ||
      (l.email && l.email.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({ success: true, leads });
}

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { studentName, phone, email, courseId, branchId, assignedCounsellorId, notes, source = 'DIRECT_WALKIN' } = body;

  if (!studentName || !phone) {
    return NextResponse.json({ error: 'Student name and phone are required' }, { status: 400 });
  }

  // Subscription Quota Enforcement
  const sub = db.getSubscription(authUser.instituteId);
  const currentLeadsCount = db.getLeads(authUser.instituteId).length;
  if (sub && currentLeadsCount >= sub.leadsQuota) {
    return NextResponse.json({
      error: `Subscription lead quota reached (${currentLeadsCount}/${sub.leadsQuota}). Please upgrade your plan in Billing to add more leads.`,
      quotaExceeded: true,
      currentTier: sub.tier
    }, { status: 402 });
  }

  // Deduplication check
  const existing = db.findLeadByPhone(authUser.instituteId, phone);
  if (existing) {
    return NextResponse.json({ 
      error: 'A lead with this phone number already exists', 
      existingLead: existing 
    }, { status: 409 });
  }

  const newLead: Lead = {
    id: 'lead-' + Date.now(),
    instituteId: authUser.instituteId,
    branchId: branchId || authUser.branchId,
    assignedCounsellorId: assignedCounsellorId || authUser.userId,
    studentName,
    phone,
    email,
    courseId,
    status: 'NEW',
    source,
    leadScore: 65,
    nextBestAction: 'Send course syllabus and invite for counseling session.',
    notes,
    lastInteractionAt: new Date().toISOString(),
    nextFollowupAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.createLead(newLead);
  return NextResponse.json({ success: true, lead: newLead });
}

export async function PUT(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'Lead id required' }, { status: 400 });

  const lead = db.getLeadById(id);
  if (!lead || lead.instituteId !== authUser.instituteId) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const updated = db.updateLead(id, updates);

  if (updates.status && updates.status !== lead.status) {
    db.addLeadActivity({
      id: 'act-' + Date.now(),
      leadId: id,
      instituteId: authUser.instituteId,
      actorId: authUser.userId,
      actorType: 'COUNSELLOR',
      activityType: 'STATUS_CHANGE',
      description: `Stage changed from ${lead.status} to ${updates.status} by ${authUser.name}`,
      createdAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ success: true, lead: updated });
}
