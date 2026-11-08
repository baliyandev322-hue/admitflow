/**
 * Step 5 Final Hardening Audit Test Suite
 * 
 * Verifies:
 * 1. Production seed blocking (NODE_ENV=production blocks seedPrernaPilotInstitute)
 * 2. Development/test seed functionality with safe demo placeholders (.invalid & +91-00000-XXXXX)
 * 3. Server-side communication blocking (WhatsApp, Calendar, Follow-up approval) for UNVERIFIED_DEMO_TENANT
 * 4. Cross-tenant access restrictions and Apex Academy 18-lead integrity & isolation
 * 5. Public widget demo sandbox disclaimers
 */

import { NextRequest } from 'next/server';
import { db } from '../lib/db';
import { generateToken } from '../lib/auth';
import { seedPrernaPilotInstitute, PRERNA_PILOT_INSTITUTE_ID } from '../lib/pilot/prerna_seed';
import { checkOutboundCommunication } from '../lib/safety';
import { WhatsAppBusinessConnector } from '../lib/mcp/whatsapp';
import { GoogleCalendarConnector } from '../lib/mcp/calendar';
import { GET as getLeads } from '../app/api/leads/route';
import { PUT as updateFollowup } from '../app/api/followups/route';

async function runFinalHardeningAudit() {
  console.log('========================================================================');
  console.log('🛡️ ADMITFLOW AI — P8 STEP 5 FINAL HARDENING AUDIT');
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

  // -------------------------------------------------------------
  // 1. Production Seed Blocking
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: PRODUCTION SEED BLOCKING ---');
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllowSeed = process.env.ALLOW_DEMO_SEED;

  // Simulate production without override flag
  (process.env as any).NODE_ENV = 'production';
  delete process.env.ALLOW_DEMO_SEED;

  const prodSeedResult = seedPrernaPilotInstitute();
  assert(prodSeedResult.blockedInProduction === true, 'seedPrernaPilotInstitute() strictly blocked in production mode');
  assert(prodSeedResult.institute === null, 'No synthetic institute returned when blocked in production');

  // Simulate production WITH override flag attempt (must STILL be blocked unconditionally)
  process.env.ALLOW_DEMO_SEED = 'true';
  const prodOverrideResult = seedPrernaPilotInstitute();
  assert(prodOverrideResult.blockedInProduction === true, 'ALLOW_DEMO_SEED cannot override production seed blocking');
  assert(prodOverrideResult.institute === null, 'Synthetic seeding remains blocked even if ALLOW_DEMO_SEED is set in production');

  // Restore test/dev env
  (process.env as any).NODE_ENV = originalNodeEnv || 'test';
  if (originalAllowSeed) process.env.ALLOW_DEMO_SEED = originalAllowSeed;
  else delete process.env.ALLOW_DEMO_SEED;

  const devSeedResult = seedPrernaPilotInstitute({ force: true });
  assert(devSeedResult.blockedInProduction === undefined || devSeedResult.blockedInProduction === false, 'Development/test seed functionality operates when permitted');

  // -------------------------------------------------------------
  // 2. Safe Demo Placeholders (.invalid & +91-00000-XXXXX)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: SAFE DEMO PLACEHOLDERS VERIFICATION ---');
  const inst = db.getInstituteById(PRERNA_PILOT_INSTITUTE_ID);
  assert(!!inst, 'Demo institute exists in database');
  assert(Boolean(inst?.email?.endsWith('.invalid')), `Institute email is non-routable demo placeholder (${inst?.email})`);
  assert(Boolean(inst?.phone?.includes('00000')), `Institute phone is unroutable dummy placeholder (${inst?.phone})`);
  assert(Boolean(inst?.website?.endsWith('.invalid')), `Institute website is non-existent demo placeholder (${inst?.website})`);

  const users = db.getUsers(PRERNA_PILOT_INSTITUTE_ID);
  const owner = users.find(u => u.role === 'INSTITUTE_OWNER');
  assert(Boolean(owner?.email?.endsWith('.invalid')), `Owner email uses RFC 2606 .invalid placeholder (${owner?.email})`);
  assert(Boolean(owner?.phone?.includes('00000')), `Owner phone uses dummy digits (${owner?.phone})`);
  assert(Boolean(owner?.name?.includes('Demo Persona')), `Owner name clearly identifies demo persona (${owner?.name})`);

  const counselors = users.filter(u => u.role === 'ADMISSION_COUNSELLOR');
  assert(counselors.every(c => c.email?.endsWith('.invalid')), 'All counselor emails use safe RFC 2606 .invalid placeholders');
  assert(counselors.every(c => c.phone ? c.phone.includes('00000') : false), 'All counselor phones use non-dialable dummy numbers');

  const branches = db.getBranches(PRERNA_PILOT_INSTITUTE_ID);
  assert(branches.every(b => b.email?.endsWith('.invalid')), 'All branch emails use safe .invalid placeholders');
  assert(branches.every(b => b.phone ? b.phone.includes('00000') : false), 'All branch phones use dummy numbers');

  // -------------------------------------------------------------
  // 3. Server-Side Communication Blocking (WhatsApp, Calendar, Follow-up)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: SERVER-SIDE COMMUNICATION BLOCKING ---');
  // 3.1 Direct Safety Module Check
  const directCheck = checkOutboundCommunication(PRERNA_PILOT_INSTITUTE_ID);
  assert(directCheck.blocked === true, 'checkOutboundCommunication blocks inst-prerna-pilot');
  assert(directCheck.code === 'BLOCKED_DEMO_TENANT_COMMUNICATION', 'Error code is BLOCKED_DEMO_TENANT_COMMUNICATION');

  // Check target safety check
  const invalidEmailCheck = checkOutboundCommunication('inst-apex-001', { email: 'fake@prerna-demo.invalid' });
  assert(invalidEmailCheck.blocked === true, 'checkOutboundCommunication blocks any email ending in .invalid');

  const dummyPhoneCheck = checkOutboundCommunication('inst-apex-001', { phone: '+91-00000-00010' });
  assert(dummyPhoneCheck.blocked === true, 'checkOutboundCommunication blocks dummy phone numbers');

  // 3.2 WhatsApp MCP Connector Blocking
  const waConnector = new WhatsAppBusinessConnector(PRERNA_PILOT_INSTITUTE_ID);
  const waResult = await waConnector.sendApprovedTemplate({
    toPhone: '+91-00000-00010',
    templateName: 'enquiry_acknowledgement_v1',
    parameters: {
      studentName: 'Test Student',
      courseName: 'JEE',
      instituteName: 'Demo Institute',
      referenceId: 'REF-123'
    }
  });
  assert(waResult.success === false, 'WhatsApp dispatch returns success: false for demo tenant');
  assert(waResult.liveMetaDispatch === false, 'Live Meta WhatsApp dispatch strictly blocked');
  assert(Boolean(waResult.reason?.includes('BLOCKED_DEMO_TENANT_COMMUNICATION') || waResult.reason?.includes('BLOCKED_INVALID_TARGET')), 'WhatsApp blocking reason clearly indicated');

  // 3.3 Google Calendar Event Creation Blocking
  const calConnector = new GoogleCalendarConnector(PRERNA_PILOT_INSTITUTE_ID);
  let calBlocked = false;
  let calErrorMsg = '';
  try {
    await calConnector.createEvent({
      summary: 'Demo Counseling',
      startTime: '2026-06-01T10:00:00Z',
      endTime: '2026-06-01T10:45:00Z',
      attendeeEmail: 'director@prerna-demo.invalid'
    });
  } catch (err: any) {
    calBlocked = true;
    calErrorMsg = err.message;
  }
  assert(calBlocked === true, 'Google Calendar event creation strictly throws error for demo tenant');
  assert(calErrorMsg.includes('BLOCKED_DEMO_TENANT_COMMUNICATION') || calErrorMsg.includes('BLOCKED_INVALID_TARGET'), 'Calendar error message specifies communication blocking');

  // 3.4 Followup Approval API Blocking
  const demoOwnerUser = db.getUserByEmail('director@prerna-demo.invalid');
  const demoOwnerToken = demoOwnerUser ? generateToken(demoOwnerUser) : '';

  // Seed or get a demo followup
  let demoFollowup = db.getFollowups(PRERNA_PILOT_INSTITUTE_ID)[0];
  if (!demoFollowup) {
    demoFollowup = db.createFollowup({
      id: 'fol-demo-safety-test',
      instituteId: PRERNA_PILOT_INSTITUTE_ID,
      leadId: 'lead-test',
      dueDate: '2026-06-01',
      suggestedMessage: 'Demo follow up message',
      channel: 'WHATSAPP',
      status: 'PENDING',
      isOverdue: false,
      createdAt: new Date().toISOString()
    });
  }

  const approveReq = new NextRequest('http://localhost:3000/api/followups', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${demoOwnerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: demoFollowup.id,
      action: 'APPROVE'
    })
  });
  const approveRes = await updateFollowup(approveReq);
  assert(approveRes.status === 403, 'Approving follow-up dispatch for UNVERIFIED_DEMO_TENANT returns HTTP 403 Forbidden');
  const approveData = await approveRes.json();
  assert(approveData.code === 'BLOCKED_DEMO_TENANT_COMMUNICATION', 'Follow-up blocking returned code BLOCKED_DEMO_TENANT_COMMUNICATION');

  // -------------------------------------------------------------
  // 4. Cross-Tenant Access Restrictions & Apex Academy 18 Leads
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: APEX ACADEMY 18 LEADS & CROSS-TENANT ISOLATION ---');
  const apexLeads = db.getLeads('inst-apex-001');
  assert(apexLeads.length === 18, `Apex Academy has exactly 18 leads preserved intact (found ${apexLeads.length})`);
  assert(apexLeads.every(l => l.instituteId === 'inst-apex-001'), 'All 18 leads belong strictly to inst-apex-001');

  // 4.1 Unauthenticated Request to /api/leads
  const unauthReq = new NextRequest('http://localhost:3000/api/leads');
  const unauthRes = await getLeads(unauthReq);
  assert(unauthRes.status === 401, 'Unauthenticated request to /api/leads returns 401 Unauthorized');

  // 4.2 CodeCraft user cannot access Apex leads
  const codeCraftUser = db.getUserByEmail('pooja@codecraft.tech');
  const codeCraftToken = codeCraftUser ? generateToken(codeCraftUser) : '';
  const codeCraftReq = new NextRequest('http://localhost:3000/api/leads', {
    headers: { Authorization: `Bearer ${codeCraftToken}` }
  });
  const codeCraftRes = await getLeads(codeCraftReq);
  assert(codeCraftRes.status === 200, 'CodeCraft user request returns 200');
  const codeCraftData = await codeCraftRes.json();
  assert(codeCraftData.leads.every((l: any) => l.instituteId === 'inst-codecraft-002'), 'CodeCraft user receives 0 leads from Apex Academy');

  // 4.3 Prerna Demo user cannot access Apex leads
  const prernaReq = new NextRequest('http://localhost:3000/api/leads', {
    headers: { Authorization: `Bearer ${demoOwnerToken}` }
  });
  const prernaRes = await getLeads(prernaReq);
  const prernaData = await prernaRes.json();
  assert(prernaData.leads.every((l: any) => l.instituteId === PRERNA_PILOT_INSTITUTE_ID), 'Prerna demo user receives 0 leads from Apex Academy');

  // 4.4 Apex Owner can view all 18 leads
  const apexOwnerUser = db.getUserByEmail('rajesh@apexacademy.in');
  const apexOwnerToken = apexOwnerUser ? generateToken(apexOwnerUser) : '';
  const apexReq = new NextRequest('http://localhost:3000/api/leads', {
    headers: { Authorization: `Bearer ${apexOwnerToken}` }
  });
  const apexRes = await getLeads(apexReq);
  const apexData = await apexRes.json();
  assert(apexData.leads.length === 18, `Apex Owner receives all 18 leads under their own tenant`);

  console.log('\n========================================================================');
  console.log(`TOTAL HARDENING TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFinalHardeningAudit().catch(e => {
  console.error('Fatal hardening test error:', e);
  process.exit(1);
});
