import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import Fastify from 'fastify';

import { createHistoryStore } from '../src/lib/historyStore.js';
import { registerChatRoute } from '../src/routes/chat.js';

async function createTempHistoryStore() {
  const dir = await mkdtemp(join(tmpdir(), 'agent-route-history-'));
  const filePath = join(dir, 'history.json');
  return {
    store: createHistoryStore(filePath),
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}

test('rejects invalid chat payloads with 400', async () => {
  const app = Fastify();
  await registerChatRoute(app);

  const response = await app.inject({
    method: 'POST',
    url: '/chat',
    payload: {},
  });

  assert.equal(response.statusCode, 400);
  const body = response.json();
  assert.equal(body.error, 'Invalid request body');

  await app.close();
});

test('returns agent response for valid chat payloads', async () => {
  const app = Fastify();
  await registerChatRoute(app);

  const response = await app.inject({
    method: 'POST',
    url: '/chat',
    payload: {
      message: 'summarize "Route level integration test for the learning service works correctly."',
    },
  });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.match(body.message, /^Summary:/);
  assert.deepEqual(body.toolLogs, ['summarizeText']);
  assert.equal(body.metadata, undefined);

  await app.close();
});

test('returns 400 when message is empty string', async () => {
  const app = Fastify();
  await registerChatRoute(app);

  const response = await app.inject({
    method: 'POST',
    url: '/chat',
    payload: {
      message: '',
      history: [],
    },
  });

  assert.equal(response.statusCode, 400);
  const body = response.json();
  assert.equal(body.error, 'Message cannot be empty');

  await app.close();
});

test('reuses stored history when sessionId is provided', async () => {
  const app = Fastify();
  const { store, cleanup } = await createTempHistoryStore();
  await registerChatRoute(app, store);

  try {
    const firstResponse = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        sessionId: 'demo',
        message: 'hello',
      },
    });

    assert.equal(firstResponse.statusCode, 200);

    const secondResponse = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        sessionId: 'demo',
        message: 'what happened before',
      },
    });

    assert.equal(secondResponse.statusCode, 200);
    const body = secondResponse.json();
    assert.equal(body.message, 'You said: what happened before. Previous assistant reply: You said: hello.');
    assert.equal(body.sessionId, 'demo');
  } finally {
    await app.close();
    await cleanup();
  }
});

test('rejects invalid sessionId with 400', async () => {
  const app = Fastify();
  await registerChatRoute(app);

  const response = await app.inject({
    method: 'POST',
    url: '/chat',
    payload: {
      sessionId: 'bad session id',
      message: 'hello',
    },
  });

  assert.equal(response.statusCode, 400);
  const body = response.json();
  assert.equal(body.error, 'Invalid request body');

  await app.close();
});
