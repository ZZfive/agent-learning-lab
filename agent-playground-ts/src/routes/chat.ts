import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { runAgent } from '../lib/runAgent.js';

const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

const chatRequestSchema = z.object({
  message: z.string().min(1),
  history: z.array(chatMessageSchema).optional(),
});

export async function registerChatRoute(app: FastifyInstance): Promise<void> {
  app.post('/chat', async (request, reply) => {
    const parsed = chatRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parsed.error.flatten(),
      });
    }

    const result = await runAgent(parsed.data.message, parsed.data.history ?? []);
    return reply.send(result);
  });
}
