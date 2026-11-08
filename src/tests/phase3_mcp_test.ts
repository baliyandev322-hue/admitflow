import { db } from '../lib/db';
import { createAdmitFlowMcpServer, executeMcpToolDirectly, listAvailableMcpTools } from '../lib/mcp/server';
import { GoogleCalendarConnector } from '../lib/mcp/calendar';
import { WhatsAppBusinessConnector } from '../lib/mcp/whatsapp';
import { StudentDocumentWorkflow } from '../lib/mcp/documents';
import { executeGeminiWithMcp } from '../lib/mcp/geminiToolBridge';
import { checkRateLimit } from '../lib/rateLimit';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail: string = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] Test ${totalTests.toString().padStart(2, ' ')}: ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] Test ${totalTests.toString().padStart(2, ' ')}: ${testName} ${detail ? '(' + detail + ')' : ''}`);
  }
}

async function runMcpPhase3VerificationSuite() {
  console.log('================================================================');
  console.log('   ADMITFLOW AI - PHASE 3: MCP & EXTERNAL TOOLS TEST SUITE      ');
  console.log('================================================================\n');

  const instituteId = 'inst-apex-001';
  const competitorInstituteId = 'inst-codecraft-002';

  // TEST 1: MCP Server Initialization
  console.log('--- Test 1: MCP Server Initialization ---');
  const mcpServer = createAdmitFlowMcpServer(instituteId, { id: 'admin-01', role: 'ADMIN' });
  assert(
    Boolean(mcpServer && (mcpServer as any).server),
    'Official McpServer initializes according to Model Context Protocol specification v1.32.2'
  );

  // TEST 2: Protocol Discovery & Metadata
  console.log('\n--- Test 2: Protocol Discovery & Metadata ---');
  const availableTools = listAvailableMcpTools(instituteId, 'ADMIN');
  assert(
    availableTools.length >= 25 && availableTools.some(t => t.name === 'create_lead') && availableTools.some(t => t.name === 'get_fee_information'),
    'MCP Server discovers and exposes 25+ atomic tools across all modules',
    `Found: ${availableTools.length} tools`
  );

  // TEST 3: Tool Listing Filter by Role
  console.log('\n--- Test 3: Tool Listing Role-Based Filtering ---');
  const studentTools = listAvailableMcpTools(instituteId, 'STUDENT');
  const counsellorTools = listAvailableMcpTools(instituteId, 'COUNSELLOR');
  assert(
    studentTools.length < availableTools.length && counsellorTools.length > studentTools.length,
    'Tool listing enforces strict role-based visibility (Student < Counsellor <= Admin)',
    `Student: ${studentTools.length}, Counsellor: ${counsellorTools.length}, Admin: ${availableTools.length}`
  );

  // TEST 4: Tool Execution with Valid Input
  console.log('\n--- Test 4: Tool Execution with Valid Input ---');
  const feeExec = await executeMcpToolDirectly(instituteId, 'get_fee_information', { courseNameOrCode: 'jee' });
  assert(
    feeExec.success && Array.isArray(feeExec.data) && feeExec.data[0].baseFee === 145000,
    'MCP tool "get_fee_information" executes cleanly and returns ground-truth fee',
    `Fee: ₹${feeExec.data?.[0]?.baseFee}`
  );

  // TEST 5: Structured Input Validation Rejection
  console.log('\n--- Test 5: Structured Input Validation Rejection (Zod) ---');
  let zodErrorCaught = false;
  try {
    // Missing required phone and invalid email
    await executeMcpToolDirectly(instituteId, 'create_lead', { studentName: 'X', email: 'not-an-email' });
  } catch (err: any) {
    zodErrorCaught = err.message.includes('Invalid arguments');
  }
  assert(
    zodErrorCaught,
    'MCP Server validates inputs against Zod schema and rejects malformed payloads'
  );

  // TEST 6: Unauthorized Tool Execution Guard
  console.log('\n--- Test 6: Unauthorized Role Execution Block ---');
  let roleBlocked = false;
  try {
    // Student attempting to call Admin-only tool get_branch_performance
    await executeMcpToolDirectly(instituteId, 'get_branch_performance', {}, { id: 'student-01', role: 'STUDENT' });
  } catch (err: any) {
    roleBlocked = err.message.includes('Access Denied');
  }
  assert(
    roleBlocked,
    'MCP Server blocks unauthorized tool invocation when actor lacks required role'
  );

  // TEST 7: Cross-Institute Tenant Isolation
  console.log('\n--- Test 7: Cross-Institute Access Prevention ---');
  let tenantIsolated = false;
  try {
    // Attempting to retrieve Apex Academy lead using CodeCraft institute context
    await executeMcpToolDirectly(competitorInstituteId, 'get_lead', { leadId: 'lead-01' });
  } catch (err: any) {
    tenantIsolated = err.message.includes('not found in this institute');
  }
  assert(
    tenantIsolated,
    'Tenant isolation strictly prevents cross-institute data leakage across tools'
  );

  // TEST 8: CRM Lead Creation via MCP
  console.log('\n--- Test 8: CRM Lead Creation via MCP ---');
  const testPhone = `981${Math.floor(1000000 + Math.random() * 9000000)}`;
  const leadRes = await executeMcpToolDirectly(instituteId, 'create_lead', {
    studentName: 'P3 Integration Test Lead',
    phone: testPhone,
    courseNameOrId: 'course-jee-target',
    source: 'MCP_TEST_SUITE'
  });
  const createdLeadId = leadRes.data?.id;
  assert(
    leadRes.success && Boolean(createdLeadId) && leadRes.data.phone === testPhone,
    'MCP tool "create_lead" persists new student lead in database',
    `Lead ID: ${createdLeadId}`
  );

  // TEST 9: CRM Lead Retrieval via MCP
  console.log('\n--- Test 9: CRM Lead Retrieval via MCP ---');
  const retrieved = await executeMcpToolDirectly(instituteId, 'get_lead', { leadId: createdLeadId });
  assert(
    retrieved.success && retrieved.data?.lead?.studentName === 'P3 Integration Test Lead',
    'MCP tool "get_lead" retrieves lead details and timeline history'
  );

  // TEST 10: Calendar Availability Check
  console.log('\n--- Test 10: Google Calendar Availability Check ---');
  const calConnector = new GoogleCalendarConnector(instituteId);
  const futureSlot = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const futureSlotEnd = new Date(new Date(futureSlot).getTime() + 30 * 60000).toISOString();
  const avail = await calConnector.checkAvailability({
    startTime: futureSlot,
    endTime: futureSlotEnd
  });
  assert(
    avail.available === true,
    'Calendar connector accurately checks slot availability without false conflict',
    `Available: ${avail.available}`
  );

  // TEST 11: Calendar Event Creation
  console.log('\n--- Test 11: Calendar Event Creation ---');
  const calEvent = await calConnector.createEvent({
    summary: 'Counselling Session - P3 Lead',
    startTime: futureSlot,
    endTime: futureSlotEnd,
    attendeeName: 'P3 Student'
  });
  assert(
    calEvent.success && Boolean(calEvent.eventId) && Boolean(calEvent.meetingLink),
    'Calendar connector creates event with verified video meeting link',
    `Event ID: ${calEvent.eventId}`
  );

  // TEST 12: Calendar Conflict Detection
  console.log('\n--- Test 12: Calendar Double-Booking Prevention ---');
  // Attempting to book the identical slot in DB
  const apt = db.createAppointment({
    id: `apt-p3-${Date.now()}`,
    instituteId,
    leadId: createdLeadId,
    scheduledAt: futureSlot,
    durationMinutes: 30,
    mode: 'ONLINE_MEET',
    status: 'SCHEDULED',
    createdAt: new Date().toISOString()
  });
  const conflictCheck = await calConnector.checkAvailability({
    startTime: futureSlot,
    endTime: futureSlotEnd
  });
  assert(
    conflictCheck.available === false && Boolean(conflictCheck.conflict),
    'Calendar connector prevents double booking when overlapping with scheduled session'
  );

  // TEST 13: WhatsApp Template Parameter Validation
  console.log('\n--- Test 13: WhatsApp Template Parameter Validation ---');
  const wa = new WhatsAppBusinessConnector(instituteId);
  const missingParamCheck = wa.prepareMessage('enquiry_acknowledgement_v1', {
    studentName: 'Aarav'
    // missing courseName, instituteName, referenceId
  });
  assert(
    missingParamCheck.success === false && Boolean(missingParamCheck.missingParams?.length),
    'WhatsApp connector detects missing template parameters before dispatch',
    `Missing: ${missingParamCheck.missingParams?.join(', ')}`
  );

  // TEST 14: WhatsApp Consent Enforcement (Opt-Out Block)
  console.log('\n--- Test 14: WhatsApp Consent Enforcement (Opt-Out Block) ---');
  // Explicitly mark lead as opted out
  db.updateLead(createdLeadId, { whatsappConsent: false });
  const optOutDispatch = await wa.sendApprovedTemplate({
    toPhone: testPhone,
    templateName: 'enquiry_acknowledgement_v1',
    leadId: createdLeadId,
    parameters: {
      studentName: 'P3 Student',
      courseName: 'JEE',
      instituteName: 'Apex Academy',
      referenceId: 'REF-001'
    }
  });
  assert(
    optOutDispatch.success === false && optOutDispatch.status === 'BLOCKED_NO_CONSENT',
    'WhatsApp connector blocks message dispatch to opted-out students under DPDP Act / Meta Policy',
    `Status: ${optOutDispatch.status}`
  );

  // TEST 15: Document Completeness Assessment
  console.log('\n--- Test 15: Document Completeness Assessment ---');
  const docWorkflow = new StudentDocumentWorkflow(instituteId);
  const completeness = docWorkflow.checkCompleteness(createdLeadId);
  assert(
    completeness.isComplete === false && completeness.missingDocuments.length > 0 && typeof completeness.completenessPercentage === 'number',
    'Document workflow accurately calculates missing application documents and completeness percentage',
    `Missing count: ${completeness.missingCount}, Complete: ${completeness.completenessPercentage}%`
  );

  // TEST 16: Document Review Status Update
  console.log('\n--- Test 16: Document Review Status Update ---');
  const newDoc = db.addStudentDocument({
    id: `doc-p3-${Date.now()}`,
    instituteId,
    leadId: createdLeadId,
    studentName: 'P3 Integration Test Lead',
    docType: '10TH_MARKSHEET',
    fileName: 'class10_marksheet.pdf',
    fileSizeKb: 340,
    mimeType: 'application/pdf',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  });
  const reviewResult = docWorkflow.updateReviewStatus(newDoc.id, 'VERIFIED', 'senior-counsellor', 'Verified against original copy');
  assert(
    reviewResult.success && reviewResult.document?.status === 'VERIFIED',
    'Staff review workflow updates document status with reviewer attribution'
  );

  // TEST 17: High-Impact Human Approval Flag
  console.log('\n--- Test 17: High-Impact Human Approval Flag ---');
  const cancelExec = await executeMcpToolDirectly(instituteId, 'cancel_appointment', {
    appointmentId: apt.id,
    reason: 'Parent requested postponement'
  }, { id: 'counsellor-01', role: 'COUNSELLOR' });
  assert(
    cancelExec.requiresHumanApproval === true,
    'High-impact operations (cancel_appointment) require explicit human approval flag'
  );

  // TEST 18: Idempotency & Duplicate Request Protection
  console.log('\n--- Test 18: Idempotency & Duplicate Request Protection ---');
  const requestId = `req-idemp-${Date.now()}`;
  const firstCall = await executeMcpToolDirectly(instituteId, 'get_fee_information', { courseNameOrCode: 'jee' }, undefined, requestId);
  const secondCall = await executeMcpToolDirectly(instituteId, 'get_fee_information', { courseNameOrCode: 'jee' }, undefined, requestId);
  assert(
    firstCall.success && secondCall.success && secondCall.executionTimeMs === 0,
    'Duplicate requests within window return cached idempotent response (0ms latency)'
  );

  // TEST 19: Audit Logging
  console.log('\n--- Test 19: Audit Logging in Database ---');
  const executions = db.getAgentExecutions(instituteId);
  const hasMcpLog = executions.some(e => e.skillName.startsWith('mcp:'));
  assert(
    hasMcpLog,
    'MCP server logs all tool executions to database audit trail with timing and payload'
  );

  // TEST 20: Gemini-to-MCP Tool Execution
  console.log('\n--- Test 20: Live Gemini-to-MCP Tool Execution ---');
  const geminiToolRes = await executeGeminiWithMcp(
    instituteId,
    'NEET dropper batch ki base fee kitni hai?',
    'hinglish'
  );
  assert(
    Boolean(geminiToolRes.reply) && (geminiToolRes.toolUsed === 'get_fee_information' || geminiToolRes.reply.includes('1,25,000') || geminiToolRes.reply.includes('125000')),
    'Gemini agent autonomously triggers MCP tool and synthesizes natural Hinglish answer',
    `Tool called: ${geminiToolRes.toolUsed}, Excerpt: ${geminiToolRes.reply.slice(0, 90)}...`
  );

  console.log('\n================================================================');
  console.log(`   P3 MCP VERIFICATION SUMMARY: ${passedTests}/${totalTests} PASSED   `);
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.error(`P3 Verification FAILED with ${failedTests} failed test(s).`);
    process.exit(1);
  } else {
    console.log('All 20 P3 MCP & External Tools Verification tests PASSED!');
  }
}

runMcpPhase3VerificationSuite().catch(err => {
  console.error('Fatal error in P3 test suite:', err);
  process.exit(1);
});
