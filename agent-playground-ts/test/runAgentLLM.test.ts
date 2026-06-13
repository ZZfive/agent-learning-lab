import test from 'node:test';
import assert from 'node:assert/strict';

const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

test('runAgentLLM calls summarize tool for summarize request', { skip: !hasApiKey }, async () => {
  const { runAgentLLM } = await import('../src/lib/runAgentLLM.js');
  const result = await runAgentLLM('Please summarize this text: "A quick brown fox jumps over the lazy dog"');

  assert.ok(result.toolLogs.includes('summarizeText'), `expected summarizeText in toolLogs, got: ${JSON.stringify(result.toolLogs)}`);
  assert.ok(result.message.length > 0, 'expected non-empty message');
});

test('runAgentLLM returns text response for general question without tool call', { skip: !hasApiKey }, async () => {
  const { runAgentLLM } = await import('../src/lib/runAgentLLM.js');
  const result = await runAgentLLM('What is 2 + 2?');

  assert.equal(result.toolLogs.length, 0, 'expected no tool calls for simple question');
  assert.ok(result.message.length > 0, 'expected non-empty message');
});

test('runAgentLLM uses custom registry (only echo tool)', { skip: !hasApiKey }, async () => {
  const { runAgentLLM } = await import('../src/lib/runAgentLLM.js');
  const { echoBackToolDef } = await import('../src/tools/echoBack.js');

  const result = await runAgentLLM('Echo back: hello world', [], [echoBackToolDef]);

  assert.ok(result.toolLogs.includes('echoBack'), `expected echoBack in toolLogs, got: ${JSON.stringify(result.toolLogs)}`);
});
