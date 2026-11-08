import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  if (slug) {
    const inst = db.getInstituteBySlug(slug) || db.getInstitutes().find(i => i.slug.includes(slug));
    if (inst) {
      return NextResponse.json({
        success: true,
        institute: {
          id: inst.id,
          name: inst.name,
          slug: inst.slug,
          welcomeMessage: inst.welcomeMessage,
          phone: inst.phone,
          website: inst.website
        }
      });
    }
  }

  const authUser = getAuthUser(req);
  if (!authUser) {
    const defaultInst = db.getInstitutes()[0];
    return NextResponse.json({
      success: true,
      institute: defaultInst ? {
        id: defaultInst.id,
        name: defaultInst.name,
        slug: defaultInst.slug,
        welcomeMessage: defaultInst.welcomeMessage
      } : null
    });
  }

  const institute = db.getInstituteById(authUser.instituteId);
  return NextResponse.json({ success: true, institute });
}

export async function PUT(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!requireRole(authUser.role, ['INSTITUTE_OWNER', 'BRANCH_MANAGER'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updates = await req.json();
  const updated = db.updateInstitute(authUser.instituteId, updates);
  return NextResponse.json({ success: true, institute: updated });
}
