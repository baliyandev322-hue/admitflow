async function testLiveProduction() {
  const prodUrl = 'https://admitflow-cbx6.vercel.app';
  console.log('========================================================================');
  console.log('🌐 ADMITFLOW AI — PHASE 10 LIVE VERCEL PRODUCTION AUDIT');
  console.log(`Target: ${prodUrl}`);
  console.log('========================================================================\n');

  // 1. Health Check & Environment
  console.log('--- 1. TESTING /api/health ---');
  const healthRes = await fetch(`${prodUrl}/api/health`, { headers: { 'Cache-Control': 'no-cache' } });
  console.log('HTTP Status:', healthRes.status);
  const healthData = await healthRes.json();
  console.log('Health Data:', JSON.stringify(healthData, null, 2));

  // 2. Chat API - Non-Streaming & Persistence
  console.log('\n--- 2. TESTING LIVE CHAT CONVERSATION PERSISTENCE ---');
  const testSessionId = `prod-sess-${Date.now()}`;
  const chatRes1 = await fetch(`${prodUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instituteId: 'inst-apex-001',
      sessionId: testSessionId,
      message: 'JEE 2027 batch fees aur scholarship details kya hain?',
      studentName: 'Aarav Prod Test',
      phone: '+91-9988776655',
      language: 'hinglish'
    })
  });
  console.log('Chat Turn 1 Status:', chatRes1.status);
  const chatData1 = await chatRes1.json();
  console.log('Chat Turn 1 Response Preview:', {
    success: chatData1.success,
    conversationId: chatData1.conversationId,
    sessionId: chatData1.sessionId,
    isGrounded: chatData1.isGrounded,
    sourcesCount: chatData1.sources?.length,
    capturedLead: chatData1.capturedLead ? chatData1.capturedLead.studentName : null,
    replySnippet: (chatData1.reply || '').slice(0, 150)
  });

  // 3. Conversation Restoration via GET /api/chat
  console.log('\n--- 3. TESTING CONVERSATION RESTORATION ---');
  const restoreRes = await fetch(`${prodUrl}/api/chat?sessionId=${testSessionId}&instituteId=inst-apex-001`);
  console.log('Restore Status:', restoreRes.status);
  const restoreData = await restoreRes.json();
  console.log('Restored Messages Count:', restoreData.messages?.length);
  if (restoreData.messages?.length > 0) {
    console.log('Sample Restored Message:', restoreData.messages[0]);
  }

  // 4. Chat API - Turn 2
  console.log('\n--- 4. TESTING CHAT TURN 2 (FOLLOW-UP) ---');
  const chatRes2 = await fetch(`${prodUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instituteId: 'inst-apex-001',
      sessionId: testSessionId,
      conversationId: chatData1.conversationId,
      message: 'Counseling kab hoti hai?',
      language: 'hinglish'
    })
  });
  console.log('Chat Turn 2 Status:', chatRes2.status);
  const chatData2 = await chatRes2.json();
  console.log('Chat Turn 2 Response Preview:', {
    success: chatData2.success,
    suggestCounselingBooking: chatData2.suggestCounselingBooking,
    replySnippet: (chatData2.reply || '').slice(0, 150)
  });

  // 5. Test Live MCP Endpoint
  console.log('\n--- 5. TESTING LIVE /api/mcp ENDPOINT ---');
  const mcpGet = await fetch(`${prodUrl}/api/mcp`);
  console.log('MCP GET Status:', mcpGet.status);
  const mcpGetData = await mcpGet.json();
  console.log('MCP Discovery Preview:', {
    name: mcpGetData.name,
    toolsCount: mcpGetData.toolsCount,
    sampleTools: mcpGetData.tools?.slice(0, 3).map((t: any) => t.name)
  });

  const mcpPost = await fetch(`${prodUrl}/api/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      method: 'tools/call',
      params: {
        name: 'get_fee_information',
        arguments: { courseNameOrCode: 'JEE' }
      }
    })
  });
  console.log('MCP POST Status:', mcpPost.status);
  const mcpPostData = await mcpPost.json();
  console.log('MCP Call Response Preview:', JSON.stringify(mcpPostData).slice(0, 200));

  // 6. Test Live UI Widget
  console.log('\n--- 6. TESTING LIVE /widget & EMBED SCRIPT ---');
  const widgetRes = await fetch(`${prodUrl}/widget?instituteId=inst-apex-001`);
  console.log('Widget Page Status:', widgetRes.status);
  const embedRes = await fetch(`${prodUrl}/api/widget/embed.js?instituteId=inst-apex-001`);
  console.log('Embed Script Status:', embedRes.status);

  console.log('\n========================================================================');
  console.log('PROD AUDIT COMPLETE');
  console.log('========================================================================');
}

testLiveProduction().catch(err => {
  console.error('Live Production Audit Error:', err);
  process.exit(1);
});
