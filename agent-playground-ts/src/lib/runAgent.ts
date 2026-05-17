import { readLocalNote } from '../tools/readLocalNote.js';
import { summarizeText } from '../tools/summarizeText.js';
import type { AgentResponse, ChatMessage } from '../types.js';

function extractQuotedText(message: string): string | null {
  const match = message.match(/"([^"]+)"/);
  return match?.[1] ?? null;
}

function extractNotePath(message: string): string | null {
  const match = message.match(/note:\s*(\S+)/i);
  return match?.[1] ?? null;
}

export async function runAgent(message: string, history: ChatMessage[] = []): Promise<AgentResponse> {
  const toolLogs: string[] = [];
  const normalizedMessage = message.trim();

  if (/summarize/i.test(normalizedMessage)) {
    const quotedText = extractQuotedText(normalizedMessage) ?? normalizedMessage;
    const summary = summarizeText(quotedText);
    toolLogs.push('summarizeText');

    return {
      message: `Summary: ${summary}`,
      toolLogs,
    };
  }

  if (/read note/i.test(normalizedMessage)) {
    const notePath = extractNotePath(normalizedMessage);

    if (!notePath) {
      return {
        message: 'Please provide a note path like: read note note:/absolute/path.txt',
        toolLogs,
      };
    }

    const content = await readLocalNote(notePath);
    toolLogs.push('readLocalNote');

    return {
      message: `Note content: ${content}`,
      toolLogs,
    };
  }

  const lastAssistantMessage = [...history].reverse().find((item) => item.role === 'assistant');
  const contextSuffix = lastAssistantMessage ? ` Previous assistant reply: ${lastAssistantMessage.content}` : '';

  return {
    message: `You said: ${normalizedMessage}.${contextSuffix}`,
    toolLogs,
  };
}
