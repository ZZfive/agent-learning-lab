import { readLocalNote } from '../tools/readLocalNote.js';
import { summarizeText } from '../tools/summarizeText.js';
import type { AgentResponse, ChatMessage } from '../types.js';

function extractQuotedText(message: string): string | null {
  const match = message.match(/"([^"]+)"/); // 匹配引号包裹的文本，返回捕获组中的文本，如果没有匹配到，则返回 null
  return match?.[1] ?? null;
}

function extractNotePath(message: string): string | null {
  const match = message.match(/note:\s*(\S+)/i);
  return match?.[1] ?? null;
}

export async function runAgent(message: string, history: ChatMessage[] = []): Promise<AgentResponse> {
  const toolLogs: string[] = []; //初始化为空数组
  const normalizedMessage = message.trim();

  if (/summarize/i.test(normalizedMessage)) { // 如果消息包含 summarize，则调用 summarizeText 工具，忽略大小写，走摘要工具路径
    const quotedText = extractQuotedText(normalizedMessage) ?? normalizedMessage; // 提取引号包裹的文本，如果没有匹配到，则使用原始消息
    const summary = summarizeText(quotedText); // 调用 summarizeText 工具，返回摘要
    toolLogs.push('summarizeText'); // 将摘要工具日志添加到工具日志数组中

    return {
      message: `Summary: ${summary}`,
      toolLogs,
    };
  }

  if (/read note/i.test(normalizedMessage)) { // 如果消息包含 read note，则调用 readLocalNote 工具，忽略大小写，走读取本地笔记工具路径
    const notePath = extractNotePath(normalizedMessage); // 提取笔记路径

    if (!notePath) { // 如果笔记路径为空，则返回错误信息
      return {
        message: 'Please provide a note path like: read note note:/absolute/path.txt',
        toolLogs,
      };
    }

    const content = await readLocalNote(notePath); // 读取本地笔记内容
    toolLogs.push('readLocalNote'); // 将读取本地笔记工具日志添加到工具日志数组中

    return {
      message: `Note content: ${content}`,
      toolLogs,
    };
  }

  const lastAssistantMessage = [...history].reverse().find((item) => item.role === 'assistant'); // 获取最后一个助理消息
  const contextSuffix = lastAssistantMessage ? ` Previous assistant reply: ${lastAssistantMessage.content}` : ''; // 如果最后一个助理消息不为空，则添加助理消息前缀

  return {
    message: `You said: ${normalizedMessage}.${contextSuffix}`, // 返回消息，包含原始消息和助理消息前缀
    toolLogs,
  };
}
