import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { ChatMessage } from '../types.js'; //导入ChatMessage类型

type HistoryFile = Record<string, ChatMessage[]>; //定义HistoryFile类型，表示一个会话的聊天记录，key是sessionId，value是ChatMessage数组

export interface HistoryStore { //定义HistoryStore接口，表示一个会话的聊天记录，key是sessionId，value是ChatMessage数组
  loadHistory(sessionId: string): Promise<ChatMessage[]>; //加载一个会话的聊天记录
  appendHistory(sessionId: string, messages: ChatMessage[]): Promise<void>; //追加一个会话的聊天记录
}

async function readHistoryFile(filePath: string): Promise<HistoryFile> { //读取一个会话的聊天记录
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as HistoryFile;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {}; //如果文件不存在，返回空对象
    }

    throw error;
  }
}

async function writeHistoryFile(filePath: string, historyFile: HistoryFile): Promise<void> { //写入一个会话的聊天记录
  await mkdir(dirname(filePath), { recursive: true }); //创建文件夹
  await writeFile(filePath, `${JSON.stringify(historyFile, null, 2)}\n`, 'utf8'); //写入文件
}

export function createHistoryStore(filePath = 'data/chat-history.json'): HistoryStore { //创建一个会话的聊天记录
  return {
    async loadHistory(sessionId: string): Promise<ChatMessage[]> { //加载一个会话的聊天记录
      const historyFile = await readHistoryFile(filePath);
      return historyFile[sessionId] ?? []; //如果文件不存在，返回空数组
    },

    async appendHistory(sessionId: string, messages: ChatMessage[]): Promise<void> { //追加一个会话的聊天记录
      const historyFile = await readHistoryFile(filePath);
      historyFile[sessionId] = [...(historyFile[sessionId] ?? []), ...messages].slice(-10); //追加消息，并限制长度为10
      await writeHistoryFile(filePath, historyFile); //写入文件
    },
  };
}
