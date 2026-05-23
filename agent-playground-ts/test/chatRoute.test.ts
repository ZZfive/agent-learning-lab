import test from 'node:test';
import assert from 'node:assert/strict';

import Fastify from 'fastify';

import { registerChatRoute } from '../src/routes/chat.js';

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