import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isSuperAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  if (!isSuperAdmin(authUser)) {
    return NextResponse.json(
      { error: 'Forbidden: SUPER_ADMIN role required to view sales telemetry' }, 
      { status: 403 }
    );
  }

  try {
    const prospects = db.getSalesProspects();
    const now = Date.now();

    const stageCounts = {
      prospectIdentified: prospects.filter(p => p.stage === 'PROSPECT_IDENTIFIED').length,
      contacted: prospects.filter(p => p.stage === 'CONTACTED').length,
      interested: prospects.filter(p => p.stage === 'INTERESTED').length,
      demoScheduled: prospects.filter(p => p.stage === 'DEMO_SCHEDULED').length,
      demoCompleted: prospects.filter(p => p.stage === 'DEMO_COMPLETED').length,
      pilotProposed: prospects.filter(p => p.stage === 'PILOT_PROPOSED').length,
      negotiation: prospects.filter(p => p.stage === 'NEGOTIATION').length,
      won: prospects.filter(p => p.stage === 'WON').length,
      lost: prospects.filter(p => p.stage === 'LOST').length,
    };

    const overdueFollowups = prospects.filter(p => 
      p.nextFollowupDate && 
      new Date(p.nextFollowupDate).getTime() < now &&
      !['WON', 'LOST'].includes(p.stage)
    );

    // Strict Honest MRR Policy: Only count confirmed paid commercial orders (not trials/pilots)
    const payingSubscriptions = (db.getData().subscriptions || []).filter((s: any) => 
      s.status === 'ACTIVE' && s.tier !== 'STARTER' && !s.isPilot
    );
    const actualMRR = payingSubscriptions.reduce((sum: number, s: any) => sum + (s.monthlyPrice || 0), 0);

    const estimatedPipelineValue = prospects
      .filter(p => !['LOST'].includes(p.stage))
      .reduce((sum, p) => sum + (p.dealValueEstimated || 9999), 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalProspects: prospects.length,
        ...stageCounts,
        overdueFollowupsCount: overdueFollowups.length,
        actualMonthlyRecurringRevenue: actualMRR,
        estimatedPipelineValue,
        currency: 'INR'
      },
      overdueProspects: overdueFollowups.map(p => ({
        id: p.id,
        instituteName: p.instituteName,
        city: p.city,
        contactPerson: p.contactPerson,
        phone: p.phone,
        nextFollowupDate: p.nextFollowupDate,
        stage: p.stage
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to compute sales metrics' }, { status: 500 });
  }
}
