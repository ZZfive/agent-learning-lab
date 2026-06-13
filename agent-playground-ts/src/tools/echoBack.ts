import type { ToolDefinition } from '../types.js';

export const echoBackToolDef: ToolDefinition = {
    name: 'echoBack',
    description: 'Echoes back the input message with a prefix "Echo:"',
    parameters: {
      message: { type: 'string', description: 'The message to echo back' },
    },
    match({ message }) {
      return /^echo back/i.test(message);
    },
    async run({ message: argMessage }, { message }) {
      const input = argMessage ?? message;
      return { output: `Echo: ${input}`, toolName: 'echoBack' };
    },
  };