# Week 02 实操清单：Session History 已最小实现版

## 当前状态

本周原计划的核心功能已经由 Claude 先完成了一个最小实现。你接下来不需要从零写，而是要用它来加快学习：先跑通、读懂、手动验证，再做 1-2 个小改动。

已实现内容：

- `POST /chat` 支持可选 `sessionId`
- 有 `sessionId` 时：
  - 从本地 JSON history 文件读取历史
  - 调用 `runAgent(message, history)`
  - 保存本轮 user message 和 assistant reply
- 无 `sessionId` 时：保持原有 `history` 行为
- `sessionId` 有最小格式校验：只允许字母、数字、`-`、`_`
- 新增 `historyStore` 与测试

已新增/修改文件：

- `agent-playground-ts/src/lib/historyStore.ts`
- `agent-playground-ts/src/routes/chat.ts`
- `agent-playground-ts/src/types.ts`
- `agent-playground-ts/test/historyStore.test.ts`
- `agent-playground-ts/test/chatRoute.test.ts`

已验证：

```bash
npm test
npm run check
```

均通过。

---

## 本周学习目标

你现在的目标不是“再写很多功能”，而是把已经实现的 session history 真正吃透。

到本周结束时，你应该能说清楚：

1. history JSON 文件为什么是 `Record<string, ChatMessage[]>`
2. `sessionId -> loadHistory -> runAgent -> appendHistory` 的完整数据流
3. 为什么 `runAgent` 不应该知道 `sessionId`
4. 为什么 `historyStore` 的测试不需要启动 Fastify
5. 为什么 route 测试可以证明多轮 session 生效

建议总投入：3-4 小时。

---

## Day 1：跑通并观察新增测试

### 要做的事

进入：

```bash
cd agent-playground-ts
```

运行：

```bash
npm test
npm run check
```

重点看这些测试输出：

- `returns empty history for unknown session`
- `loads messages after appending them to a session`
- `keeps histories isolated between sessions`
- `reuses stored history when sessionId is provided`
- `rejects invalid sessionId with 400`

### 你要回答

- 哪些测试只验证 `historyStore`？
- 哪些测试验证 HTTP route 和 `historyStore` 的集成？
- 为什么要把它们分开测？

### Claude Code 提示词

```text
请按“测试保护了什么行为”的角度讲解 Week 02 新增测试。
不要先讲实现，先讲每个测试为什么存在。
```

---

## Day 2：读懂 `historyStore.ts`

### 要读的文件

- `src/lib/historyStore.ts`
- `test/historyStore.test.ts`

### 重点理解

- `HistoryFile = Record<string, ChatMessage[]>` 是什么意思
- `createHistoryStore(filePath)` 为什么接收文件路径
- `loadHistory` 为什么遇到不存在文件时返回空对象
- `appendHistory` 为什么是“读旧文件 -> 追加 -> 写回文件”
- 测试里为什么使用临时目录

### 你要画的数据结构

```text
history.json
  demo -> ChatMessage[]
  session-a -> ChatMessage[]
  session-b -> ChatMessage[]
```

### 当天输出

用自己的话解释：

```text
Record<string, ChatMessage[]> 表示：每个 sessionId 对应一组 ChatMessage。
```

---

## Day 3：读懂 `/chat` 接入 session 的数据流

### 要读的文件

- `src/routes/chat.ts`
- `test/chatRoute.test.ts`
- `src/lib/runAgent.ts`

### 重点理解

有 `sessionId` 时：

```text
request.body.sessionId
  -> historyStore.loadHistory(sessionId)
  -> runAgent(message, storedHistory)
  -> historyStore.appendHistory(sessionId, [user, assistant])
  -> reply.send(result)
```

无 `sessionId` 时：

```text
request.body.history ?? []
  -> runAgent(message, history)
  -> reply.send(result)
```

### 你要回答

- `runAgent` 的函数签名为什么没有变化？
- route 层现在多承担了什么职责？
- `historyStore` 为什么通过参数传进 `registerChatRoute`？

---

## Day 4：手动联调

### 启动服务

```bash
npm run dev
```

### 第一轮请求

```bash
curl -s -X POST "http://127.0.0.1:3000/chat" \
  -H "content-type: application/json" \
  -d '{"sessionId":"demo","message":"hello"}'
```

### 第二轮请求

```bash
curl -s -X POST "http://127.0.0.1:3000/chat" \
  -H "content-type: application/json" \
  -d '{"sessionId":"demo","message":"what happened before"}'
```

### 观察

第二轮回复应该包含第一轮 assistant reply，例如：

```text
Previous assistant reply: You said: hello.
```

再查看：

```bash
cat data/chat-history.json
```

注意：这里只是手动观察，正式读文件仍建议用编辑器或 `read` 工具。

---

## Day 5：做一个很小的学习型改动

二选一即可，不要都做。

### 方案 A：给 session 响应加 metadata

例如在有 `sessionId` 时，返回里增加：

```ts
sessionId: 'demo'
```

这会练习 response shape 和测试更新。

### 方案 B：限制每个 session 只保留最近 10 条消息

这会练习数组处理和 memory 边界。

推荐先做方案 B，因为更接近真实 Agent memory。

### 要求

- 先写或修改测试
- 再改实现
- 跑：

```bash
npm test
npm run check
```

---

## Day 6：让 Claude 做 review

### Claude Code 提示词

```text
请 review Week 02 session history 的实现。
重点看：
1. `historyStore` 的 API 是否清晰
2. route 层是否过重
3. 测试是否覆盖了核心行为
4. 当前实现有哪些真实项目里会出问题但本周可以暂时不处理
请按学习优先级给建议，不要直接改代码。
```

---

## Day 7：复盘

更新：

- `weeks/week-02/week-02-notes.md`

回答：

1. `sessionId` 和 `history` 的区别是什么？
2. `Record<string, ChatMessage[]>` 是什么？
3. 本周新增的异步文件读写在哪里？
4. 哪个测试最能证明 session history 生效？
5. 你现在对 route / lib / agent 分层的理解是什么？

---

## 本周最重要的约束

1. 不继续加数据库
2. 不接真实 LLM API
3. 不做 streaming
4. 优先读懂这次最小实现
5. 只做 1 个小改动来巩固理解

---

## Week 02 验收标准

- 你能独立解释 `historyStore.ts`
- 你能独立解释 route 中有/无 `sessionId` 的两条路径
- 你能说出为什么测试要使用临时 history 文件
- 你完成 1 个小改动并让测试通过
- `npm test` 和 `npm run check` 通过
