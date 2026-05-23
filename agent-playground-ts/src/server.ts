import Fastify from 'fastify';

import { registerChatRoute } from './routes/chat.js';

async function buildServer() {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({ ok: true })); //健康检查路由
  await registerChatRoute(app); //注册聊天路由

  return app;
}

async function start() {
  const app = await buildServer(); //构建服务器

  try {
    await app.listen({ port: 3000, host: '0.0.0.0' }); //启动服务器
  } catch (error) {
    app.log.error(error); //记录错误
    process.exit(1);
  }
}

void start();
