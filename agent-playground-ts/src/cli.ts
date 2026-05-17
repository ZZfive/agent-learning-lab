import { runAgent } from './lib/runAgent.js';

export function buildCliMessage(args: string[]): string {
  const message = args.join(' ').trim();

  if (!message) {
    throw new Error('Please provide a message. Example: npm run cli -- summarize "hello world"');
  }

  return message.replace(/\s+/g, ' ');
}

async function main(): Promise<void> {
  const message = buildCliMessage(process.argv.slice(2));
  const result = await runAgent(message);
  console.log(result.message);

  if (result.toolLogs.length > 0) {
    console.log(`Tools: ${result.toolLogs.join(', ')}`);
  }
}

const isDirectRun = process.argv[1]?.endsWith('cli.ts');

if (isDirectRun) {
  void main();
}
