import Fastify from 'fastify';

import { registerChatRoute } from './routes/chat.js';

async function buildServer() {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({ ok: true }));
  await registerChatRoute(app);

  return app;
}

async function start() {
  const app = await buildServer();

  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
