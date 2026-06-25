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
  registry: ToolDefinition[] = defaultRegistry, // 默认工具注册表，包含三个工具
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
    // v6 用 stopWhen 替代了 v4/v5 的 maxSteps: 5。
    // stopWhen 接收一个判断函数，每步结束后调用一次决定是否继续循环。
    // stepCountIs(5) 是内置谓词：到第 5 步就停，防止工具调用循环无限执行。
    // 也可以换成 hasToolCall()（调过一次工具就停）或自定义条件。
    stopWhen: stepCountIs(5),
  });

  // dynamicToolCalls 收录用 dynamicTool() 创建的工具的调用记录。
  // 用 tool() + Zod 创建的工具调用记录在 toolCalls 里。
  // 我们在 toolAdapter.ts 里用的是 dynamicTool，所以这里必须读 dynamicToolCalls，
  // 读 toolCalls 会永远得到空数组。
  const toolLogs = result.steps
    .flatMap(step => step.dynamicToolCalls)
    .map(tc => tc.toolName);

  return {
    message: result.text,
    toolLogs,
  };
}
