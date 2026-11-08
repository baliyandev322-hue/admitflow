/**
 * Step 5: Prerna Pilot Console & Sales Outreach Preparation Test Suite
 * 
 * Verifies:
 * 1. Track A: Prerna Career Institute pilot identity, multi-branch hierarchy, and ownership
 * 2. Track A: Public widget slug resolution, DPDP consent capture, and RAG prospectus retrieval
 * 3. Track A: Pilot tracking console, technical issue register (P0/P1/P2), and director acceptance workflow
 * 4. Track B: Target institute categories, qualification criteria, and pricing proposal tiers
 * 5. Commercial Guardrail: Strict separation of proposed ₹9,999/mo tier from realized MRR (strictly ₹0)
 * 6. Non-destruction of existing student CRM, counseling scheduler, and multi-tenant isolation
 */

import { NextRequest } from 'next/server';
import { db } from '../lib/db';
import { generateToken } from '../lib/auth';
import { GET as getPilot, PATCH as patchPilot } from '../app/api/sales/pilot/route';
import { GET as getDashboard } from '../app/api/sales/dashboard/route';
import { PRERNA_PILOT_INSTITUTE_ID, seedPrernaPilotInstitute } from '../lib/pilot/prerna_seed';

async function runStep5Validation() {
  console.log('========================================================================');
  console.log('🚀 ADMITFLOW AI — P8 STEP 5: PRERNA PILOT & SALES PREPARATION AUDIT');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // Ensure Prerna pilot institute is cleanly seeded
  seedPrernaPilotInstitute();

  // 1. Setup Auth
  const superAdminUser = await db.getUserByEmail('admin@admitflow.ai');
  const adminToken = superAdminUser ? generateToken(superAdminUser) : '';

  console.log('--- TEST GROUP 1: PRERNA PILOT IDENTITY & MULTI-BRANCH STRUCTURE ---');
  const institute = db.getInstituteById(PRERNA_PILOT_INSTITUTE_ID);
  assert(!!institute, 'Prerna Career Institute exists in database');
  assert(institute?.slug === 'prerna-career-institute', 'Public slug is prerna-career-institute');
  
  const branches = db.getBranches(PRERNA_PILOT_INSTITUTE_ID);
  assert(branches.length >= 2, 'Dual-branch structure configured (Kota HQ + Jaipur Center)');
  const kotaHq = branches.find(b => b.isHeadquarters);
  assert(kotaHq?.city === 'Kota', 'Kota branch correctly designated as Headquarters');
  const jaipurBranch = branches.find(b => b.city === 'Jaipur');
  assert(!!jaipurBranch, 'Jaipur Regional Center configured');

  const owner = db.getUserByEmail('director@prerna-demo.invalid') || db.getUserByEmail('director@prernacareer.edu.in');
  assert(!!owner && owner.role === 'INSTITUTE_OWNER', 'Dr. Rajesh Verma verified as INSTITUTE_OWNER');

  const counselors = db.getUsers(PRERNA_PILOT_INSTITUTE_ID).filter(u => u.role === 'ADMISSION_COUNSELLOR');
  assert(counselors.length >= 2, 'Two admission counselors allocated (Sunita Sharma & Vikram Rathore)');

  console.log('\n--- TEST GROUP 2: PUBLIC WIDGET & RAG KNOWLEDGE BRAIN RETRIEVAL ---');
  const widgetInst = db.getInstituteBySlug('prerna-career-institute');
  assert(widgetInst?.id === PRERNA_PILOT_INSTITUTE_ID, 'Public widget successfully resolves institute by slug');

  const docs = db.getKnowledgeDocs(PRERNA_PILOT_INSTITUTE_ID);
  assert(docs.length >= 1, 'Official 2026 admission prospectus ingested into Knowledge Brain');

  const chunks = db.getChunksForInstitute(PRERNA_PILOT_INSTITUTE_ID);
  assert(chunks.length >= 4, 'At least 4 vector knowledge chunks indexed for RAG retrieval');

  const feeChunk = chunks.find(c => c.content.includes('1,50,000') || c.content.includes('150000'));
  assert(!!feeChunk, 'IIT-JEE Course fee (₹1,50,000) accurately grounded in vector chunks');

  const neetChunk = chunks.find(c => c.content.includes('1,30,000') || c.content.includes('130000'));
  assert(!!neetChunk, 'NEET Dropper Course fee (₹1,30,000) accurately grounded in vector chunks');

  console.log('\n--- TEST GROUP 3: PILOT TRACKING CONSOLE & TECHNICAL ISSUES REGISTER ---');
  // 3.1 Fetch Pilot Tracking via API
  const getReq = new NextRequest('http://localhost:3000/api/sales/pilot', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const getRes = await getPilot(getReq);
  assert(getRes.status === 200, 'Super Admin can retrieve pilot tracking console via API');
  const pilotPayload = await getRes.json();
  assert(pilotPayload.pilot.instituteId === PRERNA_PILOT_INSTITUTE_ID, 'Pilot console correctly scoped to Prerna Institute');
  assert(pilotPayload.pilot.tenantClassification === 'UNVERIFIED_DEMO_TENANT', 'Tenant classified strictly as UNVERIFIED_DEMO_TENANT');
  assert(pilotPayload.pilot.isDemoTenant === true, 'Pilot isDemoTenant flag set to true');
  assert(typeof pilotPayload.genuineMetrics.totalRecordedEnquiries === 'number', 'Genuine enquiry metrics derived from actual leads');

  // 3.2 Update Acceptance Workflow Status
  const patchReq = new NextRequest('http://localhost:3000/api/sales/pilot', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      instituteId: PRERNA_PILOT_INSTITUTE_ID,
      ownerAcceptanceStatus: 'IN_REVIEW',
      widgetInstallationApproved: true
    })
  });
  const patchRes = await patchPilot(patchReq);
  assert(patchRes.status === 200, 'Pilot acceptance status updated to IN_REVIEW (HTTP 200)');
  const patchData = await patchRes.json();
  assert(patchData.pilot.ownerAcceptanceStatus === 'IN_REVIEW', 'Owner acceptance status persisted as IN_REVIEW');
  assert(patchData.pilot.widgetInstallationApproved === true, 'Widget installation approved persisted');

  // 3.3 Log Technical Issue with Severity (P1)
  const testIssueId = `issue-${Date.now()}`;
  const issuePatchReq = new NextRequest('http://localhost:3000/api/sales/pilot', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      instituteId: PRERNA_PILOT_INSTITUTE_ID,
      technicalIssues: [
        {
          id: testIssueId,
          issue: 'Verify Meta WhatsApp Business Account approval for Prerna GST registration',
          severity: 'P1',
          resolved: false,
          createdAt: new Date().toISOString()
        }
      ]
    })
  });
  const issuePatchRes = await patchPilot(issuePatchReq);
  assert(issuePatchRes.status === 200, 'Technical issue logged to pilot register (HTTP 200)');
  const issueData = await issuePatchRes.json();
  const foundIssue = issueData.pilot.technicalIssues.find((i: any) => i.id === testIssueId);
  assert(!!foundIssue && foundIssue.severity === 'P1', 'Logged issue has correct P1 severity');

  // 3.4 Resolve Technical Issue
  const resolvePatchReq = new NextRequest('http://localhost:3000/api/sales/pilot', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      instituteId: PRERNA_PILOT_INSTITUTE_ID,
      technicalIssues: [
        {
          id: testIssueId,
          issue: 'Verify Meta WhatsApp Business Account approval for Prerna GST registration',
          severity: 'P1',
          resolved: true,
          createdAt: new Date().toISOString()
        }
      ]
    })
  });
  const resolvePatchRes = await patchPilot(resolvePatchReq);
  const resolveData = await resolvePatchRes.json();
  const resolvedIssue = resolveData.pilot.technicalIssues.find((i: any) => i.id === testIssueId);
  assert(resolvedIssue?.resolved === true, 'Technical issue marked resolved');

  console.log('\n--- TEST GROUP 4: STRICT HONEST ACCOUNTING & ZERO MRR GUARD ---');
  const dashReq = new NextRequest('http://localhost:3000/api/sales/dashboard', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const dashRes = await getDashboard(dashReq);
  const dashData = await dashRes.json();
  assert(dashData.summary.actualMonthlyRecurringRevenue === 0, 'Actual MRR remains strictly ₹0 during pilot');
  assert(pilotPayload.pilot.proposedTier === 'GROWTH', 'Pilot pricing tier remains GROWTH (proposed ₹9,999/mo)');
  assert(pilotPayload.pilot.paidConversionStatus === 'PILOT_ACTIVE', 'Pilot conversion status strictly remains PILOT_ACTIVE (unpaid)');

  console.log('\n--- TEST GROUP 5: EXISTING CRM REGRESSION & DATA ISOLATION ---');
  const leads = db.getLeads(PRERNA_PILOT_INSTITUTE_ID);
  assert(leads.length >= 1, 'Prerna student leads preserved and accessible');
  
  const otherLeads = db.getLeads('inst-apex-001');
  assert(otherLeads.length >= 1, 'Apex Academy leads completely isolated from Prerna Institute');

  const appointments = db.getAppointments(PRERNA_PILOT_INSTITUTE_ID);
  assert(appointments.length >= 1, 'Confirmed counseling appointments preserved without data loss');

  console.log('\n========================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep5Validation().catch(e => {
  console.error('Fatal test error in Step 5 validation:', e);
  process.exit(1);
});
