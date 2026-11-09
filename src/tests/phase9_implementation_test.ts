import { gemini } from '../lib/gemini';
import { generateEmbedding, generateEmbeddingWithDetails, cosineSimilarity, searchKnowledgeBrain, indexDocument } from '../lib/rag';
import { db } from '../lib/db';
import { AgentOrchestrator } from '../lib/agent';
import { executeMcpToolDirectly } from '../lib/mcp/server';
import { toolRegistry } from '../lib/mcp/registry';

async function runPhase9Tests() {
  console.log('========================================================================');
  console.log('🧪 ADMITFLOW AI — PHASE 9 IMPLEMENTATION VERIFICATION SUITE');
  console.log('========================================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ PASS: ${testName}`);
    } else {
      console.error(`❌ FAIL: ${testName}`, detail || '');
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  const testInst1 = 'inst-apex-001';
  const testInst2 = 'inst-codecraft-002';

  // ----------------------------------------------------------------------
  // TEST GROUP 1: RAG EMBEDDING GENERATION & DIMENSION CONSISTENCY
  // ----------------------------------------------------------------------
  console.log('--- TEST GROUP 1: RAG EMBEDDINGS & DIMENSION CONSISTENCY ---');
  const embResult = await generateEmbeddingWithDetails('NEET 2027 scholarship criteria and tuition fees');
  assert(embResult.dimensions === 768, `Embedding dimension is exactly 768 (got ${embResult.dimensions})`);
  assert(embResult.provider === 'GEMINI_API' || embResult.provider === 'DETERMINISTIC_FALLBACK', 'Valid embedding provider returned');
  console.log(`[Info] Active embedding provider: ${embResult.provider}, model: ${embResult.model}`);

  const embQuery = await generateEmbedding('tuition fee for NEET');
  assert(embQuery.length === 768, `Query embedding dimension is exactly 768 (got ${embQuery.length})`);
  assert(embQuery.length === embResult.embedding.length, 'Query and Document embedding dimensions are strictly identical');

  const similarity = cosineSimilarity(embResult.embedding, embQuery);
  assert(similarity > 0.4, `Semantic similarity between related educational concepts is high (got ${similarity.toFixed(4)})`);

  // Test retrieval accuracy
  const sampleDoc = await indexDocument(testInst1, 'NEET 2027 Fee Schedule Test', 'PDF', `NEET 2027 Classroom Coaching fee is ₹1,20,000. Installment 1 is ₹40,000.`);
  assert(sampleDoc.status === 'INDEXED', 'Document indexed successfully');
  const searchRes = await searchKnowledgeBrain('How much is the NEET 2027 fee?', testInst1, 2);
  assert(searchRes.length > 0, 'RAG search successfully retrieved indexed document chunks');
  assert(searchRes[0].score > 0.3, `RAG match score is strong: ${searchRes[0].score.toFixed(3)}`);

  // ----------------------------------------------------------------------
  // TEST GROUP 2: MULTI-TURN CONVERSATION PERSISTENCE & RESTORATION
  // ----------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: CONVERSATION PERSISTENCE & RESTORATION ---');
  const testSessionId = `test-sess-${Date.now()}`;
  
  // 1. Create conversation
  const conv = db.createConversation({
    id: `conv-test-${Date.now()}`,
    instituteId: testInst1,
    channel: 'WEB_CHAT',
    sessionId: testSessionId,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });
  assert(conv.id.startsWith('conv-test-'), 'Conversation session created in database');

  // 2. Add Turn 1 (Student query & AI response)
  const userMsg1 = db.addMessage({
    id: `msg-u1-${Date.now()}`,
    conversationId: conv.id,
    senderType: 'STUDENT',
    content: 'Namaste! JEE 2027 batch kab shuru ho raha hai?',
    createdAt: new Date().toISOString()
  });
  assert(userMsg1.content.includes('JEE 2027'), 'Turn 1 user message persisted');

  const aiMsg1 = db.addMessage({
    id: `msg-ai1-${Date.now()}`,
    conversationId: conv.id,
    senderType: 'AI_ASSISTANT',
    content: 'Namaste! JEE 2027 Target batch Nov 20 se shuru ho raha hai.',
    createdAt: new Date().toISOString()
  });
  assert(aiMsg1.senderType === 'AI_ASSISTANT', 'Turn 1 AI response persisted');

  // 3. Add Turn 2 (Student follow-up query & AI response)
  const userMsg2 = db.addMessage({
    id: `msg-u2-${Date.now()}`,
    conversationId: conv.id,
    senderType: 'STUDENT',
    content: 'Aur iski fees kitni hai?',
    createdAt: new Date().toISOString()
  });
  const aiMsg2 = db.addMessage({
    id: `msg-ai2-${Date.now()}`,
    conversationId: conv.id,
    senderType: 'AI_ASSISTANT',
    content: 'JEE 2027 ki base fee ₹1,45,000 hai jise aap 3 installments mein de sakte hain.',
    createdAt: new Date().toISOString()
  });

  // 4. Retrieve conversation messages by conversation ID
  const history = db.getMessages(conv.id);
  assert(history.length === 4, `Multi-turn conversation history holds exactly 4 messages (got ${history.length})`);
  assert(history[0].id === userMsg1.id, 'Messages are ordered chronologically');
  assert(history[3].id === aiMsg2.id, 'Latest message is at the end of thread');

  // 5. Restore conversation by Session ID
  const restoredConv = db.findConversationBySession(testInst1, testSessionId);
  assert(restoredConv !== undefined, 'Conversation successfully restored by sessionId');
  assert(restoredConv?.id === conv.id, 'Restored conversation matches original session');

  // 6. Test Deduplication
  const duplicateMsg = db.addMessage(userMsg1);
  assert(duplicateMsg.id === userMsg1.id, 'Duplicate message insert handled idempotently');
  const historyAfterDup = db.getMessages(conv.id);
  assert(historyAfterDup.length === 4, 'Message count remains 4 after duplicate insertion attempt');

  // ----------------------------------------------------------------------
  // TEST GROUP 3: CROSS-TENANT ISOLATION
  // ----------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: CROSS-TENANT ISOLATION ---');
  // Attempt to access inst1's session from inst2
  const crossTenantConv = db.findConversationBySession(testInst2, testSessionId);
  assert(crossTenantConv === undefined, 'Tenant 2 cannot access Tenant 1 conversation via sessionId');

  const tenant2ConvList = db.getConversations(testInst2);
  assert(!tenant2ConvList.some(c => c.id === conv.id), 'Tenant 2 conversation list does not contain Tenant 1 conversation');

  // ----------------------------------------------------------------------
  // TEST GROUP 4: LLM STREAMING & FALLBACK
  // ----------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: LLM STREAMING & FALLBACK ---');
  let streamChunkCount = 0;
  let fullStreamedText = '';
  for await (const chunk of gemini.streamText('Say "AdmitFlow AI" in 3 words.', { maxOutputTokens: 20 })) {
    streamChunkCount++;
    fullStreamedText += chunk;
  }
  assert(streamChunkCount > 0, `streamText yielded ${streamChunkCount} streaming chunks`);
  assert(fullStreamedText.length > 0, `Streamed text received: "${fullStreamedText.trim()}"`);

  // ----------------------------------------------------------------------
  // TEST GROUP 5: ALL 12 AI SKILLS VERIFICATION
  // ----------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: ALL 12 AI SKILLS VERIFICATION ---');
  const orchestrator = new AgentOrchestrator(testInst1);

  // Skill 1: answer_enquiry
  const sk1 = await orchestrator.answer_enquiry('What is JEE fees?');
  assert(sk1.success && sk1.data.answer.length > 0, 'Skill 1: answer_enquiry functional');

  // Skill 2: create_lead
  const dummyPhone = '+91-98' + Math.floor(10000000 + Math.random() * 90000000);
  const sk2 = await orchestrator.create_lead({
    studentName: 'Phase 9 Test Student',
    phone: dummyPhone,
    courseNameOrId: 'JEE'
  });
  assert(sk2.success, 'Skill 2: create_lead functional');
  const createdLeadId = sk2.data.id;

  // Skill 3: qualify_lead
  const sk3 = await orchestrator.qualify_lead(createdLeadId, 'I want to confirm admission for JEE 2027 and pay fees');
  assert(sk3.success && sk3.data.leadScore >= 70, `Skill 3: qualify_lead upgraded score to ${sk3.data.leadScore}`);

  // Skill 4: update_lead
  const sk4 = await orchestrator.update_lead(createdLeadId, { notes: 'Parent visited campus' });
  assert(sk4.success && sk4.data.notes === 'Parent visited campus', 'Skill 4: update_lead functional');

  // Skill 5: retrieve_course_details
  const sk5 = await orchestrator.retrieve_course_details('JEE');
  assert(sk5.success && sk5.data.course !== undefined, 'Skill 5: retrieve_course_details functional');

  // Skill 6: retrieve_fee_details
  const sk6 = await orchestrator.retrieve_fee_details(sk5.data.course.id, 15);
  assert(sk6.success && sk6.data.discountApplied > 0, 'Skill 6: retrieve_fee_details calculated discount');

  // Skill 7: check_batch_availability
  const sk7 = await orchestrator.check_batch_availability(sk5.data.course.id);
  assert(sk7.success && Array.isArray(sk7.data), 'Skill 7: check_batch_availability functional');

  // Skill 8: schedule_counselling
  const sk8 = await orchestrator.schedule_counselling({
    leadId: createdLeadId,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    mode: 'ONLINE_MEET'
  });
  assert(sk8.success && sk8.data.status === 'SCHEDULED', 'Skill 8: schedule_counselling functional');

  // Skill 9: create_followup
  const sk9 = await orchestrator.create_followup({
    leadId: createdLeadId,
    dueDate: new Date(Date.now() + 172800000).toISOString(),
    suggestedMessage: 'Remind student about upcoming counseling slot.'
  });
  assert(sk9.success && sk9.requiresHumanApproval === true, 'Skill 9: create_followup requires human approval');

  // Skill 10: generate_lead_report
  const sk10 = await orchestrator.generate_lead_report();
  assert(sk10.success && sk10.data.totalLeads > 0, 'Skill 10: generate_lead_report functional');

  // Skill 11: identify_dropoffs
  const sk11 = await orchestrator.identify_dropoffs();
  assert(sk11.success && Array.isArray(sk11.data), 'Skill 11: identify_dropoffs functional');

  // Skill 12: recommend_next_action
  const sk12 = await orchestrator.recommend_next_action(createdLeadId);
  assert(sk12.success && typeof sk12.data.recommendedAction === 'string', 'Skill 12: recommend_next_action functional');

  // ----------------------------------------------------------------------
  // TEST GROUP 6: MCP TOOL EXECUTION VERIFICATION
  // ----------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: MCP TOOLS EXECUTION ---');
  assert(Object.keys(toolRegistry).length === 33, `All 33 MCP tools registered (got ${Object.keys(toolRegistry).length})`);

  const mcpLeadRes = await executeMcpToolDirectly(testInst1, 'get_lead', { leadId: createdLeadId }, { id: 'counsellor-1', role: 'COUNSELLOR' });
  assert(mcpLeadRes.success && mcpLeadRes.data.lead.id === createdLeadId, 'MCP tool get_lead executed successfully');

  const mcpCourseRes = await executeMcpToolDirectly(testInst1, 'get_course_information', { courseNameOrCode: 'JEE' });
  assert(mcpCourseRes.success && Array.isArray(mcpCourseRes.data), 'MCP tool get_course_information executed successfully');

  console.log('\n========================================================================');
  console.log(`🎉 PHASE 9 IMPLEMENTATION VERIFICATION: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('========================================================================\n');
  process.exit(0);
}

runPhase9Tests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
