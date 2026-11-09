import { gemini } from '../lib/gemini';
import { chunkText, generateEmbedding, cosineSimilarity, searchKnowledgeBrain, indexDocument } from '../lib/rag';
import { createAdmitFlowMcpServer, executeMcpToolDirectly, listAvailableMcpTools } from '../lib/mcp/server';
import { toolRegistry } from '../lib/mcp/registry';
import { getGeminiFunctionDeclarations, executeGeminiWithMcp } from '../lib/mcp/geminiToolBridge';
import { AgentOrchestrator } from '../lib/agent';
import { db } from '../lib/db';

async function runPhase9Audit() {
  console.log('========================================================================');
  console.log('🔍 ADMITFLOW AI — PHASE 9 DEEP CODEBASE & EXECUTION AUDIT');
  console.log('========================================================================\n');

  const auditResults: Record<string, any> = {};
  const testInstId = 'inst-apex-001';

  // ----------------------------------------------------------------------
  // 1. LLM AUDIT
  // ----------------------------------------------------------------------
  console.log('=== 1. AUDITING LLM INTEGRATION ===');
  const llmKeyAvailable = gemini.isAvailable();
  console.log(`[LLM] API Key configured: ${llmKeyAvailable}`);
  
  let llmCallResult: any = null;
  try {
    const start = Date.now();
    const res = await gemini.generateText('Explain NEET 2027 eligibility in 1 short sentence in Hinglish.', {
      temperature: 0.2,
      maxOutputTokens: 100
    });
    llmCallResult = {
      success: true,
      text: res.text,
      modelUsed: res.modelUsed,
      fallbackUsed: res.fallbackUsed,
      latencyMs: Date.now() - start
    };
    console.log('[LLM] generateText Result:', llmCallResult);
  } catch (err: any) {
    llmCallResult = { success: false, error: err.message };
    console.error('[LLM] generateText Error:', err.message);
  }
  auditResults.llm = { available: llmKeyAvailable, execution: llmCallResult };

  // ----------------------------------------------------------------------
  // 2. RAG AUDIT
  // ----------------------------------------------------------------------
  console.log('\n=== 2. AUDITING RAG (RETRIEVAL-AUGMENTED GENERATION) ===');
  // A. Chunker & Tokenizer
  const sampleBrochure = `Apex Career Institute JEE Main + Advanced 2027 Comprehensive Classroom Program. 
The total tuition fee is ₹1,45,000 payable in 3 installments. 
First installment is ₹50,000 due at admission. Second installment is ₹50,000 after 60 days. 
Third installment is ₹45,000 after 120 days. Scholarship up to 40% is available based on Apex Aptitude Test (AAT).
Hostel facility is available at ₹12,000 per month including food.`;

  const chunks = chunkText(sampleBrochure, 20, 5);
  console.log(`[RAG] ChunkText generated ${chunks.length} chunks from sample brochure.`);

  // B. Embeddings
  const startEmb = Date.now();
  const embA = await generateEmbedding('tuition fee for JEE 2027');
  const embB = await generateEmbedding('Apex Career Institute fee installment structure');
  const embC = await generateEmbedding('cooking recipe for pizza');
  const embLatency = Date.now() - startEmb;

  const simMatch = cosineSimilarity(embA, embB);
  const simUnrelated = cosineSimilarity(embA, embC);
  console.log(`[RAG] Embedding dimension: ${embA.length}, Latency: ${embLatency}ms`);
  console.log(`[RAG] Cosine similarity between related concepts: ${simMatch.toFixed(4)}`);
  console.log(`[RAG] Cosine similarity between unrelated concepts: ${simUnrelated.toFixed(4)}`);

  // C. Ingestion & Retrieval
  let testDoc: any = null;
  let retrievalMatches: any[] = [];
  try {
    testDoc = await indexDocument(testInstId, 'NEET 2027 Test Brochure', 'PDF', sampleBrochure);
    console.log(`[RAG] Indexed document id: ${testDoc.id}, chunks: ${testDoc.chunkCount}`);
    retrievalMatches = await searchKnowledgeBrain('What is the first installment for JEE 2027?', testInstId, 3);
    console.log(`[RAG] Search retrieved ${retrievalMatches.length} matches:`, retrievalMatches.map(m => ({ title: m.documentTitle, score: m.score.toFixed(3) })));
  } catch (err: any) {
    console.error('[RAG] Indexing/Search Error:', err.message);
  }
  auditResults.rag = {
    chunking: chunks.length > 0,
    embeddingDim: embA.length,
    semanticSearch: retrievalMatches.length > 0,
    topMatchScore: retrievalMatches[0]?.score
  };

  // ----------------------------------------------------------------------
  // 3. MCP AUDIT
  // ----------------------------------------------------------------------
  console.log('\n=== 3. AUDITING MODEL CONTEXT PROTOCOL (MCP) ===');
  const mcpServer = createAdmitFlowMcpServer(testInstId);
  const registeredToolCount = Object.keys(toolRegistry).length;
  console.log(`[MCP] Total registered tools in registry: ${registeredToolCount}`);

  const studentTools = listAvailableMcpTools(testInstId, 'STUDENT');
  const counsellorTools = listAvailableMcpTools(testInstId, 'COUNSELLOR');
  const adminTools = listAvailableMcpTools(testInstId, 'ADMIN');
  console.log(`[MCP] Role-Based Discovery: Student=${studentTools.length}, Counsellor=${counsellorTools.length}, Admin=${adminTools.length}`);

  // Test executing a tool directly
  const toolExec = await executeMcpToolDirectly(testInstId, 'get_fee_information', { courseNameOrCode: 'JEE' });
  console.log(`[MCP] Direct tool execution 'get_fee_information': Success=${toolExec.success}, Output count=${toolExec.data?.length}`);

  // Test Gemini tool bridge function declarations
  const funcDecls = getGeminiFunctionDeclarations(['get_fee_information', 'get_batch_information']);
  console.log(`[MCP] Gemini Function Declarations generated: ${funcDecls.length} tools`);

  // Test executeGeminiWithMcp
  const bridgeRes = await executeGeminiWithMcp(testInstId, 'JEE 2027 ki fees kitni hai?', 'hinglish');
  console.log(`[MCP] Gemini-MCP Bridge Execution: toolUsed=${bridgeRes.toolUsed || 'none'}, reply preview=${bridgeRes.reply.slice(0, 150)}`);

  auditResults.mcp = {
    totalTools: registeredToolCount,
    toolExecSuccess: toolExec.success,
    bridgeSuccess: Boolean(bridgeRes.reply)
  };

  // ----------------------------------------------------------------------
  // 4. AI SKILLS AUDIT
  // ----------------------------------------------------------------------
  console.log('\n=== 4. AUDITING AI SKILLS ===');
  const orchestrator = new AgentOrchestrator(testInstId);
  const skillsList = [
    'answer_enquiry',
    'qualify_lead',
    'create_lead',
    'update_lead',
    'retrieve_course_details',
    'retrieve_fee_details',
    'check_batch_availability',
    'schedule_counselling',
    'create_followup',
    'generate_lead_report',
    'identify_dropoffs',
    'recommend_next_action'
  ];

  const skillExecutionSummary: Record<string, boolean> = {};

  // Test 1: answer_enquiry
  const s1 = await orchestrator.answer_enquiry('What is JEE batch timing?');
  skillExecutionSummary.answer_enquiry = s1.success;

  // Test 2: retrieve_course_details
  const s2 = await orchestrator.retrieve_course_details('JEE');
  skillExecutionSummary.retrieve_course_details = s2.success;

  // Test 3: check_batch_availability
  const s3 = await orchestrator.check_batch_availability('course-apex-jee-2027');
  skillExecutionSummary.check_batch_availability = s3.success;

  // Test 4: generate_lead_report
  const s4 = await orchestrator.generate_lead_report();
  skillExecutionSummary.generate_lead_report = s4.success;

  // Test 5: identify_dropoffs
  const s5 = await orchestrator.identify_dropoffs();
  skillExecutionSummary.identify_dropoffs = s5.success;

  console.log('[SKILLS] Evaluated skills status:', skillExecutionSummary);
  auditResults.skills = skillExecutionSummary;

  // ----------------------------------------------------------------------
  // 5. AI AGENT WORKFLOW AUDIT
  // ----------------------------------------------------------------------
  console.log('\n=== 5. AUDITING AI AGENT ORCHESTRATION ===');
  // Check execution logging
  const recentLogs = db.getAgentExecutions(testInstId);
  console.log(`[AGENT] Total execution audit logs in database: ${recentLogs.length}`);

  console.log('\n========================================================================');
  console.log('✅ AUDIT RUN COMPLETE');
  console.log('========================================================================\n');
  process.exit(0);
}

runPhase9Audit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
