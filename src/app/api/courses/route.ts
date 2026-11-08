import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { Course, Batch } from '@/lib/types';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const courses = db.getCourses(authUser.instituteId);
  const batches = db.getBatches(authUser.instituteId);

  return NextResponse.json({ success: true, courses, batches });
}

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!requireRole(authUser.role, ['INSTITUTE_OWNER', 'BRANCH_MANAGER'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  if (body.type === 'batch') {
    const { courseId, branchId, batchName, startDate, timings, maxSeats = 40 } = body;
    if (!courseId || !batchName || !startDate || !timings) {
      return NextResponse.json({ error: 'Missing batch parameters' }, { status: 400 });
    }
    const newBatch: Batch = {
      id: 'batch-' + Date.now(),
      courseId,
      instituteId: authUser.instituteId,
      branchId,
      batchName,
      startDate,
      timings,
      daysOfWeek: body.daysOfWeek || 'Monday to Saturday',
      maxSeats: Number(maxSeats),
      enrolledCount: 0,
      status: 'ENROLLING'
    };
    db.getData().batches.push(newBatch);
    db.persist();
    return NextResponse.json({ success: true, batch: newBatch });
  }

  // Create course
  const { name, code, category, baseFee, minInstallmentFee, maxDiscountPct, durationWeeks, description, eligibility } = body;
  if (!name || !baseFee) {
    return NextResponse.json({ error: 'Course name and base fee are required' }, { status: 400 });
  }

  const newCourse: Course = {
    id: 'course-' + Date.now(),
    instituteId: authUser.instituteId,
    name,
    code: code || name.slice(0, 4).toUpperCase(),
    category: category || 'General',
    durationWeeks: Number(durationWeeks) || 12,
    baseFee: Number(baseFee),
    minInstallmentFee: Number(minInstallmentFee) || Math.round(Number(baseFee) / 3),
    maxDiscountPct: Number(maxDiscountPct) || 10,
    description: description || '',
    eligibility: eligibility || 'Open to all',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  db.createCourse(newCourse);
  return NextResponse.json({ success: true, course: newCourse });
}
