import { extractTextFromGeminiResponse } from '../lib/gemini';
import assert from 'assert';

console.log('========================================================================');
console.log('🧪 REGRESSION TEST: GEMINI MULTI-PART RESPONSE EXTRACTION');
console.log('========================================================================\n');

// 1. Single text part
console.log('--- TEST 1: SINGLE TEXT PART ---');
const singlePartInput = {
  candidates: [
    {
      content: {
        parts: [{ text: 'Hello, welcome to Apex Academy!' }]
      }
    }
  ]
};
const res1 = extractTextFromGeminiResponse(singlePartInput);
assert.strictEqual(res1, 'Hello, welcome to Apex Academy!');
console.log('✅ PASS: Single text part extracted correctly:', res1);

// 2. Multiple text parts (The exact bug from Phase 10.1 Scenario 7)
console.log('\n--- TEST 2: MULTIPLE TEXT PARTS ---');
const multiPartInput = {
  candidates: [
    {
      content: {
        parts: [
          { text: 'Hello! ' },
          { text: 'Apex Academy mein aapka swagat hai. ' },
          { text: 'JEE batch fees ₹1,45,000 hai payable in 3 installments.' }
        ]
      }
    }
  ]
};
const res2 = extractTextFromGeminiResponse(multiPartInput);
assert.strictEqual(
  res2,
  'Hello! Apex Academy mein aapka swagat hai. JEE batch fees ₹1,45,000 hai payable in 3 installments.'
);
console.log('✅ PASS: Multiple text parts joined without content loss:', res2);

// 3. Empty parts array / parts containing empty strings
console.log('\n--- TEST 3: PARTS CONTAINING EMPTY STRINGS OR SPACES ---');
const mixedEmptyParts = {
  candidates: [
    {
      content: {
        parts: [
          { text: '' },
          { text: 'Valid message content' },
          { text: '   ' }
        ]
      }
    }
  ]
};
const res3 = extractTextFromGeminiResponse(mixedEmptyParts);
assert.strictEqual(res3, 'Valid message content');
console.log('✅ PASS: Empty parts filtered cleanly:', res3);

// 4. Missing text fields / undefined objects in parts array
console.log('\n--- TEST 4: MISSING TEXT FIELDS / NON-TEXT PARTS ---');
const malformedParts = {
  candidates: [
    {
      content: {
        parts: [
          {},
          { thought: 'internal reasoning' },
          { text: 'Real student answer' },
          null,
          undefined
        ]
      }
    }
  ]
};
const res4 = extractTextFromGeminiResponse(malformedParts);
assert.strictEqual(res4, 'Real student answer');
console.log('✅ PASS: Malformed/non-text parts handled without throwing:', res4);

// 5. Completely empty response / missing candidates
console.log('\n--- TEST 5: COMPLETELY EMPTY API RESPONSE (ERROR HANDLING) ---');
let caught1 = false;
try {
  extractTextFromGeminiResponse({});
} catch (e: any) {
  caught1 = true;
  console.log('✅ PASS: Caught empty object error:', e.message);
}
assert(caught1, 'Should throw on empty data object');

let caught2 = false;
try {
  extractTextFromGeminiResponse({ candidates: [] });
} catch (e: any) {
  caught2 = true;
  console.log('✅ PASS: Caught empty candidates array:', e.message);
}
assert(caught2, 'Should throw on empty candidates');

let caught3 = false;
try {
  extractTextFromGeminiResponse({
    candidates: [{ content: { parts: [{ text: '   ' }] } }]
  });
} catch (e: any) {
  caught3 = true;
  console.log('✅ PASS: Caught whitespace-only parts error:', e.message);
}
assert(caught3, 'Should throw on whitespace-only parts');

console.log('\n========================================================================');
console.log('🎉 ALL 5 GEMINI EXTRACTION REGRESSION TESTS PASSED 100%!');
console.log('========================================================================\n');
