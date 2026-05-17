# 算法工程师转 TypeScript Agent 工程：8 周学习路线

## 目标画像

主目标：能独立开发 Agent backend
兼顾目标：能和前端/产品代码协作，能完成最小联调
约束：每周学习时间少于 5 小时，Node/前端基础较弱
方法：工作任务 + 独立小项目 + Claude Code 辅助学习

---

## 总体策略

不是系统学习前端，而是按 Agent 工程所需最短路径学习 TypeScript。

优先掌握：
- TypeScript 核心语法与类型系统
- Node.js 运行时与包管理
- HTTP API 与流式输出
- tool calling 与 Agent orchestration
- 基础日志、评测与调试
- 最小 React/Next.js 联调能力

暂不优先：
- CSS 体系
- 复杂前端状态管理
- 重型数据库设计
- 大而全框架比较

---

## 主练习项目

建议整个 8 周围绕一个项目推进：`agent-playground-ts`

迭代目标：
1. CLI chat agent
2. 支持 tool calling 的 agent
3. HTTP API agent
4. streaming + memory
5. eval/logging
6. 最小 web UI

---

## 第 1-2 周：建立最小 TS/Node 生存能力

### 学习目标
- 能运行一个 TypeScript 项目
- 能读懂基础 TS 文件
- 能写简单异步逻辑
- 能调用 LLM API

### 学习内容
- `let` / `const`
- 函数、对象、数组
- `type` / `interface`
- `Promise`
- `async/await`
- `import/export`
- `package.json`
- 环境变量
- Node 文件读写
- 基础 HTTP 请求

### 实践任务
构建一个 CLI Chat Agent：
- 从命令行输入问题
- 调模型 API
- 输出结果
- 支持 system prompt
- 用本地 JSON 保存简单历史

### 产出要求
- 能本地运行
- 能修改 prompt 和 history 结构
- 能自己加一个小参数

---

## 第 3-4 周：进入 Agent backend 核心

### 学习目标
- 能写最小 Agent backend
- 能设计并接入工具调用
- 能理解一次请求的数据流

### 学习内容
- schema 校验思路
- tool schema
- function calling
- route 与 service 分层
- retries / timeout
- 错误处理

### 实践任务
把 CLI agent 升级为：
- 支持 2-3 个工具
- 能记录工具调用日志
- 新增 `POST /chat` 接口
- 返回普通响应

### 推荐工具
- Fastify 或 Express
- Zod

### 产出要求
- 有一个最小 HTTP 服务
- 有清晰的 tool router
- 能看懂 message -> tool -> response 的主流程

---

## 第 5-6 周：补齐工程能力

### 学习目标
- 能处理流式输出
- 能维护简单会话状态
- 能做基础日志与评测
- 能排查常见 Agent 故障

### 学习内容
- streaming response
- SSE / WebSocket 基本概念
- conversation memory
- logging
- config 管理
- 基础测试
- eval mindset

### 实践任务
升级项目：
- 支持 streaming
- 支持本地 memory
- 记录 tool trace
- 加一个简单 eval 脚本

### 产出要求
- 能流式输出
- 能打印清晰日志
- 能写 5-10 条简单测试样例
- 能解释常见失败模式

---

## 第 7-8 周：补一点产品侧能力

### 学习目标
- 能看懂基础 React/Next.js 结构
- 能把 Agent backend 接到一个最小 UI
- 能做简单前后端联调

### 学习内容
- React component 基础
- props / state
- `useState` / `useEffect`
- 调 API
- 渲染 streaming 文本
- tool log 展示

### 实践任务
做一个最小 Web UI：
- 输入框
- 消息列表
- 调 `/chat`
- 展示 streaming 输出
- 展示 tool call log

### 产出要求
- 能完成最小联调
- 能定位前后端边界上的问题
- 能读懂简单页面的数据流

---

## Claude Code 辅助学习工作流

### 角色 1：讲解员
示例提示词：
- 请把这段 TypeScript 用 Python 工程师的视角解释。
- 请先讲整体数据流，再讲每个函数职责。
- 只解释我必须懂的部分，不要讲太多背景。

### 角色 2：练习设计师
示例提示词：
- 基于 tool calling，给我 3 个 20 分钟内能完成的 TS 练习。
- 给我一个只训练 interface、async/await、error handling 的小练习。
- 先不要答案，等我写完你再 review。

### 角色 3：结对编程教练
示例提示词：
- 我们分 5 步实现，不要一次写完。
- 每一步先告诉我目标、输入输出和为什么这样拆。
- 我先写，你只在我卡住时提示。

### 角色 4：代码审查员
示例提示词：
- 请 review 这段代码，重点看 TS 类型设计和 Agent 工程合理性。
- 请先指出问题和修改建议，不要直接重写。
- 请按严重程度排序。

### 角色 5：学习复盘助手
示例提示词：
- 这是我本周做的内容，请帮我总结我真正掌握了什么。
- 如果下周只有 4 小时，最该补哪两个点。
- 请根据我的代码暴露出的弱点调整下周计划。

---

## 每周固定节奏

建议每周 4 小时闭环：

1. 输入（1 小时）
   - 学一点 TS/Node/React 必要知识
   - 或读 1-2 个真实 Agent 项目文件

2. 实作（1.5 小时）
   - 给 `agent-playground-ts` 增加一个功能

3. Claude Code review（1 小时）
   - 讲解、review、查缺补漏

4. 复盘（0.5 小时）
   - 记录本周掌握点、卡点、下周唯一重点

---

## 从真实工作中抽学习素材

每周挑一个最小真实切片：
- 读懂一个 tool router
- 给 Agent 加日志
- 补一个 prompt pipeline 的类型
- 理解 streaming 传递链
- 给 eval 脚本加一个 case

让 Claude Code 帮你：
- 缩小阅读范围
- 按数据流讲解
- 抽象成独立练习
- 迁移到你的 playground 项目中

---

## 最终目标

你不是要先成为前端工程师，而是先建立四种手感：
- 类型手感
- 异步手感
- 分层手感
- 调试手感

当这四种手感建立后，你就基本完成了从算法工程师到 Agent 工程师的关键跨越。
