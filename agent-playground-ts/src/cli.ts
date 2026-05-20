import { runAgent } from './lib/runAgent.js';

export function buildCliMessage(args: string[]): string {
  const message = args.join(' ').trim(); // 将所有参数拼接成一个字符串，并去除两端的空白字符

  if (!message) {
    throw new Error('Please provide a message. Example: npm run cli -- summarize "hello world"'); // 如果参数为空，则抛出错误 
  }

  return message.replace(/\s+/g, ' '); // 将连续的空白字符替换为一个空格
}

async function main(): Promise<void> {
  const message = buildCliMessage(process.argv.slice(2)); // 构建 CLI 消息，process.argv 从第二个参数开始才是传给CLI的参数
  const result = await runAgent(message);
  console.log(result.message); // 输出结果

  if (result.toolLogs.length > 0) {
    console.log(`Tools: ${result.toolLogs.join(', ')}`); // 输出工具日志
  }
}

const isDirectRun = process.argv[1]?.endsWith('cli.ts'); // 判断是否直接运行 CLI 文件

if (isDirectRun) {
  void main(); // 直接运行 CLI 文件
}
