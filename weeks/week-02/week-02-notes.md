# Week 02 Notes

## Day 1
- 我选择的 session history 数据结构：`Record<string, ChatMessage[]>`，key 是 sessionId，value 是该会话的历史消息数组
- 我认为需要改的文件：`historyStore.ts`（新建）、`chat.ts`（接入 session）、`types.ts`（扩展类型）、对应测试文件
- 我为什么不让 `runAgent` 直接读写文件：`runAgent` 本质是模型调用模块，只需要接收格式化的历史数据并执行对话，不应该耦合 session 维护逻辑，否则会降低其泛化性；session 的加载和保存是 route 层的职责

## Day 2
- 我实现的 historyStore API：`loadHistory(sessionId)` 和 `appendHistory(sessionId, messages)`，通过 `createHistoryStore(filePath)` 工厂函数创建，filePath 通过参数传入以支持测试时注入临时目录
- 我补的测试：未知 session 返回空数组、append 后可 load、多 session 互相隔离、超过 10 条只保留最后 10 条
- 我遇到的异步/文件读写问题：`appendHistory` 是"读旧文件 → 追加 → 写回"三步，不能直接覆盖；`loadHistory` 遇到文件不存在（ENOENT）时返回空数组而不是报错，表示这是新 session

## Day 3
- `/chat` 接入 session history 后的数据流：
  - 有 `sessionId`：`loadHistory(sessionId)` → `runAgent(message, storedHistory)` → `appendHistory(sessionId, [user, assistant])` → `reply.send({...result, sessionId})`
  - 无 `sessionId`：`history ?? []` → `runAgent(message, history)` → `reply.send(result)`
- 我补的 route 测试：`reuses stored history when sessionId is provided`（两轮请求验证历史复用）、`rejects invalid sessionId with 400`
- 我如何确认没有破坏原有行为：无 `sessionId` 时走原有路径，`runAgent` 函数签名未变，已有测试全部通过

## Day 4
- 手动联调命令：
  ```bash
  curl -s -X POST "http://127.0.0.1:3000/chat" -H "content-type: application/json" -d '{"sessionId":"demo","message":"hello"}'
  curl -s -X POST "http://127.0.0.1:3000/chat" -H "content-type: application/json" -d '{"sessionId":"demo","message":"what happened before"}'
  ```
- 第一轮响应：`You said: hello.`
- 第二轮响应：`You said: what happened before. Previous assistant reply: You said: hello.`
- 本地 history 文件内容观察：`data/chat-history.json` 中以 sessionId 为 key，存储 ChatMessage 数组

## Day 5
- 方案 B：限制每个 session 只保留最近 10 条消息，在 `appendHistory` 的追加步骤后加 `.slice(-10)`
- 方案 A：有 `sessionId` 时在响应中附带 `sessionId` 字段，在 route 层用 `{ ...result, sessionId }` 组装返回值，同时在 `AgentResponse` 类型中加可选字段 `sessionId?: string`
- 对应测试：方案 B 追加 11 条验证只剩最后 10 条；方案 A 在集成测试中验证响应体包含 `sessionId: 'demo'`
- 我决定暂时不处理的问题：并发写文件数据损坏、文件无大小限制、JSON 损坏无恢复机制、sessionId 无鉴权

## Day 6
- Claude Code review 给我的主要建议：
  1. 注释质量：应注释 WHY 而不是 WHAT，大多数注释可删，`ENOENT` 处理逻辑值得保留注释
  2. route 层职责：response 组装逻辑（有无 sessionId 两条返回路径）若继续增加会变重，可考虑独立
  3. 测试有一个边界未覆盖：同时传入 `sessionId` 和 `history` 时，`sessionId` 优先的行为没有测试保护
  4. 真实项目风险点按严重程度：并发写 > 文件无限增长 > JSON 损坏无恢复 > 无鉴权
- 我做的小重构：无（本周按约束只做了两个小改动）
- 重构后测试情况：`npm test` 17 个测试全部通过，`npm run check` 通过

## Day 7
- 我这周真正掌握了什么：session history 的完整数据流、historyStore 的工厂函数模式与依赖注入、测试隔离的重要性（临时目录）、route/lib/agent 分层职责
- `history` 和 `sessionId` 的区别：`sessionId` 是找到对应 history 的钥匙，`history` 是实际传给模型的上下文数据；`runAgent` 只需要知道 history，不需要知道 sessionId 的存在
- 我对 route / lib / agent 分层的新理解：
  - **route**：处理 HTTP 请求/响应、校验输入、决定 history 来源、组装返回值
  - **lib**：可复用功能模块，`runAgent` 负责工具调度和 agent 逻辑，`historyStore` 负责历史持久化
  - **tools**：被 `runAgent` 调用的具体工具函数，职责最单一
  - 核心原则：上层知道下层，下层不知道上层
- 下周最值得补的点：补"同时传 `sessionId` 和 `history` 时 `sessionId` 优先"的测试 case
