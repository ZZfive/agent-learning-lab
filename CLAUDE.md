# CLAUDE.md

## 项目目的

这个目录是一个面向算法工程师的 TypeScript Agent 学习实验场。
目标不是快速堆功能，而是通过一个尽量小、可运行、可测试的项目，建立以下四种手感：
- 类型手感
- 异步手感
- 分层手感
- 调试手感

当前阶段应优先“学习和理解”，而不是继续快速扩展功能。

---

## 当前目录结构

- `README.md`：项目入口说明
- `learning-roadmap.md`：8 周学习路线
- `claude-code-prompts.md`：Claude Code 提示词模板
- `agent-playground-ts/`：最小 TypeScript Agent 学习项目
- `weeks/`：按周组织的学习文档与实操清单

### weeks 目录约定

后续学习文档按周存放：
- `weeks/week-01/`
- `weeks/week-02/`
- `weeks/week-03/`
- ...

每周目录下优先放：
- 实操清单
- 当周笔记
- 复盘文档
- 针对该周的 Claude Code 提示词

---

## agent-playground-ts 当前已经完成的内容

### 1. 基础工程结构
- `package.json`
- `tsconfig.json`
- Node + TypeScript + Fastify 最小可运行结构

### 2. 三个学习入口
- **测试入口**：`npm test`
- **CLI 入口**：`npm run cli -- summarize "hello world"`
- **HTTP 服务入口**：`npm run dev`

### 3. 当前核心代码文件
- `src/server.ts`：Fastify 服务启动入口
- `src/routes/chat.ts`：`POST /chat` 路由与请求校验
- `src/lib/runAgent.ts`：最小 Agent 调度逻辑
- `src/lib/historyStore.ts`：按 `sessionId` 读写本地 JSON history 的最小状态模块
- `src/cli.ts`：命令行入口
- `src/tools/readLocalNote.ts`：读取本地笔记工具
- `src/tools/summarizeText.ts`：文本摘要工具
- `src/tools/countWords.ts`：词数统计 toy tool / metadata 练习
- `src/types.ts`：共享类型定义

### 4. 当前测试覆盖
- `test/runAgent.test.ts`
- `test/chatRoute.test.ts`
- `test/cli.test.ts`
- `test/historyStore.test.ts`

已覆盖行为：
- summarize 工具路径
- read note 缺少路径时的提示
- fallback 响应带历史上下文
- word count metadata 路径
- `/chat` 非法请求返回 400
- `/chat` 正常请求返回工具结果
- `/chat` 空 message 返回 400
- `/chat` 使用 `sessionId` 时会复用已保存的历史（含 `sessionId` 回显）
- `/chat` 非法 `sessionId` 返回 400
- historyStore 对未知 session 返回空数组
- historyStore append 后可 load
- historyStore 多 session 互相隔离
- historyStore 超过 10 条只保留最后 10 条
- CLI 参数拼接与空参数报错

待补测试（Week 02 review 识别）：
- 同时传入 `sessionId` 和 `history` 时，`sessionId` 优先的行为

### 5. 已完成验证
- `npm install` 成功
- `npm test` 通过
- `npm run check` 通过
- `npm run dev` 可启动服务
- `POST /chat` 已实际联调通过
- `npm run cli` 已实际运行通过

---

## 当前学习建议

现在不要急着继续加大系统复杂度。
当前项目已经到达一个适合开始学习的节点，优先顺序应为：

1. 跑通已有入口
2. 读懂核心文件
3. 自己做小改动
4. 自己补测试
5. 用 Claude Code 做讲解、review 和复盘

建议把这个项目当成“第 1 阶段学习底座”，而不是立刻演化成完整产品。

---

## 推荐的第一批学习重点

按优先级：
1. `src/lib/runAgent.ts`
2. `test/runAgent.test.ts`
3. `src/cli.ts`
4. `src/routes/chat.ts`
5. `src/server.ts`

学习目标：
- 理解输入如何流到 Agent
- 理解工具路由是怎么做的
- 理解测试如何描述行为
- 理解 CLI 和 HTTP 两种入口如何复用同一套 Agent 逻辑

---

## 后续建议方向

后续不要一次全做，按顺序逐步推进：

### 第一阶段：在当前骨架上建立手感
- 看懂代码
- 改小功能
- 补测试
- 用 Claude Code 做 review

### 第二阶段：补最小状态能力
已完成最小实现 + Week 02 学习改动：
- 多会话 history 持久化（按 `sessionId` 保存）
- 默认本地文件：`agent-playground-ts/data/chat-history.json`
- 存储结构：`Record<string, ChatMessage[]>`
- `runAgent` 不直接感知 `sessionId`，仍只接收 `message` 和 `history`
- 每个 session 最多保留最近 10 条消息（`appendHistory` 末尾 `.slice(-10)`）
- 有 `sessionId` 时响应中附带 `sessionId` 字段（`AgentResponse` 新增可选字段）

Week 02 已完成，进入 Week 03。

### 第三阶段：补更像产品的能力
后续可选：
- streaming response
- 更清晰的 tool trace
- 简单 eval 脚本
- 最小 Web UI

---

## Week 03 计划：Tool Registry

### 目标

把当前基于正则匹配的手写 tool routing 重构为 tool registry 模式，为 Week 04 接入真实 LLM tool calling 做架构准备。

### 核心改动

- `src/types.ts`：新增 `ToolDefinition`、`ToolResult`、`ToolContext` 类型
- `src/lib/toolRegistry.ts`：新建，存放 defaultRegistry
- `src/tools/`：三个工具各自包一层 `ToolDefinition`（原实现不变）
- `src/lib/runAgent.ts`：改为遍历 registry，不再 import 具体工具

### 设计原则

- `runAgent` 不再知道任何具体工具，只依赖 `registry` 参数
- 新增工具只需新建 `ToolDefinition` 并加入 registry，不改 `runAgent`
- `registry` 通过参数传入，保持可测试性（与 `historyStore` 依赖注入模式一致）
- tool schema（`parameters` 字段）与执行逻辑放在同一个 `ToolDefinition` 对象，为 Week 04 传给 LLM 做准备

### Week 04 方向

接入 Vercel AI SDK（`ai` 包），实现真正的 LLM-driven tool calling：
- 把 `ToolDefinition` 的 `parameters` 转换为各厂商格式
- 让模型根据 schema 自主决定调哪个工具
- 不绑定单一厂商，支持 OpenAI / Anthropic / 其他兼容厂商切换

---

## 协作建议

当 Claude 在这个目录中工作时：
- 优先保持项目小而清晰
- 不要过度设计
- 新功能优先 test-first
- 优先补学习价值高、复杂度低的能力
- 如果用户说“先学起来”，应停止继续堆功能，转而输出学习任务和讲解路径

---

## 常用命令

在 `agent-playground-ts/` 下：

- 安装依赖：`npm install`
- 跑测试：`npm test`
- 类型检查：`npm run check`
- 启动服务：`npm run dev`
- 跑 CLI：`npm run cli -- summarize "hello world"`

Week 02 session history 手动联调：

```bash
curl -s -X POST "http://127.0.0.1:3000/chat" \
  -H "content-type: application/json" \
  -d '{"sessionId":"demo","message":"hello"}'

curl -s -X POST "http://127.0.0.1:3000/chat" \
  -H "content-type: application/json" \
  -d '{"sessionId":"demo","message":"what happened before"}'
```

---

## 给未来 Claude 的提醒

这个项目的核心目标是“帮助用户学习 TypeScript Agent 工程”，不是单纯把功能做完。
当需要在“继续实现功能”和“帮助用户建立理解”之间做选择时，优先后者。
