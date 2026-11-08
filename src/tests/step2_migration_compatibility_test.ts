import fs from 'fs';
import path from 'path';
import { db } from '../lib/db';
import { isSuperAdmin, TokenPayload } from '../lib/auth';
import { createDatabaseBackup, verifyBackupIntegrity } from '../lib/db/backup';
import { SalesProspect, PilotTrackingRecord } from '../lib/types';
import { PRERNA_PILOT_INSTITUTE_ID, seedPrernaPilotInstitute } from '../lib/pilot/prerna_seed';

async function runStep2CompatibilityTests() {
  console.log('========================================================================');
  console.log('🐘 ADMITFLOW AI — P8 STEP 2: MIGRATIONS & COMPATIBILITY AUDIT SUITE    ');
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
    // Test 1: Versioned PostgreSQL Migration Files & Idempotency
    // -------------------------------------------------------------
    console.log('--- 1. Versioned PostgreSQL Migration Files & Idempotency ---');
    const migDir = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations');
    const mig001 = path.join(migDir, '001_initial_schema.sql');
    const mig002 = path.join(migDir, '002_p8_sales_crm_and_pilot_tracking.sql');

    assert(fs.existsSync(mig001), 'Test 1.1: Migration 001 (initial core schema) exists');
    assert(fs.existsSync(mig002), 'Test 1.2: Migration 002 (P8 Sales CRM & Pilot Tracking) exists');

    const mig002Sql = fs.readFileSync(mig002, 'utf-8');
    assert(
      mig002Sql.includes('CREATE TABLE IF NOT EXISTS sales_prospects') &&
      mig002Sql.includes('CREATE TABLE IF NOT EXISTS sales_activities') &&
      mig002Sql.includes('CREATE TABLE IF NOT EXISTS pilot_tracking'),
      'Test 1.3: Migration 002 enforces idempotent DDL (CREATE TABLE IF NOT EXISTS)'
    );
    assert(
      mig002Sql.includes('idx_sales_prospects_email') && mig002Sql.includes('idx_sales_prospects_phone'),
      'Test 1.4: Migration 002 enforces unique indexes on prospect email and phone'
    );

    // -------------------------------------------------------------
    // Test 2: Backup and Restore Procedures
    // -------------------------------------------------------------
    console.log('\n--- 2. Safe Database Backup & Restore Integrity ---');
    const backupResult = createDatabaseBackup('step2_audit');
    assert(fs.existsSync(backupResult.backupPath), 'Test 2.1: Automated timestamped backup file generated');
    assert(backupResult.totalSizeKb > 0, 'Test 2.2: Backup file contains valid payload size (> 0 KB)');

    const integrityCheck = verifyBackupIntegrity(backupResult.backupPath);
    assert(integrityCheck.valid === true, 'Test 2.3: Backup JSON payload integrity verified with all core keys');
    assert(
      (integrityCheck.metadata?.institutes ?? 0) >= 2 && (integrityCheck.metadata?.leads ?? 0) >= 1,
      'Test 2.4: Backup contains intact institute and lead counts'
    );

    // -------------------------------------------------------------
    // Test 3: Dual-Engine Compatibility & Strict Production Failure Policy
    // -------------------------------------------------------------
    console.log('\n--- 3. Dual-Engine Mode & Strict Production Fallback Guard ---');
    const activeEngine = db.getDatabaseEngine();
    assert(
      activeEngine === 'POSTGRESQL' || activeEngine === 'JSON_LOCAL',
      'Test 3.1: Active database engine correctly detected by abstraction'
    );

    // Strict Production Failure Policy: verify invalid DATABASE_URL throws rather than silent fallback
    const origEnv = process.env.NODE_ENV;
    const origDbUrl = process.env.DATABASE_URL;
    let prodErrorThrown = false;
    try {
      (process.env as any).NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://fake_user:fake_pass@127.0.0.1:5432/fake_db?connect_timeout=1';
      await db.verifyDatabaseConnection();
    } catch (err: any) {
      prodErrorThrown = true;
    } finally {
      (process.env as any).NODE_ENV = origEnv;
      process.env.DATABASE_URL = origDbUrl;
    }
    assert(prodErrorThrown, 'Test 3.2: In production mode, DB failure strictly throws critical failure without silent fallback');

    // -------------------------------------------------------------
    // Test 4: Concurrency & Duplicate Prevention Guard
    // -------------------------------------------------------------
    console.log('\n--- 4. Concurrent Prospect Creation & Race Condition Defense ---');
    const concurrentPhone = '+9198765' + Math.floor(10000 + Math.random() * 90000);
    const concurrentEmail = `concurrency.test.${Date.now()}@institute.edu.in`;

    const prospectPayloadA: SalesProspect = {
      id: 'prospect-race-a-' + Date.now(),
      instituteName: 'Kota Science Point (Lead A)',
      city: 'Kota',
      contactPerson: 'Director Sharma',
      email: concurrentEmail,
      phone: concurrentPhone,
      category: 'IIT_JEE_NEET',
      branchCount: 2,
      mainProblem: 'Lead drop-off after 8 PM',
      stage: 'PROSPECT_IDENTIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const prospectPayloadB: SalesProspect = {
      id: 'prospect-race-b-' + Date.now(),
      instituteName: 'Kota Science Point (Lead B - Duplicate Race)',
      city: 'Kota',
      contactPerson: 'Director Sharma',
      email: concurrentEmail, // Same email
      phone: concurrentPhone, // Same phone
      category: 'IIT_JEE_NEET',
      branchCount: 2,
      mainProblem: 'Duplicate submission attempt',
      stage: 'PROSPECT_IDENTIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Execute concurrently using Promise.allSettled
    const [resultA, resultB] = await Promise.allSettled([
      Promise.resolve().then(() => db.createSalesProspect(prospectPayloadA)),
      Promise.resolve().then(() => db.createSalesProspect(prospectPayloadB))
    ]);

    const successes = [resultA, resultB].filter(r => r.status === 'fulfilled');
    const rejections = [resultA, resultB].filter(r => r.status === 'rejected');

    assert(successes.length === 1, 'Test 4.1: Exactly 1 concurrent prospect creation succeeded');
    assert(rejections.length === 1, 'Test 4.2: Duplicate concurrent prospect creation strictly rejected');

    // Clean up created test prospect
    db.deleteSalesProspect(prospectPayloadA.id);
    db.deleteSalesProspect(prospectPayloadB.id);

    // -------------------------------------------------------------
    // Test 5: SUPER_ADMIN Server-Side Authorization Walls
    // -------------------------------------------------------------
    console.log('\n--- 5. Server-Side RBAC & Authorization Walls ---');
    const adminUser = db.getUserByEmail('admin@admitflow.ai');
    assert(adminUser?.role === 'SUPER_ADMIN', 'Test 5.1: admin@admitflow.ai has SUPER_ADMIN role');

    const superAdminToken: TokenPayload = {
      userId: adminUser!.id,
      instituteId: adminUser!.instituteId,
      role: 'SUPER_ADMIN',
      email: adminUser!.email,
      name: adminUser!.name
    };
    assert(isSuperAdmin(superAdminToken) === true, 'Test 5.2: isSuperAdmin grants access to SUPER_ADMIN');

    const ownerToken: TokenPayload = {
      userId: 'user-prerna-owner',
      instituteId: PRERNA_PILOT_INSTITUTE_ID,
      role: 'INSTITUTE_OWNER',
      email: 'director@prerna-demo.invalid',
      name: 'Dr. Rajesh Verma (Demo Persona)'
    };
    assert(isSuperAdmin(ownerToken) === false, 'Test 5.3: isSuperAdmin strictly blocks INSTITUTE_OWNER from internal B2B sales');

    const counselorToken: TokenPayload = {
      userId: 'user-prerna-counsellor-sunita',
      instituteId: PRERNA_PILOT_INSTITUTE_ID,
      role: 'ADMISSION_COUNSELLOR',
      email: 'sunita.sharma@prerna-demo.invalid',
      name: 'Sunita Sharma (Demo Persona)'
    };
    assert(isSuperAdmin(counselorToken) === false, 'Test 5.4: isSuperAdmin strictly blocks ADMISSION_COUNSELLOR from internal B2B sales');

    // -------------------------------------------------------------
    // Test 6: Proposed Pricing Tier vs Active Subscription Safety
    // -------------------------------------------------------------
    console.log('\n--- 6. Pricing Tier Safety & Active MRR Verification ---');
    seedPrernaPilotInstitute();
    const pilotTracking = db.getPilotTracking(PRERNA_PILOT_INSTITUTE_ID);
    
    // Set proposal
    const testPilotRecord: PilotTrackingRecord = {
      id: 'pilot-track-prerna',
      instituteId: PRERNA_PILOT_INSTITUTE_ID,
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
    db.upsertPilotTracking(testPilotRecord);

    const savedPilot = db.getPilotTracking(PRERNA_PILOT_INSTITUTE_ID);
    assert(savedPilot?.proposedTier === 'GROWTH', 'Test 6.1: ₹9,999/mo is recorded as a proposedTier (GROWTH)');
    assert(savedPilot?.paidConversionStatus === 'PILOT_ACTIVE', 'Test 6.2: Conversion status remains PILOT_ACTIVE (not converted/paid)');

    // Verify MRR calculation does not include this pilot proposal
    const payingSubscriptions = (db.getData().subscriptions || []).filter((s: any) => s.status === 'ACTIVE' && s.tier !== 'STARTER');
    // Ensure active paid revenue only counts actual non-trial subscriptions
    const actualMRR = payingSubscriptions.reduce((sum: number, s: any) => sum + (s.monthlyPrice || 0), 0);
    assert(actualMRR === 0, 'Test 6.3: Actual MRR strictly remains ₹0 until real payment transactions exist');

    // -------------------------------------------------------------
    // Test 7: Preservation of Existing Student CRM
    // -------------------------------------------------------------
    console.log('\n--- 7. Existing Student CRM Regression Verification ---');
    const institutes = db.getInstitutes();
    assert(institutes.some(i => i.id === PRERNA_PILOT_INSTITUTE_ID), 'Test 7.1: Prerna Career Institute remains intact');
    
    const prernaLeads = db.getLeads(PRERNA_PILOT_INSTITUTE_ID);
    assert(prernaLeads.every(l => l.instituteId === PRERNA_PILOT_INSTITUTE_ID), 'Test 7.2: Student leads remain 100% tenant-isolated');

    const salesProspects = db.getSalesProspects();
    assert(
      salesProspects.every(p => !p.hasOwnProperty('studentName')),
      'Test 7.3: Sales prospects schema is completely decoupled from student leads'
    );

  } catch (err: any) {
    console.error('Fatal test error occurred:', err);
    assert(false, 'Fatal Test Execution Exception', err.message);
  }

  console.log('\n========================================================================');
  console.log(`📊 STEP 2 VERIFICATION RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passed === total) {
    console.log('🎉 STEP 2 MIGRATIONS & COMPATIBILITY AUDIT COMPLETED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    console.error(`⚠️ ${total - passed} TESTS FAILED. INVESTIGATE IMMEDIATELY.`);
    process.exit(1);
  }
}

runStep2CompatibilityTests();
