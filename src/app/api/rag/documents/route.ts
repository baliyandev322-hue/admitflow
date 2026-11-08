import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const docs = db.getKnowledgeDocs(authUser.instituteId);
  const chunks = db.getChunksForInstitute(authUser.instituteId);

  return NextResponse.json({
    success: true,
    documents: docs,
    totalChunks: chunks.length
  });
}

export async function DELETE(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!requireRole(authUser.role, ['INSTITUTE_OWNER'])) {
    return NextResponse.json({ error: 'Only institute owners can delete knowledge documents' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const docId = searchParams.get('id');
  if (!docId) return NextResponse.json({ error: 'Document id required' }, { status: 400 });

  db.deleteKnowledgeDoc(docId, authUser.instituteId);
  return NextResponse.json({ success: true, message: 'Document and its vector chunks deleted successfully' });
}
