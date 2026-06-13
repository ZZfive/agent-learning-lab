import { dynamicTool, jsonSchema } from 'ai';
import type { ToolDefinition, ToolContext } from '../types.js';

function toAISDKTool(def: ToolDefinition, context: ToolContext) {
  return dynamicTool({
    description: def.description,
    inputSchema: jsonSchema({
      type: 'object' as const,
      properties: Object.fromEntries(
        Object.entries(def.parameters).map(([key, param]) => [
          key,
          { type: param.type, description: param.description },
        ])
      ),
      required: Object.keys(def.parameters),
    }),
    execute: async (input: unknown) => {
      const args = input as Record<string, string>;
      const result = await def.run(args, context);
      return result.output;
    },
  });
}

export function toAISDKTools(registry: ToolDefinition[], context: ToolContext) {
  return Object.fromEntries(
    registry.map(def => [def.name, toAISDKTool(def, context)])
  );
}
