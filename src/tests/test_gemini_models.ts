import fs from 'fs';

async function testModels() {
  const apiKey = fs.readFileSync('c:\\Users\\baliy\\Downloads\\bot\\api_key.txt', 'utf-8').trim();
  const modelsToTry = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
  ];

  console.log('Testing models with API Key...');

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello, reply with only the word OK.' }] }]
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      const data = await res.json();
      if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log(`✅ Model ${model} is WORKING! Reply:`, data.candidates[0].content.parts[0].text.trim());
        return model;
      } else {
        console.log(`❌ Model ${model} error:`, data.error?.message || res.statusText);
      }
    } catch (e: any) {
      console.log(`❌ Model ${model} fetch exception:`, e.message);
    }
  }
}

testModels();
