import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAI } from '@ai-sdk/openai';

const apiKey = process.env.OPENROUTER_API_KEY;
const baseURL = process.env.OPENROUTER_BASE_URL;
const modelId = process.env.OPENROUTER_MODEL;
const hasApiKey = !!(apiKey && baseURL && modelId);

function makeModel() {
  const openrouter = createOpenAI({ baseURL, apiKey });
  return openrouter.chat(modelId!);
}

test('runAgentLLM calls summarize tool for summarize request', { skip: !hasApiKey }, async () => {
  const { runAgentLLM } = await import('../src/lib/runAgentLLM.js');
  const result = await runAgentLLM(
    'Please summarize this text: "A quick brown fox jumps over the lazy dog"',
    [],
    undefined,
    makeModel(),
  );

  assert.ok(result.toolLogs.includes('summarizeText'), `expected summarizeText in toolLogs, got: ${JSON.stringify(result.toolLogs)}`);
  assert.ok(result.message.length > 0, 'expected non-empty message');
});

test('runAgentLLM returns text response for general question without tool call', { skip: !hasApiKey }, async () => {
  const { runAgentLLM } = await import('../src/lib/runAgentLLM.js');
  const result = await runAgentLLM('What is 2 + 2?', [], undefined, makeModel());

  assert.equal(result.toolLogs.length, 0, 'expected no tool calls for simple question');
  assert.ok(result.message.length > 0, 'expected non-empty message');
});

test('runAgentLLM uses custom registry (only echo tool)', { skip: !hasApiKey }, async () => {
  const { runAgentLLM } = await import('../src/lib/runAgentLLM.js');
  const { echoBackToolDef } = await import('../src/tools/echoBack.js');

  const result = await runAgentLLM('Echo back: hello world', [], [echoBackToolDef], makeModel());

  assert.ok(result.toolLogs.includes('echoBack'), `expected echoBack in toolLogs, got: ${JSON.stringify(result.toolLogs)}`);
});
