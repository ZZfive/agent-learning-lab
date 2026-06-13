import { readFile } from 'node:fs/promises';

import type { ToolDefinition } from '../types.js';

export async function readLocalNote(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf8');
  return content.trim();
}

function extractNotePath(message: string): string | null {
  const match = message.match(/note:\s*(\S+)/i);
  return match?.[1] ?? null;
}

export const readNoteToolDef: ToolDefinition = {
  name: 'readLocalNote',
  description: 'Reads the content of a local file by path',
  parameters: {
    path: { type: 'string', description: 'Absolute path to the note file' },
  },
  match({ message }) {
    return /read note/i.test(message);
  },
  async run({ path }, { message }) {
    const notePath = path ?? extractNotePath(message);
    if (!notePath) {
      return {
        output: 'Please provide a note path like: read note note:/absolute/path.txt',
        toolName: 'readLocalNote',
        isError: true,
      };
    }
    const content = await readLocalNote(notePath);
    return { output: `Note content: ${content}`, toolName: 'readLocalNote' };
  },
};
