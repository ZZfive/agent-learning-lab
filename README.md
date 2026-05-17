# Agent Learning Lab

这个目录用于承载你从算法工程师转向 TypeScript Agent 工程的学习材料、练习项目和 Claude Code 辅助学习模板。

## 目录说明

- `learning-roadmap.md`：8 周学习路线
- `claude-code-prompts.md`：可直接复制使用的 Claude Code 提示词模板
- `agent-playground-ts/`：最小 TypeScript Agent 服务骨架

## agent-playground-ts 当前内容

- `src/server.ts`：Fastify 启动入口
- `src/routes/chat.ts`：`POST /chat` 路由
- `src/lib/runAgent.ts`：最小 Agent 调度逻辑
- `src/tools/readLocalNote.ts`：读取本地笔记工具
- `src/tools/summarizeText.ts`：文本摘要工具
- `src/types.ts`：共享类型定义
- `src/cli.ts`：命令行入口
- `test/runAgent.test.ts`：Agent 核心行为测试
- `test/chatRoute.test.ts`：路由层集成测试

## 建议使用方式

1. 先阅读 `learning-roadmap.md`
2. 进入 `agent-playground-ts/` 后安装依赖
3. 运行 `npm test` 看测试如何覆盖当前行为
4. 运行 `npm run cli -- summarize "hello world"` 体验命令行入口
5. 运行 `npm run dev` 启动最小服务
6. 每次卡住时优先使用 `claude-code-prompts.md` 中的模板向 Claude Code 提问
7. 每周做一次复盘，更新你自己的学习笔记
