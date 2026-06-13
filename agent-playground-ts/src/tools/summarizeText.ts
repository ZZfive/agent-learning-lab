import type { ToolDefinition } from '../types.js';

export function summarizeText(input: string): string {
  const normalized = input.trim();

  if (!normalized) {
    return 'Empty input.';
  }

  if (normalized.length <= 80) {
    return normalized;
  }

  return `${normalized.slice(0, 77)}...`;
}

function extractQuotedText(message: string): string | null {
  const match = message.match(/"([^"]+)"/);
  return match?.[1] ?? null;
}

export const summarizeToolDef: ToolDefinition = {
  name: 'summarizeText',
  description: 'Summarizes a given piece of text',
  parameters: {
    text: { type: 'string', description: 'The text to summarize' },
  },
  match({ message }) {
    return /summarize/i.test(message);
  },
  async run({ text }, { message }) {
    const input = text ?? extractQuotedText(message) ?? message;
    return { output: `Summary: ${summarizeText(input)}`, toolName: 'summarizeText' };
  },
};
