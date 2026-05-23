import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { createHistoryStore } from '../src/lib/historyStore.js';

async function createTempHistoryStore() {
  const dir = await mkdtemp(join(tmpdir(), 'agent-history-'));
  const filePath = join(dir, 'history.json');
  return {
    store: createHistoryStore(filePath),
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}

test('returns empty history for unknown session', async () => {
  const { store, cleanup } = await createTempHistoryStore();

  try {
    const history = await store.loadHistory('missing-session');
    assert.deepEqual(history, []);
  } finally {
    await cleanup();
  }
});

test('loads messages after appending them to a session', async () => {
  const { store, cleanup } = await createTempHistoryStore();

  try {
    await store.appendHistory('demo', [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'You said: hello.' },
    ]);

    const history = await store.loadHistory('demo');
    assert.deepEqual(history, [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'You said: hello.' },
    ]);
  } finally {
    await cleanup();
  }
});

test('keeps histories isolated between sessions', async () => {
  const { store, cleanup } = await createTempHistoryStore();

  try {
    await store.appendHistory('session-a', [{ role: 'user', content: 'from a' }]);
    await store.appendHistory('session-b', [{ role: 'user', content: 'from b' }]);

    assert.deepEqual(await store.loadHistory('session-a'), [{ role: 'user', content: 'from a' }]);
    assert.deepEqual(await store.loadHistory('session-b'), [{ role: 'user', content: 'from b' }]);
  } finally {
    await cleanup();
  }
});
