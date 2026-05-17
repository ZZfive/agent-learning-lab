# Week 01 练习题单

这份题单用于第一周的动手练习。
原则是：每个题都尽量小、可测试、能帮助你建立 TypeScript Agent 工程手感。

建议做法：
- 每次只做一个题
- 改之前先跑 `npm test`
- 如果要新增行为，优先先补测试
- 改完后再跑 `npm test` 和 `npm run check`
- 遇到卡点时，先用 `week-01-claude-prompts.md` 里的提示词问 Claude Code

---

## 题目 1：修改 fallback 回复文案

### 目标
把 `runAgent` 的 fallback 回复从：

```text
You said: ...
```

改成你更喜欢的格式，例如：

```text
Agent received: ...
```

### 练习重点
- 理解 `runAgent` 的 fallback 路径
- 理解已有测试为什么会失败
- 体验“改实现 -> 改测试 -> 再验证”的最小闭环

### 建议先看的文件
- `src/lib/runAgent.ts`
- `test/runAgent.test.ts`

### 完成标准
- 回复文案确实被修改
- 对应测试更新并通过
- 你能说清楚为什么只有某些测试受影响

---

## 题目 2：给 CLI 增加一个更清晰的空输入提示

### 目标
当 CLI 没有收到参数时，让报错信息更清晰一点。
比如从当前提示扩展成：

```text
Please provide a message. Example: npm run cli -- summarize "hello world"
```

如果你觉得当前提示已经够清楚，也可以换成你自己的版本，但要保持信息更明确。

### 练习重点
- 理解 `buildCliMessage` 的职责
- 理解 CLI 测试如何保护参数处理行为
- 练习非常小的字符串级修改

### 建议先看的文件
- `src/cli.ts`
- `test/cli.test.ts`

### 完成标准
- 你修改了错误提示
- 对应测试更新并通过
- 你能解释为什么这个逻辑应该放在 CLI，而不是 `runAgent`

---

## 题目 3：给 summarize 行为补一个边界测试

### 目标
为 summarize 行为新增一个测试，覆盖一个边界情况。
你可以选下面任一方向：

1. 输入是空白字符串时会发生什么
2. 输入长度刚好不超过阈值时，是否保持原样
3. 输入里没有引号时，是否仍然走 summarize 路径

### 练习重点
- 练习先想“我要保护什么行为”
- 学会区分“重复测试”和“新增测试”
- 体验 test-first 的最小实践

### 建议先看的文件
- `src/lib/runAgent.ts`
- `src/tools/summarizeText.ts`
- `test/runAgent.test.ts`

### 完成标准
- 新增 1 个有意义的测试
- 如果测试暴露了行为缺口，你自己补上最小实现
- 所有测试通过

---

## 题目 4：新增一个最小 toy tool：wordCount

### 目标
当输入包含 `count words` 时，调用一个新工具，返回词数。

示例：

```text
count words "hello world from agent"
```

返回类似：

```text
Word count: 4
```

### 练习重点
- 理解新增一个 tool 最少要改哪些地方
- 学会把逻辑拆到 `tools/` 和 `runAgent` 两层
- 练习新增测试而不是只补实现

### 建议先看的文件
- `src/tools/summarizeText.ts`
- `src/lib/runAgent.ts`
- `test/runAgent.test.ts`

### 完成标准
- 新增一个独立 tool 文件
- `runAgent` 能识别并调用它
- 至少新增 1 个测试
- 所有测试通过

---

## 推荐顺序

如果你只做 2 个题，建议顺序：
1. 题目 1
2. 题目 3

如果你做 3 个题，建议顺序：
1. 题目 1
2. 题目 2
3. 题目 3

如果你想挑战一个稍完整的功能闭环，再做：
4. 题目 4

---

## 结束后建议复盘

每做完一个题，都简单写下：
- 我改了哪些文件
- 哪个测试先失败了
- 我学到了什么
- 我哪里还是不顺

建议把这些记录到：
- `weeks/week-01/week-01-notes.md`
