# Week 01 实操清单

## 本周总目标

这一周的目标不是继续扩功能，而是把当前最小项目真正学会。

到本周结束时，你应该能：
1. 说清楚当前项目的 3 个入口分别是什么
2. 说清楚一次输入如何从入口流到 `runAgent`
3. 自己完成 2 个小改动
4. 自己新增 1 个小测试
5. 能用 Claude Code 对当前项目做讲解、review、复盘

建议总投入：4 小时左右。

---

## Day 1：跑通项目，建立整体感

### 目标
先建立“这个项目能干什么”的感觉，不急着深读代码。

### 要做的事

进入路径：
- `/Users/zzfive/projects/github/self/agent-learning-lab/agent-playground-ts`

运行命令：
- `npm test`
- `npm run check`
- `npm run cli -- summarize "hello world"`
- `npm run dev`

服务启动后，发送一个请求：

```bash
curl -s -X POST "http://127.0.0.1:3000/chat" \
  -H "content-type: application/json" \
  -d '{"message":"summarize \"This is my first API test for the agent playground.\""}'
```

### 观察重点
- 测试在验证什么
- CLI 做了什么
- `/chat` 做了什么
- 三个入口是不是在复用同一套 Agent 逻辑

### Claude Code 提示词

```text
请基于当前项目，用“先整体后局部”的方式告诉我：
1. 这个项目现在能做什么
2. 三个入口分别是什么
3. 哪个文件最值得先看
不要按文件顺序讲，请按一次请求的数据流来讲。
```

### 当天输出
写 5 句话：
- 这个项目是干什么的
- CLI 是什么
- HTTP route 是什么
- tool 是什么
- `runAgent` 在系统里扮演什么角色

---

## Day 2：读懂最核心的 Agent 主流程

### 目标
彻底看懂：
- `src/lib/runAgent.ts`
- `test/runAgent.test.ts`

### 要做的事
先读测试，再读实现：
- `test/runAgent.test.ts`
- `src/lib/runAgent.ts`

手动画一条最小数据流，例如：

```text
summarize "This is a long sentence..."
```

画出：
- 输入字符串进入哪
- 经过什么判断
- 调了哪个 tool
- 返回值长什么样

### 重点理解
- `toolLogs` 是干嘛的
- `summarize` 是怎么被识别的
- fallback reply 是怎么生成的
- history 为什么只取最后一个 assistant message

### Claude Code 提示词

```text
请解释 `src/lib/runAgent.ts`，但要满足：
1. 用 Python 工程师的视角解释
2. 先讲输入输出，再讲内部逻辑
3. 不要泛泛讲 TypeScript 语法，只解释我必须懂的部分
4. 顺便解释 `test/runAgent.test.ts` 是怎么约束这些行为的
```

### 当天输出
回答：
- `runAgent` 的输入是什么？
- 输出是什么？
- 它现在支持哪几种路径？
- 这个实现为什么适合当学习项目，而不是生产项目？

---

## Day 3：读懂 CLI 和 HTTP 入口

### 目标
理解同一个 Agent 核心逻辑如何被两个不同入口复用。

### 要读的文件
- `src/cli.ts`
- `test/cli.test.ts`
- `src/routes/chat.ts`
- `test/chatRoute.test.ts`
- `src/server.ts`

### 要做的事

比较 CLI 和 HTTP 入口：
- CLI 的输入来自哪里
- HTTP 的输入来自哪里
- 它们分别做了什么预处理
- 最终是不是都调用了 `runAgent`

重点理解 route 层职责：
- 为什么 `chat.ts` 里有 schema 校验
- 为什么 `runAgent` 不直接做 request body 校验

### Claude Code 提示词

```text
请帮我对比 `src/cli.ts` 和 `src/routes/chat.ts`：
1. 它们各自负责什么
2. 哪些逻辑应该放入口层，哪些应该放 `runAgent`
3. 用“分层设计”的角度解释，不要只讲代码表面行为
```

### 当天输出
写一个表格：

| 文件 | 职责 | 为什么不该把别的逻辑放这里 |
|---|---|---|
| `src/server.ts` |  |  |
| `src/routes/chat.ts` |  |  |
| `src/cli.ts` |  |  |
| `src/lib/runAgent.ts` |  |  |

---

## Day 4：做第一个小改动

### 目标
自己完成一个非常小的功能改动。

### 推荐改动
方案 A：把 fallback 回复

```ts
You said: ...
```

改成你更喜欢的格式，例如：

```ts
Agent received: ...
```

方案 B：给 summarize 返回值再加一点信息。

### 要求
- 改之前先跑 `npm test`
- 改完后再跑 `npm test`
- 如果测试失败，先读失败信息再修

### Claude Code 提示词

```text
我准备做一个很小的改动：[写你的改动]。
请先告诉我：
1. 最可能需要改哪几个文件
2. 哪些测试会受影响
3. 请不要直接给完整代码，只给我修改思路
```

### 当天输出
- 一个你自己完成的小改动
- 对应测试重新通过

---

## Day 5：自己补一个测试

### 目标
第一次自己加测试，而不是只读已有测试。

### 推荐测试题目
三选一：

1. 给 `runAgent` 加一个测试：当输入是空白字符串时，系统应该返回什么
2. 给 CLI 加一个测试：多余空格是不是被正确压缩
3. 给 `/chat` route 加一个测试：`message` 是空字符串时，是否返回 400

### 推荐做法
- 先写测试
- 先看它失败
- 再决定是否需要改实现

### Claude Code 提示词

```text
我想自己补一个测试，但不想你直接写答案。
请你先给我：
1. 一个合适的测试目标
2. 这个测试应该放在哪个文件
3. 这个测试大概断言什么
不要直接给完整测试代码
```

### 当天输出
- 你自己写的 1 个测试
- 你自己解释这个测试在保护什么行为

---

## Day 6：做一个最小 toy tool 改动

### 目标
体验“加一个 Agent tool”最小需要改哪些地方。

### 推荐方向
- `shoutText`：输入包含 `shout` 时，把文本转成大写
- `wordCount`：输入包含 `count words` 时，返回词数

推荐优先 `wordCount`。

### 你应该自己思考
- tool 本身应该放哪
- `runAgent` 里怎么接它
- 测试应该先写在哪

### Claude Code 提示词

```text
我想给这个 playground 加一个最小 toy tool：[wordCount / shoutText]。
请不要直接实现。
先告诉我：
1. 需要改哪些文件
2. 测试先写在哪
3. 这个改动为什么是“最小但完整”的练习
```

### 当天输出
- 新增一个最小 tool
- 至少补 1 个对应测试
- 所有测试通过

---

## Day 7：复盘 + 让 Claude Code 做学习教练

### 目标
把这一周做的东西沉淀下来。

### 要做的事

先自己写复盘，回答：
1. 我这周真正掌握了什么
2. 哪个文件我还是看得不顺
3. 我最容易混淆的是哪两个概念
4. 如果下周只学一个点，应该学什么

再让 Claude Code 帮你复盘：

```text
这是我这周在 `agent-playground-ts` 里做的事情：[你自己的总结]
请帮我复盘：
1. 我真正掌握了什么
2. 我还薄弱的是什么
3. 如果下周只有 4 小时，最值得补哪两个点
4. 请按优先级给我下周学习顺序
```

### 当天输出
建议新建文件：
- `weeks/week-01/week-01-notes.md`

---

## 本周最重要的约束

1. 不要继续扩大系统范围
2. 优先读懂已有代码，而不是继续加功能
3. 每次改动后都跑测试
4. 让 Claude Code 多做讲解和 review，少做代写

---

## 本周结束时的验收标准

如果你能做到下面这些，就说明第一周是成功的：
- 你能说清楚三个入口的区别
- 你能解释 `runAgent` 的主流程
- 你自己改过至少 1 个小功能
- 你自己补过至少 1 个测试
- 你知道该如何用 Claude Code 帮你学，而不是只帮你写
