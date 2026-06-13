import { generateText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import type { AgentResponse, ChatMessage, ToolDefinition } from '../types.js';
import { defaultRegistry } from './toolRegistry.js';
import { toAISDKTools } from './toolAdapter.js';

export const defaultModel = anthropic('claude-haiku-4-5-20251001');

export async function runAgentLLM(
  message: string,
  history: ChatMessage[] = [],
  registry: ToolDefinition[] = defaultRegistry,
  model: LanguageModel = defaultModel,
): Promise<AgentResponse> {
  const context = { message, history };
  const tools = toAISDKTools(registry, context);

  const messages = [
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: message },
  ];

  const result = await generateText({
    model,
    messages,
    tools,
    stopWhen: stepCountIs(5),
  });

  const toolLogs = result.steps
    .flatMap(step => step.dynamicToolCalls)
    .map(tc => tc.toolName);

  return {
    message: result.text,
    toolLogs,
  };
}
