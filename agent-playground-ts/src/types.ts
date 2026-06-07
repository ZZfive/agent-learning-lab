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
