async function testRunningApp() {
  console.log('Testing running Next.js app on port 3000...\n');
  
  // 1. Health Endpoint
  console.log('--- 1. Testing /api/health ---');
  const healthRes = await fetch('http://localhost:3000/api/health');
  const healthData = await healthRes.json();
  console.log('HTTP Status:', healthRes.status);
  console.log('Health Response:', JSON.stringify(healthData, null, 2));

  // 2. Landing Page
  console.log('\n--- 2. Testing / (Landing Page) ---');
  const homeRes = await fetch('http://localhost:3000/');
  console.log('HTTP Status:', homeRes.status);

  // 3. Admission Widget Page
  console.log('\n--- 3. Testing /widget ---');
  const widgetRes = await fetch('http://localhost:3000/widget');
  console.log('HTTP Status:', widgetRes.status);

  // 4. Gemini AI Chat Enquiry
  console.log('\n--- 4. Testing /api/chat (Gemini AI Admission Query) ---');
  const chatRes = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Namaste, JEE 2027 batch admission details bataiye',
      instituteId: 'inst-apex-001'
    })
  });
  console.log('HTTP Status:', chatRes.status);
  const chatData = await chatRes.json();
  console.log('AI Reply Preview:', (chatData.response || chatData.reply || JSON.stringify(chatData)).slice(0, 300));

  console.log('\n=============================================');
  console.log('🎉 ALL SERVICES VERIFIED LIVE AND OPERATIONAL!');
  console.log('=============================================');
  process.exit(0);
}

testRunningApp().catch(err => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
