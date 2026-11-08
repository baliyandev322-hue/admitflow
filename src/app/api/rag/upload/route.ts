import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { indexDocument } from '@/lib/rag';

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!requireRole(authUser.role, ['INSTITUTE_OWNER', 'BRANCH_MANAGER'])) {
      return NextResponse.json({ error: 'Only owners and managers can upload knowledge documents' }, { status: 403 });
    }

    const { title, content, fileType = 'PDF' } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content text are strictly required' }, { status: 400 });
    }

    if (content.trim().length < 20) {
      return NextResponse.json({ error: 'Document content is too brief for indexing' }, { status: 400 });
    }

    if (content.length > 2_000_000) {
      return NextResponse.json({ error: 'Document content exceeds 2MB limit. Please upload concise sections.' }, { status: 413 });
    }

    const doc = await indexDocument(authUser.instituteId, title, fileType, content);

    return NextResponse.json({
      success: true,
      document: doc,
      message: `Document '${title}' indexed successfully into ${doc.chunkCount} semantic vector chunks.`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Indexing failed' }, { status: 500 });
  }
}
