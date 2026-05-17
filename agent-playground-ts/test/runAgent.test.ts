import test from 'node:test';
import assert from 'node:assert/strict';

import { runAgent } from '../src/lib/runAgent.js';

test('returns summarize tool output when message asks to summarize quoted text', async () => {
  const result = await runAgent('summarize "This is a long sentence for verifying the summarize tool is selected by the agent layer."');

  assert.equal(result.toolLogs[0], 'summarizeText');
  assert.match(result.message, /^Summary:/);
});

test('returns note path guidance when read note request has no path', async () => {
  const result = await runAgent('read note');

  assert.equal(result.toolLogs.length, 0);
  assert.equal(result.message, 'Please provide a note path like: read note note:/absolute/path.txt');
});

test('includes previous assistant reply in fallback response context', async () => {
  const result = await runAgent('hello there', [
    { role: 'assistant', content: 'Earlier answer' },
  ]);

  assert.equal(result.toolLogs.length, 0);
  assert.equal(result.message, 'You said: hello there. Previous assistant reply: Earlier answer');
});
