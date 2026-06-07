# Week 03 实操清单：Tool Registry

## 本周目标

当前 `runAgent.ts` 用正则匹配决定调用哪个工具，这是一种手写路由，不可扩展。
本周目标是把它重构为 **tool registry 模式**：每个工具自带 schema 描述，`runAgent` 遍历 registry 决定调用哪个，不再硬编码 if/else。

这是为 Week 04 接入真实 LLM tool calling 做的架构准备——真实的 function calling 就是把 tool schema 发给模型，让模型决定调哪个。本周先在不依赖任何 LLM SDK 的情况下，把这个结构建清楚。

到本周结束时，你应该能说清楚：

1. tool registry 是什么，为什么比 if/else 更好
2. `ToolDefinition` 的 schema 字段为什么重要
3. `runAgent` 现在怎么决定调哪个工具
4. 为什么 tool 实现和 tool schema 应该放在一起
5. 这个结构如何做到不绑定具体 LLM 厂商

建议总投入：3-4 小时。

---

## 当前问题

现在的 `runAgent.ts`：

```ts
if (/summarize/i.test(normalizedMessage)) {
  // 调 summarize
}
if (/read note/i.test(normalizedMessage)) {
  // 调 readLocalNote
}
// fallback
```

问题：
- 新增工具必须改 `runAgent.ts`
- 工具没有自描述能力（没有名称、描述、参数说明）
- 无法把工具列表传给 LLM 让它自主决策

---

## 目标结构

```ts
// 每个工具是一个带 schema 的对象
interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string }>;
  run(args: Record<string, string>, context: ToolContext): Promise<ToolResult>;
}

// runAgent 从 registry 中匹配工具
const tool = registry.find(t => matches(t, message));
```

registry 存放所有工具，`runAgent` 遍历它，不再知道具体工具的存在。

---

## Day 1：理解当前结构的局限

### 要读的文件

- `src/lib/runAgent.ts`
- `src/tools/summarizeText.ts`
- `src/tools/readLocalNote.ts`

### 你要回答

- 现在新增一个工具需要改哪些文件？
- `runAgent` 现在依赖工具的什么信息来决定调用？
- 如果要把工具列表发给 LLM，现在的结构缺少什么？

### Claude Code 提示词

```text
请解释当前 runAgent.ts 的 tool routing 机制有哪些扩展性问题。
不要直接给解决方案，先帮我看清楚问题。
```

---

## Day 2：设计 ToolDefinition 类型

### 目标

在 `src/types.ts` 中新增：

```ts
export interface ToolParameter {
  type: string;
  description: string;
}

export interface ToolResult {
  output: string;
  toolName: string;
}

export interface ToolContext {
  message: string;
  history: ChatMessage[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  match(context: ToolContext): boolean;
  run(args: Record<string, string>, context: ToolContext): Promise<ToolResult>;
}
```

### 重点理解

- `match` 和 `run` 为什么都在 `ToolDefinition` 上，而不是分开
- `ToolContext` 为什么需要同时带 `message` 和 `history`
- `parameters` 字段现在不驱动执行，但为什么还要定义它

### 你要回答

把 `parameters` 字段类比成什么？（提示：想想 API 文档的作用）

---

## Day 3：改写三个工具为 ToolDefinition

### 目标

把 `src/tools/` 下的三个工具改写成 `ToolDefinition` 格式。

以 `summarizeText` 为例：

```ts
import { summarizeText } from './summarizeText.js'; // 保留原实现不变

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
```

### 注意

- 原有的 `summarizeText`、`readLocalNote`、`countWords` 函数实现**不需要改**
- 只是在外面包一层 `ToolDefinition`，把 `match` 和 `run` 逻辑从 `runAgent.ts` 迁移过来

---

## Day 4：重构 runAgent 使用 registry

### 目标

新建 `src/lib/toolRegistry.ts`：

```ts
import { summarizeToolDef } from '../tools/summarizeText.js';
import { readNoteToolDef } from '../tools/readLocalNote.js';

export const defaultRegistry: ToolDefinition[] = [
  summarizeToolDef,
  readNoteToolDef,
];
```

重构 `runAgent.ts`：

```ts
export async function runAgent(
  message: string,
  history: ChatMessage[] = [],
  registry: ToolDefinition[] = defaultRegistry,
): Promise<AgentResponse> {
  const context: ToolContext = { message, history };
  const tool = registry.find(t => t.match(context));

  if (tool) {
    const result = await tool.run({}, context);
    return { message: result.output, toolLogs: [result.toolName] };
  }

  // fallback 不变
}
```

### 重点理解

- `runAgent` 现在不 import 任何具体工具了，只依赖 `registry`
- 新增工具只需要新建一个 `ToolDefinition` 并加入 registry，不改 `runAgent`
- `registry` 通过参数传入，测试时可以传入只有一个工具的 mock registry

---

## Day 5：更新测试

现有测试不需要大改，但需要验证新结构的关键行为：

- `runAgent` 在 registry 为空时走 fallback
- `runAgent` 在 registry 只有一个工具时只调那个工具
- 单个 `ToolDefinition` 的 `match` 和 `run` 可以独立测试

先跑现有测试确认没有回归：

```bash
npm test
npm run check
```

---

## Day 6：做一个验收：新增第四个工具

不用实现复杂逻辑，验收标准是：**新增工具时不需要改 `runAgent.ts`**。

例如新增一个 `echoTool`：

```ts
export const echoToolDef: ToolDefinition = {
  name: 'echo',
  description: 'Echoes back the input message',
  parameters: {
    message: { type: 'string', description: 'The message to echo' },
  },
  match({ message }) {
    return /^echo:/i.test(message);
  },
  async run(_, { message }) {
    return { output: `Echo: ${message}`, toolName: 'echo' };
  },
};
```

加入 registry，写一个测试，跑通即可。

---

## Day 7：复盘

新建：

- `weeks/week-03/week-03-notes.md`

回答：

1. tool registry 和原来的 if/else routing 最本质的区别是什么？
2. `ToolDefinition` 上的 `parameters` 字段现在有没有被执行逻辑用到？它的价值是什么？
3. 为什么 `registry` 要通过参数传给 `runAgent` 而不是直接 import？
4. 这个结构和 Week 04 要接入的真实 LLM tool calling 之间差了什么？
5. 你对"扩展时不改已有代码"这个原则的理解是什么？

---

## 本周最重要的约束

1. 不接真实 LLM API（Week 04 的事）
2. 不改三个工具的内部实现，只在外层包 `ToolDefinition`
3. 原有测试必须继续通过
4. 优先把结构设计清楚，不追求完美实现

---

## Week 03 验收标准

- `runAgent.ts` 不再 import 任何具体工具
- 新增一个工具不需要改 `runAgent.ts`
- `npm test` 和 `npm run check` 通过
- 你能解释 `ToolDefinition` 上每个字段的作用
- 你能说出这个结构为什么不绑定具体 LLM 厂商
