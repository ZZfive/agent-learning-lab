# Week 04 实操清单：接入真实 LLM Tool Calling

## 本周目标

Week 03 建立了 tool registry：每个工具自带 schema，`runAgent` 遍历 registry 用 `match()` 决定调哪个。但"谁来决定调哪个工具"这件事仍然是代码写死的规则，而不是 LLM 决定的。

本周目标是接入 [Vercel AI SDK](https://sdk.vercel.ai/)（`ai` 包），让 **LLM 根据工具的 `description` 和 `parameters` schema 自主决定调哪个工具**，把 Week 03 的 `parameters` 字段从"装饰性的文档"变成"真正驱动行为的 schema"。

到本周结束时，你应该能说清楚：

1. LLM tool calling 的 3-turn 协议是什么
2. `parameters` schema 在 Week 03 和 Week 04 中各扮演什么角色
3. Vercel AI SDK 的 `generateText` 如何处理工具调用的循环
4. 为什么 `match()` 方法在接入 LLM 后变得多余
5. 工具的 `run(args, context)` 在 Week 04 中应该如何使用 `args`

建议总投入：4-5 小时。

---

## 架构对比

### Week 03（当前）

```
用户输入 → runAgent
  → registry.find(t => t.match(context))  ← 代码规则决定调哪个工具
  → tool.run({}, context)                 ← args 为空，工具自己从 message 提取信息
  → 返回结果
```

### Week 04（目标）

```
用户输入 → runAgentLLM
  → generateText(model, messages, tools)  ← LLM 决定调哪个工具
  → tool.run(args, context)               ← args 由 LLM 解析填充，工具直接使用
  → 返回结果
```

关键变化：
- `match()` 不再参与路由，LLM 自主决策
- `parameters` schema 真正传给 LLM，驱动 LLM 的工具调用格式
- `run(args, ...)` 的 `args` 第一次有了真实内容

---

## Day 1：理解 LLM Tool Calling 协议

### 要理解的核心概念

LLM tool calling 本质是一个**三步循环**：

```
1. 发送：messages + tools（带 schema）→ LLM
          ↓
2. LLM 返回：tool_use（工具名 + 参数）
          ↓
3. 执行：client 执行工具，把结果作为 tool_result 再发给 LLM
          ↓
4. LLM 返回：最终文本回复
```

这个循环可以重复多次（多工具调用）。Vercel AI SDK 的 `stopWhen: stepCountIs(n)` 参数控制最多循环多少次。

### 你要回答

- Week 03 中 `parameters` 字段被什么代码用到了？（答案：几乎没有）
- Week 04 中 LLM 读取 `parameters` 是为了做什么？
- 为什么 LLM 需要知道工具的参数 schema？

### Claude Code 提示词

```text
解释 LLM function calling 的完整请求-响应循环，
从客户端发送 tools 数组，到 LLM 返回 tool_use，
到客户端发送 tool_result，到 LLM 返回最终回复。
用伪代码或流程图帮我建立直觉。
不要写实际代码，先帮我理解协议。
```

---

## Day 2：安装 Vercel AI SDK，理解它的接口

### 安装

在 `agent-playground-ts/` 下：

```bash
npm install ai @ai-sdk/anthropic
```

### 理解 Vercel AI SDK 的工具格式

Vercel AI SDK v6 中，针对运行时动态 schema（我们的场景），使用 `dynamicTool` + `jsonSchema`：

```ts
import { dynamicTool, jsonSchema } from 'ai';

const myTool = dynamicTool({
  description: 'Summarizes a piece of text',
  inputSchema: jsonSchema({      // 注意：v6 用 inputSchema，不是 parameters
    type: 'object' as const,
    properties: {
      text: { type: 'string', description: 'The text to summarize' },
    },
    required: ['text'],
  }),
  execute: async (input: unknown) => {
    const { text } = input as { text: string };
    return `Summary: ${text.slice(0, 50)}`;
  },
});
```

如果 schema 在编译期已知，可以用 Zod + `tool()`：

```ts
import { tool } from 'ai';
import { z } from 'zod';

const myTool = tool({
  description: 'Summarizes a piece of text',
  inputSchema: z.object({
    text: z.string().describe('The text to summarize'),
  }),
  execute: async ({ text }) => `Summary: ${text.slice(0, 50)}`,
});
```

> **注意**：v6 把 `parameters` 改名为 `inputSchema`。如果你在网上看到用 `parameters` 的示例，那是 v4/v5 的写法。

### 理解 generateText 的调用方式

```ts
import { generateText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const result = await generateText({
  model: anthropic('claude-haiku-4-5-20251001'),
  messages: [...],
  tools: { summarizeText: myTool },
  stopWhen: stepCountIs(5),  // v6 用 stopWhen，替代了 v4/v5 的 maxSteps
});

console.log(result.text);              // 最终文本回复
console.log(result.steps);             // 每一步的详情
console.log(result.steps[0].dynamicToolCalls);  // dynamicTool 的调用记录
```

### 你要回答

- `stopWhen` 和旧版 `maxSteps` 有什么区别？（提示：看 `stepCountIs`、`isLoopFinished`、`hasToolCall` 三个函数）
- `result.steps` 中，`dynamicToolCalls` 和 `toolCalls` 的区别是什么？
- `dynamicTool` 和 `tool` 分别适合什么场景？

---

## Day 3：写 adapter 函数

### 目标

新建 `src/lib/toolAdapter.ts`，写一个把我们的 `ToolDefinition` 转成 AI SDK 工具格式的函数：

```ts
import { dynamicTool, jsonSchema } from 'ai';
import type { ToolDefinition, ToolContext } from '../types.js';

function toAISDKTool(def: ToolDefinition, context: ToolContext) {
  return dynamicTool({
    description: def.description,
    inputSchema: jsonSchema({      // v6 用 inputSchema，不是 parameters
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
```

### 重点理解

- `context` 为什么需要传给 adapter 而不是在 `execute` 内部构造？
- `required: Object.keys(def.parameters)` 意味着什么？有什么风险？
- `as const` 在 `type: 'object' as const` 这里为什么必要？
- 为什么用 `dynamicTool` 而不是 `tool`？（提示：我们的 schema 在运行时才确定，TypeScript 无法提前推导输入类型）

### 你要回答

- `toAISDKTools` 返回的是什么结构？（提示：看 `generateText` 的 `tools` 参数类型）
- 如果 `def.parameters` 为空对象 `{}`，adapter 会生成什么 schema？

---

## Day 4：写 runAgentLLM

### 目标

新建 `src/lib/runAgentLLM.ts`，使用 Vercel AI SDK 实现与 `runAgent` 相同接口的 LLM-driven 版本：

```ts
import { generateText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import type { AgentResponse, ChatMessage, ToolDefinition } from '../types.js';
import { defaultRegistry } from './toolRegistry.js';
import { toAISDKTools } from './toolAdapter.js';

export const defaultModel = anthropic('claude-haiku-4-5-20251001');

export async function runAgentLLM(
  message: string,
  history: ChatMessage[] = [],
  registry: ToolDefinition[] = defaultRegistry,
  model: LanguageModel = defaultModel,  // provider 可注入，默认 Anthropic Haiku
): Promise<AgentResponse> {
  const context = { message, history };
  const tools = toAISDKTools(registry, context);

  const messages = [
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: message },
  ];

  const result = await generateText({
    model,
    messages,
    tools,
    stopWhen: stepCountIs(5),  // v6 API：替代了 maxSteps
  });

  const toolLogs = result.steps
    .flatMap(step => step.dynamicToolCalls)  // dynamicTool 的调用记录在这里
    .map(tc => tc.toolName);

  return {
    message: result.text,
    toolLogs,
  };
}
```

### 注意

- 返回类型 `AgentResponse` 与 `runAgent` 相同，这是有意为之的
- `registry` 和 `model` 都通过参数注入，与 `runAgent` 的 `registry` 注入模式一致
- `withWordCount` 参数暂时不迁移（Week 04 重点是 LLM routing，不是 metadata）

### 验证：Anthropic

```bash
export ANTHROPIC_API_KEY="your-key-here"
```

```ts
import { runAgentLLM } from '../src/lib/runAgentLLM.js';
const result = await runAgentLLM('summarize "hello world this is a test"');
console.log(result);
```

### 验证：OpenRouter（切换 provider 只改一行）

```ts
import { createOpenAI } from '@ai-sdk/openai';
import { runAgentLLM } from '../src/lib/runAgentLLM.js';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const result = await runAgentLLM(
  'summarize "hello world"',
  [],
  undefined,
  openrouter('deepseek/deepseek-chat'),
);
console.log(result);
```

> OpenRouter 上不同模型的 tool calling 支持质量差异较大，切换后建议手动验证工具是否被正确调用。

---

## Day 5：理解 args 的变化，更新工具

### 当前问题

Week 03 中所有工具都这样写：

```ts
async run(_, { message }) {
  const input = extractQuotedText(message) ?? message;  // 从 message 里手动提取
  return { output: `Summary: ${summarizeText(input)}`, toolName: 'summarizeText' };
},
```

`_` 代表 `args`，完全被忽略了。工具自己解析用户输入。

Week 04 中 LLM 已经解析好了：

```
用户说: 'summarize "hello world"'
LLM 理解后调用: summarizeText({ text: "hello world" })
```

`args.text` 已经是 `"hello world"` 了，不需要工具再从 message 里提取。

### 目标：更新工具，优先使用 args

更新 `summarizeText.ts` 的 `run` 方法：

```ts
async run({ text }, { message }) {
  // Week 04: LLM 已解析 args，优先使用；Week 03 路径退化用 message 提取
  const input = text ?? extractQuotedText(message) ?? message;
  return { output: `Summary: ${summarizeText(input)}`, toolName: 'summarizeText' };
},
```

同理更新 `readLocalNote.ts` 和 `echoBack.ts`（让 `args.path`/`args.message` 优先）。

### 你要回答

- 如果工具只靠 `args`、完全不看 `context.message`，有什么好处？有什么问题？
- Week 03 的测试（`runAgent`）会不会因为这个改动而 break？为什么不会？
- `match()` 方法在 `runAgentLLM` 中有没有被调用？

---

## Day 6：写集成测试

### 测试策略

`runAgentLLM` 需要真实 API key，不能在 CI 环境无 key 时跑。用环境变量做 guard：

```ts
// test/runAgentLLM.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';

const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

test('runAgentLLM calls summarize tool for summarize request', { skip: !hasApiKey }, async () => {
  const { runAgentLLM } = await import('../src/lib/runAgentLLM.js');
  const result = await runAgentLLM('summarize "a quick brown fox jumps over the lazy dog"');

  assert.ok(result.toolLogs.includes('summarizeText'), 'expected summarizeText in toolLogs');
  assert.ok(result.message.length > 0, 'expected non-empty message');
});

test('runAgentLLM returns text response for general question', { skip: !hasApiKey }, async () => {
  const { runAgentLLM } = await import('../src/lib/runAgentLLM.js');
  const result = await runAgentLLM('what is 2 + 2?');

  assert.equal(result.toolLogs.length, 0, 'expected no tool calls for simple question');
  assert.ok(result.message.length > 0);
});
```

### 验证

无 API key 时：
```bash
npm test  # 集成测试 skip，其他测试正常通过
```

有 API key 时：
```bash
ANTHROPIC_API_KEY=xxx npm test  # 集成测试运行
```

### 单元测试建议

`toolAdapter.ts` 的 `toAISDKTool` 是纯函数，可以单独测试（不需要 API key）：

```ts
// 只测 adapter 的结构正确性，不调用 LLM
test('toAISDKTool maps ToolDefinition to AI SDK tool format', () => {
  const fakeDef = {
    name: 'test',
    description: 'test tool',
    parameters: { input: { type: 'string', description: 'test input' } },
    match: () => false,
    run: async () => ({ output: 'ok', toolName: 'test' }),
  };
  // 验证 adapter 不抛错，返回有 description/parameters/execute 的对象
  const sdkTool = toAISDKTool(fakeDef, { message: '', history: [] });
  assert.ok(sdkTool.description);
  assert.ok(sdkTool.parameters);
  assert.ok(typeof sdkTool.execute === 'function');
});
```

---

## Day 7：复盘

新建：

- `weeks/week-04/week-04-notes.md`

回答：

1. Week 03 中 `parameters` 字段是"文档"，Week 04 中它是什么？
2. `match()` 方法在 Week 04 的 `runAgentLLM` 路径中有没有被调用？如果要彻底去掉它，下一步该怎么做？
3. Vercel AI SDK 的 `generateText` 和直接调 Anthropic SDK 的 `messages.create` 相比，省了什么步骤？
4. `maxSteps: 5` 是为了处理什么情况？如果不设置会怎样？
5. 为什么 `runAgent`（Week 03 版本）和 `runAgentLLM`（Week 04 版本）保持相同的返回类型很重要？

---

## 本周最重要的约束

1. `runAgent.ts` 原文件**不要改**——保留 Week 03 实现作为对照参考
2. `runAgentLLM.ts` 是新文件，与 `runAgent.ts` 并存
3. 现有测试（`test/runAgent.test.ts` 等）必须继续通过
4. 集成测试用 `skip: !hasApiKey` 保护，无 key 时不强制运行
5. 不要在这周把 HTTP 路由切换为 `runAgentLLM`（那是可选的扩展）

---

## Week 04 验收标准

- `src/lib/toolAdapter.ts` 存在，`toAISDKTools` 能把 registry 转为 AI SDK 工具格式
- `src/lib/runAgentLLM.ts` 存在，有 `runAgentLLM` 函数，接口与 `runAgent` 兼容
- 有 API key 时，手动测试 `runAgentLLM('summarize "hello"')` 能返回工具调用结果
- 工具的 `run()` 已更新为优先使用 `args` 参数
- `npm test` 仍然通过（无 API key 时集成测试 skip）
- 你能解释 `match()` 在 Week 04 中变多余的原因

---

## 可选扩展（完成以上后再考虑）

- 把 `src/routes/chat.ts` 的 `runAgent` 替换为 `runAgentLLM`，做端到端联调
- 把 provider 从 `anthropic` 换为 `openai`（需要 `@ai-sdk/openai`），验证 provider-agnostic 设计
- 添加系统 prompt，让 LLM 更好地理解工具的使用场景
