import { countWords } from '../tools/countWords.js';
import { defaultRegistry } from './toolRegistry.js';
import type { AgentMetadata, AgentResponse, ChatMessage, ToolDefinition } from '../types.js';

export async function runAgent(
  message: string,
  history: ChatMessage[] = [],
  withWordCount: boolean = false,
  registry: ToolDefinition[] = defaultRegistry,
): Promise<AgentResponse> {
  const toolLogs: string[] = [];
  const normalizedMessage = message.trim();
  const context = { message: normalizedMessage, history };

  function buildMetadata(inputText: string, outputText: string): AgentMetadata | undefined {
    if (!withWordCount) {
      return undefined;
    }
    return {
      inputWordCount: countWords(inputText),
      outputWordCount: countWords(outputText),
    };
  }

  const tool = registry.find(t => t.match(context)); // 遍历registry，找到匹配的工具

  if (tool) {
    const result = await tool.run({}, context); // 执行工具
    if (!result.isError) {
      toolLogs.push(result.toolName);
    }
    return {
      message: result.output,
      toolLogs,
      metadata: buildMetadata(normalizedMessage, result.output),
    };
  }

  const lastAssistantMessage = [...history].reverse().find((item) => item.role === 'assistant');
  const contextSuffix = lastAssistantMessage ? ` Previous assistant reply: ${lastAssistantMessage.content}` : '';
  const fallbackMessage = `You said: ${normalizedMessage}.${contextSuffix}`;

  return {
    message: fallbackMessage,
    toolLogs,
    metadata: buildMetadata(normalizedMessage, fallbackMessage),
  };
}
