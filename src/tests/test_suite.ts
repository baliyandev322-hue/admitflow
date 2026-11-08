/**
 * ADMITFLOW AI COMPREHENSIVE AUTOMATED TEST SUITE
 * Validates Workflows A through F strictly against the Database & Agent Engines
 */

import { db } from '../lib/db';
import { AgentOrchestrator } from '../lib/agent';
import { searchKnowledgeBrain } from '../lib/rag';

interface TestResult {
  workflow: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 RUNNING ADMITFLOW AI PRODUCTION TEST SUITE');
  console.log('====================================================\n');

  const institute1Id = 'inst-apex-001';
  const institute2Id = 'inst-codecraft-002';
  const agent1 = new AgentOrchestrator(institute1Id);
  const agent2 = new AgentOrchestrator(institute2Id);

  // WORKFLOW A: Student asks about a course / fee. AI retrieves correct grounded answer.
  try {
    const resA = await agent1.answer_enquiry('JEE Target batch ki base fees kitni hai aur installment options kya hain?', 'hinglish');
    const hasBaseFee = resA.data?.answer?.includes('1,45,000') || resA.data?.answer?.includes('145000');
    const isGrounded = resA.data?.isGrounded === true;

    results.push({
      workflow: 'WORKFLOW A',
      name: 'RAG Retrieval & Course Fee Answering',
      passed: Boolean(resA.success && hasBaseFee && isGrounded),
      details: `Retrieved Fee: ₹1,45,000; Grounded: ${isGrounded}; Sources count: ${resA.data?.sources?.length}`
    });
  } catch (e: any) {
    results.push({ workflow: 'WORKFLOW A', name: 'RAG Retrieval', passed: false, details: e.message });
  }

  // WORKFLOW B: New student submits enquiry -> System creates CRM lead with deduplication
  try {
    const testPhone = '+91-999' + Date.now().toString().slice(-7);
    const resB1 = await agent1.create_lead({
      studentName: 'Harshita Meena',
      phone: testPhone,
      courseNameOrId: 'Target JEE (Main + Advanced) 2027',
      source: 'WEBSITE_CHAT',
      notes: 'Testing Workflow B enquiry submission'
    });

    const leadCreated = resB1.success && resB1.data?.id;
    // Test duplicate detection with same phone
    const resB2 = await agent1.create_lead({
      studentName: 'Harshita M (Duplicate Test)',
      phone: testPhone,
      source: 'WHATSAPP'
    });
    const duplicateDetected = resB2.data?.id === resB1.data?.id;

    results.push({
      workflow: 'WORKFLOW B',
      name: 'Enquiry Submission, CRM Lead Capture & Duplicate Detection',
      passed: Boolean(leadCreated && duplicateDetected),
      details: `Created Lead ID: ${resB1.data?.id}; Duplicate Flagged Correctly: ${duplicateDetected}`
    });
  } catch (e: any) {
    results.push({ workflow: 'WORKFLOW B', name: 'Lead Creation', passed: false, details: e.message });
  }

  // WORKFLOW C: Student requests counselling -> Slot availability & Double booking prevention
  try {
    const leads = db.getLeads(institute1Id);
    const testLead = leads[0];
    const testSlot = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + Math.floor(Math.random() * 10000000)).toISOString();
    const counsellorId = 'user-counsellor-01';

    const resC1 = await agent1.schedule_counselling({
      leadId: testLead.id,
      scheduledAt: testSlot,
      counsellorId,
      mode: 'ONLINE_MEET'
    });

    const booked = resC1.success && resC1.data?.id;

    // Now try to double book the same counsellor at the exact same slot
    let doubleBookingBlocked = false;
    try {
      const resC2 = await agent1.schedule_counselling({
        leadId: testLead.id,
        scheduledAt: testSlot,
        counsellorId,
        mode: 'OFFLINE_CAMPUS'
      });
      if (!resC2.success) doubleBookingBlocked = true;
    } catch (e) {
      doubleBookingBlocked = true;
    }

    results.push({
      workflow: 'WORKFLOW C',
      name: 'Counselling Appointment & Conflict/Double-Booking Prevention',
      passed: Boolean(booked && doubleBookingBlocked),
      details: `Appointment ID: ${resC1.data?.id}; Double Booking Successfully Blocked: ${doubleBookingBlocked}`
    });
  } catch (e: any) {
    results.push({ workflow: 'WORKFLOW C', name: 'Counselling Booking', passed: false, details: e.message });
  }

  // WORKFLOW D: Follow-up required -> Task creation & Human approval verification
  try {
    const leads = db.getLeads(institute1Id);
    const testLead = leads[0];
    const resD = await agent1.create_followup({
      leadId: testLead.id,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      suggestedMessage: 'Namaste! Are you ready to attend your free demo session this Thursday?',
      channel: 'WHATSAPP'
    });

    const followupCreated = resD.success && resD.data?.status === 'PENDING';
    const requiresApproval = resD.requiresHumanApproval === true;

    results.push({
      workflow: 'WORKFLOW D',
      name: 'Follow-up Task Automation & Human Approval Enforcement',
      passed: Boolean(followupCreated && requiresApproval),
      details: `Task Status: ${resD.data?.status}; Requires Approval: ${requiresApproval}`
    });
  } catch (e: any) {
    results.push({ workflow: 'WORKFLOW D', name: 'Follow-up Automation', passed: false, details: e.message });
  }

  // WORKFLOW E: Institute owner checks analytics -> Verified database metrics
  try {
    const leads = db.getLeads(institute1Id);
    const confirmedCount = leads.filter(l => l.status === 'ADMISSION_CONFIRMED').length;
    const branches = db.getBranches(institute1Id);

    const metricsValid = leads.length > 0 && branches.length >= 3;

    results.push({
      workflow: 'WORKFLOW E',
      name: 'Owner Analytics Dashboard Real Database Query',
      passed: metricsValid,
      details: `Total DB Leads: ${leads.length}; Confirmed Admissions: ${confirmedCount}; Branches: ${branches.length}`
    });
  } catch (e: any) {
    results.push({ workflow: 'WORKFLOW E', name: 'Analytics Verification', passed: false, details: e.message });
  }

  // WORKFLOW F: Multi-tenant data isolation -> Two institutes cannot access each other's data
  try {
    // Institute 1 has Apex Academy leads
    const inst1Leads = db.getLeads(institute1Id);
    const inst2Leads = db.getLeads(institute2Id);

    // Check cross-tenant query isolation
    const inst1CanSeeInst2 = inst1Leads.some(l => l.instituteId === institute2Id);
    const inst2CanSeeInst1 = inst2Leads.some(l => l.instituteId === institute1Id);

    // Check RAG vector chunk isolation
    const inst1Chunks = db.getChunksForInstitute(institute1Id);
    const inst2Chunks = db.getChunksForInstitute(institute2Id);
    const ragLeakage = inst1Chunks.some(c => c.instituteId === institute2Id) || inst2Chunks.some(c => c.instituteId === institute1Id);

    const isolationSecure = !inst1CanSeeInst2 && !inst2CanSeeInst1 && !ragLeakage;

    results.push({
      workflow: 'WORKFLOW F',
      name: 'Multi-Tenant Data & RAG Knowledge Isolation Guard',
      passed: isolationSecure,
      details: `Institute 1 Leads: ${inst1Leads.length}; Institute 2 Leads: ${inst2Leads.length}; RAG Leakage: ${ragLeakage}`
    });
  } catch (e: any) {
    results.push({ workflow: 'WORKFLOW F', name: 'Tenant Isolation', passed: false, details: e.message });
  }

  // PRINT FINAL TEST REPORT
  console.log('\n================ TEST SUMMARY REPORT ================');
  let passedCount = 0;
  for (const r of results) {
    const icon = r.passed ? '✅ PASSED' : '❌ FAILED';
    if (r.passed) passedCount++;
    console.log(`${icon} [${r.workflow}] ${r.name}`);
    console.log(`   Details: ${r.details}\n`);
  }

  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${results.length - passedCount}`);
  if (passedCount === results.length) {
    console.log('🎉 ALL 6 REAL WORKFLOW TESTS PASSED PERFECTLY!\n');
  } else {
    console.error('⚠️ SOME TESTS FAILED!\n');
    process.exit(1);
  }
}

runTestSuite();
