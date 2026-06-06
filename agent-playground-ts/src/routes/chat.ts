import type { FastifyInstance } from 'fastify'; //只导入类型，不执行代码
import { z } from 'zod'; //导入zod库，用于数据验证

import { createHistoryStore, type HistoryStore } from '../lib/historyStore.js';
import { runAgent } from '../lib/runAgent.js';

const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']), //定义role的枚举类型
  content: z.string(), //定义content的类型
});

const chatRequestSchema = z.object({
  message: z.string(), //定义message的类型
  history: z.array(chatMessageSchema).optional(), //定义history的类型
  sessionId: z.string().regex(/^[A-Za-z0-9_-]+$/).optional(), //定义sessionId的类型
});

export async function registerChatRoute(
  app: FastifyInstance,
  historyStore: HistoryStore = createHistoryStore()
): Promise<void> {
  app.post('/chat', async (request, reply) => {
    const parsed = chatRequestSchema.safeParse(request.body); //验证请求体是否符合schema

    if (!parsed.success) {
      return reply.status(400).send({ //如果验证失败，返回400错误
        error: 'Invalid request body',
        details: parsed.error.flatten(), //返回错误详情
      });
    }

    if (parsed.data.message.trim() === '') {
      return reply.status(400).send({
        error: 'Message cannot be empty',
      });
    }

    const history = parsed.data.sessionId
      ? await historyStore.loadHistory(parsed.data.sessionId)
      : parsed.data.history ?? []; //如果sessionId存在，则加载会话的聊天记录；如果请求体中没有sessionId，则用请求体中的history；如果请求体中也没有history，就用空数组

    const result = await runAgent(parsed.data.message, history); //调用runAgent函数

    if (parsed.data.sessionId) {
      await historyStore.appendHistory(parsed.data.sessionId, [
        { role: 'user', content: parsed.data.message },
        { role: 'assistant', content: result.message },
      ]); //追加消息到sessionId对应的会话的聊天记录
    }

    return reply.send(result); //返回结果
  });
}
