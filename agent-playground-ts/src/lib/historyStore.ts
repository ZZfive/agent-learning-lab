import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { ChatMessage } from '../types.js';

type HistoryFile = Record<string, ChatMessage[]>;

export interface HistoryStore {
  loadHistory(sessionId: string): Promise<ChatMessage[]>;
  appendHistory(sessionId: string, messages: ChatMessage[]): Promise<void>;
}

async function readHistoryFile(filePath: string): Promise<HistoryFile> {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as HistoryFile;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}

async function writeHistoryFile(filePath: string, historyFile: HistoryFile): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(historyFile, null, 2)}\n`, 'utf8');
}

export function createHistoryStore(filePath = 'data/chat-history.json'): HistoryStore {
  return {
    async loadHistory(sessionId: string): Promise<ChatMessage[]> {
      const historyFile = await readHistoryFile(filePath);
      return historyFile[sessionId] ?? [];
    },

    async appendHistory(sessionId: string, messages: ChatMessage[]): Promise<void> {
      const historyFile = await readHistoryFile(filePath);
      historyFile[sessionId] = [...(historyFile[sessionId] ?? []), ...messages];
      await writeHistoryFile(filePath, historyFile);
    },
  };
}
