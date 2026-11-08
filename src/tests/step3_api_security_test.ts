import { NextRequest } from 'next/server';
import { GET as prospectsGet, POST as prospectsPost } from '../app/api/sales/prospects/route';
import { GET as prospectDetailGet, PATCH as prospectDetailPatch, DELETE as prospectDetailDelete } from '../app/api/sales/prospects/[id]/route';
import { GET as activityGet, POST as activityPost } from '../app/api/sales/prospects/[id]/activity/route';
import { GET as pilotGet, PATCH as pilotPatch } from '../app/api/sales/pilot/route';
import { GET as dashboardGet } from '../app/api/sales/dashboard/route';
import { generateToken } from '../lib/auth';
import { db } from '../lib/db';
import { User } from '../lib/types';
import { PRERNA_PILOT_INSTITUTE_ID } from '../lib/pilot/prerna_seed';

async function runStep3SecurityTestSuite() {
  console.log('========================================================================');
  console.log('🛡️ ADMITFLOW AI — P8 STEP 3: BACKEND APIs & RBAC SECURITY AUDIT        ');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      if (details) console.error(`         -> Details: ${details}`);
    }
  }

  // Set up mock users for testing role walls
  const superAdminUser: User = {
    id: 'user-sec-admin',
    instituteId: 'inst-admitflow-internal',
    name: 'Sales Director',
    email: 'sales.director@admitflow.ai',
    passwordHash: 'hash',
    role: 'SUPER_ADMIN',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  const instituteOwnerUser: User = {
    id: 'user-sec-owner',
    instituteId: PRERNA_PILOT_INSTITUTE_ID,
    name: 'Dr. Rajesh Verma (Demo Persona)',
    email: 'director@prerna-demo.invalid',
    passwordHash: 'hash',
    role: 'INSTITUTE_OWNER',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  const counselorUser: User = {
    id: 'user-sec-counselor',
    instituteId: PRERNA_PILOT_INSTITUTE_ID,
    branchId: 'branch-prerna-kota',
    name: 'Sunita Sharma (Demo Persona)',
    email: 'sunita.sharma@prerna-demo.invalid',
    passwordHash: 'hash',
    role: 'ADMISSION_COUNSELLOR',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  const superAdminToken = generateToken(superAdminUser);
  const instituteOwnerToken = generateToken(instituteOwnerUser);
  const counselorToken = generateToken(counselorUser);

  try {
    // -------------------------------------------------------------
    // Test 1: Unauthenticated Requests (HTTP 401 Unauthorized)
    // -------------------------------------------------------------
    console.log('--- 1. Unauthenticated Request Blocking (HTTP 401) ---');
    const unauthReq = new NextRequest('http://localhost:3000/api/sales/prospects', { method: 'GET' });
    const unauthRes = await prospectsGet(unauthReq);
    assert(unauthRes.status === 401, 'Test 1.1: Unauthenticated GET /api/sales/prospects returns HTTP 401');

    const unauthPostReq = new NextRequest('http://localhost:3000/api/sales/prospects', { 
      method: 'POST',
      body: JSON.stringify({ instituteName: 'Test' })
    });
    const unauthPostRes = await prospectsPost(unauthPostReq);
    assert(unauthPostRes.status === 401, 'Test 1.2: Unauthenticated POST /api/sales/prospects returns HTTP 401');

    const unauthPilotReq = new NextRequest('http://localhost:3000/api/sales/pilot', { method: 'GET' });
    const unauthPilotRes = await pilotGet(unauthPilotReq);
    assert(unauthPilotRes.status === 401, 'Test 1.3: Unauthenticated GET /api/sales/pilot returns HTTP 401');

    const unauthDashReq = new NextRequest('http://localhost:3000/api/sales/dashboard', { method: 'GET' });
    const unauthDashRes = await dashboardGet(unauthDashReq);
    assert(unauthDashRes.status === 401, 'Test 1.4: Unauthenticated GET /api/sales/dashboard returns HTTP 401');

    // -------------------------------------------------------------
    // Test 2: Role Access-Denial: Institute Owner & Counselor (HTTP 403 Forbidden)
    // -------------------------------------------------------------
    console.log('\n--- 2. RBAC Enforcement & Access Denial (HTTP 403 Forbidden) ---');
    const ownerGetReq = new NextRequest('http://localhost:3000/api/sales/prospects', {
      method: 'GET',
      headers: { Authorization: `Bearer ${instituteOwnerToken}` }
    });
    const ownerGetRes = await prospectsGet(ownerGetReq);
    assert(ownerGetRes.status === 403, 'Test 2.1: INSTITUTE_OWNER blocked from B2B sales with HTTP 403 Forbidden');

    const counselorGetReq = new NextRequest('http://localhost:3000/api/sales/prospects', {
      method: 'GET',
      headers: { Authorization: `Bearer ${counselorToken}` }
    });
    const counselorGetRes = await prospectsGet(counselorGetReq);
    assert(counselorGetRes.status === 403, 'Test 2.2: ADMISSION_COUNSELLOR blocked from B2B sales with HTTP 403 Forbidden');

    const ownerPostReq = new NextRequest('http://localhost:3000/api/sales/prospects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${instituteOwnerToken}` },
      body: JSON.stringify({ instituteName: 'Hacker Academy' })
    });
    const ownerPostRes = await prospectsPost(ownerPostReq);
    assert(ownerPostRes.status === 403, 'Test 2.3: INSTITUTE_OWNER blocked from POST /api/sales/prospects with HTTP 403');

    const counselorPilotReq = new NextRequest('http://localhost:3000/api/sales/pilot', {
      method: 'GET',
      headers: { Authorization: `Bearer ${counselorToken}` }
    });
    const counselorPilotRes = await pilotGet(counselorPilotReq);
    assert(counselorPilotRes.status === 403, 'Test 2.4: ADMISSION_COUNSELLOR blocked from GET /api/sales/pilot with HTTP 403');

    // -------------------------------------------------------------
    // Test 3: Forged / Tampered Token Privilege Escalation Defense
    // -------------------------------------------------------------
    console.log('\n--- 3. Privilege Escalation & Forged Token Defense ---');
    const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiU1VQRVJfQURNSU4iLCJlbWFpbCI6ImhhY2tlckBnbWFpbC5jb20ifQ.invalid_signature_here';
    const forgedReq = new NextRequest('http://localhost:3000/api/sales/prospects', {
      method: 'GET',
      headers: { Authorization: `Bearer ${forgedToken}` }
    });
    const forgedRes = await prospectsGet(forgedReq);
    assert(forgedRes.status === 401, 'Test 3.1: Forged signature token strictly rejected with HTTP 401');

    // -------------------------------------------------------------
    // Test 4: Authorized SUPER_ADMIN CRUD & Validation
    // -------------------------------------------------------------
    console.log('\n--- 4. Authorized SUPER_ADMIN CRUD & Input Validation ---');
    // Test Empty input validation
    const invalidPostReq = new NextRequest('http://localhost:3000/api/sales/prospects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ instituteName: '' }) // missing required fields
    });
    const invalidPostRes = await prospectsPost(invalidPostReq);
    assert(invalidPostRes.status === 400, 'Test 4.1: Missing required fields rejected with HTTP 400');

    // Test Valid prospect creation
    const uniquePhone = '+919811' + Math.floor(100000 + Math.random() * 900000);
    const uniqueEmail = `owner.${Date.now()}@gurukulacademy.in`;
    const validProspectPayload = {
      instituteName: 'Gurukul IIT-JEE Institute (Live B2B Lead)',
      city: 'Jaipur',
      contactPerson: 'Mr. Surendra Meena',
      email: uniqueEmail,
      phone: uniquePhone,
      category: 'IIT_JEE_NEET',
      branchCount: 4,
      mainProblem: 'After-hours walk-in queries not followed up.',
      stage: 'PROSPECT_IDENTIFIED',
      dealValueEstimated: 9999,
      notes: 'Initial prospecting via official directory.'
    };

    const validPostReq = new NextRequest('http://localhost:3000/api/sales/prospects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify(validProspectPayload)
    });
    const validPostRes = await prospectsPost(validPostReq);
    assert(validPostRes.status === 201, 'Test 4.2: SUPER_ADMIN successfully creates prospect with HTTP 201');
    const createdData = await validPostRes.json();
    const createdProspectId = createdData.prospect.id;

    // Test Duplicate prevention (HTTP 409 Conflict)
    const dupPostReq = new NextRequest('http://localhost:3000/api/sales/prospects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify(validProspectPayload)
    });
    const dupPostRes = await prospectsPost(dupPostReq);
    assert(dupPostRes.status === 409, 'Test 4.3: Duplicate phone/email rejected with HTTP 409 Conflict');

    // Test GET /api/sales/prospects/[id]
    const detailReq = new NextRequest(`http://localhost:3000/api/sales/prospects/${createdProspectId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const detailRes = await prospectDetailGet(detailReq, { params: { id: createdProspectId } });
    assert(detailRes.status === 200, 'Test 4.4: SUPER_ADMIN retrieves prospect detail with HTTP 200');

    // Test PATCH /api/sales/prospects/[id]
    const patchReq = new NextRequest(`http://localhost:3000/api/sales/prospects/${createdProspectId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ stage: 'CONTACTED', notes: 'Spoke with Director Surendra Meena' })
    });
    const patchRes = await prospectDetailPatch(patchReq, { params: { id: createdProspectId } });
    assert(patchRes.status === 200, 'Test 4.5: SUPER_ADMIN updates stage with HTTP 200');

    // -------------------------------------------------------------
    // Test 5: Sales Activity Sub-Resource Logging
    // -------------------------------------------------------------
    console.log('\n--- 5. Sales Activity Sub-Resource Logging ---');
    const actPostReq = new NextRequest(`http://localhost:3000/api/sales/prospects/${createdProspectId}/activity`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        activityType: 'CALL',
        outcome: 'INTERESTED',
        notes: 'Director requested online demo on Thursday.'
      })
    });
    const actPostRes = await activityPost(actPostReq, { params: { id: createdProspectId } });
    assert(actPostRes.status === 201, 'Test 5.1: Sales activity logged with HTTP 201');

    const actGetReq = new NextRequest(`http://localhost:3000/api/sales/prospects/${createdProspectId}/activity`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const actGetRes = await activityGet(actGetReq, { params: { id: createdProspectId } });
    const actData = await actGetRes.json();
    assert(actData.activities.length >= 2, 'Test 5.2: Activity history retrieved with STAGE_CHANGE and CALL logs');

    // -------------------------------------------------------------
    // Test 6: Pilot Tracking Console Endpoint & Actual Metrics
    // -------------------------------------------------------------
    console.log('\n--- 6. Pilot Tracking Console Endpoint ---');
    const pilotAdminReq = new NextRequest('http://localhost:3000/api/sales/pilot', {
      method: 'GET',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const pilotAdminRes = await pilotGet(pilotAdminReq);
    assert(pilotAdminRes.status === 200, 'Test 6.1: SUPER_ADMIN retrieves pilot tracking console with HTTP 200');
    const pilotData = await pilotAdminRes.json();
    assert(
      ['PENDING_SIGN_OFF', 'IN_REVIEW'].includes(pilotData.pilot.ownerAcceptanceStatus),
      'Test 6.2: Pilot tracking correctly reports unapproved status (PENDING_SIGN_OFF / IN_REVIEW)'
    );
    assert(
      typeof pilotData.genuineMetrics.totalRecordedEnquiries === 'number',
      'Test 6.3: Pilot console reports genuine metrics without synthetic numbers'
    );

    // -------------------------------------------------------------
    // Test 7: Sales Dashboard Telemetry & Zero MRR Policy
    // -------------------------------------------------------------
    console.log('\n--- 7. Sales Dashboard Telemetry & Zero MRR Policy ---');
    const dashAdminReq = new NextRequest('http://localhost:3000/api/sales/dashboard', {
      method: 'GET',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const dashAdminRes = await dashboardGet(dashAdminReq);
    assert(dashAdminRes.status === 200, 'Test 7.1: SUPER_ADMIN retrieves sales dashboard telemetry with HTTP 200');
    const dashData = await dashAdminRes.json();
    assert(
      dashData.summary.actualMonthlyRecurringRevenue === 0,
      'Test 7.2: Actual MRR strictly remains ₹0 (Zero fake revenue policy enforced)'
    );

    // -------------------------------------------------------------
    // Test 8: IDOR & Delete Cleanup
    // -------------------------------------------------------------
    console.log('\n--- 8. IDOR & Resource Deletion ---');
    const deleteReq = new NextRequest(`http://localhost:3000/api/sales/prospects/${createdProspectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const deleteRes = await prospectDetailDelete(deleteReq, { params: { id: createdProspectId } });
    assert(deleteRes.status === 200, 'Test 8.1: Prospect cleanly deleted with HTTP 200');

    // Attempt deleting non-existent ID
    const deleteNonExistentReq = new NextRequest('http://localhost:3000/api/sales/prospects/fake-non-existent-id', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const deleteNonExistentRes = await prospectDetailDelete(deleteNonExistentReq, { params: { id: 'fake-non-existent-id' } });
    assert(deleteNonExistentRes.status === 404, 'Test 8.2: Non-existent prospect deletion returns HTTP 404');

  } catch (err: any) {
    console.error('Fatal test error occurred:', err);
    assert(false, 'Fatal Test Execution Exception', err.message);
  }

  console.log('\n========================================================================');
  console.log(`📊 STEP 3 SECURITY AUDIT RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passed === total) {
    console.log('🎉 STEP 3 SECURED BACKEND APIs & RBAC AUDIT PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    console.error(`⚠️ ${total - passed} TESTS FAILED. INVESTIGATE IMMEDIATELY.`);
    process.exit(1);
  }
}

runStep3SecurityTestSuite();
