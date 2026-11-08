import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = db.getUserById(authUser.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const institute = db.getInstituteById(user.instituteId);
    const branches = db.getBranches(user.instituteId);
    const subscription = db.getSubscription(user.instituteId);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        instituteId: user.instituteId,
        branchId: user.branchId,
        phone: user.phone,
      },
      institute,
      branches,
      subscription
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch session' }, { status: 500 });
  }
}
