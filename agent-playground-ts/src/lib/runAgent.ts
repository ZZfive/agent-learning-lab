import { readLocalNote } from '../tools/readLocalNote.js';
import { summarizeText } from '../tools/summarizeText.js';
import { countWords } from '../tools/countWords.js';
import type { AgentMetadata, AgentResponse, ChatMessage } from '../types.js';

function extractQuotedText(message: string): string | null {
  const match = message.match(/"([^"]+)"/); // 匹配引号包裹的文本，返回捕获组中的文本，如果没有匹配到，则返回 null
  return match?.[1] ?? null;
}

function extractNotePath(message: string): string | null {
  const match = message.match(/note:\s*(\S+)/i);
  return match?.[1] ?? null;
}

export async function runAgent(
  message: string,
  history: ChatMessage[] = [],
  withWordCount: boolean = false
): Promise<AgentResponse> {
  const toolLogs: string[] = [];
  const normalizedMessage = message.trim();

  function buildMetadata(inputText: string, outputText: string): AgentMetadata | undefined {
    if (!withWordCount) {
      return undefined;
    }

    return {
      inputWordCount: countWords(inputText),
      outputWordCount: countWords(outputText),
    };
  }

  if (/summarize/i.test(normalizedMessage)) {
    const quotedText = extractQuotedText(normalizedMessage) ?? normalizedMessage;
    const summary = summarizeText(quotedText);
    toolLogs.push('summarizeText');
    const outputMessage = `Summary: ${summary}`;
    return {
      message: outputMessage,
      toolLogs,
      metadata: buildMetadata(quotedText, outputMessage),
    };
  }

  if (/read note/i.test(normalizedMessage)) {
    const notePath = extractNotePath(normalizedMessage);
    if (!notePath) {
      const errorMessage = 'Please provide a note path like: read note note:/absolute/path.txt';
      return {
        message: errorMessage,
        toolLogs,
        metadata: buildMetadata(normalizedMessage, errorMessage),
      };
    }

    const content = await readLocalNote(notePath);
    toolLogs.push('readLocalNote');
    const outputMessage = `Note content: ${content}`;
    return {
      message: outputMessage,
      toolLogs,
      metadata: buildMetadata(normalizedMessage, outputMessage),
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
