export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface AgentMetadata {
  inputWordCount?: number;
  outputWordCount?: number;
}

export interface AgentResponse {
  message: string;
  toolLogs: string[];
  metadata?: AgentMetadata;
  sessionId?: string;
}

export interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
  sessionId?: string;
}

export interface ToolParameter {
  type: string;
  description: string;
}

export interface ToolResult {
  output: string;
  toolName: string;
  isError?: boolean;
}

export interface ToolContext {
  message: string;
  history: ChatMessage[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  match(context: ToolContext): boolean; // 判断是否匹配工具，需要和实际工具函数中提取的匹配逻辑一致
  run(args: Record<string, string>, context: ToolContext): Promise<ToolResult>; // 执行工具，需要和实际工具函数中执行逻辑一致
} // 工具定义，需要和实际工具函数中定义的工具定义一致
