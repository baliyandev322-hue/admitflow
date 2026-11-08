import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isSuperAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { SalesProspect, SalesStage, SalesProspectCategory } from '@/lib/types';

const VALID_STAGES: SalesStage[] = [
  'PROSPECT_IDENTIFIED',
  'CONTACTED',
  'INTERESTED',
  'DEMO_SCHEDULED',
  'DEMO_COMPLETED',
  'PILOT_PROPOSED',
  'NEGOTIATION',
  'WON',
  'LOST'
];

const VALID_CATEGORIES: SalesProspectCategory[] = [
  'IIT_JEE_NEET',
  'CODING_ACADEMY',
  'CIVIL_SERVICES',
  'COMMERCE_CA',
  'K12_TUITION',
  'OTHER'
];

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  if (!isSuperAdmin(authUser)) {
    return NextResponse.json(
      { error: 'Forbidden: SUPER_ADMIN role required to access internal B2B sales management' }, 
      { status: 403 }
    );
  }

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search')?.toLowerCase().trim();
    const stage = url.searchParams.get('stage') as SalesStage | null;
    const category = url.searchParams.get('category') as SalesProspectCategory | null;
    const city = url.searchParams.get('city')?.toLowerCase().trim();

    let prospects = db.getSalesProspects();

    if (search) {
      prospects = prospects.filter(p => 
        p.instituteName.toLowerCase().includes(search) ||
        p.city.toLowerCase().includes(search) ||
        p.contactPerson.toLowerCase().includes(search) ||
        p.email.toLowerCase().includes(search) ||
        p.phone.includes(search)
      );
    }

    if (stage && VALID_STAGES.includes(stage)) {
      prospects = prospects.filter(p => p.stage === stage);
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      prospects = prospects.filter(p => p.category === category);
    }

    if (city) {
      prospects = prospects.filter(p => p.city.toLowerCase() === city);
    }

    return NextResponse.json({
      success: true,
      total: prospects.length,
      prospects
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal sales query error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  if (!isSuperAdmin(authUser)) {
    return NextResponse.json(
      { error: 'Forbidden: SUPER_ADMIN role required to create B2B sales prospects' }, 
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      instituteName,
      city,
      website,
      contactPerson,
      email,
      phone,
      category = 'IIT_JEE_NEET',
      branchCount = 1,
      mainProblem,
      stage = 'PROSPECT_IDENTIFIED',
      dealValueEstimated = 0,
      notes
    } = body;

    // Strict input validation
    if (!instituteName || typeof instituteName !== 'string' || instituteName.trim().length < 2) {
      return NextResponse.json({ error: 'Valid instituteName is required' }, { status: 400 });
    }

    if (!city || typeof city !== 'string' || city.trim().length < 2) {
      return NextResponse.json({ error: 'Valid city is required' }, { status: 400 });
    }

    if (!contactPerson || typeof contactPerson !== 'string' || contactPerson.trim().length < 2) {
      return NextResponse.json({ error: 'Valid contactPerson decision maker is required' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'Valid business email is required' }, { status: 400 });
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      return NextResponse.json({ error: 'Valid business phone number is required' }, { status: 400 });
    }

    if (!VALID_STAGES.includes(stage)) {
      return NextResponse.json({ error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}` }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 });
    }

    const cleanProspect: SalesProspect = {
      id: 'prospect-' + Date.now(),
      instituteName: instituteName.trim(),
      city: city.trim(),
      website: website?.trim() || undefined,
      contactPerson: contactPerson.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      category,
      branchCount: Number(branchCount) || 1,
      mainProblem: (mainProblem || '').trim(),
      stage,
      dealValueEstimated: Number(dealValueEstimated) || 0,
      notes: (notes || '').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const created = db.createSalesProspect(cleanProspect);
      return NextResponse.json({
        success: true,
        prospect: created
      }, { status: 201 });
    } catch (dupErr: any) {
      return NextResponse.json({ error: dupErr.message }, { status: 409 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Malformed request payload' }, { status: 400 });
  }
}
