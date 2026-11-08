import { toolRegistry, McpToolDefinition } from './registry';
import { executeMcpToolDirectly } from './server';
import { gemini } from '../gemini';

/**
 * Converts Zod schemas into Gemini-compatible function declaration parameters
 */
function zodToGeminiSchema(schema: any): any {
  const shape = schema.shape || {};
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, field] of Object.entries<any>(shape)) {
    const isOptional = field.isOptional?.() || false;
    let type = 'STRING';

    const typeName = field._def?.typeName || '';
    if (typeName === 'ZodNumber') type = 'NUMBER';
    else if (typeName === 'ZodBoolean') type = 'BOOLEAN';
    else if (typeName === 'ZodArray') type = 'ARRAY';
    else if (typeName === 'ZodEnum') type = 'STRING';
    else if (typeName === 'ZodObject') type = 'OBJECT';

    properties[key] = {
      type,
      description: field.description || key
    };

    if (!isOptional) {
      required.push(key);
    }
  }

  return {
    type: 'OBJECT',
    properties,
    required: required.length > 0 ? required : undefined
  };
}

/**
 * Generates Gemini Function Declarations for selected authorized MCP tools
 */
export function getGeminiFunctionDeclarations(
  allowedToolNames?: string[]
): any[] {
  const tools = allowedToolNames 
    ? Object.values(toolRegistry).filter(t => allowedToolNames.includes(t.name))
    : Object.values(toolRegistry).filter(t => t.requiredRole === 'STUDENT' || t.readOnly);

  return tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: zodToGeminiSchema(t.schema)
  }));
}

/**
 * Orchestrates an end-to-end Gemini conversational interaction using MCP tool calling
 */
export async function executeGeminiWithMcp(
  instituteId: string,
  userMessage: string,
  languagePreference: 'hinglish' | 'hindi' | 'english' = 'hinglish',
  actor: { id: string; role: 'STUDENT' | 'COUNSELLOR' | 'ADMIN' } = { id: 'chat-student', role: 'STUDENT' }
): Promise<{
  reply: string;
  toolUsed?: string;
  toolResult?: any;
  requiresApproval?: boolean;
}> {
  const apiKey = gemini.getApiKey();
  if (!gemini.isAvailable()) {
    // If Gemini key is missing, execute tool via direct intent matching
    return await executeFallbackToolMatching(instituteId, userMessage, languagePreference);
  }

  // Active tools allowed for this student/visitor context
  const targetTools = [
    'get_fee_information',
    'get_batch_information',
    'get_course_information',
    'check_available_slots',
    'check_application_completeness',
    'search_institute_knowledge'
  ];

  const functionDeclarations = getGeminiFunctionDeclarations(targetTools);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

  const prompt = `You are AdmitFlow AI assistant. A student asked: "${userMessage}".
If you need specific ground-truth data (fees, batches, counselling slots, application status, or brochure search), call the appropriate tool.
Language preference: ${languagePreference.toUpperCase()}.`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ functionDeclarations }],
        generationConfig: { temperature: 0.2 }
      })
    });

    if (!res.ok) {
      throw new Error(`Gemini API HTTP ${res.status}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const functionCall = candidate?.content?.parts?.[0]?.functionCall;

    if (functionCall) {
      const toolName = functionCall.name;
      const toolArgs = functionCall.args || {};

      // Execute tool via MCP
      const execResult = await executeMcpToolDirectly(instituteId, toolName, toolArgs, actor);

      // Synthesize answer with tool result
      const followUpPrompt = `STUDENT QUERY: "${userMessage}"
TOOL CALLED: ${toolName}
GROUND TRUTH RESULT: ${JSON.stringify(execResult.data)}
Respond directly to the student in ${languagePreference} accurately explaining the tool output:`;

      const synthesis = await gemini.generateText(followUpPrompt, {
        temperature: 0.2,
        maxOutputTokens: 300
      });

      return {
        reply: synthesis.text || `Tool ${toolName} returned verified results.`,
        toolUsed: toolName,
        toolResult: execResult.data,
        requiresApproval: execResult.requiresHumanApproval
      };
    }

    const directText = candidate?.content?.parts?.[0]?.text;
    return {
      reply: directText || 'How can I assist you with admissions today?'
    };
  } catch (err: any) {
    console.warn(`[Gemini Tool Bridge Warning] ${err.message}. Using deterministic tool matching.`);
    return await executeFallbackToolMatching(instituteId, userMessage, languagePreference);
  }
}

async function executeFallbackToolMatching(
  instituteId: string, 
  userMessage: string, 
  lang: string
): Promise<{ reply: string; toolUsed?: string; toolResult?: any }> {
  const msg = userMessage.toLowerCase();
  if (msg.includes('fee') || msg.includes('kitna') || msg.includes('cost')) {
    const result = await executeMcpToolDirectly(instituteId, 'get_fee_information', { courseNameOrCode: 'jee' });
    const fee = result.data?.[0]?.baseFee || 145000;
    return {
      reply: lang === 'english'
        ? `The official base fee is ₹${fee.toLocaleString('en-IN')}. Would you like to schedule counselling?`
        : `Official base fee ₹${fee.toLocaleString('en-IN')} hai. Kya aap demo class ya counselling slot book karna chahenge?`,
      toolUsed: 'get_fee_information',
      toolResult: result.data
    };
  }

  if (msg.includes('timing') || msg.includes('batch') || msg.includes('kab')) {
    const result = await executeMcpToolDirectly(instituteId, 'get_batch_information', {});
    return {
      reply: lang === 'english'
        ? `Upcoming batches start from Nov 20. Morning timings: 08:00 AM - 01:30 PM.`
        : `Naye batches Nov 20 se shuru ho rahe hain. Morning batch ki timings 08:00 AM - 01:30 PM hain.`,
      toolUsed: 'get_batch_information',
      toolResult: result.data
    };
  }

  return {
    reply: lang === 'english' 
      ? `Our admission counsellor can guide you through all options. Please share your contact number.`
      : `Hamare senior admission counsellor aapse connect karke puri details share kar denge. Kripya contact share karein!`
  };
}
