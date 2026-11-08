/**
 * ADMITFLOW AI — PHASE 2 VERIFICATION SUITE
 * Tests:
 * 1. Document Indexing & Text Chunking
 * 2. Cross-Tenant RAG Isolation (Institute 1 vs Institute 2)
 * 3. Exact Fee Calculation & Zero Hallucination
 * 4. All 12 AI Agent Skills Execution
 * 5. Audit Logging in agent_executions table
 */

import { db } from '../lib/db';
import { AgentOrchestrator } from '../lib/agent';
import { indexDocument, searchKnowledgeBrain } from '../lib/rag';

async function runPhase2Tests() {
  console.log('================================================================');
  console.log('🔬 STARTING PHASE 2: RAG KNOWLEDGE BRAIN & AGENT SKILLS AUDIT');
  console.log('================================================================\n');

  const inst1Id = 'inst-apex-001';
  const inst2Id = 'inst-codecraft-002';

  const agent1 = new AgentOrchestrator(inst1Id);
  const agent2 = new AgentOrchestrator(inst2Id);

  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, details: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${name}`);
      console.log(`   Details: ${details}\n`);
    } else {
      console.error(`❌ [FAIL] ${name}`);
      console.error(`   Details: ${details}\n`);
      process.exit(1);
    }
  }

  // TEST 1: Index a new document for Institute 2 (CodeCraft Academy)
  console.log('--- Step 1: Testing Document Indexing & Chunking ---');
  const codeCraftBrochure = `CODECRAFT AI ACADEMY 2026 OFFICIAL CURRICULUM & ADMISSION GUIDELINES
1. Course: Full Stack AI Software Engineering Bootcamp (Duration: 24 weeks).
2. Base Tuition Fee: ₹85,000 payable in 3 easy installments. First installment is ₹20,000 at enrollment.
3. 100% Placement Guarantee: Students with >85% score in mock assessments get guaranteed interviews at top startups.
4. Timings: Evening Batch starts at 7:00 PM to 9:30 PM (Mon-Fri) designed for working professionals and college students.
5. Refund: 100% refund during the first 7 days trial period without questions asked.`;

  const newDoc = await indexDocument(inst2Id, 'CodeCraft AI 2026 Bootcamp Prospectus', 'PDF', codeCraftBrochure);
  assert(
    'Document Chunking & Vector Indexing',
    newDoc.chunkCount > 0 && newDoc.status === 'INDEXED',
    `Created ${newDoc.chunkCount} vector chunks for Institute 2`
  );

  // TEST 2: Strict Tenant Isolation in RAG Retrieval
  console.log('--- Step 2: Testing Cross-Tenant RAG Isolation ---');
  // Query from Institute 1 (Apex Academy) asking about CodeCraft placement
  const inst1Search = await searchKnowledgeBrain('Placement guarantee and startup interviews', inst1Id);
  // Query from Institute 2 (CodeCraft) asking about CodeCraft placement
  const inst2Search = await searchKnowledgeBrain('Placement guarantee and startup interviews', inst2Id);

  const leakDetected = inst1Search.some(s => s.chunk.instituteId === inst2Id || s.chunk.content.includes('CODECRAFT'));
  const inst2FoundItsData = inst2Search.some(s => s.chunk.instituteId === inst2Id);

  assert(
    'Tenant Vector Isolation Guard',
    !leakDetected && inst2FoundItsData,
    `Institute 1 search returned 0 leaked chunks; Institute 2 successfully retrieved its own data.`
  );

  // TEST 3: Zero-Hallucination Hinglish Fee Retrieval
  console.log('--- Step 3: Testing Grounded Hinglish Fee Query ---');
  const feeQuery = await agent1.answer_enquiry('Apex mein Target JEE 2027 batch ki fees kitni hai?', 'hinglish');
  const feeGrounded = feeQuery.data?.answer?.includes('1,45,000') || feeQuery.data?.answer?.includes('145000');
  assert(
    'Zero-Hallucination Fee Answering (Hinglish)',
    Boolean(feeQuery.success && feeGrounded && feeQuery.data?.isGrounded),
    `Answer: "${feeQuery.data?.answer?.slice(0, 80)}..."`
  );

  // TEST 4: The 12 Reusable Agent Skills Execution
  console.log('--- Step 4: Testing The 12 Reusable Agent Skills ---');

  // Skill 1: answer_enquiry
  const s1 = await agent1.answer_enquiry('Hostel aur mess facility Kota campus mein hai kya?', 'hinglish');
  assert('Skill 1: answer_enquiry', s1.success && s1.data?.isGrounded, 'Retrieved hostel details from chunk');

  // Skill 2: qualify_lead
  const s2 = await agent1.qualify_lead('lead-01', 'Student wants immediate admission and hostel confirmation');
  assert('Skill 2: qualify_lead', s2.success && s2.data?.leadScore >= 80, `Lead score updated to ${s2.data?.leadScore}`);

  // Skill 3: create_lead
  const s3 = await agent1.create_lead({
    studentName: 'Siddharth Saxena',
    phone: '+91-987' + Date.now().toString().slice(-7),
    courseNameOrId: 'Target JEE (Main + Advanced) 2027',
    source: 'WEBSITE_CHAT'
  });
  assert('Skill 3: create_lead', s3.success && s3.data?.id, `Created lead ID: ${s3.data?.id}`);

  // Skill 4: update_lead
  const s4 = await agent1.update_lead(s3.data.id, { status: 'INTERESTED', leadScore: 75 });
  assert('Skill 4: update_lead', s4.success && s4.data?.status === 'INTERESTED', 'Status updated to INTERESTED');

  // Skill 5: retrieve_course_details
  const s5 = await agent1.retrieve_course_details('Target JEE');
  assert('Skill 5: retrieve_course_details', s5.success && s5.data?.course?.code === 'JEE-T27', `Found course: ${s5.data?.course?.name}`);

  // Skill 6: retrieve_fee_details
  const s6 = await agent1.retrieve_fee_details('course-jee-target', 10);
  assert('Skill 6: retrieve_fee_details', s6.success && s6.data?.netPayable === 130500, `Net fee calculated with 10% discount: ₹${s6.data?.netPayable}`);

  // Skill 7: check_batch_availability
  const s7 = await agent1.check_batch_availability('course-jee-target');
  assert('Skill 7: check_batch_availability', s7.success && s7.data?.length > 0, `Open batches found: ${s7.data?.length}`);

  // Skill 8: schedule_counselling
  const dynamicSlotP2 = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + Math.floor(Math.random() * 10000000)).toISOString();
  const s8 = await agent1.schedule_counselling({
    leadId: s3.data.id,
    scheduledAt: dynamicSlotP2,
    counsellorId: 'user-counsellor-01',
    mode: 'ONLINE_MEET'
  });
  assert('Skill 8: schedule_counselling', s8.success && s8.data?.id, `Appointment created ID: ${s8.data?.id}`);

  // Skill 9: create_followup
  const s9 = await agent1.create_followup({
    leadId: s3.data.id,
    dueDate: '2026-11-14T10:00:00Z',
    suggestedMessage: 'Namaste Siddharth! Following up on your JEE counseling slot.',
    channel: 'WHATSAPP'
  });
  assert('Skill 9: create_followup', s9.success && s9.requiresHumanApproval === true, 'Task created requiring human approval');

  // Skill 10: generate_lead_report
  const s10 = await agent1.generate_lead_report();
  assert('Skill 10: generate_lead_report', s10.success && s10.data?.totalLeads > 0, `Report compiled: ${s10.data?.totalLeads} total leads`);

  // Skill 11: identify_dropoffs
  const s11 = await agent1.identify_dropoffs();
  assert('Skill 11: identify_dropoffs', s11.success, `Identified drop-off candidates successfully`);

  // Skill 12: recommend_next_action
  const s12 = await agent1.recommend_next_action(s3.data.id);
  assert('Skill 12: recommend_next_action', s12.success && s12.data?.recommendedAction, `Next Action: ${s12.data?.recommendedAction}`);

  // TEST 5: Verify Agent Executions Audit Trail in Database
  console.log('--- Step 5: Verifying Agent Executions Audit Logging ---');
  const logs = db.getAgentExecutions(inst1Id);
  assert(
    'Audit Trail Logging',
    logs.length >= 12,
    `Logged ${logs.length} agent skill executions in persistent DB`
  );

  console.log('================================================================');
  console.log(`🎉 ALL PHASE 2 TESTS PASSED! (${passed}/${total})`);
  console.log('================================================================\n');
}

runPhase2Tests().catch(err => {
  console.error('Fatal error in Phase 2 tests:', err);
  process.exit(1);
});
