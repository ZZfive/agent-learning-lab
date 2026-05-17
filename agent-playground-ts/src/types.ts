export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface AgentResponse {
  message: string;
  toolLogs: string[];
}

export interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
}
