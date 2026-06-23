import { dynamicTool, jsonSchema } from 'ai';
import type { ToolDefinition, ToolContext } from '../types.js';

// 把项目自定义的 ToolDefinition 转换为 AI SDK 的 dynamicTool 格式。
// 之所以用 dynamicTool 而非 tool()：我们的 schema 来自运行时的 ToolDefinition.parameters，
// 编译期类型未知，无法让 TypeScript 推导参数类型，所以选择 dynamicTool + jsonSchema 组合。
function toAISDKTool(def: ToolDefinition, context: ToolContext) {
  return dynamicTool({
    // description 告诉 LLM 这个工具是做什么的，LLM 根据它决定是否调用该工具
    description: def.description,

    // inputSchema 告诉 LLM 调用时需要提供哪些参数及其类型。
    // LLM 会按照这个 schema 生成参数，再由 execute 接收。
    inputSchema: jsonSchema({
      // 'object' as const：收窄字面量类型，避免被推断为宽泛的 string，否则 jsonSchema 类型检查报错
      type: 'object' as const,

      // 把 ToolDefinition.parameters（{ [key]: { type, description } }）
      // 转为 JSON Schema 的 properties 格式（结构相同，只是换了外层容器）：
      //   Object.entries → [['text', { type, description }], ...]
      //   .map           → 保持每项结构不变（此处无需改写内容）
      //   Object.fromEntries → 重新组装回对象
      properties: Object.fromEntries(
        Object.entries(def.parameters).map(([key, param]) => [
          key,
          { type: param.type, description: param.description },
        ])
      ),

      // 把所有参数都列为必填，让 LLM 调用时不会省略任何字段
      required: Object.keys(def.parameters),
    }),

    // execute 是 AI SDK 在 LLM 决定调用该工具后实际执行的函数。
    // input 是 LLM 按照 inputSchema 生成的参数对象，类型声明为 unknown，
    // 用 as 断言为 Record<string, string> 后传给 def.run。
    // context 通过闭包捕获，携带原始 message 和 history，工具执行时可按需使用。
    execute: async (input: unknown) => {
      const args = input as Record<string, string>;
      const result = await def.run(args, context);
      return result.output;
    },
  });
}

// 将整个 registry 批量转换为 AI SDK 的 tools 字典格式：{ [toolName]: dynamicTool }。
// generateText 的 tools 参数就是这个结构，LLM 拿到后按 name 识别和调用工具。
export function toAISDKTools(registry: ToolDefinition[], context: ToolContext) {
  return Object.fromEntries(
    registry.map(def => [def.name, toAISDKTool(def, context)])
  );
}
