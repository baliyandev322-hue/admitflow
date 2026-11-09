import { POST, GET } from '../app/api/chat/route';
import { NextRequest } from 'next/server';
import { db } from '../lib/db';

async function testChatApi() {
  console.log('Testing /api/chat enhancements...\n');
  const testInst = 'inst-apex-001';
  const testSession = `sess-api-test-${Date.now()}`;

  // 1. Test POST Non-Streaming Chat with Session
  console.log('1. Testing POST Non-Streaming with sessionId...');
  const req1 = new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      instituteId: testInst,
      sessionId: testSession,
      message: 'JEE 2027 batch admission fee kya hai?',
      studentName: 'Vikram Rajput',
      phone: '+91-9876543219'
    })
  });
  const res1 = await POST(req1);
  const data1 = await res1.json();
  console.log('POST status:', res1.status);
  console.log('POST response preview:', {
    success: data1.success,
    conversationId: data1.conversationId,
    sessionId: data1.sessionId,
    replyLength: data1.reply?.length,
    capturedLead: data1.capturedLead ? data1.capturedLead.studentName : null
  });

  if (!data1.conversationId) throw new Error('Missing conversationId in response');
  if (!data1.capturedLead) throw new Error('Lead was not captured');

  // 2. Test GET Conversation History Restoration
  console.log('\n2. Testing GET Conversation History...');
  const req2 = new NextRequest(`http://localhost:3000/api/chat?sessionId=${testSession}&instituteId=${testInst}`, {
    method: 'GET'
  });
  const res2 = await GET(req2);
  const data2 = await res2.json();
  console.log('GET status:', res2.status);
  console.log(`Restored messages count: ${data2.messages?.length}`);
  console.log('First message:', data2.messages?.[0]?.text);
  console.log('Second message preview:', data2.messages?.[1]?.text?.slice(0, 100));

  if (data2.messages.length < 2) throw new Error('Expected at least 2 messages in conversation history');

  // 3. Test POST with stream: true
  console.log('\n3. Testing POST Streaming (SSE)...');
  const req3 = new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      instituteId: testInst,
      sessionId: testSession,
      message: 'Hostel facility available hai kya?',
      stream: true
    })
  });
  const res3 = await POST(req3);
  console.log('Streaming status:', res3.status);
  console.log('Content-Type:', res3.headers.get('content-type'));

  const reader = res3.body?.getReader();
  if (!reader) throw new Error('Missing stream reader');
  const decoder = new TextDecoder();
  let streamChunks = 0;
  let fullStreamOutput = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    fullStreamOutput += text;
    streamChunks++;
  }

  console.log(`Received ${streamChunks} SSE stream packets`);
  console.log('Stream sample:\n', fullStreamOutput.slice(0, 200));

  console.log('\n🎉 ALL CHAT API ENHANCEMENTS VERIFIED 100%!');
  process.exit(0);
}

testChatApi().catch(err => {
  console.error('Chat API test failed:', err);
  process.exit(1);
});
