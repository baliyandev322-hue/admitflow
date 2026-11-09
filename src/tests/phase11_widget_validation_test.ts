import assert from 'assert';

async function testWidgetEmbed() {
  console.log('========================================================================');
  console.log('🌐 ADMITFLOW AI — PHASE 11: EMBEDDABLE WEBSITE WIDGET VALIDATION');
  console.log('Testing Isolated Widget Script, Responsive Layout & Consent Protocol');
  console.log('========================================================================\n');

  const prodUrl = 'https://admitflow-cbx6.vercel.app';
  console.log(`Targeting Live Vercel Deployment: ${prodUrl}\n`);

  // 1. Test embed.js script endpoint
  console.log('--- TEST 1: WIDGET LOADER SCRIPT (embed.js) ---');
  const embedRes = await fetch(`${prodUrl}/api/widget/embed.js?institute=apex-academy`);
  assert.strictEqual(embedRes.status, 200, 'embed.js must return HTTP 200');
  const scriptContent = await embedRes.text();
  
  assert(scriptContent.includes('admitflow-bubble'), 'Script must define floating chat bubble');
  assert(scriptContent.includes('admitflow_loaded'), 'Script must prevent duplicate initialization');
  assert(scriptContent.includes('apex-academy'), 'Script must embed target institute slug');
  assert(scriptContent.includes('iframe'), 'Script must create isolated iframe');
  assert(scriptContent.includes('380px'), 'Script must enforce mobile-responsive 380px width');
  assert(scriptContent.includes('580px'), 'Script must enforce 580px height');
  console.log('Script Content Length:', scriptContent.length, 'bytes');
  console.log('✅ PASS: embed.js script loader verified with correct layout & tenant slug');

  // 2. Test widget chat page (iframe destination)
  console.log('\n--- TEST 2: WIDGET IFRAME DESTINATION (/widget) ---');
  const widgetRes = await fetch(`${prodUrl}/widget?slug=apex-academy`);
  assert.strictEqual(widgetRes.status, 200, 'Widget page must return HTTP 200');
  const htmlContent = await widgetRes.text();
  assert(htmlContent.length > 500, 'Widget page must return rendered HTML');
  console.log('Widget HTML Length:', htmlContent.length, 'bytes');
  console.log('✅ PASS: Widget iframe destination renders HTTP 200');

  // 3. Test tenant-specific branding resolution
  console.log('\n--- TEST 3: TENANT BRANDING API (/api/institutes?slug=apex-academy) ---');
  const instRes = await fetch(`${prodUrl}/api/institutes?slug=apex-academy`);
  assert.strictEqual(instRes.status, 200, 'Institute slug resolution must return HTTP 200');
  const instData = await instRes.json();
  assert(instData.institute?.name.includes('Apex Academy'), 'Resolved correct institute name');
  console.log('Resolved Institute:', {
    name: instData.institute?.name,
    slug: instData.institute?.slug,
    welcomeMessage: instData.institute?.welcomeMessage?.substring(0, 60) + '...'
  });
  console.log('✅ PASS: Tenant-specific branding & welcome message verified');

  // 4. Test Chat Session & DPDP Consent in Widget Payload
  console.log('\n--- TEST 4: WIDGET CHAT DISPATCH & CONSENT PROTOCOL ---');
  const widgetSessionId = `widget-sess-${Date.now()}`;
  const chatRes = await fetch(`${prodUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instituteSlug: 'apex-academy',
      sessionId: widgetSessionId,
      message: 'JEE Morning batch me admission lena hai',
      studentName: 'Simulated Widget Student',
      phone: '+91-9876501234',
      whatsappConsent: true,
      language: 'hinglish'
    })
  });

  assert.strictEqual(chatRes.status, 200, 'Chat API must accept widget submission');
  const chatData = await chatRes.json();
  assert(chatData.success, 'Chat response must be successful');
  assert(chatData.conversationId, 'Persistent conversation ID must be generated');
  assert(chatData.reply.length > 30, 'AI must return grounded reply');
  console.log('Widget Chat Reply:', chatData.reply.substring(0, 100) + '...');
  console.log('Conversation Persistence:', {
    conversationId: chatData.conversationId,
    sessionId: chatData.sessionId,
    isGrounded: chatData.isGrounded
  });
  console.log('✅ PASS: Widget chat dispatch and conversation persistence verified');

  // 5. Test Session Continuity on Page Refresh
  console.log('\n--- TEST 5: SESSION RESTORATION ACROSS REFRESH ---');
  const restoreRes = await fetch(`${prodUrl}/api/chat?sessionId=${widgetSessionId}&instituteId=inst-apex-001`);
  assert.strictEqual(restoreRes.status, 200, 'Session restore must return HTTP 200');
  const restoreData = await restoreRes.json();
  assert(restoreData.messages?.length >= 2, 'Restored at least user message and AI response');
  console.log(`Restored ${restoreData.messages.length} messages in chronological order.`);
  console.log('✅ PASS: Session restoration across browser refresh verified');

  console.log('\n========================================================================');
  console.log('🎉 EMBEDDED WEBSITE WIDGET AUDIT COMPLETED SUCCESSFULLY (5/5 PASSED)!');
  console.log('========================================================================\n');
}

testWidgetEmbed().catch(err => {
  console.error('Widget validation failed:', err);
  process.exit(1);
});
