import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { Branch } from '@/lib/types';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const branches = db.getBranches(authUser.instituteId);
  return NextResponse.json({ success: true, branches });
}

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!requireRole(authUser.role, ['INSTITUTE_OWNER'])) {
    return NextResponse.json({ error: 'Only institute owners can add branches' }, { status: 403 });
  }

  const { name, city, address, phone, email } = await req.json();
  if (!name || !city || !address) {
    return NextResponse.json({ error: 'Name, city, and address are required' }, { status: 400 });
  }

  const newBranch: Branch = {
    id: 'branch-' + Date.now(),
    instituteId: authUser.instituteId,
    name,
    city,
    address,
    phone,
    email,
    isHeadquarters: false,
    createdAt: new Date().toISOString()
  };

  db.createBranch(newBranch);
  return NextResponse.json({ success: true, branch: newBranch });
}
