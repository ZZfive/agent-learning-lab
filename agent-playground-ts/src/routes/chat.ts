import type { FastifyInstance } from 'fastify'; //只导入类型，不执行代码
import { z } from 'zod'; //导入zod库，用于数据验证

import { runAgent } from '../lib/runAgent.js';

const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']), //定义role的枚举类型
  content: z.string(), //定义content的类型
});

const chatRequestSchema = z.object({
  message: z.string().min(1), //定义message的类型
  history: z.array(chatMessageSchema).optional(), //定义history的类型
});

export async function registerChatRoute(app: FastifyInstance): Promise<void> {
  app.post('/chat', async (request, reply) => {
    const parsed = chatRequestSchema.safeParse(request.body); //验证请求体是否符合schema

    if (!parsed.success) {
      return reply.status(400).send({ //如果验证失败，返回400错误
        error: 'Invalid request body',
        details: parsed.error.flatten(), //返回错误详情
      });
    }

    const result = await runAgent(parsed.data.message, parsed.data.history ?? []); //调用runAgent函数
    return reply.send(result); //返回结果
  });
}
