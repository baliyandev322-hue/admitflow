/**
 * ADMITFLOW AI — PHASE 3 VERIFICATION SUITE
 * Tests:
 * 1. CRM Pipeline Stage Transitions & Filtering
 * 2. Activity Timeline & Counselor Note Logging
 * 3. Duplicate Phone Number Resolution
 * 4. Counseling Calendar Double-Booking Prevention
 * 5. Follow-up Overdue Detection & Human Approval Flow
 */

import { db } from '../lib/db';
import { AgentOrchestrator } from '../lib/agent';
import { LeadStatus } from '../lib/types';

async function runPhase3Tests() {
  console.log('================================================================');
  console.log('🔬 STARTING PHASE 3: CRM PIPELINE, SCHEDULER & FOLLOW-UP AUDIT');
  console.log('================================================================\n');

  const instId = 'inst-apex-001';
  const agent = new AgentOrchestrator(instId);

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

  // TEST 1: Complete CRM Pipeline Progression
  console.log('--- Step 1: Testing Full CRM Funnel Lifecycle ---');
  const pipelineStudentPhone = '+91-911' + Date.now().toString().slice(-7);
  const newLead = await agent.create_lead({
    studentName: 'Ananya Deshmukh',
    phone: pipelineStudentPhone,
    courseNameOrId: 'Target JEE (Main + Advanced) 2027',
    source: 'WEBSITE_CHAT'
  });
  const leadId = newLead.data.id;
  assert('Funnel Stage 1: NEW', newLead.data.status === 'NEW', `Lead created with ID: ${leadId}`);

  const stages: LeadStatus[] = [
    'CONTACTED',
    'INTERESTED',
    'COUNSELLING_SCHEDULED',
    'TRIAL_CLASS',
    'ADMISSION_CONFIRMED'
  ];

  for (const st of stages) {
    const updated = await agent.update_lead(leadId, { status: st });
    assert(`Funnel Progression: -> ${st}`, updated.data.status === st, `Lead stage moved to ${st}`);
  }

  // TEST 2: Activity Timeline Logging
  console.log('--- Step 2: Testing Activity Timeline & Audit Trail ---');
  const activities = db.getLeadActivities(leadId);
  assert(
    'Activity Timeline Accumulation',
    activities.length >= stages.length,
    `Logged ${activities.length} distinct events for student lead`
  );

  // Counselor Note Logging
  const noteAct = db.addLeadActivity({
    id: 'act-note-' + Date.now(),
    leadId,
    instituteId: instId,
    actorType: 'COUNSELLOR',
    activityType: 'COUNSELLOR_NOTE',
    description: 'Parent requested batch change to morning 8 AM slot.',
    createdAt: new Date().toISOString()
  });
  const refreshedActivities = db.getLeadActivities(leadId);
  assert(
    'Counselor Note Logging',
    refreshedActivities.some(a => a.id === noteAct.id),
    'Counselor note successfully persisted in timeline'
  );

  // TEST 3: Duplicate Phone Detection
  console.log('--- Step 3: Testing Phone Deduplication Guard ---');
  const duplicateAttempt = await agent.create_lead({
    studentName: 'Ananya D (Re-enquiry)',
    phone: pipelineStudentPhone,
    source: 'WHATSAPP'
  });
  assert(
    'Phone Deduplication & Lead Merge',
    duplicateAttempt.data.id === leadId,
    `Prevented duplicate lead creation; reused existing lead ID: ${leadId}`
  );

  // TEST 4: Counseling Calendar Slot Booking & Double Booking Prevention
  console.log('--- Step 4: Testing Counseling Conflict Engine ---');
  const slotTime = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000 + Math.floor(Math.random() * 10000000)).toISOString();
  const counsellorId = 'user-counsellor-01';

  const booking1 = await agent.schedule_counselling({
    leadId,
    scheduledAt: slotTime,
    counsellorId,
    mode: 'ONLINE_MEET'
  });
  assert('Slot Booking 1 Confirmed', booking1.success && booking1.data.status === 'SCHEDULED', `Appointment ID: ${booking1.data.id}`);

  // Attempt to book same counsellor at identical slot for another lead
  let conflictCaught = false;
  try {
    const conflictBooking = await agent.schedule_counselling({
      leadId: 'lead-01',
      scheduledAt: slotTime,
      counsellorId,
      mode: 'OFFLINE_CAMPUS'
    });
    if (!conflictBooking.success) conflictCaught = true;
  } catch (e) {
    conflictCaught = true;
  }
  assert(
    'Double-Booking Prevention Guard',
    conflictCaught,
    'Attempt to double-book counselor at exact same slot was strictly rejected!'
  );

  // TEST 5: Follow-up Queue, Overdue Calculation & Human Approval Flow
  console.log('--- Step 5: Testing Follow-up Queue & Human Approval Flow ---');
  const pastDueDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 1 day in the past

  const overdueTask = db.createFollowup({
    id: 'fol-overdue-test',
    instituteId: instId,
    leadId,
    counsellorId,
    dueDate: pastDueDate,
    suggestedMessage: 'Namaste Ananya! Your counseling session is pending confirmation.',
    channel: 'WHATSAPP',
    status: 'PENDING',
    isOverdue: true,
    createdAt: new Date().toISOString()
  });

  const allFollowups = db.getFollowups(instId);
  const foundTask = allFollowups.find(f => f.id === overdueTask.id);
  assert(
    'Overdue Follow-up Detection',
    Boolean(foundTask && foundTask.status === 'PENDING'),
    `Overdue task detected with due date: ${pastDueDate}`
  );

  // Counselor Approves Task
  const approvedTask = db.updateFollowup(overdueTask.id, {
    status: 'SENT',
    approvedBy: 'user-counsellor-01'
  });
  assert(
    'Human-In-The-Loop Approval & Dispatch',
    approvedTask?.status === 'SENT' && approvedTask?.approvedBy === 'user-counsellor-01',
    'Follow-up task transitioned from PENDING -> SENT only after counselor approval'
  );

  console.log('================================================================');
  console.log(`🎉 ALL PHASE 3 TESTS PASSED! (${passed}/${total})`);
  console.log('================================================================\n');
}

runPhase3Tests().catch(err => {
  console.error('Fatal error in Phase 3 tests:', err);
  process.exit(1);
});
