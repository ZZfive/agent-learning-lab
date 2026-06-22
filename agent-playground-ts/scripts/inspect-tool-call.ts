import { generateText, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { defaultRegistry } from '../src/lib/toolRegistry.js';
import { toAISDKTools } from '../src/lib/toolAdapter.js';

const apiKey = process.env.OPENROUTER_API_KEY;
const baseURL = process.env.OPENROUTER_BASE_URL;
const modelId = process.env.OPENROUTER_MODEL;

const openrouter = createOpenAI({ baseURL, apiKey });
const model = openrouter.chat(modelId!);

const message = 'Please summarize this text: "A quick brown fox jumps over the lazy dog"';
const context = { message, history: [] };
const tools = toAISDKTools(defaultRegistry, context);

console.log('=== REQUEST ===');
console.log('Message:', message);
console.log('Tools exposed to model:', Object.keys(tools));

const result = await generateText({
  model,
  messages: [{ role: 'user', content: message }],
  tools,
  stopWhen: stepCountIs(5),
});

console.log('\n=== STEPS (complete conversation history) ===');
result.steps.forEach((step, i) => {
  console.log(`\n--- Step ${i + 1} ---`);
  const body = step.request?.body as Record<string, unknown> | undefined;
  console.log('messages sent to LLM:', JSON.stringify(body?.messages ?? '(not available)', null, 2));
  console.log('text:', step.text);
  console.log('toolCalls:', JSON.stringify(step.dynamicToolCalls, null, 2));
  console.log('toolResults:', JSON.stringify(step.toolResults, null, 2));
  console.log('finishReason:', step.finishReason);
});

console.log('\n=== FINAL RESULT ===');
console.log('text:', result.text);
console.log('toolLogs:', result.steps.flatMap(s => s.dynamicToolCalls).map(tc => tc.toolName));
