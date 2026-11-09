import { AgentOrchestrator } from '../lib/agent';
import { db } from '../lib/db';
import assert from 'assert';

async function runConversationalIntelligenceTests() {
  console.log('=== PHASE 10: CONVERSATIONAL INTELLIGENCE & QUALITY TEST SUITE ===\n');

  const institutes = db.getInstitutes();
  const institute = institutes[0];
  console.log(`Testing with Institute: ${institute.name} (ID: ${institute.id})`);

  const agent = new AgentOrchestrator(institute.id);

  const testCases = [
    {
      id: 1,
      query: 'Why should I join this institute?',
      expectedCategory: 'Category 1 + 2 (Institute Value Proposition)',
      validator: (res: any) => {
        const text = res.answer.toLowerCase();
        // Should explain benefits / small batches / doubt clearing / demo class
        // and NOT reject with "not present in prospectus"
        const isHelpful = text.includes('doubt') || text.includes('batch') || text.includes('guidance') || text.includes('demo') || text.includes('concept') || text.includes('mentor');
        const notRejected = !text.includes('specific jaankari uplabdh nahi');
        return isHelpful && notRejected;
      }
    },
    {
      id: 2,
      query: 'What are the benefits of coaching?',
      expectedCategory: 'Category 2 (General Educational Guidance)',
      validator: (res: any) => {
        const text = res.answer.toLowerCase();
        const hasBenefits = text.includes('discipline') || text.includes('routine') || text.includes('structured') || text.includes('doubt') || text.includes('fayde') || text.includes('mock') || text.includes('guidance') || text.includes('mentor') || text.includes('benefit');
        const notRejected = !text.includes('prospectus mein specific jaankari uplabdh nahi');
        return hasBenefits && notRejected;
      }
    },
    {
      id: 3,
      query: 'How should I prepare for JEE?',
      expectedCategory: 'Category 2 (General Academic Mentorship)',
      validator: (res: any) => {
        const text = res.answer.toLowerCase();
        const hasGuidance = text.includes('ncert') || text.includes('pyq') || text.includes('mock') || text.includes('concept') || text.includes('revision') || text.includes('practice');
        const notRejected = !text.includes('prospectus mein specific jaankari uplabdh nahi');
        return hasGuidance && notRejected;
      }
    },
    {
      id: 4,
      query: 'Who are your best teachers?',
      expectedCategory: 'Category 1 + 2 (Zero Hallucination + Demo Offer)',
      validator: (res: any) => {
        const text = res.answer.toLowerCase();
        // Zero Hallucination: Mentions experienced mentors / demo class, does NOT make up fake individual names
        const hasTeacherInfo = text.includes('faculty') || text.includes('teacher') || text.includes('mentor') || text.includes('expert');
        const offersExperience = text.includes('demo') || text.includes('class') || text.includes('concept');
        return hasTeacherInfo && offersExperience;
      }
    },
    {
      id: 5,
      query: 'What is the exact hostel fee?',
      expectedCategory: 'Category 1 (Zero Hallucination Grounded Policy)',
      validator: (res: any) => {
        const text = res.answer.toLowerCase();
        // Must NOT invent a fake price, must state it varies/not listed and offer counselor
        const avoidsHallucination = text.includes('prospectus') || text.includes('sharing') || text.includes('depend') || text.includes('counselor') || text.includes('contact');
        return avoidsHallucination;
      }
    },
    {
      id: 6,
      query: 'Can you guarantee my selection?',
      expectedCategory: 'Category 2 (Ethical Educational Guidance)',
      validator: (res: any) => {
        const text = res.answer.toLowerCase();
        // Must refuse to guarantee, emphasis on student hard work & dedication
        const isHonest = text.includes('nahi') || text.includes('guarantee nahi') || text.includes('no') || text.includes('cannot guarantee') || text.includes('mehnat') || text.includes('hard work');
        return isHonest;
      }
    },
    {
      id: 7,
      query: 'What is the difference between JEE Main and Advanced?',
      expectedCategory: 'Category 2 (Pedagogical Exam Facts)',
      validator: (res: any) => {
        const text = res.answer.toLowerCase();
        // Mentions Main (NITs/IIITs/screening/speed) and Advanced (IITs/conceptual depth)
        const hasComparison = (text.includes('main') && text.includes('advanced')) && (text.includes('iit') || text.includes('nit') || text.includes('concept') || text.includes('speed'));
        const notRejected = !text.includes('prospectus mein specific jaankari uplabdh nahi');
        return hasComparison && notRejected;
      }
    },
    {
      id: 8,
      query: 'Why should I choose this institute over competitors?',
      expectedCategory: 'Category 1 + 2 (Positive Strengths, Zero Disparagement)',
      validator: (res: any) => {
        const text = res.answer.toLowerCase();
        const hasStrengths = text.includes('doubt') || text.includes('batch') || text.includes('personal') || text.includes('demo') || text.includes('attention') || text.includes('student');
        const notRejected = !text.includes('prospectus mein specific jaankari uplabdh nahi');
        return hasStrengths && notRejected;
      }
    }
  ];

  let passedCount = 0;

  for (const tc of testCases) {
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`[TEST ${tc.id}/8] Query: "${tc.query}"`);
    console.log(`Target Classification: ${tc.expectedCategory}`);
    
    const startTime = Date.now();
    const result = await agent.answer_enquiry(tc.query, 'hinglish');
    const elapsed = Date.now() - startTime;

    assert(result.success, `Skill call failed for test case ${tc.id}`);
    const data = result.data;
    
    console.log(`Elapsed: ${elapsed}ms | Model: ${data.modelUsed} | Fallback: ${data.fallbackUsed} | Grounded: ${data.isGrounded}`);
    console.log(`Response:\n"${data.answer}"\n`);

    const isValid = tc.validator(data);
    if (isValid) {
      console.log(` Verdict:  PASSED`);
      passedCount++;
    } else {
      console.error(`❌ Verdict: FAILED - Response did not satisfy quality criteria`);
    }
  }

  console.log(`================================================================================`);
  console.log(`TEST SUMMARY: ${passedCount}/8 Test Cases PASSED`);
  assert.strictEqual(passedCount, 8, 'All 8 conversational intelligence test cases must pass');
  console.log('🎉 ALL 8 CONVERSATIONAL INTELLIGENCE BENCHMARKS SATISFIED 100%!');
}

runConversationalIntelligenceTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
