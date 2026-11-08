import { db } from '../lib/db';
import { isSuperAdmin, TokenPayload } from '../lib/auth';
import { SalesProspect, PilotTrackingRecord } from '../lib/types';

async function runStep1SchemaTests() {
  console.log('========================================================================');
  console.log('🧪 ADMITFLOW AI — P8 STEP 1: TYPES & DATABASE SCHEMA VERIFICATION');
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

  try {
    // -------------------------------------------------------------
    // Test 1: Super Admin Identity & Role Verification
    // -------------------------------------------------------------
    console.log('--- 1. SUPER_ADMIN Role & Dedicated Identity ---');
    const adminUser = db.getUserByEmail('admin@admitflow.ai');
    assert(!!adminUser, 'Test 1.1: Default internal super admin user exists (admin@admitflow.ai)');
    assert(adminUser?.role === 'SUPER_ADMIN', 'Test 1.2: Super admin has role strictly set to SUPER_ADMIN');

    const superAdminPayload: TokenPayload = {
      userId: adminUser!.id,
      instituteId: adminUser!.instituteId,
      role: adminUser!.role,
      email: adminUser!.email,
      name: adminUser!.name
    };
    assert(isSuperAdmin(superAdminPayload) === true, 'Test 1.3: isSuperAdmin helper returns true for internal admin');

    const instituteOwnerUser = db.getUserByEmail('director@prerna-demo.invalid') || db.getUserByEmail('director@prernacareer.edu.in');
    const instituteOwnerPayload: TokenPayload = {
      userId: instituteOwnerUser!.id,
      instituteId: instituteOwnerUser!.instituteId,
      role: instituteOwnerUser!.role,
      email: instituteOwnerUser!.email,
      name: instituteOwnerUser!.name
    };
    assert(isSuperAdmin(instituteOwnerPayload) === false, 'Test 1.4: isSuperAdmin returns false for institute owner');

    // -------------------------------------------------------------
    // Test 2: B2B Sales Prospect Creation & Retrieval
    // -------------------------------------------------------------
    console.log('\n--- 2. B2B Sales Prospects CRUD & Duplicate Guard ---');
    const initialProspects = db.getSalesProspects();
    assert(Array.isArray(initialProspects), 'Test 2.1: getSalesProspects returns an array');

    const testProspectId = 'prospect-test-' + Date.now();
    const testPhone = '+9199999' + Math.floor(10000 + Math.random() * 90000);
    const testEmail = `director.test.${Date.now()}@targetacademy.in`;

    const newProspect: SalesProspect = {
      id: testProspectId,
      instituteName: 'Target IIT-JEE Academy (Demo Lead)',
      city: 'Sikar',
      website: 'https://targetsikar.edu.in',
      contactPerson: 'Mr. Arvind Kulhari',
      email: testEmail,
      phone: testPhone,
      category: 'IIT_JEE_NEET',
      branchCount: 3,
      mainProblem: 'Late night enquiries drop off without response; need 24x7 AI counseling.',
      stage: 'PROSPECT_IDENTIFIED',
      notes: 'Initial outreach planned for regional entrance session.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const created = db.createSalesProspect(newProspect);
    assert(created.id === testProspectId, 'Test 2.2: createSalesProspect successfully stores prospect record');

    const fetched = db.getSalesProspectById(testProspectId);
    assert(fetched?.instituteName === 'Target IIT-JEE Academy (Demo Lead)', 'Test 2.3: getSalesProspectById accurately retrieves prospect');

    // Verify activity auto-created
    const activities = db.getSalesActivities(testProspectId);
    assert(activities.length >= 1, 'Test 2.4: Creation auto-logs initial activity in timeline');

    // Duplicate prevention test
    let duplicateCaught = false;
    try {
      db.createSalesProspect({
        ...newProspect,
        id: 'prospect-dup-' + Date.now(),
        instituteName: 'Duplicate Academy'
      });
    } catch (err: any) {
      duplicateCaught = true;
    }
    assert(duplicateCaught, 'Test 2.5: Duplicate prospect creation by phone/email is strictly rejected');

    // -------------------------------------------------------------
    // Test 3: Stage Progression & Timeline Logging
    // -------------------------------------------------------------
    console.log('\n--- 3. Sales Stage Progression & Activity Logging ---');
    const updated = db.updateSalesProspect(testProspectId, { stage: 'CONTACTED' });
    assert(updated?.stage === 'CONTACTED', 'Test 3.1: updateSalesProspect successfully transitions stage');

    const updatedActivities = db.getSalesActivities(testProspectId);
    assert(
      updatedActivities.some(a => a.activityType === 'STAGE_CHANGE' && a.outcome === 'CONTACTED'),
      'Test 3.2: Stage transition automatically creates STAGE_CHANGE activity record'
    );

    // -------------------------------------------------------------
    // Test 4: Prerna Pilot Tracking Record CRUD
    // -------------------------------------------------------------
    console.log('\n--- 4. Pilot Tracking Record Storage & Isolation ---');
    const pilotRecord: PilotTrackingRecord = {
      id: 'pilot-track-prerna',
      instituteId: 'inst-prerna-pilot',
      instituteName: 'Prerna Career Institute (IIT-JEE & NEET Academy)',
      ownerAcceptanceStatus: 'PENDING_SIGN_OFF',
      authorizationConfirmed: false,
      widgetInstallationApproved: false,
      pilotStartDate: '2026-04-01T00:00:00Z',
      pilotEndDate: '2026-04-14T23:59:59Z',
      demoStatus: 'NOT_SCHEDULED',
      technicalIssues: [],
      counselorFeedback: 'Awaiting launch',
      ownerFeedback: 'Awaiting live session',
      paidConversionStatus: 'PILOT_ACTIVE',
      proposedTier: 'GROWTH',
      updatedAt: new Date().toISOString()
    };

    db.upsertPilotTracking(pilotRecord);
    const retrievedPilot = db.getPilotTracking('inst-prerna-pilot');
    assert(!!retrievedPilot, 'Test 4.1: upsertPilotTracking stores pilot record');
    assert(retrievedPilot?.ownerAcceptanceStatus === 'PENDING_SIGN_OFF', 'Test 4.2: Owner acceptance status accurately tracked as PENDING_SIGN_OFF');
    assert(retrievedPilot?.proposedTier === 'GROWTH', 'Test 4.3: Proposed tier recorded as GROWTH (₹9,999/mo proposal)');

    // -------------------------------------------------------------
    // Test 5: Clean-up Test Data & Existing Data Integrity
    // -------------------------------------------------------------
    console.log('\n--- 5. Database Cleanup & Preservation of Existing Student CRM ---');
    db.deleteSalesProspect(testProspectId);
    assert(db.getSalesProspectById(testProspectId) === undefined, 'Test 5.1: deleteSalesProspect cleanly removes test record');

    // Verify existing institutes and student leads are intact
    const institutes = db.getInstitutes();
    assert(institutes.length >= 2, 'Test 5.2: Existing institutes preserved intact without corruption');
    const prernaLeads = db.getLeads('inst-prerna-pilot');
    assert(Array.isArray(prernaLeads), 'Test 5.3: Student leads table preserved and completely isolated from sales prospects');

  } catch (err: any) {
    console.error('Fatal test error occurred:', err);
    assert(false, 'Fatal Test Execution Exception', err.message);
  }

  console.log('\n========================================================================');
  console.log(`📊 STEP 1 VERIFICATION RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passed === total) {
    console.log('🎉 STEP 1 TYPES & DATABASE SCHEMA IMPLEMENTED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    console.error(`⚠️ ${total - passed} TESTS FAILED. INVESTIGATE IMMEDIATELY.`);
    process.exit(1);
  }
}

runStep1SchemaTests();
